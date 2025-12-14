import { NextRequest, NextResponse } from "next/server";
import { createClient, type RedisClientType } from "redis";

const DAILY_CREDITS = 3;

// Redis client singleton
let redis: RedisClientType | null = null;

async function getRedisClient(): Promise<RedisClientType> {
	if (!redis) {
		redis = createClient({
			url: process.env.KV_REDIS_URL,
		});
		redis.on("error", (err) => console.error("Redis Client Error:", err));
		await redis.connect();
	}
	return redis;
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
 */
async function getUserCredits(userId: string): Promise<CreditsData> {
	const today = getTodayString();
	const key = `alphasolver:credits:${userId}`;
	
	try {
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
		await client.setEx(key, 172800, JSON.stringify(newData));
		return newData;
	} catch (error) {
		console.error("Redis get error:", error);
		// Fallback to fresh credits on error
		return { credits: DAILY_CREDITS, lastReset: today };
	}
}

/**
 * Save credits for a user to Redis
 */
async function saveUserCredits(userId: string, data: CreditsData): Promise<void> {
	const key = `alphasolver:credits:${userId}`;
	try {
		const client = await getRedisClient();
		// Set with 48h expiry (auto-cleanup old entries)
		await client.setEx(key, 172800, JSON.stringify(data));
	} catch (error) {
		console.error("Redis set error:", error);
	}
}

/**
 * GET /api/credits - Get current credits for user
 * Query params: userId (required)
 */
export async function GET(request: NextRequest) {
	try {
		const userId = request.nextUrl.searchParams.get("userId");
		
		if (!userId) {
			return NextResponse.json({ error: "userId required" }, { status: 400 });
		}

		const creditsData = await getUserCredits(userId);

		return NextResponse.json({
			credits: creditsData.credits,
			maxCredits: DAILY_CREDITS,
			lastReset: creditsData.lastReset,
			isUnlimited: false,
		});
	} catch (error) {
		console.error("Credits GET error:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

/**
 * POST /api/credits - Use one credit
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		const userId = body.userId;
		
		if (!userId) {
			return NextResponse.json({ error: "userId required" }, { status: 400 });
		}

		const creditsData = await getUserCredits(userId);

		// Check if credits available
		if (creditsData.credits <= 0) {
			return NextResponse.json({
				success: false,
				error: "No credits remaining. Credits reset daily at midnight UTC.",
				credits: 0,
				maxCredits: DAILY_CREDITS,
			}, { status: 403 });
		}

		// Decrement credit
		creditsData.credits -= 1;
		await saveUserCredits(userId, creditsData);

		console.log(`Credit used: userId=${userId}, remaining=${creditsData.credits}`);

		return NextResponse.json({
			success: true,
			credits: creditsData.credits,
			maxCredits: DAILY_CREDITS,
		});
	} catch (error) {
		console.error("Credits POST error:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
