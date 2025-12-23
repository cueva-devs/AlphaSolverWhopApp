import Link from "next/link";

export default function DiscoverPage() {
	return (
		<div className="min-h-screen bg-[var(--bg-primary)]">
			{/* Header */}
			<header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<span className="text-[var(--accent)] text-2xl font-bold">α</span>
						<span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">ALPHASOLVER</span>
					</Link>
					<Link href="/app">
						<button className="btn btn-primary btn-sm">
							Launch App
						</button>
					</Link>
				</div>
			</header>

			<div className="max-w-5xl mx-auto px-6 py-16">
				{/* Hero */}
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 font-[var(--font-display)]">
						Monte Carlo Simulation for{" "}
						<span className="headline-gradient">Prop Traders</span>
					</h1>
					<p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
						Know your real probability of passing any prop firm challenge before you pay. 
						Upload your trade log, run 10,000+ simulations, and get your exact pass rate.
					</p>
				</div>

				{/* Main Feature Card */}
				<div className="chart-container p-8 mb-12">
					<div className="grid md:grid-cols-2 gap-8 items-center">
						<div>
							<h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
								What AlphaSolver Does
							</h2>
							<ul className="space-y-4">
								{[
									"Calculate your true pass probability based on your actual trade statistics",
									"Simulate against real prop firm rules (Topstep, TPT, Apex, Tradeify, and more)",
									"Get a personalized trading plan with daily targets and risk limits",
									"See expected costs, ROI, and time to payout before you start",
								].map((item, i) => (
									<li key={i} className="flex items-start gap-3">
										<svg className="w-5 h-5 text-[var(--positive)] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
										</svg>
										<span className="text-[var(--text-secondary)]">{item}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="dash-card p-6 space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="metric-card metric-positive p-4">
									<span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block mb-1">Pass Rate</span>
									<span className="text-2xl font-semibold text-[var(--positive)]">76.9%</span>
								</div>
								<div className="metric-card p-4">
									<span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] block mb-1">Expected ROI</span>
									<span className="text-2xl font-semibold text-[var(--text-primary)]">+541%</span>
								</div>
							</div>
							<p className="text-xs text-[var(--text-muted)] text-center">
								Sample results from a typical simulation
							</p>
						</div>
					</div>
				</div>

				{/* Use Cases */}
				<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 text-center">
					Who Uses AlphaSolver
				</h2>
				<div className="grid md:grid-cols-3 gap-6 mb-16">
					{[
						{
							title: "Prop Firm Traders",
							description: "Evaluate your strategy before paying for an evaluation. Know your true odds of passing.",
						},
						{
							title: "Trading Communities",
							description: "Give your members the tools to make data-driven decisions on prop firm challenges.",
						},
						{
							title: "Educators & Mentors",
							description: "Help your students understand the math behind prop trading success.",
						},
					].map((item, i) => (
						<div key={i} className="dash-card p-6">
							<h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
								{item.title}
							</h3>
							<p className="text-sm text-[var(--text-secondary)]">
								{item.description}
							</p>
						</div>
					))}
				</div>

				{/* CTA */}
				<div className="chart-container p-8 text-center">
					<h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
						Ready to know your true odds?
					</h2>
					<p className="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
						Start with 3 free simulations per day. Upgrade to unlimited for $9/month.
					</p>
					<div className="flex flex-wrap gap-4 justify-center">
						<a href={process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver"}>
							<button className="btn btn-primary btn-lg">
								Get Started Free
							</button>
						</a>
						<Link href="/">
							<button className="btn btn-soft btn-lg">
								Learn More
							</button>
						</Link>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-16 pt-8 border-t border-[var(--border)] text-center">
					<p className="text-xs text-[var(--text-muted)]">
						AlphaSolver runs entirely in your browser. Your trade data never leaves your device.
					</p>
				</div>
			</div>
		</div>
	);
}
