import Link from "next/link";

// For landing page checkout URL
// Priority: NEXT_PUBLIC_WHOP_EXPERIENCE_URL > NEXT_PUBLIC_WHOP_CHECKOUT_URL > default
// Use experience URL to ensure users land where the app is installed
const WHOP_CHECKOUT_URL = 
	process.env.NEXT_PUBLIC_WHOP_EXPERIENCE_URL || 
	process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || 
	"https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-[#080c14] text-white antialiased">
			{/* Subtle gradient overlay */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent" />
				<div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-teal-500/5 via-transparent to-transparent" />
			</div>

			{/* Navigation */}
			<nav className="relative z-20 max-w-7xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
							<span className="text-[#080c14] font-bold text-lg">α</span>
						</div>
						<span className="font-semibold text-lg text-white">AlphaSolver</span>
					</div>
					<div className="flex items-center gap-6">
						<Link href="/app" className="text-slate-300 hover:text-white transition-colors text-sm">
							Sign In
						</Link>
						<a href={WHOP_CHECKOUT_URL}>
							<button className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-400 text-[#080c14] rounded-lg transition-all">
								Get Started
							</button>
						</a>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24">
				<div className="text-center space-y-6">
					{/* Badge */}
					<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f1520] border border-[#1e293b]">
						<span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
						<span className="text-sm text-slate-300">Monte Carlo Simulation for Prop Traders</span>
					</div>
					
					{/* Main headline */}
					<h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
						<span className="text-white">Know Your </span>
						<span className="text-teal-400">True Odds</span>
						<br />
						<span className="text-slate-400">Before You Pay</span>
					</h1>
					
					{/* Subheadline */}
					<p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
						Upload your trade log. See your real probability of passing any prop firm challenge.
					</p>
					
					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-6 py-3 font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-black transition-all">
									Launch App
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-6 py-3 font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-black transition-all">
									Start Free →
								</button>
							</a>
						)}
						<Link href="/app">
							<button className="px-6 py-3 font-semibold rounded-lg bg-slate-700 border border-slate-600 hover:bg-slate-600 transition-all text-white">
								I Have Access
							</button>
						</Link>
					</div>
					
					{/* Trust indicators */}
					<div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-slate-400">
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							No credit card required
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							10 free runs daily
						</span>
						<span className="flex items-center gap-2">
							<svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
							Runs in browser
						</span>
					</div>
				</div>
			</section>

			{/* Example Output Section */}
			<section className="relative z-10 py-20 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-sm text-teal-400 uppercase tracking-wider mb-2">Live Preview</p>
						<h2 className="text-3xl md:text-4xl font-bold text-white">
							See What You'll Get
						</h2>
					</div>
					
					{/* Results Card - Dashboard Style */}
					<div className="bg-[#0f1520] border border-[#1e293b] rounded-2xl p-6 md:p-8">
						{/* Header */}
						<div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1e293b]">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
									<span className="text-[#080c14] font-bold">TS</span>
								</div>
								<div>
									<p className="font-semibold text-white">Topstep 50k Evaluation</p>
									<p className="text-sm text-slate-500">10,000 Monte Carlo paths</p>
								</div>
							</div>
							<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
								<span className="w-2 h-2 rounded-full bg-teal-400" />
								<span className="text-sm text-teal-400 font-medium">+EV Strategy</span>
							</div>
						</div>
						
						{/* Metrics Grid - Like Dashboard Cards */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div className="bg-[#0a0e16] border border-[#1e293b] rounded-xl p-4">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pass Rate</p>
								<p className="text-3xl font-bold text-teal-400">67.2%</p>
							</div>
							<div className="bg-[#0a0e16] border border-[#1e293b] rounded-xl p-4">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net EV</p>
								<p className="text-3xl font-bold text-green-400">$1,847</p>
							</div>
							<div className="bg-[#0a0e16] border border-[#1e293b] rounded-xl p-4">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Attempts</p>
								<p className="text-3xl font-bold text-white">1.5</p>
							</div>
							<div className="bg-[#0a0e16] border border-[#1e293b] rounded-xl p-4">
								<p className="text-xs text-slate-500 uppercase tracking-wider mb-1">ROI</p>
								<p className="text-3xl font-bold text-green-400">+412%</p>
							</div>
						</div>
						
						{/* Chart Area */}
						<div className="bg-[#0a0e16] border border-[#1e293b] rounded-xl p-4">
							<div className="flex items-center justify-between mb-3">
								<p className="text-sm font-medium text-white">Simulation Paths</p>
								<div className="flex items-center gap-4 text-xs">
									<span className="flex items-center gap-1.5">
										<span className="w-2 h-2 rounded-full bg-teal-400" />
										<span className="text-slate-400">Winners</span>
									</span>
									<span className="flex items-center gap-1.5">
										<span className="w-2 h-2 rounded-full bg-rose-400" />
										<span className="text-slate-400">Losers</span>
									</span>
								</div>
							</div>
							<div className="h-40 relative">
								<svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
									<path d="M0,120 Q50,110 100,90 T200,55 T300,28 T400,12" fill="none" stroke="#2dd4bf" strokeWidth="2"/>
									<path d="M0,120 Q60,115 120,100 T220,75 T320,45 T400,20" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.5"/>
									<path d="M0,120 Q40,105 80,80 T180,48 T280,24 T400,8" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.4"/>
									<path d="M0,120 Q30,128 60,140 T120,152" fill="none" stroke="#fb7185" strokeWidth="2"/>
									<path d="M0,120 Q40,132 80,148 T140,155" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeOpacity="0.5"/>
									<line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4"/>
								</svg>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className="relative z-10 py-20 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-sm text-teal-400 uppercase tracking-wider mb-2">Simple Process</p>
						<h2 className="text-3xl md:text-4xl font-bold text-white">
							How It Works
						</h2>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="bg-[#0f1520] border border-[#1e293b] rounded-xl p-6 hover:border-[#334155] transition-all">
							<div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
								<span className="text-lg font-bold text-cyan-400">1</span>
							</div>
							<h3 className="text-lg font-semibold text-white mb-2">Upload Trade Log</h3>
							<p className="text-sm text-slate-400 leading-relaxed">
								Export from NinjaTrader, TradingView, Tradovate, Rithmic, or any platform as CSV
							</p>
						</div>
						
						<div className="bg-[#0f1520] border border-[#1e293b] rounded-xl p-6 hover:border-[#334155] transition-all">
							<div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4">
								<span className="text-lg font-bold text-violet-400">2</span>
							</div>
							<h3 className="text-lg font-semibold text-white mb-2">Select Prop Firm</h3>
							<p className="text-sm text-slate-400 leading-relaxed">
								Choose from Topstep, Take Profit Trader, Tradeify, FFN, or create custom rules
							</p>
						</div>
						
						<div className="bg-[#0f1520] border border-[#1e293b] rounded-xl p-6 hover:border-[#334155] transition-all">
							<div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4">
								<span className="text-lg font-bold text-teal-400">3</span>
							</div>
							<h3 className="text-lg font-semibold text-white mb-2">Get Results</h3>
							<p className="text-sm text-slate-400 leading-relaxed">
								See pass probability, expected costs, timeline, and personalized trading plan
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features Grid */}
			<section className="relative z-10 py-20 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-sm text-teal-400 uppercase tracking-wider mb-2">Features</p>
						<h2 className="text-3xl md:text-4xl font-bold text-white">
							Everything You Need
						</h2>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[
							{ icon: "📊", title: "Monte Carlo Simulation", desc: "10,000+ simulated paths using your actual trade statistics" },
							{ icon: "🎯", title: "Outcome Clustering", desc: "AI-powered clustering identifies the most probable scenarios" },
							{ icon: "💰", title: "Cost Analysis", desc: "Full breakdown of expected costs including rebills and resets" },
							{ icon: "📈", title: "ROI Calculator", desc: "Expected return on investment accounting for all costs" },
							{ icon: "📋", title: "Trading Plan", desc: "Personalized daily profit targets and risk limits" },
							{ icon: "🏢", title: "All Major Prop Firms", desc: "Topstep, TPT, Tradeify, FFN, and custom rules" },
						].map((feature, i) => (
							<div key={i} className="bg-[#0f1520] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all">
								<span className="text-2xl block mb-3">{feature.icon}</span>
								<h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
								<p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section className="relative z-10 py-20 px-6">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-sm text-teal-400 uppercase tracking-wider mb-2">Pricing</p>
						<h2 className="text-3xl md:text-4xl font-bold text-white">
							Simple, Transparent Pricing
						</h2>
					</div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Free Plan */}
						<div className="bg-[#0f1520] border border-[#1e293b] rounded-xl p-6 hover:border-[#334155] transition-all">
							<div className="mb-6">
								<h3 className="text-xl font-semibold text-white mb-1">Free</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-4xl font-bold text-white">$0</span>
									<span className="text-slate-500">/month</span>
								</div>
							</div>
							
							<ul className="space-y-3 mb-6">
								{[
									"10 simulation runs per day",
									"All prop firms supported",
									"Trading plan generation",
									"Full results & visualizations",
								].map((item, i) => (
									<li key={i} className="flex items-center gap-2 text-sm">
										<svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
										<span className="text-slate-300">{item}</span>
									</li>
								))}
								<li className="flex items-center gap-2 text-sm">
									<svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
									<span className="text-slate-500">Export/Import runs</span>
								</li>
							</ul>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3 px-4 rounded-lg bg-slate-700 border border-slate-600 font-semibold text-white hover:bg-slate-600 transition-all">
									Get Started Free
								</button>
							</a>
						</div>
						
						{/* Unlimited Plan */}
						<div className="bg-[#0f1520] border-2 border-teal-500/50 rounded-xl p-6 relative">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2">
								<span className="px-3 py-1 rounded-full bg-teal-500 text-black text-xs font-bold uppercase">
									Popular
								</span>
							</div>
							
							<div className="mb-6 pt-2">
								<h3 className="text-xl font-semibold text-white mb-1">Unlimited</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-4xl font-bold text-teal-400">$9</span>
									<span className="text-slate-500">/month</span>
								</div>
							</div>
							
							<ul className="space-y-3 mb-6">
								{[
									"Unlimited simulation runs",
									"All prop firms supported",
									"Trading plan generation",
									"Full results & visualizations",
									"Export/Import runs",
								].map((item, i) => (
									<li key={i} className="flex items-center gap-2 text-sm">
										<svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
										<span className="text-slate-300">{item}</span>
									</li>
								))}
							</ul>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 font-bold text-black transition-all">
									Upgrade to Unlimited
								</button>
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-20 px-6">
				<div className="max-w-2xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
						Ready to Know Your <span className="text-teal-400">True Odds</span>?
					</h2>
					<p className="text-slate-400 mb-8">
						Stop guessing. Start simulating. Make data-driven decisions.
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="px-6 py-3 font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-black transition-all">
									Launch App →
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="px-6 py-3 font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-black transition-all">
									Start Free Today →
								</button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-8 px-6 border-t border-[#1e293b]">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
								<span className="text-[#080c14] font-bold text-sm">α</span>
							</div>
							<span className="font-medium text-white">AlphaSolver</span>
						</div>
						<div className="flex items-center gap-6 text-sm text-slate-500">
							<a href="#" className="hover:text-white transition-colors">Terms</a>
							<a href="#" className="hover:text-white transition-colors">Privacy</a>
							<a href="#" className="hover:text-white transition-colors">Contact</a>
						</div>
						<p className="text-sm text-slate-600">
							© 2024 AlphaSolver
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
