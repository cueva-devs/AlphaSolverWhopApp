import { redirect } from "next/navigation";
import { headers } from "next/headers";
import AlphaSolverApp from "../experiences/[experienceId]/AlphaSolverApp";
import { getPlanConfig, determinePlanId } from "../experiences/[experienceId]/config/planConfig";
import type { PlanId } from "../experiences/[experienceId]/config/planConfig";

// Environment variable to control bypass mode
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

// Whop checkout URL - set this in your environment variables
const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";

export default async function DirectAppPage() {
	// In bypass mode, allow direct access without Whop verification
	if (BYPASS_ACCESS) {
		const planId: PlanId = "free"; // Default to free plan in bypass mode
		const planConfig = getPlanConfig(planId);
		
		return (
			<AlphaSolverApp
				experienceId="direct"
				planId={planId}
				planConfig={planConfig}
			/>
		);
	}

	// TODO: In production, verify Whop membership here
	// For now, redirect to Whop checkout if not in bypass mode
	// 
	// Production implementation would:
	// 1. Check for Whop session cookie or OAuth token
	// 2. Call Whop API to verify membership: GET /api/v2/me/has_access?resource_id=xxx
	// 3. If valid, render the app with appropriate plan
	// 4. If not valid, redirect to checkout
	
	redirect(WHOP_CHECKOUT_URL);
}
