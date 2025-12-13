import { NextRequest, NextResponse } from "next/server";

// Whop OAuth configuration
const WHOP_CLIENT_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID || "";
const WHOP_CLIENT_SECRET = process.env.WHOP_API_KEY || "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
	? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/whop/callback`
	: "http://localhost:3000/api/auth/whop/callback";

// Whop OAuth endpoints
const WHOP_AUTH_URL = "https://whop.com/oauth";
const WHOP_TOKEN_URL = "https://api.whop.com/api/v2/oauth/token";

/**
 * GET /api/auth/whop - Initiates Whop OAuth flow
 * Redirects user to Whop login page
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const returnTo = searchParams.get("returnTo") || "/app";
	
	// Build Whop OAuth URL
	const authUrl = new URL(WHOP_AUTH_URL);
	authUrl.searchParams.set("client_id", WHOP_CLIENT_ID);
	authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("scope", "openid profile email");
	authUrl.searchParams.set("state", returnTo); // Pass return URL in state
	
	return NextResponse.redirect(authUrl.toString());
}
