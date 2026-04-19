"use client";

export interface CreditsState {
	creditsRemaining: number;
	maxCredits: number;
	lastResetDate: string;
	isUnlimited: boolean;
}

export interface UseCreditResult {
	success: boolean;
	credits: number;
	maxCredits: number;
	error?: string;
}

/**
 * Gets today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

function whopAuthHeaders(whopUserToken?: string | null): HeadersInit {
	if (!whopUserToken) {
		return {};
	}
	return { "x-whop-user-token": whopUserToken };
}

/**
 * Fetch credits from API (cookies for OAuth /app; pass iframe token when the Whop header is not forwarded on fetch).
 */
export async function checkCreditsServer(whopUserToken?: string | null): Promise<CreditsState | null> {
	try {
		const response = await fetch("/api/credits", {
			headers: whopAuthHeaders(whopUserToken),
			credentials: "same-origin",
		});
		
		if (response.status === 401) {
			// User not authenticated
			return null;
		}
		
		if (!response.ok) {
			console.error("Credits API error:", response.status);
			return null;
		}
		
		const data = await response.json();
		return {
			creditsRemaining: data.credits,
			maxCredits: data.maxCredits,
			lastResetDate: data.lastReset || getTodayString(),
			isUnlimited: data.isUnlimited || false,
		};
	} catch (error) {
		console.error("Failed to fetch credits:", error);
		return null;
	}
}

/**
 * Use one credit via API
 * Server authenticates user from session - no need to pass userId
 */
export async function useCreditServer(whopUserToken?: string | null): Promise<UseCreditResult | null> {
	try {
		const response = await fetch("/api/credits", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...whopAuthHeaders(whopUserToken),
			},
			credentials: "same-origin",
			body: JSON.stringify({}),
		});
		
		const data = await response.json();
		
		if (response.status === 401) {
			return { 
				success: false, 
				credits: 0, 
				maxCredits: 3,
				error: "Please log in to continue" 
			};
		}
		
		if (!response.ok) {
			return { 
				success: false, 
				credits: data.credits || 0, 
				maxCredits: data.maxCredits || 3,
				error: data.error 
			};
		}
		
		return { 
			success: data.success, 
			credits: data.credits,
			maxCredits: data.maxCredits,
		};
	} catch (error) {
		console.error("Failed to use credit:", error);
		return null;
	}
}

/**
 * Get credits display string from server state
 */
export function getCreditsDisplayFromState(state: CreditsState | null, fallbackMax: number = 3): string {
	if (!state) return `? / ${fallbackMax}`;
	if (state.isUnlimited) return "Unlimited";
	return `${state.creditsRemaining} / ${state.maxCredits}`;
}
