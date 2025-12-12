import { Button, Card, Heading, Text } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import AlphaSolverApp from "./AlphaSolverApp";
import { determinePlanId, getEffectivePlanConfig, type PlanId } from "./config/planConfig";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const reqHeaders = await headers();
	try {
		// Ensure the user is logged in on whop.
		const { userId } = await whopsdk.verifyUserToken(reqHeaders);

		// Fetch the necessary data we want from whop.
		const [experience, user, access] = await Promise.all([
			whopsdk.experiences.retrieve(experienceId),
			whopsdk.users.retrieve(userId),
			whopsdk.users.checkAccess(experienceId, { id: userId }),
		]);

		// Check if user has access (allow bypass when explicitly enabled)
		const bypassAccess = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";
		const hasAccess = bypassAccess
			? true // allow bypass when env var is set (use with care)
			: (access as { hasAccess?: boolean }).hasAccess ?? false;

		// If user doesn't have access, show upgrade message
		if (!hasAccess) {
			// Construct checkout URL using first product ID or fallback to experience page
			const firstProduct = experience.products?.[0];
			const checkoutUrl = firstProduct?.id
				? `https://whop.com/products/${firstProduct.id}`
				: `https://whop.com/experiences/${experienceId}`;

			return (
				<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
					<Card size="3" variant="surface" className="max-w-md w-full text-center">
						<Heading size="6" className="mb-4">
							Upgrade Required
						</Heading>
						<Text size="3" color="gray" className="mb-6">
							You need access to this product to use AlphaSolver. Please upgrade
							to continue.
						</Text>
						<Link href={checkoutUrl} className="block">
							<Button variant="solid" color="blue" className="w-full" size="3">
								Upgrade Now
							</Button>
						</Link>
					</Card>
				</div>
			);
		}

		// Determine user's plan based on product/experience
		const firstProduct = experience.products?.[0];
		const planId: PlanId = determinePlanId(
			firstProduct?.id,
			firstProduct?.title,
		);
		const planConfig = getEffectivePlanConfig(planId);

		// User has access - render AlphaSolverApp
		return (
			<AlphaSolverApp
				experienceId={experienceId}
				companyId={experience.company?.id}
				planId={planId}
				planConfig={planConfig}
			/>
		);
	} catch (error) {
		// Show a user-friendly error instead of a 500 so Whop can render the page
		console.error("ExperiencePage error", error);
		return (
			<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
				<Card size="3" variant="surface" className="max-w-md w-full text-center">
					<Heading size="6" className="mb-4">
						AlphaSolver is unavailable
					</Heading>
					<Text size="3" color="gray">
						Something went wrong loading this experience. Please confirm your
						access or try again in a moment.
					</Text>
				</Card>
			</div>
		);
	}
}
