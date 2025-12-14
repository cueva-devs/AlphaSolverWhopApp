"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";

const WHOP_CHECKOUT_URL = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL || "https://whop.com/alphasolver";
const BYPASS_ACCESS = process.env.NEXT_PUBLIC_BYPASS_ACCESS === "true";

// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeUpVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }
	})
};

const fadeLeftVariants = {
	hidden: { opacity: 0, x: -30 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const fadeRightVariants = {
	hidden: { opacity: 0, x: 30 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const scaleInVariants = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.2 }
	}
};

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
	const [count, setCount] = useState(0);
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

	useEffect(() => {
		if (inView) {
			const duration = 2000;
			const steps = 60;
			const increment = value / steps;
			let current = 0;
			const timer = setInterval(() => {
				current += increment;
				if (current >= value) {
					setCount(value);
					clearInterval(timer);
				} else {
					setCount(Math.floor(current));
				}
			}, duration / steps);
			return () => clearInterval(timer);
		}
	}, [inView, value]);

	return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ============================================
// INTERACTIVE DEMO COMPONENT
// ============================================
function InteractiveDemo() {
	const [isRunning, setIsRunning] = useState(false);
	const [progress, setProgress] = useState(0);
	const [showResults, setShowResults] = useState(false);
	const [pathCount, setPathCount] = useState(0);

	const runSimulation = () => {
		if (isRunning) return;
		setIsRunning(true);
		setShowResults(false);
		setProgress(0);
		setPathCount(0);

		const duration = 3000;
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
	};

	return (
		<div className="terminal-window p-1">
			<div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
				<span className="w-3 h-3 rounded-full bg-[var(--negative)] opacity-80" />
				<span className="w-3 h-3 rounded-full bg-[var(--accent)] opacity-80" />
				<span className="w-3 h-3 rounded-full bg-[var(--positive)] opacity-80" />
				<span className="ml-4 text-xs text-[var(--text-muted)]">live_demo.exe</span>
			</div>
			
			<div className="p-6 space-y-4 font-mono text-sm min-h-[320px]">
				{!isRunning && !showResults && (
					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="space-y-4"
					>
						<div className="text-[var(--text-muted)]">
							<span className="text-[var(--accent)]">$</span> Ready to simulate your trading performance
						</div>
						<div className="text-[var(--text-secondary)] text-xs">
							Click below to run a sample Monte Carlo simulation with demo data
						</div>
						<button
							onClick={runSimulation}
							className="glow-button px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-semibold transition-all"
						>
							▶ RUN SIMULATION
						</button>
					</motion.div>
				)}

				{isRunning && (
					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="space-y-4"
					>
						<div className="text-[var(--text-muted)]">
							<span className="text-[var(--accent)]">$</span> alphasolver run --paths 10000 --firm topstep_50k
						</div>
						<div className="space-y-2">
							<div className="flex justify-between text-xs text-[var(--text-muted)]">
								<span>Simulating paths...</span>
								<span>{pathCount.toLocaleString()} / 10,000</span>
							</div>
							<div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
								<motion.div 
									className="h-full bg-[var(--accent)]"
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.1 }}
								/>
							</div>
						</div>
						<div className="text-xs text-[var(--text-muted)] animate-pulse">
							Processing Monte Carlo simulation...
						</div>
					</motion.div>
				)}

				{showResults && (
					<motion.div 
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-4"
					>
						<div className="text-[var(--positive)] text-xs">
							✓ Simulation complete - 10,000 paths analyzed
						</div>
						
						<div className="pt-2 border-t border-[var(--border)] space-y-3">
							<motion.div 
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.1 }}
								className="flex justify-between items-baseline"
							>
								<span className="text-[var(--text-muted)]">PASS_RATE</span>
								<span className="text-2xl text-[var(--accent)] font-semibold">67.2%</span>
							</motion.div>
							<motion.div 
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
								className="flex justify-between items-baseline"
							>
								<span className="text-[var(--text-muted)]">EXPECTED_VALUE</span>
								<span className="text-2xl text-[var(--positive)] font-semibold">+$1,847</span>
							</motion.div>
							<motion.div 
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.3 }}
								className="flex justify-between items-baseline"
							>
								<span className="text-[var(--text-muted)]">ROI</span>
								<span className="text-2xl text-[var(--positive)] font-semibold">+412%</span>
							</motion.div>
						</div>

						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5 }}
							className="pt-3 border-t border-[var(--border)]"
						>
							<div className="flex items-center gap-2 text-[var(--positive)]">
								<span>●</span>
								<span className="text-xs">VERDICT: +EV STRATEGY - PROCEED WITH EVALUATION</span>
							</div>
						</motion.div>

						<motion.button
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.7 }}
							onClick={() => { setShowResults(false); setProgress(0); }}
							className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
						>
							[Run again]
						</motion.button>
					</motion.div>
				)}
			</div>
		</div>
	);
}

// ============================================
// TESTIMONIAL CARD COMPONENT
// ============================================
const testimonials = [
	{
		quote: "AlphaSolver showed me my 72% pass rate before I even started. Saved me from wasting money on attempts I wasn't ready for.",
		name: "Marcus T.",
		role: "Futures Trader",
		passRate: "72%",
		avatar: "MT"
	},
	{
		quote: "Finally, actual math instead of guessing. The trading plan feature alone is worth it—I passed Topstep on my second try.",
		name: "Sarah K.",
		role: "ES Trader",
		passRate: "68%",
		avatar: "SK"
	},
	{
		quote: "I was about to pay for another reset. Ran the simulation and realized my win rate was too low. Fixed my strategy first, then passed.",
		name: "David L.",
		role: "NQ Scalper",
		passRate: "81%",
		avatar: "DL"
	},
	{
		quote: "The expected value calculation opened my eyes. Now I only take evaluations when the math says I should.",
		name: "Jennifer R.",
		role: "Swing Trader",
		passRate: "65%",
		avatar: "JR"
	}
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) {
	return (
		<motion.div
			variants={fadeUpVariants}
			custom={index}
			className="testimonial-card p-6 rounded-none"
		>
			<div className="flex items-start gap-4 mb-4">
				<div className="w-12 h-12 bg-[var(--accent-dim)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-semibold">
					{testimonial.avatar}
				</div>
				<div>
					<div className="font-medium text-[var(--text-primary)]">{testimonial.name}</div>
					<div className="text-xs text-[var(--text-muted)]">{testimonial.role}</div>
				</div>
				<div className="ml-auto text-right">
					<div className="text-xs text-[var(--text-muted)]">Pass Rate</div>
					<div className="text-lg font-semibold text-[var(--positive)]">{testimonial.passRate}</div>
				</div>
			</div>
			<p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
				"{testimonial.quote}"
			</p>
			<div className="flex gap-1 mt-4">
				{[...Array(5)].map((_, i) => (
					<span key={i} className="text-[var(--accent)]">★</span>
				))}
			</div>
		</motion.div>
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
		question: "How do I upload my trade log?",
		answer: "Export your trades as a CSV from your trading platform (NinjaTrader, TradingView, Tradovate, Rithmic, etc.) or enter your statistics manually. We'll automatically parse your data and extract the key metrics needed for simulation."
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
					variants={fadeUpVariants}
					custom={index}
					className="faq-item"
				>
					<button
						onClick={() => setOpenIndex(openIndex === index ? null : index)}
						className="w-full py-6 px-4 flex items-center justify-between text-left"
					>
						<span className="text-[var(--text-primary)] pr-8">{faq.question}</span>
						<motion.span
							animate={{ rotate: openIndex === index ? 45 : 0 }}
							className="text-[var(--accent)] text-xl flex-shrink-0"
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
								transition={{ duration: 0.3 }}
								className="overflow-hidden"
							>
								<p className="px-4 pb-6 text-sm text-[var(--text-secondary)] leading-relaxed">
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
// PLATFORM LOGOS
// ============================================
const platforms = [
	{ name: "NinjaTrader", abbr: "NT" },
	{ name: "TradingView", abbr: "TV" },
	{ name: "Tradovate", abbr: "TDV" },
	{ name: "Rithmic", abbr: "RTH" },
	{ name: "Sierra Chart", abbr: "SC" },
];

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function Page() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 50);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.3 });
	const [demoRef, demoInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [processRef, processInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [outputRef, outputInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [testimonialsRef, testimonialsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [pricingRef, pricingInView] = useInView({ triggerOnce: true, threshold: 0.2 });
	const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.2 });

	return (
		<div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased overflow-x-hidden">
			{/* Background Effects */}
			<div className="fixed inset-0 grid-bg pointer-events-none" />
			<div className="glow-orb w-[600px] h-[600px] bg-[var(--accent)] top-[-200px] left-1/2 -translate-x-1/2 opacity-20" />
			<div className="glow-orb w-[400px] h-[400px] bg-[var(--positive)] bottom-[20%] right-[-100px] opacity-10" />
			
			{/* Floating Particles */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{[...Array(15)].map((_, i) => (
					<div
						key={i}
						className="particle"
						style={{
							left: `${Math.random() * 100}%`,
							animationDuration: `${8 + Math.random() * 12}s`,
							animationDelay: `${Math.random() * 5}s`,
						}}
					/>
				))}
			</div>

			{/* Sticky Navigation */}
			<nav className={`fixed top-0 left-0 right-0 z-50 sticky-nav ${scrolled ? 'scrolled' : ''}`}>
				<div className="max-w-6xl mx-auto px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-[var(--accent)] text-2xl font-bold">α</span>
							<span className="text-sm tracking-wider hidden sm:inline">ALPHASOLVER</span>
						</div>
						
						<div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
							<a href="#demo" className="hover:text-[var(--text-primary)] transition-colors">Demo</a>
							<a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
							<a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
							<a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</a>
						</div>

						<div className="flex items-center gap-4">
							<Link href="/app" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm hidden sm:block">
								Sign In
							</Link>
							<a href={WHOP_CHECKOUT_URL}>
								<button className="glow-button px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-medium transition-all">
									GET ACCESS
								</button>
							</a>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section ref={heroRef} className="relative z-10 min-h-screen flex items-center pt-20">
				<div className="max-w-6xl mx-auto px-6 py-20">
					<div className="grid lg:grid-cols-2 gap-16 items-center">
						{/* Left: Copy */}
						<motion.div
							initial="hidden"
							animate={heroInView ? "visible" : "hidden"}
							variants={staggerContainer}
							className="space-y-8"
						>
							{/* Trust Badge */}
							<motion.div variants={fadeUpVariants} custom={0}>
								<div className="inline-flex items-center gap-3 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)]">
									<span className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full bg-[var(--positive)] animate-pulse" />
										<span className="text-xs text-[var(--positive)]">LIVE</span>
									</span>
									<span className="text-xs text-[var(--text-muted)]">|</span>
									<span className="text-xs text-[var(--text-secondary)]">
										Trusted by <span className="text-[var(--accent)]">1,500+</span> prop traders
									</span>
								</div>
							</motion.div>

							<motion.div variants={fadeUpVariants} custom={1}>
								<p className="text-[var(--text-muted)] text-sm mb-4 tracking-wider">
									MONTE CARLO SIMULATION ENGINE
								</p>
								<h1 className="text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
									<span className="font-['Instrument_Serif',_serif] italic text-[var(--text-primary)]">Know your</span>
									<br />
									<span className="font-['Instrument_Serif',_serif] italic text-[var(--accent)]">true odds</span>
								</h1>
							</motion.div>
							
							<motion.p variants={fadeUpVariants} custom={2} className="text-[var(--text-secondary)] text-lg max-w-md leading-relaxed">
								Upload your trade log. Run 10,000 simulations. See your real probability of passing any prop firm challenge—<span className="text-[var(--text-primary)]">before you pay.</span>
							</motion.p>
							
							<motion.div variants={fadeUpVariants} custom={3} className="flex flex-wrap gap-4">
								{BYPASS_ACCESS ? (
									<Link href="/app">
										<button className="group glow-button px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-semibold transition-all flex items-center gap-2">
											LAUNCH APP
											<motion.span 
												className="inline-block"
												animate={{ x: [0, 5, 0] }}
												transition={{ duration: 1.5, repeat: Infinity }}
											>
												→
											</motion.span>
										</button>
									</Link>
								) : (
									<a href={WHOP_CHECKOUT_URL}>
										<button className="group glow-button px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-semibold transition-all flex items-center gap-2">
											START FREE
											<motion.span 
												className="inline-block"
												animate={{ x: [0, 5, 0] }}
												transition={{ duration: 1.5, repeat: Infinity }}
											>
												→
											</motion.span>
										</button>
									</a>
								)}
								<Link href="/app">
									<button className="px-8 py-4 border border-[var(--border)] hover:border-[var(--text-muted)] text-[var(--text-primary)] transition-all hover:bg-[var(--bg-card)]">
										I HAVE ACCESS
									</button>
								</Link>
							</motion.div>
							
							<motion.div variants={fadeUpVariants} custom={4} className="flex flex-wrap items-center gap-6 pt-4 text-sm text-[var(--text-muted)]">
								<span className="flex items-center gap-2">
									<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									No credit card
								</span>
								<span className="flex items-center gap-2">
									<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									3 free runs/day
								</span>
								<span className="flex items-center gap-2">
									<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
									Runs locally
								</span>
							</motion.div>
						</motion.div>
						
						{/* Right: Terminal Preview */}
						<motion.div
							initial={{ opacity: 0, x: 50 }}
							animate={heroInView ? { opacity: 1, x: 0 } : {}}
							transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="relative"
						>
							<div className="terminal-window p-1">
								<div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
									<span className="w-3 h-3 rounded-full bg-[var(--negative)] opacity-80" />
									<span className="w-3 h-3 rounded-full bg-[var(--accent)] opacity-80" />
									<span className="w-3 h-3 rounded-full bg-[var(--positive)] opacity-80" />
									<span className="ml-4 text-xs text-[var(--text-muted)]">simulation_output.log</span>
								</div>
								
								<div className="p-4 space-y-4 font-mono text-sm">
									<div className="text-[var(--text-muted)]">
										<span className="text-[var(--accent)]">$</span> alphasolver run --paths 10000
									</div>
									
									<div className="space-y-1 text-xs">
										<div className="text-[var(--text-muted)]">[████████████████████] 100% | 10,000 paths</div>
									</div>
									
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
							
							{/* Decorative Elements */}
							<div className="absolute -bottom-4 -right-4 w-32 h-32 border-r-2 border-b-2 border-[var(--accent)] opacity-30" />
							<div className="absolute -top-4 -left-4 w-16 h-16 border-l-2 border-t-2 border-[var(--accent)] opacity-20" />
						</motion.div>
					</div>
				</div>
			</section>

			{/* Stats Bar */}
			<section ref={statsRef} className="relative z-10 border-y border-[var(--border)] bg-[var(--bg-card)]">
				<div className="max-w-6xl mx-auto px-6">
					<motion.div
						initial="hidden"
						animate={statsInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid grid-cols-2 md:grid-cols-4"
					>
						{[
							{ value: 1547, label: "Traders", suffix: "+" },
							{ value: 89420, label: "Simulations Run", suffix: "+" },
							{ value: 67, label: "Avg Pass Rate", suffix: "%" },
							{ value: 412, label: "Avg ROI", prefix: "+", suffix: "%" },
						].map((stat, i) => (
							<motion.div
								key={i}
								variants={fadeUpVariants}
								custom={i}
								className="py-8 px-6 text-center border-r border-[var(--border)] last:border-r-0"
							>
								<div className="text-3xl md:text-4xl font-semibold text-[var(--accent)] mb-1">
									<AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
								</div>
								<div className="text-xs text-[var(--text-muted)] tracking-wider">{stat.label}</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* Platform Integrations */}
			<section className="relative z-10 py-12 border-b border-[var(--border)]">
				<div className="max-w-6xl mx-auto px-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-6">
						<p className="text-xs text-[var(--text-muted)] tracking-wider">IMPORT FROM</p>
						<div className="flex flex-wrap items-center justify-center gap-4">
							{platforms.map((platform, i) => (
								<div key={i} className="platform-badge px-4 py-2 flex items-center gap-2">
									<span className="text-[var(--accent)] font-mono text-sm">{platform.abbr}</span>
									<span className="text-xs text-[var(--text-muted)]">{platform.name}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Interactive Demo Section */}
			<section id="demo" ref={demoRef} className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<motion.div
						initial="hidden"
						animate={demoInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid lg:grid-cols-2 gap-16 items-center"
					>
						<motion.div variants={fadeLeftVariants} className="space-y-6">
							<p className="text-xs text-[var(--text-muted)] tracking-wider">TRY IT NOW</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
								See the simulation<br />in action
							</h2>
							<p className="text-[var(--text-secondary)] leading-relaxed">
								Click to run a live Monte Carlo simulation with sample trading data. 
								Watch as 10,000 paths are calculated in real-time to determine your probability of success.
							</p>
							<div className="pt-4 space-y-3 text-sm">
								<div className="flex items-center gap-3">
									<span className="w-6 h-6 flex items-center justify-center bg-[var(--accent-dim)] text-[var(--accent)] text-xs">1</span>
									<span className="text-[var(--text-secondary)]">Simulates 10,000 unique trading paths</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="w-6 h-6 flex items-center justify-center bg-[var(--accent-dim)] text-[var(--accent)] text-xs">2</span>
									<span className="text-[var(--text-secondary)]">Calculates exact pass probability</span>
								</div>
								<div className="flex items-center gap-3">
									<span className="w-6 h-6 flex items-center justify-center bg-[var(--accent-dim)] text-[var(--accent)] text-xs">3</span>
									<span className="text-[var(--text-secondary)]">Returns expected value & ROI</span>
								</div>
							</div>
						</motion.div>
						
						<motion.div variants={fadeRightVariants}>
							<InteractiveDemo />
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Equity Curve Visualization */}
			<section className="relative z-10 py-24 px-6 border-y border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<div className="grid lg:grid-cols-3 gap-12">
						<div className="lg:col-span-1 space-y-6">
							<p className="text-xs text-[var(--text-muted)] tracking-wider">VISUALIZATION</p>
							<h2 className="text-3xl font-['Instrument_Serif',_serif] italic">
								10,000 possible futures
							</h2>
							<p className="text-[var(--text-secondary)] text-sm leading-relaxed">
								Every line is a potential equity curve based on your trading statistics. Green paths pass the evaluation. Red paths hit the drawdown limit. Your win rate, average win, and average loss drive the simulation.
							</p>
						</div>
						
						<div className="lg:col-span-2 terminal-window p-6">
							<div className="flex items-center justify-between mb-6 text-xs">
								<span className="text-[var(--text-muted)]">TOPSTEP 50K EVALUATION</span>
								<div className="flex items-center gap-6">
									<span className="flex items-center gap-2">
										<span className="w-4 h-[2px] bg-[var(--positive)]" />
										<span className="text-[var(--text-muted)]">Pass (67.2%)</span>
									</span>
									<span className="flex items-center gap-2">
										<span className="w-4 h-[2px] bg-[var(--negative)]" />
										<span className="text-[var(--text-muted)]">Fail (32.8%)</span>
									</span>
								</div>
							</div>
							
							<div className="h-56 relative">
								<svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
									{/* Grid lines */}
									{[40, 80, 120, 160].map((y, i) => (
										<line key={i} x1="0" y1={y} x2="500" y2={y} stroke="var(--border)" strokeWidth="1" opacity="0.5" />
									))}
									
									{/* Zero line */}
									<line x1="0" y1="140" x2="500" y2="140" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4,4" />
									
									{/* Profit target */}
									<line x1="0" y1="40" x2="500" y2="40" stroke="var(--positive)" strokeWidth="1" strokeDasharray="2,4" opacity="0.5" />
									<text x="505" y="44" fill="var(--positive)" fontSize="10">$3,000</text>
									
									{/* Drawdown limit */}
									<line x1="0" y1="180" x2="500" y2="180" stroke="var(--negative)" strokeWidth="1" strokeDasharray="2,4" opacity="0.5" />
									<text x="505" y="184" fill="var(--negative)" fontSize="10">-$2,000</text>
									
									{/* Winning paths with glow */}
									<path d="M0,140 Q60,135 120,115 T240,75 T360,45 T500,35" fill="none" stroke="var(--positive)" strokeWidth="2" className="path-animate chart-glow" opacity="0.9" />
									<path d="M0,140 Q80,130 140,105 T280,70 T400,40 T500,28" fill="none" stroke="var(--positive)" strokeWidth="1.5" className="path-animate" opacity="0.5" style={{ animationDelay: '0.2s' }} />
									<path d="M0,140 Q50,138 100,120 T200,85 T300,55 T400,38 T500,32" fill="none" stroke="var(--positive)" strokeWidth="1" className="path-animate" opacity="0.3" style={{ animationDelay: '0.4s' }} />
									<path d="M0,140 Q70,132 130,108 T260,72 T380,42 T500,30" fill="none" stroke="var(--positive)" strokeWidth="1" className="path-animate" opacity="0.4" style={{ animationDelay: '0.3s' }} />
									<path d="M0,140 Q90,125 150,95 T290,60 T420,35 T500,25" fill="none" stroke="var(--positive)" strokeWidth="1" className="path-animate" opacity="0.25" style={{ animationDelay: '0.5s' }} />
									
									{/* Losing paths */}
									<path d="M0,140 Q40,148 80,160 T160,178" fill="none" stroke="var(--negative)" strokeWidth="2" className="path-animate" opacity="0.8" style={{ animationDelay: '0.6s' }} />
									<path d="M0,140 Q50,152 100,168 T180,182" fill="none" stroke="var(--negative)" strokeWidth="1.5" className="path-animate" opacity="0.4" style={{ animationDelay: '0.7s' }} />
									<path d="M0,140 Q30,145 70,158 T130,175 T200,185" fill="none" stroke="var(--negative)" strokeWidth="1" className="path-animate" opacity="0.3" style={{ animationDelay: '0.8s' }} />
								</svg>
							</div>
							
							<div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
								<span>Day 0</span>
								<span>Trading Days</span>
								<span>Day 15</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section id="features" ref={processRef} className="relative z-10 py-24 px-6">
				<div className="max-w-6xl mx-auto">
					<motion.div
						initial="hidden"
						animate={processInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUpVariants} custom={0} className="text-center mb-16">
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">THE PROCESS</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
								Three inputs. Infinite clarity.
							</h2>
						</motion.div>
						
						<div className="grid md:grid-cols-3 gap-px bg-[var(--border)]">
							{[
								{
									num: "01",
									title: "Upload trade log",
									desc: "CSV export from NinjaTrader, TradingView, Tradovate, Rithmic, or any platform. We extract your win rate, average win/loss, and trade frequency automatically."
								},
								{
									num: "02",
									title: "Select prop firm",
									desc: "Topstep, Take Profit Trader, Apex, Tradeify, or custom rules. We know every profit target, drawdown limit, and fee structure for accurate simulation."
								},
								{
									num: "03",
									title: "Get your odds",
									desc: "Pass probability, expected cost, optimal attempt strategy, and a personalized trading plan with daily targets calibrated to your statistics."
								}
							].map((step, i) => (
								<motion.div
									key={i}
									variants={fadeUpVariants}
									custom={i + 1}
									className="bg-[var(--bg-primary)] p-8 space-y-4 stat-card"
								>
									<div className="text-5xl font-['Instrument_Serif',_serif] text-[var(--accent)]">{step.num}</div>
									<h3 className="text-xl">{step.title}</h3>
									<p className="text-sm text-[var(--text-secondary)] leading-relaxed">
										{step.desc}
									</p>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</section>

			{/* What You Get */}
			<section ref={outputRef} className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<motion.div
						initial="hidden"
						animate={outputInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="grid lg:grid-cols-2 gap-16"
					>
						<motion.div variants={fadeLeftVariants}>
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">OUTPUT</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic mb-8">
								Everything you need to decide
							</h2>
							
							<div className="space-y-0">
								{[
									{ label: "Pass Probability", desc: "Monte Carlo derived pass rate across 10,000+ simulated evaluations" },
									{ label: "Expected Value", desc: "Net profit expectation accounting for fees, rebills, and payout probability" },
									{ label: "Cost Analysis", desc: "Total expected cost including multiple attempts and reset scenarios" },
									{ label: "Optimal Strategy", desc: "Best approach: aggressive, conservative, or somewhere between" },
									{ label: "Trading Plan", desc: "Daily profit targets and max loss limits tuned to your statistics" },
									{ label: "Attempt Forecast", desc: "How many evaluations until you statistically pass" },
								].map((item, i) => (
									<motion.div 
										key={i} 
										variants={fadeUpVariants}
										custom={i}
										className="flex gap-4 py-5 border-b border-[var(--border)] hover:bg-[var(--bg-card)] px-4 -mx-4 transition-colors"
									>
										<span className="text-[var(--accent)] text-sm font-mono">0{i + 1}</span>
										<div>
											<h4 className="text-[var(--text-primary)] mb-1">{item.label}</h4>
											<p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
										</div>
									</motion.div>
								))}
							</div>
						</motion.div>
						
						<motion.div variants={fadeRightVariants} className="flex items-center">
							<div className="w-full terminal-window p-6 space-y-4">
								<div className="text-xs text-[var(--text-muted)] tracking-wider pb-4 border-b border-[var(--border)]">
									SAMPLE TRADING PLAN
								</div>
								
								<div className="space-y-3 font-mono text-sm">
									{[
										{ key: "account_size", value: "$50,000", color: "" },
										{ key: "profit_target", value: "$3,000", color: "" },
										{ key: "max_drawdown", value: "-$2,000", color: "text-[var(--negative)]" },
										{ key: "daily_loss_limit", value: "-$1,000", color: "text-[var(--negative)]" },
									].map((item, i) => (
										<div key={i} className="flex justify-between">
											<span className="text-[var(--text-muted)]">{item.key}</span>
											<span className={item.color}>{item.value}</span>
										</div>
									))}
									
									<div className="pt-4 border-t border-[var(--border)]" />
									
									{[
										{ key: "recommended_daily_target", value: "+$187", color: "text-[var(--positive)]" },
										{ key: "recommended_daily_stop", value: "-$125", color: "text-[var(--negative)]" },
										{ key: "optimal_trades_per_day", value: "3-4", color: "" },
										{ key: "expected_days_to_pass", value: "12", color: "text-[var(--accent)]" },
									].map((item, i) => (
										<div key={i} className="flex justify-between">
											<span className="text-[var(--text-muted)]">{item.key}</span>
											<span className={item.color}>{item.value}</span>
										</div>
									))}
								</div>
							</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Testimonials */}
			<section ref={testimonialsRef} className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-6xl mx-auto">
					<motion.div
						initial="hidden"
						animate={testimonialsInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUpVariants} custom={0} className="text-center mb-16">
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">TESTIMONIALS</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
								Traders who ran the numbers first
							</h2>
						</motion.div>
						
						<motion.div 
							variants={staggerContainer}
							className="grid md:grid-cols-2 gap-6"
						>
							{testimonials.map((testimonial, i) => (
								<TestimonialCard key={i} testimonial={testimonial} index={i} />
							))}
						</motion.div>
						
						<motion.div variants={fadeUpVariants} custom={5} className="mt-12 text-center">
							<p className="text-sm text-[var(--text-muted)]">
								Join <span className="text-[var(--accent)]">1,500+</span> traders who stopped guessing
							</p>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Video Section */}
			<section className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">SEE IT IN ACTION</p>
						<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
							Watch the 60-second demo
						</h2>
					</div>
					
					<div className="terminal-window aspect-video flex items-center justify-center">
						<div className="text-center space-y-4">
							<div className="w-20 h-20 mx-auto rounded-full bg-[var(--accent)] flex items-center justify-center cursor-pointer hover:bg-[var(--accent-bright)] transition-colors pulse-glow">
								<svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8 5v14l11-7z" />
								</svg>
							</div>
							<p className="text-sm text-[var(--text-muted)]">Video coming soon</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section id="pricing" ref={pricingRef} className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-4xl mx-auto">
					<motion.div
						initial="hidden"
						animate={pricingInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUpVariants} custom={0} className="text-center mb-16">
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">PRICING</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
								Simple. No surprises.
							</h2>
						</motion.div>
						
						<div className="grid md:grid-cols-2 gap-px bg-[var(--border)]">
							{/* Free */}
							<motion.div variants={fadeUpVariants} custom={1} className="bg-[var(--bg-primary)] p-8 stat-card">
								<div className="mb-8">
									<p className="text-sm text-[var(--text-muted)] mb-2">FREE</p>
									<div className="flex items-baseline gap-1">
										<span className="text-5xl font-['Instrument_Serif',_serif]">$0</span>
										<span className="text-[var(--text-muted)]">/mo</span>
									</div>
								</div>
								
								<div className="space-y-3 mb-8 text-sm">
									{[
										{ text: "3 simulations per day", included: true },
										{ text: "All prop firms supported", included: true },
										{ text: "Full results & analysis", included: true },
										{ text: "Trading plan generation", included: true },
										{ text: "Export/import runs", included: false },
									].map((item, i) => (
										<div key={i} className="flex items-center gap-3">
											<span className={item.included ? "text-[var(--positive)]" : "text-[var(--text-muted)]"}>
												{item.included ? "✓" : "—"}
											</span>
											<span className={item.included ? "" : "text-[var(--text-muted)]"}>{item.text}</span>
										</div>
									))}
								</div>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="w-full py-4 border border-[var(--border)] hover:border-[var(--text-muted)] text-sm transition-all hover:bg-[var(--bg-card)]">
										GET STARTED FREE
									</button>
								</a>
							</motion.div>
							
							{/* Unlimited */}
							<motion.div variants={fadeUpVariants} custom={2} className="bg-[var(--bg-secondary)] p-8 relative border-gradient">
								<div className="absolute top-4 right-4 px-3 py-1 bg-[var(--accent)] text-black text-xs font-bold">
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
									{[
										"Unlimited simulations",
										"All prop firms supported",
										"Full results & analysis",
										"Trading plan generation",
										"Export/import runs",
									].map((item, i) => (
										<div key={i} className="flex items-center gap-3">
											<span className="text-[var(--positive)]">✓</span>
											<span>{item}</span>
										</div>
									))}
								</div>
								
								<a href={WHOP_CHECKOUT_URL} className="block">
									<button className="glow-button w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black text-sm font-bold transition-all">
										UPGRADE NOW
									</button>
								</a>
							</motion.div>
						</div>
						
						<motion.p variants={fadeUpVariants} custom={3} className="text-center text-sm text-[var(--text-muted)] mt-8">
							All plans include a satisfaction guarantee. Cancel anytime.
						</motion.p>
					</motion.div>
				</div>
			</section>

			{/* FAQ */}
			<section id="faq" ref={faqRef} className="relative z-10 py-24 px-6 border-t border-[var(--border)]">
				<div className="max-w-3xl mx-auto">
					<motion.div
						initial="hidden"
						animate={faqInView ? "visible" : "hidden"}
						variants={staggerContainer}
					>
						<motion.div variants={fadeUpVariants} custom={0} className="text-center mb-16">
							<p className="text-xs text-[var(--text-muted)] tracking-wider mb-4">FAQ</p>
							<h2 className="text-4xl font-['Instrument_Serif',_serif] italic">
								Common questions
							</h2>
						</motion.div>
						
						<FAQ />
					</motion.div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="relative z-10 py-32 px-6 cta-gradient border-t border-[var(--border)]">
				<div className="max-w-3xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						viewport={{ once: true }}
						className="space-y-8"
					>
						<h2 className="text-4xl md:text-5xl font-['Instrument_Serif',_serif] italic">
							Stop guessing.<br />
							<span className="text-[var(--accent)]">Start knowing.</span>
						</h2>
						<p className="text-[var(--text-secondary)] max-w-lg mx-auto">
							Your next prop firm attempt doesn't have to be a gamble. Run the numbers first.
						</p>
						<div className="flex flex-wrap gap-4 justify-center">
							{BYPASS_ACCESS ? (
								<Link href="/app">
									<button className="group glow-button px-10 py-5 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-bold text-lg transition-all flex items-center gap-3">
										LAUNCH APP
										<motion.span 
											className="inline-block"
											animate={{ x: [0, 5, 0] }}
											transition={{ duration: 1.5, repeat: Infinity }}
										>
											→
										</motion.span>
									</button>
								</Link>
							) : (
								<a href={WHOP_CHECKOUT_URL}>
									<button className="group glow-button px-10 py-5 bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-black font-bold text-lg transition-all flex items-center gap-3">
										START FREE TODAY
										<motion.span 
											className="inline-block"
											animate={{ x: [0, 5, 0] }}
											transition={{ duration: 1.5, repeat: Infinity }}
										>
											→
										</motion.span>
									</button>
								</a>
							)}
						</div>
						<p className="text-sm text-[var(--text-muted)] flex items-center justify-center gap-2">
							<svg className="w-4 h-4 text-[var(--positive)]" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
							</svg>
							Your data stays in your browser. We never see your trades.
						</p>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 py-12 px-6 border-t border-[var(--border)] bg-[var(--bg-card)]">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-4 gap-8 mb-12">
						<div className="md:col-span-2">
							<div className="flex items-center gap-2 mb-4">
								<span className="text-[var(--accent)] text-2xl font-bold">α</span>
								<span className="tracking-wider">ALPHASOLVER</span>
							</div>
							<p className="text-sm text-[var(--text-secondary)] max-w-xs">
								Monte Carlo simulation engine for prop traders. Know your true odds before you pay.
							</p>
						</div>
						
						<div>
							<h4 className="text-sm font-medium mb-4">Product</h4>
							<div className="space-y-2 text-sm text-[var(--text-muted)]">
								<a href="#demo" className="block hover:text-[var(--text-primary)] transition-colors">Demo</a>
								<a href="#features" className="block hover:text-[var(--text-primary)] transition-colors">Features</a>
								<a href="#pricing" className="block hover:text-[var(--text-primary)] transition-colors">Pricing</a>
								<a href="#faq" className="block hover:text-[var(--text-primary)] transition-colors">FAQ</a>
							</div>
						</div>
						
						<div>
							<h4 className="text-sm font-medium mb-4">Legal</h4>
							<div className="space-y-2 text-sm text-[var(--text-muted)]">
								<a href="#" className="block hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
								<a href="#" className="block hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
								<a href="#" className="block hover:text-[var(--text-primary)] transition-colors">Contact</a>
							</div>
						</div>
					</div>
					
					<div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
						<p>© 2024 AlphaSolver. All rights reserved.</p>
						<p>Made for traders, by traders.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
