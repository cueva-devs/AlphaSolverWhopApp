import { redirect } from "next/navigation";
import Link from "next/link";
import AlphaSolverApp from "../experiences/[experienceId]/AlphaSolverApp";
import { getPlanConfig } from "../experiences/[experienceId]/config/planConfig";
import type { PlanId } from "../experiences/[experienceId]/config/planConfig";
import type { CreditsState } from "../experiences/[experienceId]/lib/creditsService";
import { getWhopSession, checkUserAccess } from "@/lib/auth";
import { BYPASS_CREDITS_USER_SUB, DAILY_CREDITS } from "@/lib/constants";
import { getUserCredits } from "@/lib/credits-store";

// Environment variable to control bypass mode
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default async function DirectAppPage() {
	// In bypass mode, allow direct access without Whop verification
	if (BYPASS_ACCESS) {
		const planId: PlanId = "free";
		const planConfig = getPlanConfig(planId);

		let initialCredits: CreditsState | null = null;
		try {
			const data = await getUserCredits(BYPASS_CREDITS_USER_SUB);
			initialCredits = {
				creditsRemaining: data.credits,
				maxCredits: DAILY_CREDITS,
				lastResetDate: data.lastReset,
				isUnlimited: false,
			};
		} catch {
			initialCredits = null;
		}

		return (
			<AlphaSolverApp
				experienceId="direct"
				planId={planId}
				planConfig={planConfig}
				upgradeUrl={process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver"}
				isWhopIframe={false}
				initialCredits={initialCredits}
			/>
		);
	}

	// Check for existing Whop session
	const session = await getWhopSession();
	
	if (!session) {
		// No session - show login prompt
		return (
			<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
				<div className="chart-container max-w-md w-full p-8 text-center">
					{/* Logo */}
					<div className="flex items-center justify-center gap-2 mb-6">
						<span className="text-[var(--accent)] text-3xl font-bold">α</span>
						<span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">ALPHASOLVER</span>
					</div>
					
					<h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
						Sign in to continue
					</h1>
					<p className="text-sm text-[var(--text-secondary)] mb-8">
						Sign in with your Whop account to access the simulator.
					</p>
					
					<div className="space-y-3">
						<Link href="/api/auth/whop" className="block">
							<button className="btn btn-primary btn-lg w-full">
								Sign in with Whop
							</button>
						</Link>
						<Link href="/" className="block">
							<button className="btn btn-soft btn-md w-full">
								Back to Home
							</button>
						</Link>
					</div>
					
					<div className="mt-8 pt-6 border-t border-[var(--border)]">
						<p className="text-xs text-[var(--text-muted)]">
							Don't have an account?{" "}
							<a 
								href={process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver"} 
								className="text-[var(--accent)] hover:underline"
							>
								Get started free
							</a>
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Check user access and plan
	const access = await checkUserAccess();
	
	if (!access) {
		// Session exists but couldn't verify access - redirect to login
		redirect("/api/auth/whop");
	}

	// User has access - render the app
	const planConfig = getPlanConfig(access.planId);

	let initialCredits: CreditsState | null | undefined = undefined;
	if (planConfig.dailyCredits !== -1) {
		try {
			const data = await getUserCredits(access.userId);
			initialCredits = {
				creditsRemaining: data.credits,
				maxCredits: DAILY_CREDITS,
				lastResetDate: data.lastReset,
				isUnlimited: false,
			};
		} catch {
			initialCredits = null;
		}
	}

	return (
		<AlphaSolverApp
			experienceId="direct"
			planId={access.planId}
			planConfig={planConfig}
			upgradeUrl={process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver"}
			isWhopIframe={false}
			initialCredits={initialCredits}
		/>
	);
}
