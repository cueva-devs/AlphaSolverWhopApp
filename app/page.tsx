"use client";

/**
 * AlphaSolver Landing Page - Enhanced Quant Dashboard Design
 * 
 * Required dependencies:
 * npm i recharts framer-motion
 * 
 * Design: Dense, information-rich quant finance dashboard preview
 * Enhanced with subtle animations, glows, and interactive elements
 */

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
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
// Shows realistic variance with some paths hitting targets, others busting
const generateEquityPaths = () => {
	const paths: { 
		day: number; 
		fastPass: number; 
		steadyPass: number; 
		slowPass: number; 
		earlyBust: number; 
		lateBust: number;
		breakeven: number;
		median: number 
	}[] = [];
	
	// Seed values for consistent but varied paths
	let fastPassEquity = 0;
	let steadyPassEquity = 0;
	let slowPassEquity = 0;
	let earlyBustEquity = 0;
	let lateBustEquity = 0;
	let breakevenEquity = 0;
	
	for (let day = 0; day <= 20; day++) {
		// Fast pass - aggressive strategy, reaches target by day 8
		if (fastPassEquity < 3000 && fastPassEquity > -2000) {
			fastPassEquity += 320 + Math.sin(day * 1.2) * 150 + (Math.random() - 0.3) * 100;
			fastPassEquity = Math.min(3200, fastPassEquity);
		}
		
		// Steady pass - conservative strategy, reaches target by day 14
		if (steadyPassEquity < 3000 && steadyPassEquity > -2000) {
			steadyPassEquity += 200 + Math.cos(day * 0.8) * 80 + (Math.random() - 0.35) * 60;
			steadyPassEquity = Math.min(3100, steadyPassEquity);
		}
		
		// Slow pass - very conservative, barely makes it by day 20
		if (slowPassEquity < 3000 && slowPassEquity > -2000) {
			slowPassEquity += 140 + Math.sin(day * 0.5) * 100 + (Math.random() - 0.4) * 80;
			slowPassEquity = Math.min(3050, slowPassEquity);
		}
		
		// Early bust - aggressive but unlucky, busts by day 6
		if (earlyBustEquity > -2000) {
			if (day < 3) {
				earlyBustEquity += 150 + (Math.random() - 0.5) * 100;
			} else {
				earlyBustEquity -= 350 + Math.random() * 150;
			}
			earlyBustEquity = Math.max(-2100, earlyBustEquity);
		}
		
		// Late bust - looks good then collapses
		if (lateBustEquity > -2000) {
			if (day < 10) {
				lateBustEquity += 120 + Math.sin(day * 0.7) * 60 + (Math.random() - 0.4) * 50;
			} else {
				lateBustEquity -= 200 + Math.random() * 100;
			}
			lateBustEquity = Math.max(-2100, lateBustEquity);
		}
		
		// Breakeven path - hovers around zero
		breakevenEquity += (Math.random() - 0.5) * 150 + Math.sin(day * 0.9) * 50;
		breakevenEquity = Math.max(-1500, Math.min(1500, breakevenEquity));
		
		// Median path
		const median = day * 95 + Math.sin(day * 0.4) * 40;
		
		paths.push({
			day,
			fastPass: Math.round(fastPassEquity),
			steadyPass: Math.round(steadyPassEquity),
			slowPass: Math.round(slowPassEquity),
			earlyBust: Math.round(earlyBustEquity),
			lateBust: Math.round(lateBustEquity),
			breakeven: Math.round(breakevenEquity),
			median: Math.round(median),
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

// Strategy runs data - showing multiple strategy tests
const strategyRuns = [
	{ run: "Strategy #1", probability: "32.4%", days: 8, maxDD: "$487", netPnL: "+$3,240", outcome: "Fast Pass", highlight: true, strategy: "Aggressive" },
	{ run: "Strategy #2", probability: "24.8%", days: 14, maxDD: "$1,124", netPnL: "+$3,067", outcome: "Steady Pass", highlight: true, strategy: "Conservative" },
	{ run: "Strategy #3", probability: "19.7%", days: 20, maxDD: "$1,687", netPnL: "+$3,012", outcome: "Slow Pass", highlight: true, strategy: "Balanced" },
	{ run: "Strategy #4", probability: "12.3%", days: 6, maxDD: "$2,000", netPnL: "-$450", outcome: "Early Bust", highlight: false, strategy: "High Risk" },
	{ run: "Strategy #5", probability: "10.8%", days: 15, maxDD: "$2,000", netPnL: "-$450", outcome: "Late Bust", highlight: false, strategy: "Low Freq" },
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
		transition: { staggerChildren: 0.08, delayChildren: 0.1 }
	}
};

const scaleUp = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: { 
		opacity: 1, 
		scale: 1,
		transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }
	}
};

const cardHover = {
	rest: { scale: 1, y: 0 },
	hover: { 
		scale: 1.02, 
		y: -4,
		transition: { duration: 0.25 }
	}
};

// ============================================
// ANIMATED COUNTER WITH FORMATTING
// ============================================
function AnimatedCounter({ 
	value, 
	suffix = "", 
	prefix = "", 
	decimals = 0,
	duration = 2000
}: { 
	value: number; 
	suffix?: string; 
	prefix?: string;
	decimals?: number;
	duration?: number;
}) {
	const [count, setCount] = useState(0);
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

	useEffect(() => {
		if (inView) {
			const steps = 60;
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
	}, [inView, value, duration]);

	return (
		<motion.span 
			ref={ref}
			initial={{ opacity: 0, y: 10 }}
			animate={inView ? { opacity: 1, y: 0 } : {}}
			transition={{ duration: 0.4 }}
		>
			{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
		</motion.span>
	);
}

// ============================================
// ENHANCED METRIC CARD WITH GLOW
// ============================================
function MetricCard({ 
	label, 
	value, 
	numericValue,
	change, 
	positive,
	large = false,
	delay = 0,
}: { 
	label: string; 
	value: string;
	numericValue?: number;
	change?: string;
	positive?: boolean;
	large?: boolean;
	delay?: number;
}) {
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
	
	return (
		<motion.div 
			ref={ref}
			initial="rest"
			whileHover="hover"
			variants={cardHover}
			className={`metric-card p-4 ${large ? 'p-6' : ''} ${positive ? 'metric-positive' : ''}`}
		>
			<div className="relative z-10">
				<div className="flex items-start justify-between mb-2">
					<span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
						{label}
					</span>
				</div>
				<motion.div 
					className={`font-semibold ${large ? 'text-3xl' : 'text-2xl'} ${positive ? 'text-[var(--positive)] green-pulse' : 'text-[var(--text-primary)]'}`}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={inView ? { opacity: 1, scale: 1 } : {}}
					transition={{ duration: 0.4, delay: delay * 0.1 }}
				>
					{numericValue !== undefined ? (
						<AnimatedCounter 
							value={numericValue} 
							suffix={value.includes('%') ? '%' : ''} 
							prefix={value.startsWith('+') ? '+' : value.startsWith('$') ? '$' : ''}
							decimals={value.includes('.') ? 1 : 0}
						/>
					) : value}
				</motion.div>
				{change && (
					<motion.div 
						className={`text-xs mt-1 ${positive ? 'text-[var(--positive)]' : 'text-[var(--text-muted)]'}`}
						initial={{ opacity: 0 }}
						animate={inView ? { opacity: 1 } : {}}
						transition={{ delay: 0.3 + delay * 0.1 }}
					>
						{change}
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

// ============================================
// SIMULATION SCENARIOS - Realistic random outcomes
// ============================================
const simulationScenarios = [
	{ passRate: 76.9, ev: 2431, roi: 541, verdict: "pass", message: "Strong +EV strategy" },
	{ passRate: 82.4, ev: 3120, roi: 693, verdict: "pass", message: "Excellent edge detected" },
	{ passRate: 64.2, ev: 1087, roi: 242, verdict: "pass", message: "Moderate +EV opportunity" },
	{ passRate: 71.8, ev: 1845, roi: 410, verdict: "pass", message: "Solid pass probability" },
	{ passRate: 58.3, ev: 412, roi: 92, verdict: "marginal", message: "Marginal edge - optimize first" },
	{ passRate: 45.6, ev: -203, roi: -45, verdict: "fail", message: "Strategy needs work" },
	{ passRate: 38.2, ev: -587, roi: -130, verdict: "fail", message: "High bust risk detected" },
	{ passRate: 52.1, ev: 156, roi: 35, verdict: "marginal", message: "Breakeven - tweak parameters" },
	{ passRate: 89.1, ev: 4250, roi: 944, verdict: "pass", message: "Exceptional strategy!" },
	{ passRate: 31.4, ev: -892, roi: -198, verdict: "fail", message: "Do not proceed" },
];

// ============================================
// SIMULATION PREVIEW COMPONENT
// ============================================
function SimulationPreview() {
	const [isRunning, setIsRunning] = useState(false);
	const [progress, setProgress] = useState(0);
	const [showResults, setShowResults] = useState(false);
	const [pathCount, setPathCount] = useState(0);
	const [result, setResult] = useState(simulationScenarios[0]);

	const runSimulation = useCallback(() => {
		if (isRunning) return;
		setIsRunning(true);
		setShowResults(false);
		setProgress(0);
		setPathCount(0);

		// Pick a random scenario
		const randomScenario = simulationScenarios[Math.floor(Math.random() * simulationScenarios.length)];
		setResult(randomScenario);

		const duration = 2500;
		const steps = 100;
		let step = 0;

		const timer = setInterval(() => {
			step++;
			setProgress((step / steps) * 100);
			setPathCount(Math.floor((step / steps) * 10000));
			
			if (step >= steps) {
				clearInterval(timer);
				setIsRunning(false);
				setShowResults(true);
			}
		}, duration / steps);
	}, [isRunning]);

	const getVerdictColor = (verdict: string) => {
		if (verdict === "pass") return "text-[var(--positive)]";
		if (verdict === "fail") return "text-[var(--negative)]";
		return "text-[var(--warning)]";
	};

	const getValueColor = (value: number, isPassRate = false) => {
		if (isPassRate) {
			if (value >= 60) return "text-[var(--positive)]";
			if (value >= 50) return "text-[var(--warning)]";
			return "text-[var(--negative)]";
		}
		if (value > 0) return "text-[var(--positive)]";
		if (value < 0) return "text-[var(--negative)]";
		return "text-[var(--text-primary)]";
	};

	return (
		<motion.div 
			className="sim-preview p-5"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<div className="relative z-10">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="text-sm font-semibold text-[var(--text-primary)]">Try It Now</h3>
						<p className="text-xs text-[var(--text-muted)]">See what your results could look like</p>
					</div>
					<motion.button
						onClick={runSimulation}
						disabled={isRunning}
						className={`btn-primary px-4 py-2 text-xs ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
						whileHover={!isRunning ? { scale: 1.05 } : {}}
						whileTap={!isRunning ? { scale: 0.98 } : {}}
					>
						{isRunning ? 'Simulating...' : showResults ? 'Run Again' : 'Run Sample'}
					</motion.button>
				</div>

				{(isRunning || showResults) && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						className="space-y-3"
					>
						{/* Progress Bar */}
						<div className="space-y-1">
							<div className="flex justify-between text-xs text-[var(--text-muted)]">
								<span>Analyzing {pathCount.toLocaleString()} paths...</span>
								<span>{Math.floor(progress)}%</span>
							</div>
							<div className="progress-bar">
								<motion.div 
									className="progress-bar-fill"
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.1 }}
								/>
							</div>
						</div>

						{/* Results */}
						<AnimatePresence>
							{showResults && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className="space-y-3 pt-2"
								>
									<div className="grid grid-cols-3 gap-2">
										<div className="text-center p-2 bg-[var(--bg-tertiary)] rounded-lg">
											<div className={`text-lg font-semibold ${getValueColor(result.passRate, true)}`}>
												{result.passRate}%
											</div>
											<div className="text-[10px] text-[var(--text-muted)]">Pass Rate</div>
										</div>
										<div className="text-center p-2 bg-[var(--bg-tertiary)] rounded-lg">
											<div className={`text-lg font-semibold ${getValueColor(result.ev)}`}>
												{result.ev >= 0 ? '+' : ''}${Math.abs(result.ev).toLocaleString()}
											</div>
											<div className="text-[10px] text-[var(--text-muted)]">Expected Value</div>
										</div>
										<div className="text-center p-2 bg-[var(--bg-tertiary)] rounded-lg">
											<div className={`text-lg font-semibold ${getValueColor(result.roi)}`}>
												{result.roi >= 0 ? '+' : ''}{result.roi}%
											</div>
											<div className="text-[10px] text-[var(--text-muted)]">ROI</div>
										</div>
									</div>
									<div className={`text-center text-xs py-2 px-3 rounded-lg ${
										result.verdict === "pass" ? "bg-[var(--positive-dim)] border border-[rgba(34,197,94,0.2)]" :
										result.verdict === "fail" ? "bg-[var(--negative-dim)] border border-[rgba(239,68,68,0.2)]" :
										"bg-[var(--warning-dim)] border border-[rgba(245,158,11,0.2)]"
									}`}>
										<span className={getVerdictColor(result.verdict)}>{result.message}</span>
									</div>
									<p className="text-[10px] text-[var(--text-muted)] text-center">
										Results vary based on your actual trade statistics
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				)}

				{!isRunning && !showResults && (
					<div className="text-xs text-[var(--text-muted)] text-center py-4 border border-dashed border-[var(--border)] rounded-lg">
						<span className="block mb-1">🎲 Each run generates different results</span>
						Click to see sample Monte Carlo outcomes
					</div>
				)}
			</div>
		</motion.div>
	);
}

// ============================================
// PLATFORM LOGO COMPONENT
// ============================================
function PlatformLogo({ name, icon }: { name: string; icon: React.ReactNode }) {
	return (
		<motion.div 
			className="platform-logo"
			whileHover={{ scale: 1.05, y: -2 }}
			whileTap={{ scale: 0.98 }}
		>
			{icon}
			<span>{name}</span>
		</motion.div>
	);
}

// Platform icons as simple SVGs
const platformIcons: Record<string, React.ReactNode> = {
	NinjaTrader: (
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.55l7 3.5v7.4l-7-3.5v-7.4zm9 10.9v-7.4l7-3.5v7.4l-7 3.5z"/>
		</svg>
	),
	TradingView: (
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M4.5 3L2 12l2.5 9h15L22 12l-2.5-9h-15zM7 7h2l3 5 3-5h2l-4 6v4h-2v-4L7 7z"/>
		</svg>
	),
	Tradovate: (
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/>
		</svg>
	),
	Rithmic: (
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
		</svg>
	),
	"Sierra Chart": (
		<svg viewBox="0 0 24 24" fill="currentColor">
			<path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-4h2v14h-2V7z"/>
		</svg>
	),
};

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
				<motion.div 
					key={index} 
					className="faq-item"
					initial={{ opacity: 0, y: 10 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: index * 0.1 }}
				>
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
				</motion.div>
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
// ANIMATED EQUITY CHART
// ============================================
function AnimatedEquityChart({ inView }: { inView: boolean }) {
	const equityPaths = useMemo(() => generateEquityPaths(), []);

	return (
		<div className="h-[300px] sm:h-[380px]">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={equityPaths} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
					<defs>
						<linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
							<stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
						</linearGradient>
						<linearGradient id="redGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
							<stop offset="100%" stopColor="#f87171" stopOpacity={1} />
						</linearGradient>
						<linearGradient id="yellowGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
							<stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
						</linearGradient>
						<filter id="glow">
							<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
							<feMerge>
								<feMergeNode in="coloredBlur"/>
								<feMergeNode in="SourceGraphic"/>
							</feMerge>
						</filter>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
					<XAxis 
						dataKey="day" 
						axisLine={false}
						tickLine={false}
						tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
						label={{ value: 'Trading Days', position: 'bottom', offset: 10, fill: 'var(--text-muted)', fontSize: 11 }}
					/>
					<YAxis 
						axisLine={false}
						tickLine={false}
						tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
						tickFormatter={(value: number) => `$${value.toLocaleString()}`}
						domain={[-2500, 3500]}
						width={60}
					/>
					<Tooltip content={<ChartTooltip />} />
					<ReferenceLine y={3000} stroke="var(--positive)" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '+$3K Target', fill: 'var(--positive)', fontSize: 10, position: 'right' }} />
					<ReferenceLine y={-2000} stroke="var(--negative)" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: '-$2K Limit', fill: 'var(--negative)', fontSize: 10, position: 'right' }} />
					<ReferenceLine y={0} stroke="var(--text-muted)" strokeOpacity={0.3} />
					
					{/* Passing paths - different strategies */}
					<Line 
						type="monotone" 
						dataKey="fastPass" 
						stroke="url(#greenGradient)" 
						strokeWidth={2.5} 
						dot={false} 
						name="Fast Pass"
						filter="url(#glow)"
						strokeDasharray={inView ? "0" : "2000"}
						style={{ 
							strokeDashoffset: inView ? 0 : 2000,
							transition: 'stroke-dashoffset 2s ease-out'
						}}
					/>
					<Line type="monotone" dataKey="steadyPass" stroke="var(--positive)" strokeWidth={1.5} dot={false} opacity={0.6} name="Steady Pass" />
					<Line type="monotone" dataKey="slowPass" stroke="var(--positive)" strokeWidth={1} dot={false} opacity={0.35} name="Slow Pass" />
					
					{/* Breakeven path */}
					<Line type="monotone" dataKey="breakeven" stroke="url(#yellowGradient)" strokeWidth={1.5} dot={false} opacity={0.5} name="Breakeven" />
					
					{/* Failing paths */}
					<Line type="monotone" dataKey="earlyBust" stroke="url(#redGradient)" strokeWidth={2} dot={false} opacity={0.7} name="Early Bust" />
					<Line type="monotone" dataKey="lateBust" stroke="var(--negative)" strokeWidth={1.5} dot={false} opacity={0.4} name="Late Bust" />
					
					{/* Median path */}
					<Line type="monotone" dataKey="median" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Median" />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Page() {
	const [scrolled, setScrolled] = useState(false);

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
						<motion.div 
							className="flex items-center gap-2"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<span className="text-[var(--accent)] text-2xl font-bold">α</span>
							<span className="text-sm font-semibold tracking-tight hidden sm:inline">ALPHASOLVER</span>
						</motion.div>
						
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
									<motion.button 
										className="btn-primary px-4 py-2 text-sm"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Launch App
									</motion.button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<motion.button 
										className="btn-primary px-4 py-2 text-sm"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Start Free
									</motion.button>
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

						{/* Eye-catching headline */}
						<motion.h1 
							variants={fadeUp} 
							custom={1} 
							className="text-4xl sm:text-5xl lg:text-6xl mb-4"
						>
							<span className="font-['Space_Grotesk',_sans-serif] font-bold text-[var(--text-primary)]">Know your </span>
							<span className="font-['Space_Grotesk',_sans-serif] font-bold headline-gradient glow-text">true odds</span>
						</motion.h1>
						
						{/* Updated messaging for all trader levels */}
						<motion.p variants={fadeUp} custom={2} className="text-[var(--text-secondary)] text-base sm:text-lg max-w-2xl mx-auto mb-4">
							Whether you're taking your first prop challenge or optimizing your hundredth strategy—get the same Monte Carlo edge that professional quant funds use.
						</motion.p>
						
						<motion.p variants={fadeUp} custom={2.5} className="text-[var(--text-muted)] text-sm max-w-xl mx-auto mb-6">
							Upload your trade log • Run 10,000 simulations • See your real probability of passing—<span className="text-[var(--text-primary)]">before you pay.</span>
						</motion.p>

						<motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<motion.button 
										className="btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Launch App
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</motion.button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<motion.button 
										className="btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Start Free Today
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</motion.button>
								</a>
							)}
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
						<motion.div variants={scaleUp}>
							<MetricCard 
								label="Pass Rate" 
								value="76.9%"
								numericValue={76.9}
								change="Based on 10,000 simulations"
								positive
								large
								delay={0}
							/>
						</motion.div>
						<motion.div variants={scaleUp}>
							<MetricCard 
								label="Expected Value" 
								value="+$2,431"
								numericValue={2431}
								change="Net profit per attempt"
								positive
								large
								delay={1}
							/>
						</motion.div>
						<motion.div variants={scaleUp}>
							<MetricCard 
								label="Avg Attempts" 
								value="1.3"
								numericValue={1.3}
								change="To pass evaluation"
								large
								delay={2}
							/>
						</motion.div>
						<motion.div variants={scaleUp}>
							<MetricCard 
								label="+EV ROI" 
								value="+541%"
								numericValue={541}
								change="Return on eval cost"
								positive
								large
								delay={3}
							/>
						</motion.div>
					</motion.div>

					{/* Secondary metrics row */}
					<motion.div
						initial="hidden"
						animate={metricsInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6"
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
								whileHover={{ scale: 1.02, y: -2 }}
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

					{/* Simulation Preview */}
					<div className="mb-6">
						<SimulationPreview />
					</div>
				</div>

				{/* Platform integrations - Enhanced with icons */}
				<div className="border-y border-[var(--border)] bg-[var(--bg-secondary)]">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Import from your platform</span>
							<div className="flex flex-wrap items-center justify-center gap-2">
								{Object.entries(platformIcons).map(([name, icon], i) => (
									<PlatformLogo key={i} name={name} icon={icon} />
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Equity Paths Section - Enhanced */}
			<section ref={equityRef} id="equity" className="relative z-10 py-10 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={equityInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
							<div>
								<h2 className="text-xl sm:text-2xl font-semibold mb-1">Equity Paths Visualization</h2>
								<p className="text-sm text-[var(--text-muted)]">10,000 simulated equity curves • TOPSTEP 50K Challenge</p>
							</div>
							<div className="flex items-center gap-4 text-xs">
								<span className="flex items-center gap-2">
									<span className="w-4 h-1 rounded bg-[var(--positive)]" />
									<span className="text-[var(--text-muted)]">Pass (76.9%)</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="w-4 h-1 rounded bg-[var(--negative)]" />
									<span className="text-[var(--text-muted)]">Fail (23.1%)</span>
								</span>
								<span className="flex items-center gap-2">
									<span className="w-4 h-0.5 rounded bg-[var(--accent)]" style={{ borderBottom: '2px dashed var(--accent)' }} />
									<span className="text-[var(--text-muted)]">Median</span>
								</span>
							</div>
						</motion.div>

						<motion.div variants={fadeUp} custom={1} className="chart-container p-4 sm:p-6">
							<AnimatedEquityChart inView={equityInView} />
							<div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
								<span className="text-[var(--positive)]">+$3,000 Profit Target</span>
								<span className="text-[var(--accent)]">Hover over paths for details</span>
								<span className="text-[var(--negative)]">-$2,000 Max Drawdown</span>
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
											cursor={{ fill: 'var(--bg-card-hover)' }}
										/>
										<Bar dataKey="count" radius={[3, 3, 0, 0]}>
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
											tickFormatter={(value: number) => `${value}%`}
										/>
										<Tooltip 
											contentStyle={{ 
												background: 'var(--bg-elevated)', 
												border: '1px solid var(--border)',
												borderRadius: '8px',
												fontSize: '12px'
											}}
											formatter={(value: string | number) => [`${value}%`, 'Frequency']}
											cursor={{ fill: 'var(--bg-card-hover)' }}
										/>
										<Bar dataKey="frequency" fill="var(--accent)" radius={[3, 3, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Strategy Runs Table - Updated from Scenario Outcomes */}
			<section ref={scenarioRef} className="relative z-10 py-8 px-4 sm:px-6">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial="hidden"
						animate={scenarioInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUp} custom={0} className="mb-4">
							<h2 className="text-xl font-semibold mb-1">Strategy Comparison</h2>
							<p className="text-sm text-[var(--text-muted)]">Test multiple strategies to find your optimal approach</p>
						</motion.div>

						<motion.div variants={fadeUp} custom={1} className="chart-container overflow-hidden">
							<div className="overflow-x-auto">
								<table className="data-table">
									<thead>
										<tr>
											<th>Strategy Run</th>
											<th>Approach</th>
											<th>Pass Rate</th>
											<th>Days</th>
											<th>Max DD</th>
											<th>Net P&L</th>
											<th>Result</th>
										</tr>
									</thead>
									<tbody>
										{strategyRuns.map((row, i) => (
											<motion.tr 
												key={i}
												initial={{ opacity: 0, x: -10 }}
												animate={scenarioInView ? { opacity: 1, x: 0 } : {}}
												transition={{ delay: i * 0.1 }}
											>
												<td>
													<span className="badge badge-run">{row.run}</span>
												</td>
												<td className="text-[var(--text-secondary)]">{row.strategy}</td>
												<td className="font-semibold">{row.probability}</td>
												<td>{row.days}</td>
												<td className="text-[var(--negative)]">{row.maxDD}</td>
												<td className={row.highlight ? 'text-[var(--positive)] font-semibold green-pulse' : 'text-[var(--negative)]'}>
													{row.netPnL}
												</td>
												<td>
													<span className={`badge ${row.highlight ? 'badge-positive' : ''}`}>
														{row.outcome}
													</span>
												</td>
											</motion.tr>
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
							{[
								{ label: "Daily Profit Target", value: "+$187", desc: "Reach $3K in ~16 trading days", positive: true },
								{ label: "Daily Stop Loss", value: "-$125", desc: "Protect against bust scenarios", negative: true },
								{ label: "Win Rate Needed", value: "52.4%", desc: "You have 58.4% (surplus)", accent: true },
								{ label: "Expected Days to Pass", value: "12", desc: "Median across simulations", neutral: true },
							].map((item, i) => (
								<motion.div 
									key={i}
									whileHover={{ scale: 1.02, y: -4 }}
									className={`metric-card p-5 ${item.positive ? 'metric-positive' : ''}`}
								>
									<div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
										{item.label}
									</div>
									<div className={`text-3xl font-semibold mb-1 ${
										item.positive ? 'text-[var(--positive)] green-pulse' : 
										item.negative ? 'text-[var(--negative)]' : 
										item.accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
									}`}>
										{item.value}
									</div>
									<p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
								</motion.div>
							))}
						</motion.div>

						{/* Mini equity preview */}
						<motion.div variants={fadeUp} custom={2} className="mt-4 grid sm:grid-cols-3 gap-3">
							{[
								{ label: "Optimal Trades/Day", value: "3-4", sub: "Based on frequency analysis" },
								{ label: "Risk per Trade", value: "$41", sub: "1R = 0.33% of drawdown" },
								{ label: "R:R Ratio", value: "1.5:1", sub: "Matches your avg win/loss" },
							].map((item, i) => (
								<motion.div 
									key={i} 
									className="dash-card p-4 flex items-center justify-between"
									whileHover={{ scale: 1.01, y: -2 }}
								>
									<div>
										<div className="text-xs text-[var(--text-muted)] mb-1">{item.label}</div>
										<div className="text-lg font-semibold">{item.value}</div>
										<div className="text-[10px] text-[var(--text-muted)]">{item.sub}</div>
									</div>
									<div className="w-20">
										<MiniEquityChart />
									</div>
								</motion.div>
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
							<h2 className="text-2xl sm:text-3xl font-['Space_Grotesk',_sans-serif] font-bold mb-2">
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
									whileHover={{ scale: 1.02, y: -4 }}
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
									<motion.button 
										className="btn-primary px-8 py-3 text-sm font-semibold"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Launch Simulator
									</motion.button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<motion.button 
										className="btn-primary px-8 py-3 text-sm font-semibold"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Start Free Today
									</motion.button>
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
							<motion.div 
								key={i} 
								className="dash-card p-5"
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.15 }}
								whileHover={{ scale: 1.02, y: -2 }}
							>
								<div className="text-3xl font-['Space_Grotesk',_sans-serif] font-bold text-[var(--accent)] mb-3">{step.num}</div>
								<h3 className="font-semibold mb-2">{step.title}</h3>
								<p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
							</motion.div>
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
							<h2 className="text-2xl sm:text-3xl font-['Space_Grotesk',_sans-serif] font-bold mb-2">Simple Pricing</h2>
							<p className="text-sm text-[var(--text-muted)]">Start free. Upgrade when you need unlimited simulations.</p>
						</motion.div>

						<div className="grid sm:grid-cols-2 gap-4">
							{/* Free */}
							<motion.div 
								variants={fadeUp} 
								custom={1} 
								className="pricing-card p-6"
								whileHover={{ scale: 1.02, y: -4 }}
							>
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
									<motion.button 
										className="btn-secondary w-full py-3 text-sm"
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
									>
										Get Started Free
									</motion.button>
								</a>
							</motion.div>

							{/* Unlimited */}
							<motion.div 
								variants={fadeUp} 
								custom={2} 
								className="pricing-card pricing-featured p-6 relative"
								whileHover={{ scale: 1.02, y: -4 }}
							>
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
									<motion.button 
										className="btn-primary w-full py-3 text-sm font-semibold"
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
									>
										Upgrade to Unlimited
									</motion.button>
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
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
					>
						<h2 className="text-3xl sm:text-4xl font-['Space_Grotesk',_sans-serif] font-bold mb-4">
							Stop guessing.<br />
							<span className="headline-gradient">Start knowing.</span>
						</h2>
						<p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
							Your next prop firm attempt doesn't have to be a gamble. Run the numbers first.
						</p>
						<div className="flex flex-wrap gap-3 justify-center mb-6">
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<motion.button 
										className="btn-primary px-8 py-4 text-sm font-semibold flex items-center gap-2"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Launch App
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</motion.button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<motion.button 
										className="btn-primary px-8 py-4 text-sm font-semibold flex items-center gap-2"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.98 }}
									>
										Start Free Today
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
										</svg>
									</motion.button>
								</a>
							)}
						</div>
						<p className="text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
							<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
							</svg>
							Your data stays in your browser. We never see your trades.
						</p>
					</motion.div>
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
