import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Whop OAuth configuration
const WHOP_CLIENT_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID || "";
const WHOP_CLIENT_SECRET = process.env.WHOP_API_KEY || "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
	? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/whop/callback`
	: "http://localhost:3000/api/auth/whop/callback";

const WHOP_TOKEN_URL = "https://api.whop.com/api/v2/oauth/token";
const WHOP_USER_URL = "https://api.whop.com/api/v2/me";

// Cookie name for storing auth session
const AUTH_COOKIE_NAME = "whop_session";

interface WhopTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
}

interface WhopUser {
	id: string;
	email?: string;
	username?: string;
	name?: string;
}

/**
 * GET /api/auth/whop/callback - Handles Whop OAuth callback
 * Exchanges auth code for access token and creates session
 */
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state") || "/app";
	const error = searchParams.get("error");

	// Handle OAuth errors
	if (error) {
		console.error("Whop OAuth error:", error);
		return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
	}

	if (!code) {
		return NextResponse.redirect(new URL("/?error=no_code", request.url));
	}

	try {
		// Exchange code for access token
		const tokenResponse = await fetch(WHOP_TOKEN_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				client_id: WHOP_CLIENT_ID,
				client_secret: WHOP_CLIENT_SECRET,
				code,
				redirect_uri: REDIRECT_URI,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Token exchange failed:", errorText);
			return NextResponse.redirect(new URL("/?error=token_failed", request.url));
		}

		const tokenData: WhopTokenResponse = await tokenResponse.json();

		// Fetch user info
		const userResponse = await fetch(WHOP_USER_URL, {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
			},
		});

		if (!userResponse.ok) {
			console.error("User fetch failed");
			return NextResponse.redirect(new URL("/?error=user_failed", request.url));
		}

		const userData: WhopUser = await userResponse.json();

		// Create session data
		const sessionData = {
			userId: userData.id,
			email: userData.email,
			username: userData.username,
			accessToken: tokenData.access_token,
			expiresAt: Date.now() + (tokenData.expires_in * 1000),
		};

		// Set session cookie
		const cookieStore = await cookies();
		cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(sessionData), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: tokenData.expires_in,
			path: "/",
		});

		// Redirect to the app
		return NextResponse.redirect(new URL(state, request.url));
	} catch (err) {
		console.error("OAuth callback error:", err);
		return NextResponse.redirect(new URL("/?error=callback_failed", request.url));
	}
}
