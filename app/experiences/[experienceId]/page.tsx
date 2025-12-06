import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import AlphaSolverApp from "./AlphaSolverApp";
import { determinePlanId, getPlanConfig, type PlanId } from "./config/planConfig";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	// Ensure the user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch the necessary data we want from whop.
	const [experience, user, access] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	// Check if user has access
	// checkAccess returns an object with hasAccess boolean property
	const hasAccess =
		process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true" &&
		process.env.VERCEL_ENV !== "production"
			? true // allow preview builds and local testing when explicitly enabled
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
				<div className="max-w-md w-full bg-gray-a2 border border-gray-a4 rounded-lg p-8 text-center">
					<h1 className="text-6 font-bold text-gray-12 mb-4">
						Upgrade Required
					</h1>
					<p className="text-3 text-gray-10 mb-6">
						You need access to this product to use AlphaSolver. Please upgrade
						to continue.
					</p>
					<Link href={checkoutUrl} className="block">
						<Button variant="classic" className="w-full" size="4">
							Upgrade Now
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	// Determine user's plan based on product/experience
	const firstProduct = experience.products?.[0];
	const planId: PlanId = determinePlanId(
		firstProduct?.id,
		firstProduct?.title,
	);
	const planConfig = getPlanConfig(planId);

	// User has access - render AlphaSolverApp
	return (
		<AlphaSolverApp
			experienceId={experienceId}
			companyId={experience.company?.id}
			planId={planId}
			planConfig={planConfig}
		/>
	);
}
