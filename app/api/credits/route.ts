import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { whopsdk } from "@/lib/whop-sdk";

const DAILY_CREDITS = 3;

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
 * Get or initialize credits for a user from Vercel KV
 */
async function getUserCredits(userId: string): Promise<CreditsData> {
	const today = getTodayString();
	const key = `alphasolver:credits:${userId}`;
	
	try {
		const stored = await kv.get<CreditsData>(key);
		
		// Reset if new day or no data
		if (!stored || stored.lastReset !== today) {
			const newData: CreditsData = { credits: DAILY_CREDITS, lastReset: today };
			// Set with 48h expiry (auto-cleanup old entries)
			await kv.set(key, newData, { ex: 172800 });
			return newData;
		}
		
		return stored;
	} catch (error) {
		console.error("KV get error:", error);
		// Fallback to fresh credits on error
		return { credits: DAILY_CREDITS, lastReset: today };
	}
}

/**
 * Save credits for a user to Vercel KV
 */
async function saveUserCredits(userId: string, data: CreditsData): Promise<void> {
	const key = `alphasolver:credits:${userId}`;
	try {
		// Set with 48h expiry (auto-cleanup old entries)
		await kv.set(key, data, { ex: 172800 });
	} catch (error) {
		console.error("KV set error:", error);
	}
}

/**
 * GET /api/credits - Get current credits for user
 */
export async function GET(request: NextRequest) {
	try {
		// Verify user token from Whop
		const result = await whopsdk.verifyUserToken(request.headers, { dontThrow: true });
		
		if (!result || !result.userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { userId } = result;
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
 */
export async function POST(request: NextRequest) {
	try {
		// Verify user token from Whop
		const result = await whopsdk.verifyUserToken(request.headers, { dontThrow: true });
		
		if (!result || !result.userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { userId } = result;
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
