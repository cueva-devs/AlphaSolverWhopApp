import { NextRequest, NextResponse } from "next/server";
import { createClient, type RedisClientType } from "redis";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { DAILY_CREDITS, CREDITS_KEY_PREFIX, CREDITS_EXPIRY_SECONDS } from "@/lib/constants";
import { checkRateLimit, rateLimitedResponse, addRateLimitHeaders } from "@/lib/rate-limit";

// Rate limit configuration for credits API
const RATE_LIMIT_CONFIG = {
	limit: 30, // 30 requests
	windowSeconds: 60, // per minute
	keyPrefix: "credits",
};

// Redis client singleton
let redis: RedisClientType | null = null;
let isConnecting = false;

async function getRedisClient(): Promise<RedisClientType> {
	if (redis?.isOpen) {
		return redis;
	}

	// Prevent multiple simultaneous connection attempts
	if (isConnecting) {
		// Wait for existing connection attempt
		await new Promise(resolve => setTimeout(resolve, 100));
		if (redis?.isOpen) {
			return redis;
		}
	}

	isConnecting = true;
	try {
		redis = createClient({
			url: process.env.KV_REDIS_URL,
		});
		redis.on("error", (err) => console.error("Redis Client Error:", err));
		await redis.connect();
		return redis;
	} finally {
		isConnecting = false;
	}
}

/**
 * Get authenticated userId from Whop SDK (works for both iframe and OAuth)
 * This uses the same authentication method as page.tsx
 */
async function getAuthenticatedUserId(): Promise<string | null> {
	try {
		const reqHeaders = await headers();
		const result = await whopsdk.verifyUserToken(reqHeaders, { dontThrow: true });
		return result?.userId || null;
	} catch {
		return null;
	}
}

/**
 * Gets today's date as YYYY-MM-DD string (UTC)
 */
function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

interface CreditsData {
	credits: number;
	lastReset: string;
}

/**
 * Get or initialize credits for a user from Redis
 * Throws on Redis errors - do not silently fallback to free credits
 */
async function getUserCredits(userId: string): Promise<CreditsData> {
	const today = getTodayString();
	const key = `${CREDITS_KEY_PREFIX}${userId}`;
	
	const client = await getRedisClient();
	const stored = await client.get(key);
	
	if (stored) {
		const data = JSON.parse(stored) as CreditsData;
		// Reset if new day
		if (data.lastReset === today) {
			return data;
		}
	}
	
	// New day or no data - reset credits
	const newData: CreditsData = { credits: DAILY_CREDITS, lastReset: today };
	// Set with 48h expiry (auto-cleanup old entries)
	await client.setEx(key, CREDITS_EXPIRY_SECONDS, JSON.stringify(newData));
	return newData;
}

/**
 * Atomically decrement credits using Redis transaction
 * Returns the new credits value, or null if no credits available
 */
async function useCredit(userId: string): Promise<{ success: boolean; credits: number; error?: string }> {
	const today = getTodayString();
	const key = `${CREDITS_KEY_PREFIX}${userId}`;
	
	const client = await getRedisClient();
	
	// Use WATCH/MULTI/EXEC for atomic check-and-decrement
	// This prevents race conditions where two requests both read credits=1
	await client.watch(key);
	
	try {
		const stored = await client.get(key);
		let data: CreditsData;
		
		if (stored) {
			data = JSON.parse(stored) as CreditsData;
			// Reset if new day
			if (data.lastReset !== today) {
				data = { credits: DAILY_CREDITS, lastReset: today };
			}
		} else {
			data = { credits: DAILY_CREDITS, lastReset: today };
		}
		
		// Check if credits available
		if (data.credits <= 0) {
			await client.unwatch();
			return {
				success: false,
				credits: 0,
				error: "No credits remaining. Credits reset daily at midnight UTC.",
			};
		}
		
		// Decrement credit atomically
		data.credits -= 1;
		
		const multi = client.multi();
		multi.setEx(key, CREDITS_EXPIRY_SECONDS, JSON.stringify(data));
		const results = await multi.exec();
		
		// If exec returns null, the watched key was modified by another request
		if (results === null) {
			// Retry once
			return useCredit(userId);
		}
		
		return {
			success: true,
			credits: data.credits,
		};
	} catch (error) {
		await client.unwatch();
		throw error;
	}
}

/**
 * GET /api/credits - Get current credits for authenticated user
 * User is identified from session, not from query params (security)
 */
export async function GET(request: NextRequest) {
	// Rate limiting
	const rateLimitResult = checkRateLimit(request, RATE_LIMIT_CONFIG);
	if (!rateLimitResult.success) {
		return rateLimitedResponse(rateLimitResult);
	}

	try {
		// SECURITY: Get userId from Whop SDK (works for both iframe and OAuth)
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const creditsData = await getUserCredits(userId);

		const response = NextResponse.json({
			credits: creditsData.credits,
			maxCredits: DAILY_CREDITS,
			lastReset: creditsData.lastReset,
			isUnlimited: false,
		});
		return addRateLimitHeaders(response, rateLimitResult);
	} catch (error) {
		console.error("Credits GET error:", error);
		// Don't expose internal errors, but don't silently give free credits
		return NextResponse.json({ error: "Unable to verify credits. Please try again." }, { status: 500 });
	}
}

/**
 * POST /api/credits - Use one credit
 * User is identified from session, not from request body (security)
 */
export async function POST(request: NextRequest) {
	// Rate limiting (stricter for POST)
	const rateLimitResult = checkRateLimit(request, {
		...RATE_LIMIT_CONFIG,
		limit: 10, // More restrictive for credit usage
		keyPrefix: "credits-use",
	});
	if (!rateLimitResult.success) {
		return rateLimitedResponse(rateLimitResult);
	}

	try {
		// SECURITY: Get userId from Whop SDK (works for both iframe and OAuth)
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Use atomic credit deduction to prevent race conditions
		const result = await useCredit(userId);

		if (!result.success) {
			return NextResponse.json({
				success: false,
				error: result.error,
				credits: result.credits,
				maxCredits: DAILY_CREDITS,
			}, { status: 403 });
		}

		console.log(`Credit used: userId=${userId}, remaining=${result.credits}`);

		const response = NextResponse.json({
			success: true,
			credits: result.credits,
			maxCredits: DAILY_CREDITS,
		});
		return addRateLimitHeaders(response, rateLimitResult);
	} catch (error) {
		console.error("Credits POST error:", error);
		// Don't expose internal errors, but don't silently succeed
		return NextResponse.json({ error: "Unable to use credit. Please try again." }, { status: 500 });
	}
}
