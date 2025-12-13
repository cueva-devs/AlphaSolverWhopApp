import { cookies } from "next/headers";
import { whopsdk } from "./whop-sdk";

const AUTH_COOKIE_NAME = "whop_session";

export interface WhopSession {
	userId: string;
	email?: string;
	username?: string;
	accessToken: string;
	expiresAt: number;
}

export interface UserAccess {
	hasAccess: boolean;
	planId: "free" | "unlimited";
	userId: string;
	username?: string;
}

/**
 * Gets the current Whop session from cookies
 */
export async function getWhopSession(): Promise<WhopSession | null> {
	try {
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
		
		if (!sessionCookie?.value) {
			return null;
		}
		
		const session: WhopSession = JSON.parse(sessionCookie.value);
		
		// Check if session is expired
		if (session.expiresAt < Date.now()) {
			return null;
		}
		
		return session;
	} catch {
		return null;
	}
}

/**
 * Checks if user has access to the app and determines their plan
 */
export async function checkUserAccess(productId?: string): Promise<UserAccess | null> {
	const session = await getWhopSession();
	
	if (!session) {
		return null;
	}
	
	try {
		// Check access via Whop API
		// If productId is provided, check access to that specific product
		// Otherwise, check if user has any valid membership
		
		const response = await fetch("https://api.whop.com/api/v2/me/memberships", {
			headers: {
				Authorization: `Bearer ${session.accessToken}`,
			},
		});
		
		if (!response.ok) {
			return null;
		}
		
		const memberships = await response.json();
		
		// Check if user has any active membership
		const activeMemberships = memberships.data?.filter(
			(m: { status: string }) => m.status === "active" || m.status === "trialing"
		) || [];
		
		if (activeMemberships.length === 0) {
			// User is authenticated but has no active membership
			// Give them free tier access
			return {
				hasAccess: true,
				planId: "free",
				userId: session.userId,
				username: session.username,
			};
		}
		
		// Check if any membership is for unlimited/pro plan
		const hasUnlimited = activeMemberships.some((m: { product?: { title?: string } }) => {
			const title = m.product?.title?.toLowerCase() || "";
			return title.includes("unlimited") || title.includes("pro") || title.includes("premium");
		});
		
		return {
			hasAccess: true,
			planId: hasUnlimited ? "unlimited" : "free",
			userId: session.userId,
			username: session.username,
		};
	} catch (err) {
		console.error("Error checking user access:", err);
		return null;
	}
}
