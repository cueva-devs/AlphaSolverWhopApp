"use client";

import type { PlanConfig } from "../config/planConfig";

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

const STORAGE_KEY = "alphasolver_credits";

/**
 * Gets today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

/**
 * Server-side credit check - calls Vercel KV via API
 */
export async function checkCreditsServer(userId?: string, experienceId?: string): Promise<CreditsState | null> {
	if (!userId) return null;
	
	try {
		const params = new URLSearchParams();
		params.set("userId", userId);
		if (experienceId) params.set("experienceId", experienceId);
		
		const response = await fetch(`/api/credits?${params.toString()}`);
		
		if (!response.ok) return null;
		
		const data = await response.json();
		return {
			creditsRemaining: data.credits,
			maxCredits: data.maxCredits,
			lastResetDate: data.lastReset || getTodayString(),
			isUnlimited: data.isUnlimited || false,
		};
	} catch {
		return null;
	}
}

/**
 * Server-side credit use - calls Vercel KV via API
 */
export async function useCreditServer(userId?: string, experienceId?: string): Promise<UseCreditResult | null> {
	if (!userId) return null;
	
	try {
		const response = await fetch("/api/credits", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, experienceId }),
		});
		
		const data = await response.json();
		
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
	} catch {
		return null;
	}
}

// ==========================================
// LOCAL STORAGE FALLBACK (for client-side only)
// ==========================================

/**
 * Gets the current credits state from localStorage (client-side fallback)
 * Used when server-side credits aren't available
 */
export function getCreditsState(planConfig: PlanConfig): CreditsState {
	// Unlimited plans don't need credits tracking
	if (planConfig.dailyCredits === -1) {
		return {
			creditsRemaining: -1,
			maxCredits: -1,
			lastResetDate: getTodayString(),
			isUnlimited: true,
		};
	}

	// Try to get from localStorage
	if (typeof window !== "undefined") {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const state = JSON.parse(stored) as CreditsState;
				
				// Check if we need to reset (new day)
				const today = getTodayString();
				if (state.lastResetDate !== today) {
					// Reset credits for new day
					const newState: CreditsState = {
						creditsRemaining: planConfig.dailyCredits,
						maxCredits: planConfig.dailyCredits,
						lastResetDate: today,
						isUnlimited: false,
					};
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
					return newState;
				}
				
				return {
					...state,
					maxCredits: state.maxCredits || planConfig.dailyCredits,
				};
			}
		} catch (e) {
			// Ignore localStorage errors
		}
	}

	// Default: full credits for today
	const defaultState: CreditsState = {
		creditsRemaining: planConfig.dailyCredits,
		maxCredits: planConfig.dailyCredits,
		lastResetDate: getTodayString(),
		isUnlimited: false,
	};
	
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
		} catch (e) {
			// Ignore localStorage errors
		}
	}
	
	return defaultState;
}

/**
 * Uses one credit (localStorage version). Returns true if successful.
 */
export function useCredit(planConfig: PlanConfig): boolean {
	// Unlimited plans always succeed
	if (planConfig.dailyCredits === -1) {
		return true;
	}

	const state = getCreditsState(planConfig);
	
	if (state.creditsRemaining <= 0) {
		return false;
	}

	// Decrement credits
	const newState: CreditsState = {
		...state,
		creditsRemaining: state.creditsRemaining - 1,
	};

	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
		} catch (e) {
			// Ignore localStorage errors
		}
	}

	return true;
}

/**
 * Checks if user has credits available (localStorage version)
 */
export function hasCredits(planConfig: PlanConfig): boolean {
	if (planConfig.dailyCredits === -1) {
		return true;
	}
	
	const state = getCreditsState(planConfig);
	return state.creditsRemaining > 0;
}

/**
 * Gets the display string for credits
 */
export function getCreditsDisplay(planConfig: PlanConfig): string {
	if (planConfig.dailyCredits === -1) {
		return "Unlimited";
	}
	
	const state = getCreditsState(planConfig);
	return `${state.creditsRemaining} / ${state.maxCredits}`;
}

/**
 * Sync local storage with server state
 */
export function syncCreditsFromServer(serverState: CreditsState, planConfig: PlanConfig): void {
	if (planConfig.dailyCredits === -1) return;
	
	if (typeof window !== "undefined") {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(serverState));
		} catch (e) {
			// Ignore localStorage errors
		}
	}
}
