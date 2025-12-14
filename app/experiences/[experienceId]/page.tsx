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
		// Use dontThrow to handle cases where token might be missing (e.g., direct access)
		const result = await whopsdk.verifyUserToken(reqHeaders, { dontThrow: true });
		
		if (!result || !result.userId) {
			return (
				<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
					<Card size="3" variant="surface" className="max-w-md w-full text-center">
						<Heading size="6" className="mb-4">
							Authentication Required
						</Heading>
						<Text size="3" color="gray" className="mb-6">
							This app must be accessed through Whop. Please open it from your Whop experience.
						</Text>
						<Text size="2" color="gray">
							If you're seeing this error, ensure:
							<br />• The Base URL is set correctly in your Whop app settings
							<br />• The App Path is configured as /experiences/[experienceId]
							<br />• You're accessing the app through Whop, not directly
						</Text>
					</Card>
				</div>
			);
		}
		
		const { userId } = result;

		// Fetch the necessary data we want from whop.
		const [experience, user, access] = await Promise.all([
			whopsdk.experiences.retrieve(experienceId),
			whopsdk.users.retrieve(userId),
			whopsdk.users.checkAccess(experienceId, { id: userId }),
		]);

		// Debug logging (only in development)
		if (process.env.NODE_ENV === "development") {
			console.log("Access check result:", JSON.stringify(access, null, 2));
			console.log("Experience products:", experience.products?.map(p => ({ id: p.id, title: p.title })));
		}

		// Check if user has access (allow bypass when explicitly enabled)
		const bypassAccess = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";
		// The API returns has_access (with underscore), not hasAccess
		const hasAccess = bypassAccess
			? true // allow bypass when env var is set (use with care)
			: (access as { has_access?: boolean; hasAccess?: boolean }).has_access ?? 
			  (access as { has_access?: boolean; hasAccess?: boolean }).hasAccess ?? 
			  false;

		// If user doesn't have access, show upgrade message
		if (!hasAccess) {
			// Construct checkout URL using first product ID or fallback to experience page
			const firstProduct = experience.products?.[0];
			const checkoutUrl = firstProduct?.id
				? `https://whop.com/products/${firstProduct.id}`
				: `https://whop.com/experiences/${experienceId}`;

			// Check if there are no products - this might indicate the app isn't properly configured
			const hasNoProducts = !experience.products || experience.products.length === 0;
			const accessLevel = (access as { access_level?: string }).access_level;

			return (
				<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
					<Card size="3" variant="surface" className="max-w-md w-full text-center">
						<Heading size="6" className="mb-4">
							{hasNoProducts ? "App Configuration Required" : "Upgrade Required"}
						</Heading>
						<Text size="3" color="gray" className="mb-6">
							{hasNoProducts 
								? "This experience doesn't have any products configured. Please add a product to this experience in your Whop dashboard."
								: "You need access to this product to use AlphaSolver. Please upgrade to continue."}
						</Text>
						{!hasNoProducts && (
							<Link href={checkoutUrl} className="block">
								<Button variant="solid" color="blue" className="w-full" size="3">
									Upgrade Now
								</Button>
							</Link>
						)}
						{process.env.NODE_ENV === "development" && (
							<Text size="2" color="gray" className="mt-4 font-mono text-xs">
								Debug: access_level={accessLevel || "none"}, products={experience.products?.length || 0}
							</Text>
						)}
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

		// Find the unlimited product for upgrade URL
		const unlimitedProduct = experience.products?.find(p => 
			p.title?.toLowerCase().includes("unlimited") || 
			p.title?.toLowerCase().includes("pro") ||
			p.title?.toLowerCase().includes("premium")
		);
		
		// Construct upgrade URL - prefer env var, then product URL, then experience page
		let upgradeUrl = process.env.NEXT_PUBLIC_WHOP_UPGRADE_URL;
		if (!upgradeUrl && unlimitedProduct) {
			upgradeUrl = `https://whop.com/products/${unlimitedProduct.id}`;
		}
		if (!upgradeUrl) {
			upgradeUrl = `https://whop.com/experiences/${experienceId}`;
		}

		// User has access - render AlphaSolverApp
		return (
			<AlphaSolverApp
				experienceId={experienceId}
				companyId={experience.company?.id}
				planId={planId}
				planConfig={planConfig}
				upgradeUrl={upgradeUrl}
				isWhopIframe={true}
			/>
		);
	} catch (error) {
		// Show a user-friendly error instead of a 500 so Whop can render the page
		console.error("ExperiencePage error", error);
		
		// Provide more specific error information
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		const isAuthError = errorMessage.includes("token") || errorMessage.includes("authentication") || errorMessage.includes("Unauthorized");
		
		return (
			<div className="min-h-screen bg-gray-1 flex items-center justify-center p-6">
				<Card size="3" variant="surface" className="max-w-md w-full text-center">
					<Heading size="6" className="mb-4">
						{isAuthError ? "Authentication Error" : "AlphaSolver is unavailable"}
					</Heading>
					<Text size="3" color="gray" className="mb-4">
						{isAuthError 
							? "Unable to authenticate with Whop. Please ensure you're accessing this app through Whop and that your app configuration is correct."
							: "Something went wrong loading this experience. Please confirm your access or try again in a moment."}
					</Text>
					{process.env.NODE_ENV === "development" && (
						<Text size="2" color="gray" className="mt-4 font-mono text-xs">
							Error: {errorMessage}
						</Text>
					)}
				</Card>
			</div>
		);
	}
}
