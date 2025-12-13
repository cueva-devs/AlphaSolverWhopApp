import { Button, Card, Heading, Text } from "@whop/react/components";
import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-[#0a0a0f] text-white">
			{/* Animated background */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/8 via-transparent to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
				<div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/8 via-transparent to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
				<div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-gradient-to-bl from-blue-500/5 via-transparent to-transparent rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
				{/* Grid overlay */}
				<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
			</div>

			{/* Navigation */}
			<nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
						<span className="text-black font-bold text-sm">α</span>
					</div>
					<span className="font-semibold text-lg tracking-tight">AlphaSolver</span>
				</div>
				<div className="flex items-center gap-4">
					<Link href="/app" className="text-sm text-gray-400 hover:text-white transition-colors">
						Sign In
					</Link>
					<a href={WHOP_CHECKOUT_URL}>
						<button className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-lg transition-all hover:border-white/20">
							Get Started
						</button>
					</a>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
				<div className="text-center space-y-8">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
						<span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
						<span className="text-sm text-gray-300">Monte Carlo Simulation for Prop Traders</span>
					</div>
					
					{/* Main headline */}
					<h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
						Know Your{' '}
						<span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
							True Odds
						</span>
						<br />
						<span className="text-gray-400">Before You Pay</span>
					</h1>
					
					{/* Subheadline */}
					<p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
						Upload your trade log. See your real probability of passing any prop firm challenge. 
						Make data-driven decisions.
					</p>
					
					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="group relative px-8 py-4 font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]">
									<span className="relative z-10">Launch App</span>
									<div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="group relative px-8 py-4 font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]">
									<span className="relative z-10">Start Free →</span>
									<div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" />
								</button>
							</a>
						)}
						<Link href="/app">
							<button className="px-8 py-4 font-medium rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm">
								I Have Access
							</button>
						</Link>
					</div>
					
					{/* Trust indicators */}
					<div className="flex items-center justify-center gap-6 pt-4 text-sm text-gray-500">
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							No credit card required
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							10 free runs daily
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							Runs in browser
						</span>
					</div>
				</div>
			</section>

			{/* Example Output Section */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Live Preview</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
							See What You'll Get
						</h2>
						<p className="text-gray-400 text-lg max-w-xl mx-auto">
							Real simulation output from a trader's NinjaTrader export
						</p>
					</div>
					
					{/* Glassmorphism Results Card */}
					<div className="relative max-w-5xl mx-auto">
						{/* Glow effect behind card */}
						<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-cyan-500/20 blur-3xl opacity-50" />
						
						<div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
							{/* Header */}
							<div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
										<span className="text-black font-bold">TS</span>
									</div>
									<div>
										<p className="font-semibold">Topstep 50k Evaluation</p>
										<p className="text-sm text-gray-500">10,000 Monte Carlo paths</p>
									</div>
								</div>
								<div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
									<span className="text-sm text-green-400 font-medium">+EV Strategy</span>
								</div>
							</div>
							
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Left: Metrics */}
								<div className="space-y-6">
									{/* Pass Rate - Hero Metric */}
									<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 p-6">
										<div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
										<p className="text-sm text-gray-400 mb-2">Pass Probability</p>
										<div className="flex items-baseline gap-2">
											<span className="text-5xl font-bold text-green-400">67.2</span>
											<span className="text-2xl text-green-400">%</span>
										</div>
										<p className="text-xs text-green-500/70 mt-2">↑ 95% CI: [65.1%, 69.3%]</p>
									</div>
									
									{/* Secondary Metrics Grid */}
									<div className="grid grid-cols-2 gap-4">
										<div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
											<p className="text-xs text-gray-500 mb-1">Net EV / Attempt</p>
											<p className="text-2xl font-bold text-green-400">$1,847</p>
										</div>
										<div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
											<p className="text-xs text-gray-500 mb-1">Expected Attempts</p>
											<p className="text-2xl font-bold">1.5</p>
										</div>
										<div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
											<p className="text-xs text-gray-500 mb-1">Days to Pass</p>
											<p className="text-2xl font-bold">28</p>
										</div>
										<div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
											<p className="text-xs text-gray-500 mb-1">Expected ROI</p>
											<p className="text-2xl font-bold text-green-400">+412%</p>
										</div>
									</div>
								</div>
								
								{/* Right: Chart */}
								<div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
									<div className="flex items-center justify-between mb-4">
										<p className="font-medium">Simulation Paths</p>
										<div className="flex items-center gap-4 text-xs">
											<span className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-green-500" />
												Winners
											</span>
											<span className="flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-red-500" />
												Losers
											</span>
										</div>
									</div>
									<div className="relative h-48 overflow-hidden rounded-xl bg-black/30">
										<svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
											{/* Gradient definitions */}
											<defs>
												<linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="rgba(34,197,94,0.6)" />
													<stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
												</linearGradient>
												<linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="rgba(239,68,68,0.6)" />
													<stop offset="100%" stopColor="rgba(239,68,68,0.2)" />
												</linearGradient>
											</defs>
											{/* Winning paths */}
											<path d="M0,140 Q50,130 100,110 T200,70 T300,35 T400,15" fill="none" stroke="url(#greenGrad)" strokeWidth="1.5"/>
											<path d="M0,140 Q60,135 120,120 T220,90 T320,55 T400,25" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
											<path d="M0,140 Q40,125 80,100 T180,60 T280,30 T400,10" fill="none" stroke="rgba(34,197,94,0.25)" strokeWidth="1"/>
											<path d="M0,140 Q70,138 140,125 T240,100 T340,65 T400,40" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="1"/>
											<path d="M0,140 Q55,132 110,115 T210,80 T310,45 T400,20" fill="none" stroke="rgba(34,197,94,0.35)" strokeWidth="1"/>
											<path d="M0,140 Q45,128 90,105 T190,65 T290,32 T400,12" fill="none" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
											{/* Losing paths */}
											<path d="M0,140 Q30,148 60,160 T120,178 T150,192" fill="none" stroke="url(#redGrad)" strokeWidth="1.5"/>
											<path d="M0,140 Q40,152 80,168 T140,185 T180,195" fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth="1"/>
											<path d="M0,140 Q25,145 50,155 T100,172 T130,188" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="1"/>
											{/* Reference lines */}
											<line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4"/>
											<line x1="0" y1="40" x2="400" y2="40" stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="4"/>
											<line x1="0" y1="185" x2="400" y2="185" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4"/>
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
						<span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Simple Process</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
							How It Works
						</h2>
						<p className="text-gray-400 text-lg">
							Three steps to data-driven prop trading decisions
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Step 1 */}
						<div className="group relative">
							<div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<div className="relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center hover:border-white/10 transition-all duration-300">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
									<span className="text-2xl font-bold bg-gradient-to-br from-cyan-400 to-cyan-300 bg-clip-text text-transparent">1</span>
								</div>
								<h3 className="text-xl font-semibold mb-3">Upload Trade Log</h3>
								<p className="text-gray-400 text-sm leading-relaxed">
									Export from NinjaTrader, TradingView, Tradovate, Rithmic, or any platform as CSV
								</p>
							</div>
						</div>
						
						{/* Step 2 */}
						<div className="group relative">
							<div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<div className="relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center hover:border-white/10 transition-all duration-300">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
									<span className="text-2xl font-bold bg-gradient-to-br from-purple-400 to-purple-300 bg-clip-text text-transparent">2</span>
								</div>
								<h3 className="text-xl font-semibold mb-3">Select Prop Firm</h3>
								<p className="text-gray-400 text-sm leading-relaxed">
									Choose from Topstep, Take Profit Trader, Tradeify, FFN, or create custom rules
								</p>
							</div>
						</div>
						
						{/* Step 3 */}
						<div className="group relative">
							<div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							<div className="relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 text-center hover:border-white/10 transition-all duration-300">
								<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
									<span className="text-2xl font-bold bg-gradient-to-br from-green-400 to-green-300 bg-clip-text text-transparent">3</span>
								</div>
								<h3 className="text-xl font-semibold mb-3">Get Results</h3>
								<p className="text-gray-400 text-sm leading-relaxed">
									See pass probability, expected costs, timeline, and personalized trading plan
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Features</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
							Everything You Need
						</h2>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[
							{ icon: "📊", title: "Monte Carlo Simulation", desc: "10,000+ simulated paths using your actual trade statistics for statistically significant results", gradient: "from-cyan-500/20" },
							{ icon: "🎯", title: "Outcome Clustering", desc: "AI-powered clustering identifies the most probable scenarios and their likelihood", gradient: "from-purple-500/20" },
							{ icon: "💰", title: "Cost Analysis", desc: "Full breakdown of expected costs including rebills, resets, and funded setup fees", gradient: "from-green-500/20" },
							{ icon: "📈", title: "ROI Calculator", desc: "See your expected return on investment accounting for all costs and probabilities", gradient: "from-blue-500/20" },
							{ icon: "📋", title: "Trading Plan", desc: "Personalized daily profit targets and risk limits based on what winners do differently", gradient: "from-orange-500/20" },
							{ icon: "🏢", title: "All Major Prop Firms", desc: "Pre-configured rules for Topstep, TPT, Tradeify, FFN, and custom rule support", gradient: "from-pink-500/20" },
						].map((feature, i) => (
							<div key={i} className="group relative">
								<div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
								<div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
									<span className="text-3xl block mb-4">{feature.icon}</span>
									<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
									<p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Pricing</span>
						<h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
							Simple, Transparent Pricing
						</h2>
						<p className="text-gray-400 text-lg">
							Start free, upgrade when you need more
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{/* Free Plan */}
						<div className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300">
							<div className="mb-8">
								<h3 className="text-xl font-semibold mb-2">Free</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-bold">$0</span>
									<span className="text-gray-500">/month</span>
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
										<div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
											<svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
										</div>
										<span className="text-gray-300 text-sm">{item}</span>
									</li>
								))}
								<li className="flex items-center gap-3">
									<div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
										<svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
									</div>
									<span className="text-gray-500 text-sm">Export/Import runs</span>
								</li>
							</ul>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 font-medium hover:bg-white/10 hover:border-white/20 transition-all">
									Get Started Free
								</button>
							</a>
						</div>
						
						{/* Unlimited Plan */}
						<div className="relative">
							{/* Glow effect */}
							<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50" />
							
							<div className="relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-cyan-500/30 rounded-3xl p-8">
								{/* Popular badge */}
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/30">
										Most Popular
									</div>
								</div>
								
								<div className="mb-8 pt-2">
									<h3 className="text-xl font-semibold mb-2">Unlimited</h3>
									<div className="flex items-baseline gap-1">
										<span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">$9</span>
										<span className="text-gray-500">/month</span>
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
											<span className="text-gray-200 text-sm">{item}</span>
										</li>
									))}
								</ul>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="group w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
										Upgrade to Unlimited
									</button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-32 px-6">
				{/* Background glow */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="w-[600px] h-[400px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl" />
				</div>
				
				<div className="relative max-w-3xl mx-auto text-center">
					<h2 className="text-4xl md:text-5xl font-bold mb-6">
						Ready to Know Your{' '}
						<span className="bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">True Odds</span>?
					</h2>
					<p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
						Stop guessing. Start simulating. Make data-driven decisions about your prop firm journey.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="group relative px-10 py-4 font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]">
									<span className="relative z-10">Launch App →</span>
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="group relative px-10 py-4 font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-black overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]">
									<span className="relative z-10">Start Free Today →</span>
								</button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-12 px-6 border-t border-white/5">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
								<span className="text-black font-bold text-xs">α</span>
							</div>
							<span className="font-medium text-sm">AlphaSolver</span>
						</div>
						<div className="flex items-center gap-8 text-sm text-gray-500">
							<a href="#" className="hover:text-white transition-colors">Terms</a>
							<a href="#" className="hover:text-white transition-colors">Privacy</a>
							<a href="#" className="hover:text-white transition-colors">Contact</a>
						</div>
						<p className="text-sm text-gray-600">
							© 2024 AlphaSolver. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
