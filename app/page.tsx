"use client";

/**
 * AlphaSolver Landing Page - Quant Dashboard Design
 * 
 * Required dependencies:
 * npm i recharts framer-motion @heroicons/react
 * 
 * Design: Dense, information-rich quant finance dashboard preview
 * Inspired by StrategyQuant, QuantConnect, BuildAlpha, TradingView backtester
 */

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
	LineChart,
	Line,
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
	Cell,
} from "recharts";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

// ============================================
// SAMPLE DATA FOR CHARTS
// ============================================

// Generate equity paths data - simulating 10,000 Monte Carlo paths summarized
const generateEquityPaths = () => {
	const paths: { day: number; pass1: number; pass2: number; pass3: number; fail1: number; fail2: number; median: number }[] = [];
	for (let day = 0; day <= 20; day++) {
		paths.push({
			day,
			pass1: Math.min(3000, 50000 + day * 180 + Math.sin(day * 0.8) * 200 + Math.random() * 100) - 50000,
			pass2: Math.min(3000, 50000 + day * 160 + Math.cos(day * 0.6) * 150 + Math.random() * 80) - 50000,
			pass3: Math.min(3000, 50000 + day * 140 + Math.sin(day * 0.5) * 180 + Math.random() * 120) - 50000,
			fail1: Math.max(-2000, -day * 150 - Math.random() * 100 + Math.sin(day * 0.7) * 80),
			fail2: Math.max(-2000, -day * 100 - Math.random() * 80 + Math.cos(day * 0.5) * 60),
			median: day * 100 + Math.sin(day * 0.3) * 50,
		});
	}
	return paths;
};

// PnL distribution data
const pnlDistribution = [
	{ range: "-$2000+", count: 328, color: "#ef4444" },
	{ range: "-$1500", count: 412, color: "#ef4444" },
	{ range: "-$1000", count: 587, color: "#ef4444" },
	{ range: "-$500", count: 823, color: "#ef4444" },
	{ range: "$0", count: 1156, color: "#6b7280" },
	{ range: "+$500", count: 1489, color: "#22c55e" },
	{ range: "+$1000", count: 1834, color: "#22c55e" },
	{ range: "+$1500", count: 1567, color: "#22c55e" },
	{ range: "+$2000", count: 1123, color: "#22c55e" },
	{ range: "+$3000+", count: 681, color: "#22c55e" },
];

// Trades per day distribution
const tradesPerDay = [
	{ trades: "0", frequency: 2.1 },
	{ trades: "1", frequency: 8.4 },
	{ trades: "2", frequency: 18.7 },
	{ trades: "3", frequency: 28.3 },
	{ trades: "4", frequency: 22.1 },
	{ trades: "5", frequency: 12.8 },
	{ trades: "6+", frequency: 7.6 },
];

// Scenario outcomes table data
const scenarioOutcomes = [
	{ probability: "32.4%", days: 8, maxDD: "$487", netPnL: "+$3,240", outcome: "Fast Pass", highlight: true },
	{ probability: "24.8%", days: 14, maxDD: "$1,124", netPnL: "+$3,067", outcome: "Steady Pass", highlight: true },
	{ probability: "19.7%", days: 20, maxDD: "$1,687", netPnL: "+$3,012", outcome: "Slow Pass", highlight: true },
	{ probability: "12.3%", days: 6, maxDD: "$2,000", netPnL: "-$450", outcome: "Early Bust", highlight: false },
	{ probability: "10.8%", days: 15, maxDD: "$2,000", netPnL: "-$450", outcome: "Late Bust", highlight: false },
];

// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.4, 0.25, 1] as const }
	})
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.06, delayChildren: 0.1 }
	}
};

// ============================================
// ANIMATED COUNTER
// ============================================
function AnimatedCounter({ 
	value, 
	suffix = "", 
	prefix = "", 
	decimals = 0 
}: { 
	value: number; 
	suffix?: string; 
	prefix?: string;
	decimals?: number;
}) {
	const [count, setCount] = useState(0);
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

	useEffect(() => {
		if (inView) {
			const duration = 1500;
			const steps = 50;
			const increment = value / steps;
			let current = 0;
			const timer = setInterval(() => {
				current += increment;
				if (current >= value) {
					setCount(value);
					clearInterval(timer);
				} else {
					setCount(current);
				}
			}, duration / steps);
			return () => clearInterval(timer);
		}
	}, [inView, value]);

	return (
		<span ref={ref}>
			{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
		</span>
	);
}

// ============================================
// METRIC CARD COMPONENT
// ============================================
function MetricCard({ 
	label, 
	value, 
	change, 
	positive,
	icon,
	large = false,
}: { 
	label: string; 
	value: string; 
	change?: string;
	positive?: boolean;
	icon?: React.ReactNode;
	large?: boolean;
}) {
	return (
		<div className={`metric-card p-4 ${large ? 'p-6' : ''} ${positive ? 'metric-positive' : ''}`}>
			<div className="flex items-start justify-between mb-2">
				<span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
					{label}
				</span>
				{icon && <span className="text-[var(--text-muted)]">{icon}</span>}
			</div>
			<div className={`font-semibold ${large ? 'text-3xl' : 'text-2xl'} ${positive ? 'text-[var(--positive)]' : 'text-[var(--text-primary)]'}`}>
				{value}
			</div>
			{change && (
				<div className={`text-xs mt-1 ${positive ? 'text-[var(--positive)]' : 'text-[var(--text-muted)]'}`}>
					{change}
				</div>
			)}
		</div>
	);
}

// ============================================
// MINI CHART COMPONENT
// ============================================
function MiniEquityChart() {
	const data = useMemo(() => {
		const points = [];
		let equity = 0;
		for (let i = 0; i < 30; i++) {
			equity += (Math.random() - 0.35) * 150;
			equity = Math.max(-1500, Math.min(3200, equity));
			points.push({ x: i, y: equity });
		}
		return points;
	}, []);

	return (
		<div className="h-12 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
					<defs>
						<linearGradient id="miniGreen" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
							<stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
						</linearGradient>
					</defs>
					<Area
						type="monotone"
						dataKey="y"
						stroke="#22c55e"
						strokeWidth={1.5}
						fill="url(#miniGreen)"
						dot={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

// ============================================
// FAQ COMPONENT
// ============================================
const faqs = [
	{
		question: "How accurate are the Monte Carlo simulations?",
		answer: "Our simulations use your actual trade statistics (win rate, average win/loss, trade frequency) to generate 10,000+ randomized paths. The accuracy depends on your input data quality—the more trades in your log, the more reliable your statistics, and the more accurate your projected pass rate."
	},
	{
		question: "Which prop firms do you support?",
		answer: "We support all major prop firms including Topstep, Take Profit Trader, Apex Trader Funding, Tradeify, and more. You can also create custom rules for any evaluation with specific profit targets, drawdown limits, and fee structures."
	},
	{
		question: "What's included in the free plan?",
		answer: "Free users get 3 simulation runs per day, access to all prop firm presets, full results visualization, and personalized trading plan generation. Unlimited removes the daily cap for power users who want to test multiple scenarios."
	},
	{
		question: "Is my trading data secure?",
		answer: "Absolutely. All simulations run entirely in your browser—your trade data never leaves your device. We don't store, transmit, or have access to your trading history."
	}
];

function FAQ() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<div className="space-y-0">
			{faqs.map((faq, index) => (
				<div key={index} className="faq-item">
					<button
						onClick={() => setOpenIndex(openIndex === index ? null : index)}
						className="w-full py-5 px-1 flex items-start justify-between text-left gap-4"
					>
						<span className="text-[var(--text-primary)] text-[15px]">{faq.question}</span>
						<motion.span
							animate={{ rotate: openIndex === index ? 45 : 0 }}
							className="text-[var(--accent)] text-xl flex-shrink-0 mt-0.5"
						>
							+
						</motion.span>
					</button>
					<AnimatePresence>
						{openIndex === index && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.25 }}
								className="overflow-hidden"
							>
								<p className="pb-5 pr-8 text-sm text-[var(--text-secondary)] leading-relaxed">
									{faq.answer}
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			))}
		</div>
	);
}

// ============================================
// CUSTOM TOOLTIP
// ============================================
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
	if (!active || !payload) return null;
	return (
		<div className="custom-tooltip">
			<p className="text-xs text-[var(--text-muted)] mb-1">Day {label}</p>
			{payload.map((p, i) => (
				<p key={i} className="text-sm" style={{ color: p.color }}>
					{p.name}: ${p.value?.toFixed(0)}
				</p>
			))}
		</div>
	);
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Page() {
	const [scrolled, setScrolled] = useState(false);
	const equityPaths = useMemo(() => generateEquityPaths(), []);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [metricsRef, metricsInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [equityRef, equityInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [distRef, distInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [scenarioRef, scenarioInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [planRef, planInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [whyRef, whyInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [pricingRef, pricingInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.2 });

	return (
		<div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased overflow-x-hidden">
			{/* Sticky Navigation */}
			<nav className={`fixed top-0 left-0 right-0 z-50 nav-fixed ${scrolled ? 'scrolled' : ''}`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-[var(--accent)] text-2xl font-bold">α</span>
							<span className="text-sm font-semibold tracking-tight hidden sm:inline">ALPHASOLVER</span>
						</div>
						
						<div className="hidden md:flex items-center gap-6 text-sm text-[var(--text-secondary)]">
							<a href="#results" className="hover:text-[var(--text-primary)] transition-colors">Results</a>
							<a href="#equity" className="hover:text-[var(--text-primary)] transition-colors">Equity Paths</a>
							<a href="#plan" className="hover:text-[var(--text-primary)] transition-colors">Trading Plan</a>
							<a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
						</div>

						<div className="flex items-center gap-3">
							<Link href="/app" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm hidden sm:block">
								Sign In
							</Link>
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<button className="btn-primary px-4 py-2 text-sm">
										Launch App
									</button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<button className="btn-primary px-4 py-2 text-sm">
										Start Free
									</button>
								</a>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section - Dashboard Preview */}
			<section ref={heroRef} className="relative z-10 pt-20 hero-gradient">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
					{/* Hero Header */}
					<motion.div
						initial="hidden"
						animate={heroInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="text-center mb-8"
					>
						{/* Trust badges */}
						<motion.div variants={fadeUp} custom={0} className="flex flex-wrap justify-center gap-3 mb-6">
							<span className="trust-badge">
								<svg className="w-3.5 h-3.5 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								Runs locally in browser
							</span>
							<span className="trust-badge">
								<svg className="w-3.5 h-3.5 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								No credit card required
							</span>
							<span className="trust-badge">
								<svg className="w-3.5 h-3.5 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								3 free runs/day
							</span>
						</motion.div>

						<motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-['Instrument_Serif',_serif] italic mb-4">
							<span className="text-[var(--text-primary)]">Know your </span>
							<span className="text-[var(--accent)]">true odds</span>
						</motion.h1>
						
						<motion.p variants={fadeUp} custom={2} className="text-[var(--text-secondary)] text-base sm:text-lg max-w-2xl mx-auto mb-6">
							Monte Carlo simulation engine for prop traders. Upload your trade log, run 10,000 simulations, see your real probability of passing—<span className="text-[var(--text-primary)]">before you pay.</span>
						</motion.p>

						<motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<button className="btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2">
										Launch App
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<button className="btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2">
										Start Free Today
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</button>
								</a>
							)}
							<Link href="/app">
								<button className="btn-secondary px-6 py-3 text-sm">
									I Have Access
								</button>
							</Link>
						</motion.div>
					</motion.div>

					{/* Key Metrics Grid - Hero Dashboard */}
					<motion.div
						ref={metricsRef}
						initial="hidden"
						animate={metricsInView ? "visible" : "hidden"}
						variants={staggerContainer}
						id="results"
						className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
					>
						<motion.div variants={fadeUp} custom={0}>
							<MetricCard 
								label="Pass Rate" 
								value="76.9%" 
								change="Based on 10,000 simulations"
								positive
								large
							/>
						</motion.div>
						<motion.div variants={fadeUp} custom={1}>
							<MetricCard 
								label="Expected Value" 
								value="+$2,431" 
								change="Net profit per attempt"
								positive
								large
							/>
						</motion.div>
						<motion.div variants={fadeUp} custom={2}>
							<MetricCard 
								label="Avg Attempts" 
								value="1.3" 
								change="To pass evaluation"
								large
							/>
						</motion.div>
						<motion.div variants={fadeUp} custom={3}>
							<MetricCard 
								label="+EV ROI" 
								value="+541%" 
								change="Return on eval cost"
								positive
								large
							/>
						</motion.div>
					</motion.div>

					{/* Secondary metrics row */}
					<motion.div
						initial="hidden"
						animate={metricsInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8"
					>
						{[
							{ label: "Profit Target", value: "$3,000" },
							{ label: "Max Drawdown", value: "-$2,000" },
							{ label: "Eval Cost", value: "$450" },
							{ label: "Win Rate", value: "58.4%" },
							{ label: "Avg Win", value: "+$187" },
							{ label: "Avg Loss", value: "-$124" },
						].map((item, i) => (
							<motion.div 
								key={i} 
								variants={fadeUp} 
								custom={i + 4}
								className="dash-card p-3 text-center"
							>
								<div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
									{item.label}
								</div>
								<div className="text-sm font-semibold text-[var(--text-primary)]">
									{item.value}
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>

				{/* Platform integrations */}
				<div className="border-y border-[var(--border)] bg-[var(--bg-secondary)]">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Import from</span>
							<div className="flex flex-wrap items-center justify-center gap-2">
								{["NinjaTrader", "TradingView", "Tradovate", "Rithmic", "Sierra Chart"].map((platform, i) => (
									<div key={i} className="platform-logo">
										{platform}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Equity Paths Section */}
			<section ref={equityRef} id="equity" className="relative z-10 py-8 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={equityInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="flex items-center justify-between mb-4">
							<div>
								<h2 className="text-xl font-semibold mb-1">Equity Paths Visualization</h2>
								<p className="text-sm text-[var(--text-muted)]">10,000 simulated equity curves • TOPSTEP 50K</p>
							</div>
							<div className="hidden sm:flex items-center gap-4 text-xs">
								<span className="flex items-center gap-2">
									<span className="w-3 h-0.5 bg-[var(--positive)]" />
									<span className="text-[var(--text-muted)]">Pass (76.9%)</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="w-3 h-0.5 bg-[var(--negative)]" />
									<span className="text-[var(--text-muted)]">Fail (23.1%)</span>
								</span>
							</div>
						</motion.div>

						<motion.div variants={fadeUp} custom={1} className="chart-container p-4">
							<div className="h-[300px] sm:h-[400px]">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={equityPaths} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
										<XAxis 
											dataKey="day" 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
											label={{ value: 'Trading Days', position: 'bottom', fill: 'var(--text-muted)', fontSize: 11 }}
										/>
										<YAxis 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
											tickFormatter={(value: number) => `$${value.toLocaleString()}`}
											domain={[-2500, 3500]}
										/>
										<Tooltip content={<ChartTooltip />} />
										<ReferenceLine y={3000} stroke="var(--positive)" strokeDasharray="4 4" strokeOpacity={0.5} />
										<ReferenceLine y={-2000} stroke="var(--negative)" strokeDasharray="4 4" strokeOpacity={0.5} />
										<ReferenceLine y={0} stroke="var(--text-muted)" strokeOpacity={0.3} />
										
										{/* Passing paths */}
										<Line type="monotone" dataKey="pass1" stroke="var(--positive)" strokeWidth={2} dot={false} name="Path A" />
										<Line type="monotone" dataKey="pass2" stroke="var(--positive)" strokeWidth={1.5} dot={false} opacity={0.6} name="Path B" />
										<Line type="monotone" dataKey="pass3" stroke="var(--positive)" strokeWidth={1} dot={false} opacity={0.4} name="Path C" />
										
										{/* Failing paths */}
										<Line type="monotone" dataKey="fail1" stroke="var(--negative)" strokeWidth={1.5} dot={false} opacity={0.7} name="Fail X" />
										<Line type="monotone" dataKey="fail2" stroke="var(--negative)" strokeWidth={1} dot={false} opacity={0.4} name="Fail Y" />
										
										{/* Median path */}
										<Line type="monotone" dataKey="median" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Median" />
									</LineChart>
								</ResponsiveContainer>
							</div>
							<div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
								<span>+$3,000 Profit Target</span>
								<span className="text-[var(--accent)]">Median path shown as dashed line</span>
								<span>-$2,000 Max Drawdown</span>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Trade Distributions Section */}
			<section ref={distRef} className="relative z-10 py-8 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={distInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid lg:grid-cols-2 gap-4"
					>
						{/* PnL Distribution */}
						<motion.div variants={fadeUp} custom={0} className="chart-container p-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="text-base font-semibold">Final P&L Distribution</h3>
									<p className="text-xs text-[var(--text-muted)]">Outcome spread across all simulations</p>
								</div>
								<span className="badge badge-positive">76.9% Profitable</span>
							</div>
							<div className="h-[200px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={pnlDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
										<XAxis 
											dataKey="range" 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
										/>
										<YAxis 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
										/>
										<Tooltip 
											contentStyle={{ 
												background: 'var(--bg-elevated)', 
												border: '1px solid var(--border)',
												borderRadius: '8px',
												fontSize: '12px'
											}}
										/>
										<Bar dataKey="count" radius={[2, 2, 0, 0]}>
											{pnlDistribution.map((entry, index) => (
												<Cell key={index} fill={entry.color} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</motion.div>

						{/* Trades Per Day Distribution */}
						<motion.div variants={fadeUp} custom={1} className="chart-container p-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="text-base font-semibold">Trades Per Day</h3>
									<p className="text-xs text-[var(--text-muted)]">Based on your trading frequency</p>
								</div>
								<span className="badge">Avg: 3.2 trades/day</span>
							</div>
							<div className="h-[200px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={tradesPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
										<XAxis 
											dataKey="trades" 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
										/>
										<YAxis 
											axisLine={false}
											tickLine={false}
											tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
											tickFormatter={(value) => `${value}%`}
										/>
								<Tooltip 
									contentStyle={{ 
										background: 'var(--bg-elevated)', 
										border: '1px solid var(--border)',
										borderRadius: '8px',
										fontSize: '12px'
									}}
									formatter={(value: string | number) => [`${value}%`, 'Frequency']}
										/>
										<Bar dataKey="frequency" fill="var(--accent)" radius={[2, 2, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Scenario Outcomes Table */}
			<section ref={scenarioRef} className="relative z-10 py-8 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={scenarioInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="mb-4">
							<h2 className="text-xl font-semibold mb-1">Most Probable Outcomes</h2>
							<p className="text-sm text-[var(--text-muted)]">Clustered scenarios from Monte Carlo analysis</p>
						</motion.div>

						<motion.div variants={fadeUp} custom={1} className="chart-container overflow-hidden">
							<div className="overflow-x-auto">
								<table className="data-table">
									<thead>
										<tr>
											<th>Probability</th>
											<th>Days to Complete</th>
											<th>Max Drawdown</th>
											<th>Net P&L</th>
											<th>Outcome</th>
										</tr>
									</thead>
									<tbody>
										{scenarioOutcomes.map((row, i) => (
											<tr key={i}>
												<td className="font-semibold">{row.probability}</td>
												<td>{row.days}</td>
												<td className="text-[var(--negative)]">{row.maxDD}</td>
												<td className={row.highlight ? 'text-[var(--positive)] font-semibold' : 'text-[var(--negative)]'}>
													{row.netPnL}
												</td>
												<td>
													<span className={`badge ${row.highlight ? 'badge-positive' : ''}`}>
														{row.outcome}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Optimal Trading Plan */}
			<section ref={planRef} id="plan" className="relative z-10 py-8 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={planInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="mb-4">
							<h2 className="text-xl font-semibold mb-1">Optimal Trading Plan</h2>
							<p className="text-sm text-[var(--text-muted)]">Personalized targets based on your statistics</p>
						</motion.div>

						<motion.div variants={fadeUp} custom={1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
							<div className="metric-card metric-positive p-5">
								<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
									Daily Profit Target
								</div>
								<div className="text-3xl font-semibold text-[var(--positive)] mb-1">+$187</div>
								<p className="text-xs text-[var(--text-muted)]">Reach $3K in ~16 trading days</p>
							</div>
							
							<div className="metric-card p-5">
								<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
									Daily Stop Loss
								</div>
								<div className="text-3xl font-semibold text-[var(--negative)] mb-1">-$125</div>
								<p className="text-xs text-[var(--text-muted)]">Protect against bust scenarios</p>
							</div>
							
							<div className="metric-card p-5">
								<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
									Win Rate Needed
								</div>
								<div className="text-3xl font-semibold text-[var(--accent)] mb-1">52.4%</div>
								<p className="text-xs text-[var(--text-muted)]">You have 58.4% (surplus)</p>
							</div>
							
							<div className="metric-card p-5">
								<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
									Expected Days to Pass
								</div>
								<div className="text-3xl font-semibold text-[var(--text-primary)] mb-1">12</div>
								<p className="text-xs text-[var(--text-muted)]">Median across simulations</p>
							</div>
						</motion.div>

						{/* Mini equity preview */}
						<motion.div variants={fadeUp} custom={2} className="mt-4 grid sm:grid-cols-3 gap-3">
							{[
								{ label: "Optimal Trades/Day", value: "3-4", sub: "Based on frequency analysis" },
								{ label: "Risk per Trade", value: "$41", sub: "1R = 0.33% of drawdown" },
								{ label: "R:R Ratio", value: "1.5:1", sub: "Matches your avg win/loss" },
							].map((item, i) => (
								<div key={i} className="dash-card p-4 flex items-center justify-between">
									<div>
										<div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
										<div className="text-lg font-semibold">{item.value}</div>
										<div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
									</div>
									<div className="w-20">
										<MiniEquityChart />
									</div>
								</div>
							))}
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Why Quant Simulation Section */}
			<section ref={whyRef} className="relative z-10 py-12 px-4 sm:px-6 border-t border-[var(--border)]">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={whyInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="text-center mb-8">
							<h2 className="text-2xl sm:text-3xl font-['Instrument_Serif',_serif] italic mb-2">
								Why Quant-Level Simulation?
							</h2>
							<p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto">
								Stop gambling on prop firm attempts. Use the same Monte Carlo methods hedge funds use to model risk.
							</p>
						</motion.div>

						<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{[
								{
									title: "Calculate True +EV",
									desc: "Know your exact expected value before spending $450 on another evaluation. If you're -EV, fix your strategy first.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
										</svg>
									)
								},
								{
									title: "Optimize for Firm Rules",
									desc: "Every prop firm has different targets, drawdowns, and fee structures. Simulate against actual rules to find your edge.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									)
								},
								{
									title: "Plan for Multiple Attempts",
									desc: "Even with 70% pass rate, you might need 2 tries. Factor in reset costs and funded phase blowups for true ROI.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									)
								},
								{
									title: "Account for Variance",
									desc: "Your 60% win rate doesn't mean 60 wins in 100 trades. Monte Carlo shows the real distribution of possible outcomes.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
										</svg>
									)
								},
								{
									title: "Get a Trading Plan",
									desc: "Stop winging it. Get daily targets, stop losses, and position sizes calibrated to your actual statistics.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
										</svg>
									)
								},
								{
									title: "100% Local & Private",
									desc: "Your trade data never leaves your browser. No servers, no uploads, no risk of your edge being exposed.",
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									)
								},
							].map((item, i) => (
								<motion.div 
									key={i} 
									variants={fadeUp} 
									custom={i + 1}
									className="dash-card p-5"
								>
									<div className="w-10 h-10 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)] mb-3">
										{item.icon}
									</div>
									<h3 className="font-semibold mb-2">{item.title}</h3>
									<p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
								</motion.div>
							))}
						</div>

						{/* CTA */}
						<motion.div variants={fadeUp} custom={7} className="text-center mt-8">
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<button className="btn-primary px-8 py-3 text-sm font-semibold">
										Launch Simulator
									</button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<button className="btn-primary px-8 py-3 text-sm font-semibold">
										Start Free Today
									</button>
								</a>
							)}
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* How It Works - Compact */}
			<section className="relative z-10 py-12 px-4 sm:px-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-xl font-semibold text-center mb-8">Three Steps to Your Edge</h2>
					<div className="grid sm:grid-cols-3 gap-4">
						{[
							{ num: "01", title: "Upload Trade Log", desc: "CSV from NinjaTrader, TradingView, Tradovate, or any platform. We extract your win rate, avg win/loss automatically." },
							{ num: "02", title: "Select Prop Firm", desc: "Topstep, Take Profit Trader, Apex, Tradeify, or custom rules. We know every target, drawdown, and fee." },
							{ num: "03", title: "Get Your Odds", desc: "Pass probability, expected value, cost analysis, and a personalized trading plan in seconds." },
						].map((step, i) => (
							<div key={i} className="dash-card p-5">
								<div className="text-3xl font-['Instrument_Serif',_serif] text-[var(--accent)] mb-3">{step.num}</div>
								<h3 className="font-semibold mb-2">{step.title}</h3>
								<p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section ref={pricingRef} id="pricing" className="relative z-10 py-12 px-4 sm:px-6 border-t border-[var(--border)]">
				<div className="max-w-4xl mx-auto">
					<motion.div
						initial="hidden"
						animate={pricingInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="text-center mb-8">
							<h2 className="text-2xl sm:text-3xl font-['Instrument_Serif',_serif] italic mb-2">Simple Pricing</h2>
							<p className="text-sm text-[var(--text-muted)]">Start free. Upgrade when you need unlimited simulations.</p>
						</motion.div>

						<div className="grid sm:grid-cols-2 gap-4">
							{/* Free */}
							<motion.div variants={fadeUp} custom={1} className="pricing-card p-6">
								<div className="mb-6">
									<p className="text-sm text-[var(--text-muted)] mb-1">FREE</p>
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-semibold">$0</span>
										<span className="text-[var(--text-muted)]">/month</span>
									</div>
								</div>
								
								<div className="space-y-3 mb-6 text-sm">
									{[
										{ text: "3 simulations per day", included: true },
										{ text: "All prop firms supported", included: true },
										{ text: "Full results & analysis", included: true },
										{ text: "Trading plan generation", included: true },
										{ text: "Unlimited simulations", included: false },
									].map((item, i) => (
										<div key={i} className="flex items-center gap-2">
											<span className={item.included ? "text-[var(--positive)]" : "text-[var(--text-muted)]"}>
												{item.included ? "✓" : "—"}
											</span>
											<span className={item.included ? "" : "text-[var(--text-muted)]"}>{item.text}</span>
										</div>
									))}
								</div>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="btn-secondary w-full py-3 text-sm">
										Get Started Free
									</button>
								</a>
							</motion.div>

							{/* Unlimited */}
							<motion.div variants={fadeUp} custom={2} className="pricing-card pricing-featured p-6 relative">
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<span className="badge badge-accent text-[10px] px-3 py-1">MOST POPULAR</span>
								</div>
								
								<div className="mb-6">
									<p className="text-sm text-[var(--text-muted)] mb-1">UNLIMITED</p>
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-semibold text-[var(--accent)]">$9</span>
										<span className="text-[var(--text-muted)]">/month</span>
									</div>
								</div>
								
								<div className="space-y-3 mb-6 text-sm">
									{[
										"Unlimited simulations",
										"All prop firms supported",
										"Full results & analysis",
										"Trading plan generation",
										"Export & import runs",
									].map((item, i) => (
										<div key={i} className="flex items-center gap-2">
											<span className="text-[var(--positive)]">✓</span>
											<span>{item}</span>
										</div>
									))}
								</div>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="btn-primary w-full py-3 text-sm font-semibold">
										Upgrade to Unlimited
									</button>
								</a>
							</motion.div>
						</div>

						<motion.p variants={fadeUp} custom={3} className="text-center text-xs text-[var(--text-muted)] mt-6">
							Cancel anytime. Satisfaction guaranteed.
						</motion.p>
					</motion.div>
				</div>
			</section>

			{/* FAQ */}
			<section ref={faqRef} id="faq" className="relative z-10 py-12 px-4 sm:px-6 border-t border-[var(--border)]">
				<div className="max-w-2xl mx-auto">
					<motion.div
						initial="hidden"
						animate={faqInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.h2 variants={fadeUp} custom={0} className="text-xl font-semibold text-center mb-6">
							Frequently Asked Questions
						</motion.h2>
						<motion.div variants={fadeUp} custom={1}>
							<FAQ />
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-16 px-4 sm:px-6 cta-gradient border-t border-[var(--border)]">
				<div className="max-w-2xl mx-auto text-center">
					<h2 className="text-3xl sm:text-4xl font-['Instrument_Serif',_serif] italic mb-4">
						Stop guessing.<br />
						<span className="text-[var(--accent)]">Start knowing.</span>
					</h2>
					<p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
						Your next prop firm attempt doesn't have to be a gamble. Run the numbers first.
					</p>
					<div className="flex flex-wrap gap-3 justify-center mb-6">
						{BYPASS_ACCESS ? (
							<Link href="/app">
								<button className="btn-primary px-8 py-4 text-sm font-semibold flex items-center gap-2">
									Launch App
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</button>
							</Link>
						) : (
							<a href={WHOP_CHECKOUT_URL}>
								<button className="btn-primary px-8 py-4 text-sm font-semibold flex items-center gap-2">
									Start Free Today
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</button>
							</a>
						)}
					</div>
					<p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
						<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
						</svg>
						Your data stays in your browser. We never see your trades.
					</p>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-8 px-4 sm:px-6 border-t border-[var(--border)] footer-gradient">
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<span className="text-[var(--accent)] text-xl font-bold">α</span>
							<span className="text-sm font-semibold tracking-tight">ALPHASOLVER</span>
						</div>
						
						<div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Terms</a>
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Privacy</a>
							<a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
						</div>

						<p className="text-xs text-[var(--text-muted)]">
							© 2024 AlphaSolver. Made for traders.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
