"use client";

import type { PlanConfig } from "../config/planConfig";

export interface CreditsState {
	creditsRemaining: number;
	lastResetDate: string;
	isUnlimited: boolean;
}

const STORAGE_KEY = "alphasolver_credits";

/**
 * Gets today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
	return new Date().toISOString().split("T")[0];
}

/**
 * Gets the current credits state from localStorage (client-side fallback)
 * In production, this should be replaced with Whop membership metadata
 */
export function getCreditsState(planConfig: PlanConfig): CreditsState {
	// Unlimited plans don't need credits tracking
	if (planConfig.dailyCredits === -1) {
		return {
			creditsRemaining: -1,
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
						lastResetDate: today,
						isUnlimited: false,
					};
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
					return newState;
				}
				
				return state;
			}
		} catch (e) {
			// Ignore localStorage errors
		}
	}

	// Default: full credits for today
	const defaultState: CreditsState = {
		creditsRemaining: planConfig.dailyCredits,
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
 * Uses one credit. Returns true if successful, false if no credits remaining.
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
 * Checks if user has credits available
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
	return `${state.creditsRemaining} / ${planConfig.dailyCredits}`;
}
