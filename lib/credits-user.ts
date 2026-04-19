import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { getWhopSession } from "@/lib/auth";
import { BYPASS_CREDITS_USER_SUB } from "@/lib/constants";

/**
 * Resolve Whop user id for credits: iframe JWT header, then cookie session (OAuth /app).
 */
export async function resolveCreditsUserIdFromHeaders(incoming: Headers): Promise<string | null> {
	if (process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true") {
		return BYPASS_CREDITS_USER_SUB;
	}
	const fromJwt = await whopsdk.verifyUserToken(incoming, { dontThrow: true });
	if (fromJwt?.userId) {
		return fromJwt.userId;
	}
	const session = await getWhopSession();
	return session?.userId ?? null;
}

export async function resolveCreditsUserIdFromRequest(request: NextRequest): Promise<string | null> {
	return resolveCreditsUserIdFromHeaders(request.headers);
}

export async function resolveCreditsUserId(): Promise<string | null> {
	const h = await headers();
	return resolveCreditsUserIdFromHeaders(h);
}

/**
 * For server actions: optional iframe JWT passed from the server-rendered page when
 * `headers()` on the action POST does not include x-whop-user-token.
 */
export async function resolveCreditsUserIdForAction(
	iframeUserToken?: string | null,
): Promise<string | null> {
	if (process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true") {
		return BYPASS_CREDITS_USER_SUB;
	}
	if (iframeUserToken) {
		const fromBody = await whopsdk.verifyUserToken(iframeUserToken, { dontThrow: true });
		if (fromBody?.userId) {
			return fromBody.userId;
		}
	}
	return resolveCreditsUserId();
}
