import { redirect } from "next/navigation";
import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";
import AlphaSolverApp from "../experiences/[experienceId]/AlphaSolverApp";
import { getPlanConfig } from "../experiences/[experienceId]/config/planConfig";
import type { PlanId } from "../experiences/[experienceId]/config/planConfig";
import { getWhopSession, checkUserAccess } from "@/lib/auth";

// Environment variable to control bypass mode
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default async function DirectAppPage() {
	// In bypass mode, allow direct access without Whop verification
	if (BYPASS_ACCESS) {
		const planId: PlanId = "free";
		const planConfig = getPlanConfig(planId);
		
		return (
			<AlphaSolverApp
				experienceId="direct"
				planId={planId}
				planConfig={planConfig}
			/>
		);
	}

	// Check for existing Whop session
	const session = await getWhopSession();
	
	if (!session) {
		// No session - show login prompt
		return (
			<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
				<Card size="3" variant="surface" className="max-w-md w-full text-center">
					<Heading size="6" className="mb-4">
						Sign in to AlphaSolver
					</Heading>
					<Text size="3" color="gray" className="mb-6">
						Sign in with your Whop account to access the app.
					</Text>
					<div className="space-y-3">
						<Link href="/api/auth/whop" className="block">
							<Button variant="solid" size="3" className="w-full">
								Sign in with Whop
							</Button>
						</Link>
						<Link href="/" className="block">
							<Button variant="soft" size="2" className="w-full">
								Back to Home
							</Button>
						</Link>
					</div>
				</Card>
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
	
	return (
		<AlphaSolverApp
			experienceId="direct"
			planId={access.planId}
			planConfig={planConfig}
		/>
	);
}
