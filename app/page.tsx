import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-slate-950 text-white antialiased">
			{/* Gradient mesh background */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px]" />
				<div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]" />
				<div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-500/10 rounded-full blur-[90px]" />
			</div>

			{/* Navigation */}
			<nav className="relative z-20 max-w-7xl mx-auto px-6 py-5">
				<div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-slate-700/50">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
							<span className="text-slate-900 font-black text-lg">α</span>
						</div>
						<span className="font-bold text-xl text-white">AlphaSolver</span>
					</div>
					<div className="flex items-center gap-5">
						<Link href="/app" className="text-slate-200 hover:text-white transition-colors font-medium">
							Sign In
						</Link>
						<a href={WHOP_CHECKOUT_URL}>
							<button className="px-5 py-2.5 font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 rounded-xl transition-all shadow-lg shadow-emerald-500/25">
								Get Started
							</button>
						</a>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-28">
				<div className="text-center space-y-8">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/15 border border-emerald-400/30">
						<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
						<span className="text-sm text-emerald-300 font-semibold">Monte Carlo Simulation for Prop Traders</span>
					</div>
					
					{/* Main headline */}
					<h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
						<span className="text-white">Know Your </span>
						<span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">True Odds</span>
						<br />
						<span className="text-slate-200">Before You Pay</span>
					</h1>
					
					{/* Subheadline */}
					<p className="text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed">
						Upload your trade log. See your real probability of passing any prop firm challenge. 
						Make data-driven decisions.
					</p>
					
					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-8 py-4 font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]">
									Launch App
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-8 py-4 font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]">
									Start Free →
								</button>
							</a>
						)}
						<Link href="/app">
							<button className="px-8 py-4 font-semibold rounded-2xl bg-slate-800/80 border border-slate-600 hover:bg-slate-700/80 hover:border-slate-500 transition-all text-white backdrop-blur-sm">
								I Have Access
							</button>
						</Link>
					</div>
					
					{/* Trust indicators */}
					<div className="flex flex-wrap items-center justify-center gap-8 pt-6 text-sm text-slate-200">
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							No credit card required
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							10 free runs daily
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							Runs in browser
						</span>
					</div>
				</div>
			</section>

			{/* Example Output Section */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Live Preview</span>
						<h2 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-white">
							See What You'll Get
						</h2>
						<p className="text-slate-200 text-lg max-w-xl mx-auto">
							Real simulation output from a trader's NinjaTrader export
						</p>
					</div>
					
					{/* Results Card */}
					<div className="relative max-w-5xl mx-auto">
						<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-violet-500/20 rounded-3xl blur-2xl" />
						<div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
							{/* Header */}
							<div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-700/50">
								<div className="flex items-center gap-4">
									<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
										<span className="text-slate-900 font-black text-xl">TS</span>
									</div>
									<div>
										<p className="font-bold text-xl text-white">Topstep 50k Evaluation</p>
										<p className="text-slate-300">10,000 Monte Carlo paths</p>
									</div>
								</div>
								<div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40">
									<span className="text-emerald-400 font-bold">+EV Strategy</span>
								</div>
							</div>
							
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Left: Metrics */}
								<div className="space-y-6">
									{/* Pass Rate - Hero Metric */}
									<div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-400/30 p-6">
										<p className="text-slate-200 font-medium mb-2">Pass Probability</p>
										<div className="flex items-baseline gap-2">
											<span className="text-6xl font-black text-emerald-400">67.2</span>
											<span className="text-3xl text-emerald-400 font-bold">%</span>
										</div>
										<p className="text-emerald-300 mt-2 font-medium">↑ 95% CI: [65.1%, 69.3%]</p>
									</div>
									
									{/* Secondary Metrics Grid */}
									<div className="grid grid-cols-2 gap-4">
										<div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
											<p className="text-slate-300 text-sm mb-1">Net EV / Attempt</p>
											<p className="text-2xl font-bold text-emerald-400">$1,847</p>
										</div>
										<div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
											<p className="text-slate-300 text-sm mb-1">Expected Attempts</p>
											<p className="text-2xl font-bold text-white">1.5</p>
										</div>
										<div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
											<p className="text-slate-300 text-sm mb-1">Days to Pass</p>
											<p className="text-2xl font-bold text-white">28</p>
										</div>
										<div className="rounded-xl bg-slate-800/80 border border-slate-700/50 p-4">
											<p className="text-slate-300 text-sm mb-1">Expected ROI</p>
											<p className="text-2xl font-bold text-emerald-400">+412%</p>
										</div>
									</div>
								</div>
								
								{/* Right: Chart */}
								<div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
									<div className="flex items-center justify-between mb-4">
										<p className="font-bold text-white text-lg">Simulation Paths</p>
										<div className="flex items-center gap-4 text-sm">
											<span className="flex items-center gap-2">
												<span className="w-3 h-3 rounded-full bg-emerald-500" />
												<span className="text-slate-200">Winners</span>
											</span>
											<span className="flex items-center gap-2">
												<span className="w-3 h-3 rounded-full bg-rose-500" />
												<span className="text-slate-200">Losers</span>
											</span>
										</div>
									</div>
									<div className="relative h-48 overflow-hidden rounded-xl bg-slate-900/80 border border-slate-700/50">
										<svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
											<path d="M0,140 Q50,130 100,110 T200,70 T300,35 T400,15" fill="none" stroke="#10b981" strokeWidth="2.5"/>
											<path d="M0,140 Q60,135 120,120 T220,90 T320,55 T400,25" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6"/>
											<path d="M0,140 Q40,125 80,100 T180,60 T280,30 T400,10" fill="none" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5"/>
											<path d="M0,140 Q55,132 110,115 T210,80 T310,45 T400,20" fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.7"/>
											<path d="M0,140 Q30,148 60,160 T120,178 T150,192" fill="none" stroke="#f43f5e" strokeWidth="2.5"/>
											<path d="M0,140 Q40,152 80,168 T140,185 T180,195" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.5"/>
											<line x1="0" y1="140" x2="400" y2="140" stroke="#475569" strokeWidth="1" strokeDasharray="6,4"/>
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
						<span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Simple Process</span>
						<h2 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-white">
							How It Works
						</h2>
						<p className="text-slate-200 text-lg">
							Three steps to data-driven prop trading decisions
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Step 1 */}
						<div className="group bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 text-center hover:border-cyan-500/50 transition-all duration-300">
							<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
								<span className="text-3xl font-black text-cyan-400">1</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Upload Trade Log</h3>
							<p className="text-slate-200 leading-relaxed">
								Export from NinjaTrader, TradingView, Tradovate, Rithmic, or any platform as CSV
							</p>
						</div>
						
						{/* Step 2 */}
						<div className="group bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 text-center hover:border-violet-500/50 transition-all duration-300">
							<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 border border-violet-400/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
								<span className="text-3xl font-black text-violet-400">2</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Select Prop Firm</h3>
							<p className="text-slate-200 leading-relaxed">
								Choose from Topstep, Take Profit Trader, Tradeify, FFN, or create custom rules
							</p>
						</div>
						
						{/* Step 3 */}
						<div className="group bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 text-center hover:border-emerald-500/50 transition-all duration-300">
							<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-400/40 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
								<span className="text-3xl font-black text-emerald-400">3</span>
							</div>
							<h3 className="text-xl font-bold text-white mb-3">Get Results</h3>
							<p className="text-slate-200 leading-relaxed">
								See pass probability, expected costs, timeline, and personalized trading plan
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Features</span>
						<h2 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-white">
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
							<div key={i} className="group bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-6 hover:border-slate-600 transition-all duration-300">
								<span className="text-4xl block mb-4 group-hover:scale-110 transition-transform inline-block">{feature.icon}</span>
								<h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
								<p className="text-slate-200 leading-relaxed">{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="text-center mb-16">
						<span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Pricing</span>
						<h2 className="text-4xl md:text-5xl font-black mt-4 mb-4 text-white">
							Simple, Transparent Pricing
						</h2>
						<p className="text-slate-200 text-lg">
							Start free, upgrade when you need more
						</p>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
						{/* Free Plan */}
						<div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8 hover:border-slate-600 transition-all">
							<div className="mb-8">
								<h3 className="text-2xl font-bold text-white mb-2">Free</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-black text-white">$0</span>
									<span className="text-slate-300 text-lg">/month</span>
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
										<div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
											<svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
										</div>
										<span className="text-slate-100">{item}</span>
									</li>
								))}
								<li className="flex items-center gap-3">
									<div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
										<svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
									</div>
									<span className="text-slate-400">Export/Import runs</span>
								</li>
							</ul>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-4 px-6 rounded-2xl bg-slate-800 border border-slate-600 font-bold text-white hover:bg-slate-700 hover:border-slate-500 transition-all">
									Get Started Free
								</button>
							</a>
						</div>
						
						{/* Unlimited Plan */}
						<div className="relative">
							<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
							<div className="relative bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-3xl p-8 shadow-xl shadow-emerald-500/10">
								{/* Popular badge */}
								<div className="absolute -top-4 left-1/2 -translate-x-1/2">
									<div className="px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/30">
										Most Popular
									</div>
								</div>
								
								<div className="mb-8 pt-4">
									<h3 className="text-2xl font-bold text-white mb-2">Unlimited</h3>
									<div className="flex items-baseline gap-1">
										<span className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">$9</span>
										<span className="text-slate-300 text-lg">/month</span>
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
											<div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
												<svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
											</div>
											<span className="text-slate-100">{item}</span>
										</li>
									))}
								</ul>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 font-black transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]">
										Upgrade to Unlimited
									</button>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-28 px-6">
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="w-[600px] h-[400px] bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-violet-500/15 rounded-full blur-[100px]" />
				</div>
				<div className="relative max-w-3xl mx-auto text-center">
					<h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
						Ready to Know Your{' '}
						<span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">True Odds</span>?
					</h2>
					<p className="text-xl text-slate-200 mb-10 max-w-xl mx-auto">
						Stop guessing. Start simulating. Make data-driven decisions about your prop firm journey.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-10 py-4 font-black rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]">
									Launch App →
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-10 py-4 font-black rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-900 transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]">
									Start Free Today →
								</button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-12 px-6 border-t border-slate-800/50">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-6">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
								<span className="text-slate-900 font-black">α</span>
							</div>
							<span className="font-bold text-white">AlphaSolver</span>
						</div>
						<div className="flex items-center gap-8 text-slate-300">
							<a href="#" className="hover:text-white transition-colors">Terms</a>
							<a href="#" className="hover:text-white transition-colors">Privacy</a>
							<a href="#" className="hover:text-white transition-colors">Contact</a>
						</div>
						<p className="text-slate-400">
							© 2024 AlphaSolver. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
