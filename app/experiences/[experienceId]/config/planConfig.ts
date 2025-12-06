export type PlanId = "starter" | "pro" | "elite";

export interface PlanConfig {
	label: string;
	maxPaths: number;
	maxDays: number;
	allowCsv: boolean;
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
	starter: {
		label: "Starter",
		maxPaths: 100,
		maxDays: 7,
		allowCsv: false,
	},
	pro: {
		label: "Pro",
		maxPaths: 1000,
		maxDays: 30,
		allowCsv: true,
	},
	elite: {
		label: "Elite",
		maxPaths: 10000,
		maxDays: 365,
		allowCsv: true,
	},
};

/**
 * Gets a plan configuration by plan ID.
 * Returns starter plan as fallback if plan ID is invalid.
 */
export function getPlanConfig(planId: PlanId | string): PlanConfig {
	if (planId in PLAN_CONFIGS) {
		return PLAN_CONFIGS[planId as PlanId];
	}
	// Fallback to starter plan
	return PLAN_CONFIGS.starter;
}

/**
 * Determines the plan ID from environment variables or product mapping.
 * This is a helper function that can be extended with more complex logic.
 */
export function determinePlanId(
	productId?: string,
	productName?: string,
): PlanId {
	// Check for explicit plan ID in env var
	const envPlanId = process.env.NEXT_PUBLIC_RECOMMENDED_PLAN_ID as
		| PlanId
		| undefined;
	if (envPlanId && envPlanId in PLAN_CONFIGS) {
		return envPlanId;
	}

	// Map product ID or name to plan (can be extended)
	// For now, default to starter if no mapping found
	// In production, you might want to map specific product IDs to plans
	if (productId || productName) {
		const lowerName = (productName || "").toLowerCase();
		if (lowerName.includes("elite")) {
			return "elite";
		}
		if (lowerName.includes("pro")) {
			return "pro";
		}
		if (lowerName.includes("starter")) {
			return "starter";
		}
	}

	// Default to starter plan
	return "starter";
}

