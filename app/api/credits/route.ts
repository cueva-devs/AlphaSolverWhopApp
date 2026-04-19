import { NextRequest, NextResponse } from "next/server";
import { DAILY_CREDITS } from "@/lib/constants";
import { getUserCredits, useCredit } from "@/lib/credits-store";
import { resolveCreditsUserIdFromRequest } from "@/lib/credits-user";
import { checkRateLimit, rateLimitedResponse, addRateLimitHeaders } from "@/lib/rate-limit";
import { redisFailureUserMessage } from "@/lib/redis-errors";

// Rate limit configuration for credits API
const RATE_LIMIT_CONFIG = {
	limit: 30, // 30 requests
	windowSeconds: 60, // per minute
	keyPrefix: "credits",
};

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
		const userId = await resolveCreditsUserIdFromRequest(request);
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
		const hint = redisFailureUserMessage(error);
		return NextResponse.json(
			{ error: hint ?? "Unable to verify credits. Please try again." },
			{ status: 500 },
		);
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
		const userId = await resolveCreditsUserIdFromRequest(request);
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const result = await useCredit(userId);

		if (!result.success) {
			return NextResponse.json(
				{
					success: false,
					error: result.error,
					credits: result.credits,
					maxCredits: DAILY_CREDITS,
				},
				{ status: 403 },
			);
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
		const hint = redisFailureUserMessage(error);
		return NextResponse.json(
			{ error: hint ?? "Unable to use credit. Please try again." },
			{ status: 500 },
		);
	}
}
