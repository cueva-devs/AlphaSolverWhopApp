import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-gray-1">
			{/* Hero Section */}
			<div className="flex flex-col items-center justify-center min-h-screen p-6">
				<div className="max-w-4xl w-full text-center space-y-8">
					<Heading size="9" className="text-cyan-400">
						AlphaSolver
					</Heading>
					<Text size="5" color="gray" className="max-w-2xl mx-auto">
						Monte Carlo simulation tool for prop firm traders. Know your true probability of passing before you pay.
					</Text>
					
					{/* Features */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
						<Card size="2" variant="surface" className="text-left">
							<Text size="5" weight="bold" className="block mb-2">📊 Data-Driven</Text>
							<Text size="2" color="gray">
								Upload your trade log and see realistic pass/fail probabilities based on your actual performance.
							</Text>
						</Card>
						<Card size="2" variant="surface" className="text-left">
							<Text size="5" weight="bold" className="block mb-2">💰 Cost Analysis</Text>
							<Text size="2" color="gray">
								Understand the true cost of getting funded including resets, rebills, and expected ROI.
							</Text>
						</Card>
						<Card size="2" variant="surface" className="text-left">
							<Text size="5" weight="bold" className="block mb-2">🎯 Trading Plan</Text>
							<Text size="2" color="gray">
								Get personalized daily profit targets and risk limits optimized for your strategy.
							</Text>
						</Card>
					</div>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
						{BYPASS_ACCESS ? (
							<Link href="/app" className="block">
								<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-600">
									Launch App (Dev Mode)
								</Button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL} className="block">
								<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-600">
									Get Free Access
								</Button>
							</a>
						)}
						<Link href="/app" className="block">
							<Button variant="soft" size="4">
								I Already Have Access
							</Button>
						</Link>
					</div>

					{/* Pricing */}
					<div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
						<Card size="3" variant="surface" className="text-left">
							<Text size="4" weight="bold" className="block mb-2">Free Plan</Text>
							<Text size="7" weight="bold" className="block mb-4">$0<Text size="2" color="gray">/month</Text></Text>
							<ul className="space-y-2">
								<li><Text size="2">✓ 10 simulation runs per day</Text></li>
								<li><Text size="2">✓ All prop firms supported</Text></li>
								<li><Text size="2">✓ Trading plan generation</Text></li>
								<li><Text size="2" color="gray">✗ Export/Import runs</Text></li>
							</ul>
						</Card>
						<Card size="3" variant="surface" className="text-left border-2 border-cyan-500">
							<Text size="4" weight="bold" className="block mb-2">Unlimited</Text>
							<Text size="7" weight="bold" className="block mb-4">$9<Text size="2" color="gray">/month</Text></Text>
							<ul className="space-y-2">
								<li><Text size="2">✓ Unlimited simulation runs</Text></li>
								<li><Text size="2">✓ All prop firms supported</Text></li>
								<li><Text size="2">✓ Trading plan generation</Text></li>
								<li><Text size="2">✓ Export/Import runs</Text></li>
							</ul>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
