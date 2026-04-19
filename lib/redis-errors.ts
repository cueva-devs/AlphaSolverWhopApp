/**
 * Map low-level Redis / network errors to actionable text for logs and UI.
 */
export function redisFailureUserMessage(error: unknown): string | null {
	const msg = error instanceof Error ? error.message : String(error);
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String((error as { code: unknown }).code)
			: "";
	const haystack = `${msg} ${code}`;

	if (!getRedisConnectionUrlConfigured() || msg.includes("Redis URL missing")) {
		return "Daily runs aren’t available: Redis isn’t configured. In Vercel, add REDIS_URL (or KV_REDIS_URL) and redeploy.";
	}
	if (haystack.includes("ENOTFOUND") || code === "ENOTFOUND") {
		return "Daily runs aren’t available: the Redis address no longer exists (database removed or wrong URL). Create a database in Redis Cloud, paste the new connection URL into Vercel → REDIS_URL for Production, redeploy.";
	}
	if (haystack.includes("ECONNREFUSED") || code === "ECONNREFUSED") {
		return "Daily runs aren’t available: Redis refused the connection. Check REDIS_URL and that the database is running.";
	}
	if (haystack.includes("ETIMEDOUT") || code === "ETIMEDOUT") {
		return "Daily runs aren’t available: connection to Redis timed out. Check REDIS_URL and network access.";
	}
	if (
		haystack.includes("WRONGPASS") ||
		haystack.includes("NOAUTH") ||
		haystack.includes("invalid username-password pair")
	) {
		return "Daily runs aren’t available: Redis username or password is wrong. Copy a fresh connection URL from Redis Cloud into Vercel → REDIS_URL, redeploy.";
	}
	return null;
}

function getRedisConnectionUrlConfigured(): boolean {
	return Boolean(process.env.KV_REDIS_URL || process.env.REDIS_URL);
}
