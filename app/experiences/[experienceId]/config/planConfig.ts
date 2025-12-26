export type PlanId = "free" | "unlimited";

export interface PlanConfig {
	label: string;
	maxPaths: number; // No limit enforced - runs on user's CPU
	maxDays: number;
	allowCsv: boolean;
	dailyCredits: number; // -1 = unlimited
	allowExport: boolean;
	allowTradingPlan: boolean;
	allowAiUpload: boolean; // AI-powered CSV column mapping
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
	free: {
		label: "Free",
		maxPaths: 100000, // No real limit - runs on user's CPU
		maxDays: 365,
		allowCsv: true,
		dailyCredits: 3, // 3 runs per day
		allowExport: false,
		allowTradingPlan: true,
		allowAiUpload: false,
	},
	unlimited: {
		label: "Unlimited",
		maxPaths: 100000, // No real limit - runs on user's CPU
		maxDays: 365,
		allowCsv: true,
		dailyCredits: -1, // Unlimited
		allowExport: true,
		allowTradingPlan: true,
		allowAiUpload: true,
	},
};

// Development/testing mode: allows unlimited paths and days for testing
// Set NEXT_PUBLIC_DEV_MODE=true to enable
// SECURITY: DEV_MODE is automatically disabled in production to prevent accidental enablement
export const DEV_MODE = 
	process.env.NEXT_PUBLIC_DEV_MODE === "true" && 
	process.env.NODE_ENV !== "production";

export function getEffectivePlanConfig(planId: PlanId | string): PlanConfig {
	const config = getPlanConfig(planId);
	
	// In dev mode, allow unlimited testing
	if (DEV_MODE) {
		return {
			...config,
			maxPaths: 1000000, // 1 million paths for extensive testing
			maxDays: 1000,
			allowCsv: true,
		};
	}
	
	return config;
}

/**
 * Gets a plan configuration by plan ID.
 * Returns free plan as fallback if plan ID is invalid.
 */
export function getPlanConfig(planId: PlanId | string): PlanConfig {
	if (planId in PLAN_CONFIGS) {
		return PLAN_CONFIGS[planId as PlanId];
	}
	// Fallback to free plan
	return PLAN_CONFIGS.free;
}

/**
 * Determines the plan ID from environment variables or product mapping.
 */
export function determinePlanId(
	productId?: string,
	productTitle?: string,
): PlanId {
	// Check for explicit plan ID in env var
	const envPlanId = process.env.NEXT_PUBLIC_RECOMMENDED_PLAN_ID as
		| PlanId
		| undefined;
	if (envPlanId && envPlanId in PLAN_CONFIGS) {
		return envPlanId;
	}

	// Map product ID or name to plan
	if (productId || productTitle) {
		const lowerName = (productTitle || "").toLowerCase();
		if (lowerName.includes("unlimited") || lowerName.includes("pro") || lowerName.includes("premium")) {
			return "unlimited";
		}
		if (lowerName.includes("free")) {
			return "free";
		}
	}

	// Default to free plan
	return "free";
}
