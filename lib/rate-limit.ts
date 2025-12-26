import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for serverless environments.
 * 
 * Note: This uses in-memory storage which resets on cold starts.
 * For production with high traffic, consider using Redis-based rate limiting
 * with @upstash/ratelimit or similar.
 * 
 * This implementation is suitable for moderate traffic and provides
 * basic protection against abuse.
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// In-memory store for rate limit tracking
// Key: IP or user identifier, Value: request count and reset time
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

function cleanupOldEntries() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL) {
		return;
	}
	
	lastCleanup = now;
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetTime < now) {
			rateLimitStore.delete(key);
		}
	}
}

export interface RateLimitConfig {
	/** Maximum number of requests allowed in the window */
	limit: number;
	/** Time window in seconds */
	windowSeconds: number;
	/** Identifier to use for rate limiting (default: IP) */
	keyPrefix?: string;
}

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

/**
 * Get rate limit identifier from request
 */
function getIdentifier(request: NextRequest, keyPrefix: string): string {
	// Try to get real IP from various headers (Vercel, Cloudflare, etc.)
	const forwardedFor = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");
	const cfIp = request.headers.get("cf-connecting-ip");
	
	const ip = cfIp || realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
	
	return `${keyPrefix}:${ip}`;
}

/**
 * Check and update rate limit for a request
 */
export function checkRateLimit(
	request: NextRequest,
	config: RateLimitConfig
): RateLimitResult {
	cleanupOldEntries();
	
	const { limit, windowSeconds, keyPrefix = "rl" } = config;
	const key = getIdentifier(request, keyPrefix);
	const now = Date.now();
	const windowMs = windowSeconds * 1000;
	
	let entry = rateLimitStore.get(key);
	
	// If no entry or window expired, create new entry
	if (!entry || entry.resetTime < now) {
		entry = {
			count: 1,
			resetTime: now + windowMs,
		};
		rateLimitStore.set(key, entry);
		
		return {
			success: true,
			limit,
			remaining: limit - 1,
			reset: entry.resetTime,
		};
	}
	
	// Increment count
	entry.count += 1;
	
	// Check if over limit
	if (entry.count > limit) {
		return {
			success: false,
			limit,
			remaining: 0,
			reset: entry.resetTime,
		};
	}
	
	return {
		success: true,
		limit,
		remaining: limit - entry.count,
		reset: entry.resetTime,
	};
}

/**
 * Create a rate limited response with appropriate headers
 */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
	const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
	
	return NextResponse.json(
		{ 
			error: "Too many requests. Please try again later.",
			retryAfter,
		},
		{ 
			status: 429,
			headers: {
				"X-RateLimit-Limit": result.limit.toString(),
				"X-RateLimit-Remaining": result.remaining.toString(),
				"X-RateLimit-Reset": result.reset.toString(),
				"Retry-After": retryAfter.toString(),
			},
		}
	);
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
	response: NextResponse,
	result: RateLimitResult
): NextResponse {
	response.headers.set("X-RateLimit-Limit", result.limit.toString());
	response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
	response.headers.set("X-RateLimit-Reset", result.reset.toString());
	return response;
}

