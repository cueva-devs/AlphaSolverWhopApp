import Link from "next/link";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

export default function Page() {
	return (
		<div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased overflow-x-hidden">
			{/* Grid Background */}
			<div className="fixed inset-0 grid-bg pointer-events-none" />
			
			{/* Gradient Accent */}
			<div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--accent-dim)_0%,_transparent_70%)] pointer-events-none opacity-50" />

			{/* Navigation */}
			<nav className="relative z-20 max-w-6xl mx-auto px-6 py-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-[var(--accent)] text-xl">α</span>
						<span className="text-sm tracking-wider">ALPHASOLVER</span>
					</div>
					<div className="flex items-center gap-8">
						<Link href="/app" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm">
							[sign in]
						</Link>
						<a href={WHOP_CHECKOUT_URL}>
							<button className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-amber-400 text-black font-medium transition-all">
								GET ACCESS
							</button>
						</a>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
				<div className="grid lg:grid-cols-2 gap-16 items-center">
					{/* Left: Copy */}
					<div className="space-y-8">
						<div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
							<p className="text-[var(--text-muted)] text-sm mb-4 tracking-wider">
								MONTE CARLO SIMULATION ENGINE
							</p>
							<h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
								<span className="font-['Instrument_Serif',_serif] italic text-[var(--text-primary)]">Know your</span>
								<br />
								<span className="font-['Instrument_Serif',_serif] italic text-[var(--accent)]">true odds</span>
							</h1>
						</div>
						
						<p className="animate-fade-up text-[var(--text-secondary)] text-lg max-w-md leading-relaxed" style={{ animationDelay: '100ms' }}>
							Upload your trade log. Run 10,000 simulations. See your real probability of passing any prop firm challenge—before you pay.
						</p>
						
						<div className="animate-fade-up flex flex-wrap gap-4" style={{ animationDelay: '200ms' }}>
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<button className="group px-6 py-3 bg-[var(--accent)] hover:bg-amber-400 text-black font-semibold transition-all flex items-center gap-2">
										LAUNCH APP
										<span className="group-hover:translate-x-1 transition-transform">→</span>
									</button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<button className="group px-6 py-3 bg-[var(--accent)] hover:bg-amber-400 text-black font-semibold transition-all flex items-center gap-2">
										START FREE
										<span className="group-hover:translate-x-1 transition-transform">→</span>
									</button>
								</a>
							)}
							<Link href="/app">
								<button className="px-6 py-3 border border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text-primary)] transition-all">
									I HAVE ACCESS
								</button>
							</Link>
						</div>
						
						<div className="animate-fade-up pt-4 flex items-center gap-8 text-sm text-[var(--text-muted)]" style={{ animationDelay: '300ms' }}>
							<span>✓ No credit card</span>
							<span>✓ 3 runs/day free</span>
							<span>✓ Runs locally</span>
						</div>
					</div>
					
					{/* Right: Live Simulation Preview */}
					<div className="animate-fade-up relative" style={{ animationDelay: '400ms' }}>
						<div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-1">
							{/* Terminal Header */}
							<div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
								<span className="w-3 h-3 rounded-full bg-[var(--negative)] opacity-80" />
								<span className="w-3 h-3 rounded-full bg-[var(--accent)] opacity-80" />
								<span className="w-3 h-3 rounded-full bg-[var(--positive)] opacity-80" />
								<span className="ml-4 text-xs text-[var(--text-muted)]">simulation_output.log</span>
							</div>
							
							{/* Terminal Content */}
							<div className="p-4 space-y-4 font-mono text-sm">
								<div className="text-[var(--text-muted)]">
									<span className="text-[var(--accent)]">$</span> alphasolver run --paths 10000
								</div>
								
								<div className="space-y-1 text-xs">
									<div className="text-[var(--text-muted)]">[████████████████████] 100% | 10,000 paths</div>
								</div>
								
								{/* Results */}
								<div className="pt-2 border-t border-[var(--border)] space-y-3">
									<div className="flex justify-between items-baseline">
										<span className="text-[var(--text-muted)]">PASS_RATE</span>
										<span className="text-2xl text-[var(--accent)] font-semibold">67.2%</span>
									</div>
									<div className="flex justify-between items-baseline">
										<span className="text-[var(--text-muted)]">EXPECTED_VALUE</span>
										<span className="text-2xl text-[var(--positive)] font-semibold">+$1,847</span>
									</div>
									<div className="flex justify-between items-baseline">
										<span className="text-[var(--text-muted)]">AVG_ATTEMPTS</span>
										<span className="text-2xl text-[var(--text-primary)] font-semibold">1.5</span>
									</div>
									<div className="flex justify-between items-baseline">
										<span className="text-[var(--text-muted)]">ROI</span>
										<span className="text-2xl text-[var(--positive)] font-semibold">+412%</span>
									</div>
								</div>
								
								{/* Verdict */}
								<div className="pt-3 border-t border-[var(--border)]">
									<div className="flex items-center gap-2">
										<span className="text-[var(--positive)]">●</span>
										<span className="text-[var(--positive)] text-xs">VERDICT: +EV STRATEGY</span>
									</div>
								</div>
								
								<div className="text-[var(--text-muted)] flex items-center">
									<span className="text-[var(--accent)]">$</span>
									<span className="ml-1 cursor-blink">_</span>
								</div>
							</div>
						</div>
						
						{/* Decorative Corner */}
						<div className="absolute -bottom-3 -right-3 w-24 h-24 border-r border-b border-[var(--accent)] opacity-30" />
					</div>
				</div>
			</section>

			{/* Equity Curve Visualization */}
			<section className="relative z-10 py-20 px-6 border-y border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-3 gap-8">
						<div className="lg:col-span-1 space-y-4">
							<p className="text-xs text-[var(--text-muted)] tracking-wider">SIMULATION OUTPUT</p>
							<h2 className="text-3xl font-['Instrument_Serif',_serif] italic">
								10,000 possible futures
							</h2>
							<p className="text-[var(--text-secondary)] text-sm leading-relaxed">
								Every line is a potential equity curve. Green paths pass. Red paths fail. Your statistics drive the simulation.
							</p>
						</div>
						
						<div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border)] p-6">
							<div className="flex items-center justify-between mb-4 text-xs">
								<span className="text-[var(--text-muted)]">TOPSTEP 50K EVALUATION</span>
								<div className="flex items-center gap-4">
									<span className="flex items-center gap-2">
										<span className="w-3 h-[2px] bg-[var(--positive)]" />
										<span className="text-[var(--text-muted)]">Pass (67.2%)</span>
									</span>
									<span className="flex items-center gap-2">
										<span className="w-3 h-[2px] bg-[var(--negative)]" />
										<span className="text-[var(--text-muted)]">Fail (32.8%)</span>
									</span>
								</div>
							</div>
							
							{/* SVG Chart */}
							<div className="h-48 relative">
								<svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
									{/* Zero line */}
									<line x1="0" y1="120" x2="500" y2="120" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,4" />
									
									{/* Profit target */}
									<line x1="0" y1="30" x2="500" y2="30" stroke="var(--positive)" strokeWidth="1" strokeDasharray="2,4" opacity="0.3" />
									<text x="505" y="34" fill="var(--text-muted)" fontSize="10">$3,000</text>
									
									{/* Drawdown limit */}
									<line x1="0" y1="160" x2="500" y2="160" stroke="var(--negative)" strokeWidth="1" strokeDasharray="2,4" opacity="0.3" />
									<text x="505" y="164" fill="var(--text-muted)" fontSize="10">-$2,000</text>
									
									{/* Winning paths */}
									<path d="M0,120 Q60,115 120,95 T240,60 T360,35 T500,25" fill="none" stroke="var(--positive)" strokeWidth="1.5" className="path-animate" opacity="0.8" />
									<path d="M0,120 Q80,110 140,85 T280,55 T400,30 T500,18" fill="none" stroke="var(--positive)" strokeWidth="1" opacity="0.4" />
									<path d="M0,120 Q50,118 100,100 T200,70 T300,45 T400,28 T500,22" fill="none" stroke="var(--positive)" strokeWidth="1" opacity="0.3" />
									<path d="M0,120 Q70,112 130,90 T260,58 T380,32 T500,20" fill="none" stroke="var(--positive)" strokeWidth="1" opacity="0.5" />
									<path d="M0,120 Q90,105 150,78 T290,48 T420,25 T500,15" fill="none" stroke="var(--positive)" strokeWidth="1" opacity="0.25" />
									
									{/* Losing paths */}
									<path d="M0,120 Q40,128 80,140 T160,158" fill="none" stroke="var(--negative)" strokeWidth="1.5" opacity="0.8" />
									<path d="M0,120 Q50,132 100,148 T180,162" fill="none" stroke="var(--negative)" strokeWidth="1" opacity="0.4" />
									<path d="M0,120 Q30,125 70,138 T130,155 T200,165" fill="none" stroke="var(--negative)" strokeWidth="1" opacity="0.3" />
								</svg>
								
								{/* Y-axis label */}
								<div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-xs text-[var(--text-muted)] [writing-mode:vertical-rl] rotate-180">
									P&L ($)
								</div>
							</div>
							
							<div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
								<span>Day 0</span>
								<span>Day 15</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works - Minimal */}
			<section className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">THE PROCESS</p>
						<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
							Three inputs. Infinite clarity.
						</h2>
					</div>
					
					<div className="grid md:grid-cols-3 gap-px bg-[var(--border)]">
						<div className="bg-[var(--bg-primary)] p-8 space-y-4">
							<div className="text-5xl font-['Instrument_Serif',_serif] text-[var(--accent)]">01</div>
							<h3 className="text-lg">Upload trade log</h3>
							<p className="text-sm text-[var(--text-secondary)] leading-relaxed">
								CSV export from NinjaTrader, TradingView, Tradovate, Rithmic, or manual entry. We extract your win rate, average win/loss, and trade frequency.
							</p>
						</div>
						
						<div className="bg-[var(--bg-primary)] p-8 space-y-4">
							<div className="text-5xl font-['Instrument_Serif',_serif] text-[var(--accent)]">02</div>
							<h3 className="text-lg">Select prop firm</h3>
							<p className="text-sm text-[var(--text-secondary)] leading-relaxed">
								Topstep, Take Profit Trader, Apex, Tradeify, or custom rules. We know every profit target, drawdown limit, and fee structure.
							</p>
						</div>
						
						<div className="bg-[var(--bg-primary)] p-8 space-y-4">
							<div className="text-5xl font-['Instrument_Serif',_serif] text-[var(--accent)]">03</div>
							<h3 className="text-lg">Get your odds</h3>
							<p className="text-sm text-[var(--text-secondary)] leading-relaxed">
								Pass probability, expected cost, optimal attempt strategy, and a personalized trading plan with daily targets.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* What You Get */}
			<section className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-2 gap-16">
						<div>
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">OUTPUT</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic mb-8">
								Everything you need to decide
							</h2>
							
							<div className="space-y-6">
								{[
									{ label: "Pass Probability", desc: "Monte Carlo derived pass rate across 10,000+ simulated evaluations" },
									{ label: "Expected Value", desc: "Net profit expectation accounting for fees, rebills, and payout probability" },
									{ label: "Cost Analysis", desc: "Total expected cost including multiple attempts and reset scenarios" },
									{ label: "Optimal Strategy", desc: "Best approach: aggressive, conservative, or somewhere between" },
									{ label: "Trading Plan", desc: "Daily profit targets and max loss limits tuned to your statistics" },
									{ label: "Attempt Forecast", desc: "How many evaluations until you statistically pass" },
								].map((item, i) => (
									<div key={i} className="flex gap-4 pb-6 border-b border-[var(--border)]">
										<span className="text-[var(--accent)] text-sm">0{i + 1}</span>
										<div>
											<h4 className="text-[var(--text-primary)] mb-1">{item.label}</h4>
											<p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
										</div>
									</div>
								))}
							</div>
						</div>
						
						<div className="flex items-center">
							<div className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] p-6 space-y-4">
								<div className="text-xs text-[var(--text-muted)] tracking-wider pb-4 border-b border-[var(--border)]">
									SAMPLE TRADING PLAN
								</div>
								
								<div className="space-y-3 font-mono text-sm">
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">account_size</span>
										<span>$50,000</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">profit_target</span>
										<span>$3,000</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">max_drawdown</span>
										<span className="text-[var(--negative)]">-$2,000</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">daily_loss_limit</span>
										<span className="text-[var(--negative)]">-$1,000</span>
									</div>
									<div className="pt-4 border-t border-[var(--border)]" />
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">recommended_daily_target</span>
										<span className="text-[var(--positive)]">+$187</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">recommended_daily_stop</span>
										<span className="text-[var(--negative)]">-$125</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">optimal_trades_per_day</span>
										<span>3-4</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">expected_days_to_pass</span>
										<span className="text-[var(--accent)]">12</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing - Stark */}
			<section className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-16">
						<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">PRICING</p>
						<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
							Simple. No surprises.
						</h2>
					</div>
					
					<div className="grid md:grid-cols-2 gap-px bg-[var(--border)]">
						{/* Free */}
						<div className="bg-[var(--bg-primary)] p-8">
							<div className="mb-8">
								<p className="text-sm text-[var(--text-muted)] mb-2">FREE</p>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-['Instrument_Serif',_serif]">$0</span>
									<span className="text-[var(--text-muted)]">/mo</span>
								</div>
							</div>
							
							<div className="space-y-3 mb-8 text-sm">
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>3 simulations per day</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>All prop firms supported</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Full results & analysis</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Trading plan generation</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--text-muted)]">—</span>
									<span className="text-[var(--text-muted)]">Export/import runs</span>
								</div>
							</div>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3 border border-[var(--border)] hover:border-[var(--text-muted)] text-sm transition-all">
									GET STARTED
								</button>
							</a>
						</div>
						
						{/* Unlimited */}
						<div className="bg-[var(--bg-secondary)] p-8 relative">
							<div className="absolute top-4 right-4 px-2 py-1 bg-[var(--accent)] text-black text-xs font-medium">
								POPULAR
							</div>
							
							<div className="mb-8">
								<p className="text-sm text-[var(--text-muted)] mb-2">UNLIMITED</p>
								<div className="flex items-baseline gap-1">
									<span className="text-5xl font-['Instrument_Serif',_serif] text-[var(--accent)]">$9</span>
									<span className="text-[var(--text-muted)]">/mo</span>
								</div>
							</div>
							
							<div className="space-y-3 mb-8 text-sm">
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Unlimited simulations</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>All prop firms supported</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Full results & analysis</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Trading plan generation</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[var(--positive)]">✓</span>
									<span>Export/import runs</span>
								</div>
							</div>
							
							<a href={WHOP_CHECKOUT_URL} className="block">
								<button className="w-full py-3 bg-[var(--accent)] hover:bg-amber-400 text-black text-sm font-medium transition-all">
									UPGRADE NOW
								</button>
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-32 px-6 border-t border-[var(--border)]">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-4xl md:text-5xl font-['Instrument_Serif',_serif] italic mb-6">
						Stop guessing.<br />
						<span className="text-[var(--accent)]">Start knowing.</span>
					</h2>
					<p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
						Your next prop firm attempt doesn't have to be a gamble. Run the numbers first.
					</p>
					<div className="flex flex-wrap gap-4 justify-center">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="group px-8 py-4 bg-[var(--accent)] hover:bg-amber-400 text-black font-semibold transition-all flex items-center gap-2">
									LAUNCH APP
									<span className="group-hover:translate-x-1 transition-transform">→</span>
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="group px-8 py-4 bg-[var(--accent)] hover:bg-amber-400 text-black font-semibold transition-all flex items-center gap-2">
									START FREE TODAY
									<span className="group-hover:translate-x-1 transition-transform">→</span>
								</button>
							</a>
						)}
					</div>
				</div>
			</section>

			{/* Footer - Minimal */}
			<footer className="relative z-10 py-8 px-6 border-t border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
						<div className="flex items-center gap-2">
							<span className="text-[var(--accent)]">α</span>
							<span className="tracking-wider">ALPHASOLVER</span>
						</div>
						<div className="flex items-center gap-6">
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
						</div>
						<p>© 2024</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
