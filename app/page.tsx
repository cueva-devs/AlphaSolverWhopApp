import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-gray-1">
			{/* Hero Section */}
			<section className="relative overflow-hidden">
				{/* Background gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20" />
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl" />
				
				<div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
					<div className="text-center space-y-6">
						<div className="inline-block px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
							<Text size="2" className="text-cyan-400">Prop Trading Evaluation Simulator</Text>
						</div>
						<Heading size="9" className="text-white leading-tight">
							Know Your <span className="text-cyan-400">True Odds</span><br />
							Before You Pay
						</Heading>
						<Text size="5" color="gray" className="max-w-2xl mx-auto">
							Monte Carlo simulation powered by your real trade data. See your probability of passing any prop firm challenge.
						</Text>
						
						{/* CTA Buttons */}
						<div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
							{BYPASS_ACCESS ? (
								<Link href="/app" className="block">
									<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
										Launch App
									</Button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL} className="block">
									<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
										Start Free
									</Button>
								</a>
							)}
							<Link href="/app" className="block">
								<Button variant="soft" size="4" className="px-8">
									I Have Access
								</Button>
							</Link>
						</div>
						
						<Text size="1" color="gray" className="pt-2">
							No credit card required • 10 free simulations daily
						</Text>
					</div>
				</div>
			</section>

			{/* Example Output Section */}
			<section className="py-20 px-6 bg-gray-a2">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<Heading size="7" className="text-white mb-4">
							See What You'll Get
						</Heading>
						<Text size="3" color="gray">
							Real simulation output from a trader's NinjaTrader log
						</Text>
					</div>
					
					{/* Mock Results Display */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Left: Key Metrics */}
						<div className="space-y-4">
							{/* Outcome Probability */}
							<div className="space-y-3">
								<Text size="4" weight="bold" className="text-cyan-400">Outcome Probability</Text>
								<div className="grid grid-cols-2 gap-3">
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Pass Rate</Text>
										<Text size="8" weight="bold" className="text-green-500">67.2%</Text>
										<Text size="1" className="text-green-500/70">↑ 95% CI: [65.1%, 69.3%]</Text>
									</div>
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Fail Rate</Text>
										<Text size="8" weight="bold" className="text-red-500">32.8%</Text>
									</div>
								</div>
							</div>
							
							{/* Expected Value */}
							<div className="space-y-3">
								<Text size="4" weight="bold" className="text-cyan-400">Expected Value</Text>
								<div className="grid grid-cols-2 gap-3">
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Net EV Per Attempt</Text>
										<Text size="7" weight="bold" className="text-green-500">$1,847.32</Text>
									</div>
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Expected Attempts</Text>
										<Text size="7" weight="bold">1.5</Text>
									</div>
								</div>
							</div>
							
							{/* Timeline */}
							<div className="space-y-3">
								<Text size="4" weight="bold" className="text-cyan-400">Timeline (Winners)</Text>
								<div className="grid grid-cols-3 gap-3">
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Days in Eval</Text>
										<Text size="6" weight="bold">28</Text>
										<Text size="1" className="text-green-500">↑ ~0 rebills</Text>
									</div>
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">Days Funded</Text>
										<Text size="6" weight="bold">21</Text>
									</div>
									<div className="bg-gray-a3 rounded-lg p-4">
										<Text size="1" color="gray" className="block mb-1">To Payout</Text>
										<Text size="6" weight="bold">49</Text>
										<Text size="1" className="text-green-500">↑ ~2.3 months</Text>
									</div>
								</div>
							</div>
						</div>
						
						{/* Right: Chart Mockup */}
						<div className="bg-gray-a3 rounded-xl p-6">
							<Text size="3" weight="bold" className="block mb-4">Topstep 50k - Simulation Paths</Text>
							<div className="relative h-64 overflow-hidden rounded-lg bg-gray-a4">
								{/* Simulated equity curves */}
								<svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
									{/* Winning paths (green) */}
									<path d="M0,150 Q50,140 100,120 T200,80 T300,40 T400,20" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
									<path d="M0,150 Q60,145 120,130 T220,100 T320,60 T400,30" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
									<path d="M0,150 Q40,135 80,110 T180,70 T280,35 T400,15" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1"/>
									<path d="M0,150 Q70,148 140,135 T240,110 T340,75 T400,45" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
									<path d="M0,150 Q55,142 110,125 T210,90 T310,55 T400,25" fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5"/>
									{/* Losing paths (red) */}
									<path d="M0,150 Q30,155 60,165 T120,180 T150,195" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1"/>
									<path d="M0,150 Q40,158 80,170 T140,185 T180,198" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1"/>
									<path d="M0,150 Q25,152 50,160 T100,175 T130,190" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1"/>
									{/* Starting line */}
									<line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4"/>
									{/* Profit target line */}
									<line x1="0" y1="50" x2="400" y2="50" stroke="rgba(34,197,94,0.5)" strokeWidth="1" strokeDasharray="4"/>
									<text x="10" y="45" fill="rgba(34,197,94,0.7)" fontSize="10">Profit Target</text>
									{/* Max loss line */}
									<line x1="0" y1="190" x2="400" y2="190" stroke="rgba(239,68,68,0.5)" strokeWidth="1" strokeDasharray="4"/>
									<text x="10" y="185" fill="rgba(239,68,68,0.7)" fontSize="10">Max Loss</text>
								</svg>
							</div>
							<div className="flex justify-between mt-4">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-green-500"></div>
									<Text size="1" color="gray">Winning Paths (67.2%)</Text>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-red-500"></div>
									<Text size="1" color="gray">Losing Paths (32.8%)</Text>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-20 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Heading size="7" className="text-white mb-4">
							How It Works
						</Heading>
						<Text size="3" color="gray">
							Three simple steps to know your true probability
						</Text>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
								<Text size="6" weight="bold" className="text-cyan-400">1</Text>
							</div>
							<Text size="4" weight="bold" className="block mb-2">Upload Trade Log</Text>
							<Text size="2" color="gray">
								Export your trades from NinjaTrader, TradingView, Tradovate, or any platform as CSV
							</Text>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
								<Text size="6" weight="bold" className="text-cyan-400">2</Text>
							</div>
							<Text size="4" weight="bold" className="block mb-2">Select Prop Firm</Text>
							<Text size="2" color="gray">
								Choose from Topstep, Take Profit Trader, Tradeify, FFN, or create custom rules
							</Text>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
								<Text size="6" weight="bold" className="text-cyan-400">3</Text>
							</div>
							<Text size="4" weight="bold" className="block mb-2">Get Results</Text>
							<Text size="2" color="gray">
								See pass probability, expected costs, timeline, and personalized trading plan
							</Text>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="py-20 px-6 bg-gray-a2">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<Heading size="7" className="text-white mb-4">
							Everything You Need
						</Heading>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">📊</Text>
							<Text size="4" weight="bold" className="block mb-2">Monte Carlo Simulation</Text>
							<Text size="2" color="gray">
								10,000+ simulated paths using your actual trade statistics for statistically significant results
							</Text>
						</Card>
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">🎯</Text>
							<Text size="4" weight="bold" className="block mb-2">Outcome Clustering</Text>
							<Text size="2" color="gray">
								AI-powered clustering identifies the most probable scenarios and their likelihood
							</Text>
						</Card>
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">💰</Text>
							<Text size="4" weight="bold" className="block mb-2">Cost Analysis</Text>
							<Text size="2" color="gray">
								Full breakdown of expected costs including rebills, resets, and funded setup fees
							</Text>
						</Card>
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">📈</Text>
							<Text size="4" weight="bold" className="block mb-2">ROI Calculator</Text>
							<Text size="2" color="gray">
								See your expected return on investment accounting for all costs and probabilities
							</Text>
						</Card>
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">📋</Text>
							<Text size="4" weight="bold" className="block mb-2">Trading Plan</Text>
							<Text size="2" color="gray">
								Personalized daily profit targets and risk limits based on what winners do differently
							</Text>
						</Card>
						<Card size="3" variant="surface" className="bg-gray-a3 border-gray-a5">
							<Text size="5" className="block mb-2">🏢</Text>
							<Text size="4" weight="bold" className="block mb-2">All Major Prop Firms</Text>
							<Text size="2" color="gray">
								Pre-configured rules for Topstep, TPT, Tradeify, FFN, and custom rule support
							</Text>
						</Card>
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="py-20 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-16">
						<Heading size="7" className="text-white mb-4">
							Simple Pricing
						</Heading>
						<Text size="3" color="gray">
							Start free, upgrade when you need more
						</Text>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<Card size="4" variant="surface" className="bg-gray-a3 border-gray-a5 p-8">
							<Text size="5" weight="bold" className="block mb-2">Free</Text>
							<div className="flex items-baseline gap-1 mb-6">
								<Text size="9" weight="bold">$0</Text>
								<Text size="3" color="gray">/month</Text>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">10 simulation runs per day</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">All prop firms supported</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Trading plan generation</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Full results & visualizations</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-gray-a8">✗</span>
									<Text size="2" color="gray">Export/Import runs</Text>
								</li>
							</ul>
							<a href={WHOP_CHECKOUT_URL} className="block">
								<Button variant="soft" size="3" className="w-full">
									Get Started Free
								</Button>
							</a>
						</Card>
						
						<Card size="4" variant="surface" className="bg-gray-a3 border-2 border-cyan-500 p-8 relative">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 rounded-full">
								<Text size="1" weight="bold" className="text-black">POPULAR</Text>
							</div>
							<Text size="5" weight="bold" className="block mb-2">Unlimited</Text>
							<div className="flex items-baseline gap-1 mb-6">
								<Text size="9" weight="bold" className="text-cyan-400">$9</Text>
								<Text size="3" color="gray">/month</Text>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Unlimited simulation runs</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">All prop firms supported</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Trading plan generation</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Full results & visualizations</Text>
								</li>
								<li className="flex items-center gap-2">
									<span className="text-green-500">✓</span>
									<Text size="2">Export/Import runs</Text>
								</li>
							</ul>
							<a href={WHOP_CHECKOUT_URL} className="block">
								<Button variant="solid" size="3" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
									Upgrade to Unlimited
								</Button>
							</a>
						</Card>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="py-20 px-6 bg-gradient-to-t from-cyan-900/20 to-transparent">
				<div className="max-w-2xl mx-auto text-center">
					<Heading size="7" className="text-white mb-4">
						Ready to Know Your Odds?
					</Heading>
					<Text size="3" color="gray" className="mb-8">
						Stop guessing. Start simulating. Make data-driven decisions about your prop firm journey.
					</Text>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app" className="block">
								<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
									Launch App
								</Button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL} className="block">
								<Button variant="solid" size="4" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8">
									Start Free Today
								</Button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-8 px-6 border-t border-gray-a4">
				<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
					<Text size="2" color="gray">
						© 2024 AlphaSolver. All rights reserved.
					</Text>
					<div className="flex gap-6">
						<Text size="2" color="gray" className="hover:text-white cursor-pointer">Terms</Text>
						<Text size="2" color="gray" className="hover:text-white cursor-pointer">Privacy</Text>
						<Text size="2" color="gray" className="hover:text-white cursor-pointer">Contact</Text>
					</div>
				</div>
			</footer>
		</div>
	);
}
