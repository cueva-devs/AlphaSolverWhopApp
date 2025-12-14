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

/**
 * Gets today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

/**
 * Fetch credits from Vercel KV via API
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
 * Use one credit via Vercel KV API
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

/**
 * Check if user has credits (server-side check)
 */
export async function hasCreditsServer(userId?: string, experienceId?: string): Promise<boolean> {
	const state = await checkCreditsServer(userId, experienceId);
	if (!state) return false;
	if (state.isUnlimited) return true;
	return state.creditsRemaining > 0;
}

/**
 * Get credits display string from server state
 */
export function getCreditsDisplayFromState(state: CreditsState | null, fallbackMax: number = 3): string {
	if (!state) return `? / ${fallbackMax}`;
	if (state.isUnlimited) return "Unlimited";
	return `${state.creditsRemaining} / ${state.maxCredits}`;
}
