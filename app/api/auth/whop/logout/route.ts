import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

/**
 * GET /api/auth/whop/logout - Logs out the user
 * Clears the session cookie and redirects to home
 */
export async function GET(request: NextRequest) {
	const cookieStore = await cookies();
	cookieStore.delete(AUTH_COOKIE_NAME);
	
	return NextResponse.redirect(new URL("/", request.url));
}
