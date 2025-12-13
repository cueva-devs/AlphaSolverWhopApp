import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-[#09090b] text-white">
			{/* Animated background */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/15 via-transparent to-transparent rounded-full blur-[120px]" />
				<div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-[100px]" />
			</div>

			{/* Navigation */}
			<nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
						<span className="text-black font-bold">α</span>
					</div>
					<span className="font-bold text-xl">AlphaSolver</span>
				</div>
				<div className="flex items-center gap-4">
					<Link href="/app" className="text-sm text-gray-300 hover:text-white transition-colors font-medium">
						Sign In
					</Link>
					<a href={WHOP_CHECKOUT_URL}>
						<button className="px-5 py-2.5 text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-all shadow-lg shadow-cyan-500/20">
							Get Started
						</button>
					</a>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
				<div className="text-center space-y-8">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
						<span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
						<span className="text-sm text-cyan-300 font-medium">Monte Carlo Simulation for Prop Traders</span>
					</div>
					
					{/* Main headline */}
					<h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
						Know Your{' '}
						<span className="text-cyan-400">True Odds</span>
						<br />
						<span className="text-zinc-400">Before You Pay</span>
					</h1>
					
					{/* Subheadline */}
					<p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
						Upload your trade log. See your real probability of passing any prop firm challenge. 
						Make data-driven decisions.
					</p>
					
					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-8 py-4 font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
									Launch App
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-8 py-4 font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
									Start Free →
								</button>
							</a>
						)}
						<Link href="/app">
							<button className="px-8 py-4 font-semibold rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-all text-white">
								I Have Access
							</button>
						</Link>
					</div>
					
					{/* Trust indicators */}
					<div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-zinc-400">
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							No credit card required
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							10 free runs daily
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							Runs in browser
						</span>
					</div>
				</div>
			</section>

			{/* Example Output Section */}
			<section className="relative z-10 py-24 px-6 bg-zinc-900/50">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Live Preview</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white">
							See What You'll Get
						</h2>
						<p className="text-zinc-400 text-lg max-w-xl mx-auto">
							Real simulation output from a trader's NinjaTrader export
						</p>
					</div>
					
					{/* Results Card */}
					<div className="relative max-w-5xl mx-auto">
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
							{/* Header */}
							<div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
										<span className="text-black font-bold text-lg">TS</span>
									</div>
									<div>
										<p className="font-bold text-lg text-white">Topstep 50k Evaluation</p>
										<p className="text-sm text-zinc-500">10,000 Monte Carlo paths</p>
									</div>
								</div>
								<div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40">
									<span className="text-sm text-green-400 font-bold">+EV Strategy</span>
								</div>
							</div>
							
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Left: Metrics */}
								<div className="space-y-6">
									{/* Pass Rate - Hero Metric */}
									<div className="rounded-xl bg-green-500/10 border border-green-500/30 p-6">
										<p className="text-sm text-zinc-400 font-medium mb-2">Pass Probability</p>
										<div className="flex items-baseline gap-2">
											<span className="text-6xl font-bold text-green-400">67.2</span>
											<span className="text-3xl text-green-400 font-bold">%</span>
										</div>
										<p className="text-sm text-green-400/80 mt-2 font-medium">↑ 95% CI: [65.1%, 69.3%]</p>
									</div>
									
									{/* Secondary Metrics Grid */}
									<div className="grid grid-cols-2 gap-4">
										<div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4">
											<p className="text-xs text-zinc-500 font-medium mb-1">Net EV / Attempt</p>
											<p className="text-2xl font-bold text-green-400">$1,847</p>
										</div>
										<div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4">
											<p className="text-xs text-zinc-500 font-medium mb-1">Expected Attempts</p>
											<p className="text-2xl font-bold text-white">1.5</p>
										</div>
										<div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4">
											<p className="text-xs text-zinc-500 font-medium mb-1">Days to Pass</p>
											<p className="text-2xl font-bold text-white">28</p>
										</div>
										<div className="rounded-xl bg-zinc-800/80 border border-zinc-700 p-4">
											<p className="text-xs text-zinc-500 font-medium mb-1">Expected ROI</p>
											<p className="text-2xl font-bold text-green-400">+412%</p>
										</div>
									</div>
								</div>
								
								{/* Right: Chart */}
								<div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-6">
									<div className="flex items-center justify-between mb-4">
										<p className="font-bold text-white">Simulation Paths</p>
										<div className="flex items-center gap-4 text-sm">
											<span className="flex items-center gap-2">
												<span className="w-3 h-3 rounded-full bg-green-500" />
												<span className="text-zinc-400">Winners</span>
											</span>
											<span className="flex items-center gap-2">
												<span className="w-3 h-3 rounded-full bg-red-500" />
												<span className="text-zinc-400">Losers</span>
											</span>
										</div>
									</div>
									<div className="relative h-48 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
										<svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
											{/* Winning paths */}
											<path d="M0,140 Q50,130 100,110 T200,70 T300,35 T400,15" fill="none" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.8"/>
											<path d="M0,140 Q60,135 120,120 T220,90 T320,55 T400,25" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5"/>
											<path d="M0,140 Q40,125 80,100 T180,60 T280,30 T400,10" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.4"/>
											<path d="M0,140 Q70,138 140,125 T240,100 T340,65 T400,40" fill="none" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.3"/>
											<path d="M0,140 Q55,132 110,115 T210,80 T310,45 T400,20" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6"/>
											<path d="M0,140 Q45,128 90,105 T190,65 T290,32 T400,12" fill="none" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.4"/>
											{/* Losing paths */}
											<path d="M0,140 Q30,148 60,160 T120,178 T150,192" fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.8"/>
											<path d="M0,140 Q40,152 80,168 T140,185 T180,195" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.4"/>
											<path d="M0,140 Q25,145 50,155 T100,172 T130,188" fill="none" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3"/>
											{/* Reference lines */}
											<line x1="0" y1="140" x2="400" y2="140" stroke="#52525b" strokeWidth="1" strokeDasharray="4"/>
											<line x1="0" y1="40" x2="400" y2="40" stroke="#22c55e" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5"/>
											<line x1="0" y1="185" x2="400" y2="185" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5"/>
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Simple Process</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white">
							How It Works
						</h2>
						<p className="text-zinc-400 text-lg">
							Three steps to data-driven prop trading decisions
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Step 1 */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center hover:border-zinc-700 transition-all">
							<div className="w-14 h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-cyan-400">1</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Upload Trade Log</h3>
							<p className="text-zinc-400 text-sm leading-relaxed">
								Export from NinjaTrader, TradingView, Tradovate, Rithmic, or any platform as CSV
							</p>
						</div>
						
						{/* Step 2 */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center hover:border-zinc-700 transition-all">
							<div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-purple-400">2</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Select Prop Firm</h3>
							<p className="text-zinc-400 text-sm leading-relaxed">
								Choose from Topstep, Take Profit Trader, Tradeify, FFN, or create custom rules
							</p>
						</div>
						
						{/* Step 3 */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center hover:border-zinc-700 transition-all">
							<div className="w-14 h-14 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
								<span className="text-2xl font-bold text-green-400">3</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Get Results</h3>
							<p className="text-zinc-400 text-sm leading-relaxed">
								See pass probability, expected costs, timeline, and personalized trading plan
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="relative z-10 py-24 px-6 bg-zinc-900/50">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Features</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white">
							Everything You Need
						</h2>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[
							{ icon: "📊", title: "Monte Carlo Simulation", desc: "10,000+ simulated paths using your actual trade statistics for statistically significant results" },
							{ icon: "🎯", title: "Outcome Clustering", desc: "AI-powered clustering identifies the most probable scenarios and their likelihood" },
							{ icon: "💰", title: "Cost Analysis", desc: "Full breakdown of expected costs including rebills, resets, and funded setup fees" },
							{ icon: "📈", title: "ROI Calculator", desc: "See your expected return on investment accounting for all costs and probabilities" },
							{ icon: "📋", title: "Trading Plan", desc: "Personalized daily profit targets and risk limits based on what winners do differently" },
							{ icon: "🏢", title: "All Major Prop Firms", desc: "Pre-configured rules for Topstep, TPT, Tradeify, FFN, and custom rule support" },
						].map((feature, i) => (
							<div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all">
								<span className="text-3xl block mb-4">{feature.icon}</span>
								<h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
								<p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Pricing</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 text-white">
							Simple, Transparent Pricing
						</h2>
						<p className="text-zinc-400 text-lg">
							Start free, upgrade when you need more
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{/* Free Plan */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all">
							<div className="mb-8">
								<h3 className="text-xl font-bold text-white mb-2">Free</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-bold text-white">$0</span>
									<span className="text-zinc-500">/month</span>
								</div>
							</div>
							
							<ul className="space-y-4 mb-8">
								{[
									"10 simulation runs per day",
									"All prop firms supported",
									"Trading plan generation",
									"Full results & visualizations",
								].map((item, i) => (
									<li key={i} className="flex items-center gap-3">
										<div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
											<svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
										</div>
										<span className="text-zinc-300 text-sm">{item}</span>
									</li>
								))}
								<li className="flex items-center gap-3">
									<div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
										<svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
									</div>
									<span className="text-zinc-600 text-sm">Export/Import runs</span>
								</li>
							</ul>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3.5 px-6 rounded-xl bg-zinc-800 border border-zinc-700 font-semibold text-white hover:bg-zinc-700 hover:border-zinc-600 transition-all">
									Get Started Free
								</button>
							</a>
						</div>
						
						{/* Unlimited Plan */}
						<div className="relative">
							<div className="bg-zinc-900 border-2 border-cyan-500/50 rounded-2xl p-8 shadow-lg shadow-cyan-500/10">
								{/* Popular badge */}
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<div className="px-4 py-1.5 rounded-full bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/30">
										Most Popular
									</div>
								</div>
								
								<div className="mb-8 pt-2">
									<h3 className="text-xl font-bold text-white mb-2">Unlimited</h3>
									<div className="flex items-baseline gap-1">
										<span className="text-5xl font-bold text-cyan-400">$9</span>
										<span className="text-zinc-500">/month</span>
									</div>
								</div>
								
								<ul className="space-y-4 mb-8">
									{[
										"Unlimited simulation runs",
										"All prop firms supported",
										"Trading plan generation",
										"Full results & visualizations",
										"Export/Import runs",
									].map((item, i) => (
										<li key={i} className="flex items-center gap-3">
											<div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
												<svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
											</div>
											<span className="text-zinc-200 text-sm">{item}</span>
										</li>
									))}
								</ul>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-all shadow-lg shadow-cyan-500/25">
										Upgrade to Unlimited
									</button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-24 px-6 bg-zinc-900/50">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
						Ready to Know Your{' '}
						<span className="text-cyan-400">True Odds</span>?
					</h2>
					<p className="text-xl text-zinc-400 mb-10 max-w-xl mx-auto">
						Stop guessing. Start simulating. Make data-driven decisions about your prop firm journey.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-10 py-4 font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
									Launch App →
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-10 py-4 font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
									Start Free Today →
								</button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-12 px-6 border-t border-zinc-800">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-3">
							<div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
								<span className="text-black font-bold text-sm">α</span>
							</div>
							<span className="font-bold text-white">AlphaSolver</span>
						</div>
						<div className="flex items-center gap-8 text-sm text-zinc-500">
							<a href="#" className="hover:text-white transition-colors">Terms</a>
							<a href="#" className="hover:text-white transition-colors">Privacy</a>
							<a href="#" className="hover:text-white transition-colors">Contact</a>
						</div>
						<p className="text-sm text-zinc-600">
							© 2024 AlphaSolver. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
