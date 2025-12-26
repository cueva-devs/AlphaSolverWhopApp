"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import type { SimulationResult, AccountConfig, OutcomeScenario } from "../types";
import type { SimulationProgress } from "../hooks/useSimulationEngine";
import EquityChart from "./EquityChart";
import TradeDistributionCharts from "./TradeDistributionCharts";

// Witty loading messages that cycle - poking fun at trader mistakes
const LOADING_MESSAGES = [
	"Calculating so you don't blow your account",
	"Running simulations to save you money",
	"Preventing revenge trades and tilt",
	"Protecting your spouse's credit card",
	"Analyzing thousands of possible outcomes",
	"Finding your true pass probability",
	"Modeling risk like a quant fund",
	"Preventing expensive mistakes",
	"Calculating your edge",
	"Running Monte Carlo magic",
	"Simulating so you don't go on tilt",
	"Protecting you from yourself",
	"Crunching numbers to save your account",
	"Preventing the classic 'one more trade' mistake",
	"Analyzing why you keep blowing accounts",
	"Finding out if you're actually profitable",
	"Simulating your trading future (spoiler: it's expensive)",
	"Protecting your relationship with your broker",
	"Calculating how many resets you'll need",
	"Preventing the 'I'll make it back' trap",
	"Analyzing your true win rate (not the one you tell yourself)",
	"Simulating reality vs your trading journal",
	"Protecting you from the 'this time is different' mindset",
	"Calculating your actual edge (hint: it might be negative)",
	"Preventing the 'just one more eval' cycle",
];

// ============================================
// ANIMATION VARIANTS (matching landing page)
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
// ANIMATED COUNTER (matching landing page)
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
// METRIC CARD COMPONENT (matching landing page)
// ============================================
function MetricCard({ 
	label, 
	value, 
	numericValue,
	change, 
	positive,
	large = false,
	delay = 0,
	accent = false,
}: { 
	label: string; 
	value: string;
	numericValue?: number;
	change?: string;
	positive?: boolean;
	large?: boolean;
	delay?: number;
	accent?: boolean;
}) {
	const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
	
	return (
		<motion.div 
			ref={ref}
			initial="rest"
			whileHover="hover"
			variants={cardHover}
			className={`metric-card p-4 ${large ? 'p-6' : ''} ${positive ? 'metric-positive' : ''} ${accent ? 'border-[var(--accent)]' : ''}`}
		>
			<div className="relative z-10">
				<div className="flex items-start justify-between mb-2">
					<span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
						{label}
					</span>
				</div>
				<motion.div 
					className={`font-semibold ${large ? 'text-3xl' : 'text-2xl'} ${
						positive ? 'text-[var(--positive)] green-pulse' : 
						accent ? 'text-[var(--accent)]' : 
						'text-[var(--text-primary)]'
					}`}
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

function MostProbableOutcomesTable({ outcomes }: { outcomes: OutcomeScenario[] }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [minProbability, setMinProbability] = useState(0.1);

	const filteredOutcomes = outcomes.filter(o => o.probability >= minProbability);
	const totalPages = Math.ceil(filteredOutcomes.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, filteredOutcomes.length);
	const paginatedOutcomes = filteredOutcomes.slice(startIndex, endIndex);

	const showPagination = filteredOutcomes.length > 10;
	const dominant = outcomes[0];
	const isPass = dominant.netPnl > 0;

	return (
		<motion.div 
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className="chart-container p-6 sm:p-8"
		>
			<div className="mb-6">
				<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
					Most Probable Outcomes
				</h3>
				<p className="text-sm text-[var(--text-muted)]">
					Scenarios identified via clustering algorithm on simulation paths
				</p>
			</div>

			{/* Dominant Scenario Callout */}
			<motion.div 
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.2 }}
				className={`mb-6 p-5 rounded-lg border-l-4 ${
					isPass 
						? 'bg-[var(--positive-dim)] border-[var(--positive)]' 
						: 'bg-[var(--negative-dim)] border-[var(--negative)]'
				}`}
			>
				<div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-1">
					Most Likely Outcome ({dominant.probability.toFixed(1)}%)
				</div>
				<div className={`text-xl font-semibold ${isPass ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
					{dominant.scenario}
				</div>
			</motion.div>

			{/* Filters */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
				<div className="flex items-center gap-2">
					<span className="text-xs text-[var(--text-muted)]">Min Probability:</span>
					<select 
						value={minProbability} 
						onChange={(e) => {
							setMinProbability(Number(e.target.value));
							setCurrentPage(1);
						}}
						className="bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
					>
						<option value={0}>All</option>
						<option value={0.1}>≥ 0.1%</option>
						<option value={0.25}>≥ 0.25%</option>
						<option value={0.5}>≥ 0.5%</option>
						<option value={1}>≥ 1%</option>
						<option value={2}>≥ 2%</option>
						<option value={5}>≥ 5%</option>
					</select>
				</div>
				<span className="text-xs text-[var(--text-muted)]">
					{filteredOutcomes.length} of {outcomes.length} scenarios
				</span>
			</div>

			{/* Table */}
			<div className="overflow-x-auto border border-[var(--border)] rounded-lg">
				<table className="data-table w-full text-sm">
					<thead>
						<tr>
							<th>Scenario</th>
							<th className="text-right">Probability</th>
							<th className="text-right">Days</th>
							<th className="text-right whitespace-nowrap">Max DD</th>
							<th className="text-right whitespace-nowrap">Net P&L</th>
						</tr>
					</thead>
					<tbody>
						{paginatedOutcomes.map((outcome, idx) => (
							<motion.tr 
								key={startIndex + idx}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: idx * 0.03 }}
								className="hover:bg-[var(--bg-card-hover)]"
							>
								<td className="py-3 px-4">{outcome.scenario}</td>
								<td className="py-3 px-4 text-right">{outcome.probability.toFixed(1)}%</td>
								<td className="py-3 px-4 text-right">{outcome.days}</td>
								<td className="py-3 px-4 text-right">${outcome.maxDD.toFixed(0)}</td>
								<td className={`py-3 px-4 text-right font-medium ${
									outcome.netPnl >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
								}`}>
									${outcome.netPnl.toFixed(0)}
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{showPagination && totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 mt-4">
					<button
						onClick={() => setCurrentPage(1)}
						disabled={currentPage === 1}
						className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent)] transition-colors"
					>
						««
					</button>
					<button
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
						disabled={currentPage === 1}
						className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent)] transition-colors"
					>
						«
					</button>
					<span className="px-4 text-xs text-[var(--text-muted)]">
						Page {currentPage} of {totalPages}
					</span>
					<button
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
						className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent)] transition-colors"
					>
						»
					</button>
					<button
						onClick={() => setCurrentPage(totalPages)}
						disabled={currentPage === totalPages}
						className="px-3 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent)] transition-colors"
					>
						»»
					</button>
				</div>
			)}
		</motion.div>
	);
}

interface ResultsPanelProps {
	result: SimulationResult | null;
	isRunning: boolean;
	error: string | null;
	accountConfig: AccountConfig;
	progress: SimulationProgress | null;
}

export default function ResultsPanel({
	result,
	isRunning,
	error,
	accountConfig,
	progress,
}: ResultsPanelProps) {
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

	// Cycle through messages every 3 seconds
	useEffect(() => {
		if (isRunning) {
			const interval = setInterval(() => {
				setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
			}, 3000);
			return () => clearInterval(interval);
		} else {
			setLoadingMessageIndex(0);
		}
	}, [isRunning]);

	const [metricsRef, metricsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
	const [resultsRef, resultsInView] = useInView({ triggerOnce: true, threshold: 0.1 });

	return (
		<div className="results-panel-container">
			{/* Error Banner */}
			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="results-section"
				>
					<div className="p-5 rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]">
						<div className="text-sm font-semibold text-[var(--negative)] mb-1">
							Simulation Error
						</div>
						<div className="text-sm text-[var(--text-secondary)]">{error}</div>
					</div>
				</motion.div>
			)}

			{/* Loading State */}
			{isRunning && (
				<motion.div 
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="flex flex-col items-center justify-center py-24"
				>
					<div className="relative mb-6">
						<div className="w-16 h-16 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
						<div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[var(--positive)] rounded-full animate-spin" style={{ animationDelay: '0.15s', animationDuration: '1.5s' }} />
					</div>
					<motion.div 
						key={loadingMessageIndex}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3 }}
						className="text-lg font-semibold text-[var(--text-primary)] mb-2 text-center px-4"
					>
						{LOADING_MESSAGES[loadingMessageIndex]}
					</motion.div>
				</motion.div>
			)}

			{/* Empty State - Minimal, since intro is now in Run tab */}
			{!result && !isRunning && !error && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="results-section"
				>
					<div className="chart-container p-8 sm:p-12 text-center">
						<div className="w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mx-auto mb-6">
							<svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
							</svg>
						</div>
						<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
							No Simulation Results Yet
						</h2>
						<p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
							Go to the <strong className="text-[var(--accent)]">Run</strong> tab to upload your trade log and run a Monte Carlo simulation.
						</p>
					</div>
				</motion.div>
			)}

			{/* Results Content - Single Column Vertical Stack */}
			{result && !isRunning && (
				<motion.div
					ref={resultsRef}
					initial="hidden"
					animate={resultsInView ? "visible" : "hidden"}
					variants={staggerContainer}
					className="results-content"
				>
					{/* Hero Metrics - Matching Landing Page */}
					<motion.section
						ref={metricsRef}
						initial="hidden"
						animate={metricsInView ? "visible" : "hidden"}
						variants={staggerContainer}
						className="results-section"
					>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
							<motion.div variants={scaleUp}>
								<MetricCard 
									label="Pass Rate" 
									value={`${result.passProbability.toFixed(1)}%`}
									numericValue={result.passProbability}
									change={result.passRateCiLower !== undefined ? `${Math.round((result.confidenceLevel || 0.95) * 100)}% CI: [${result.passRateCiLower.toFixed(1)}%, ${result.passRateCiUpper?.toFixed(1)}%]` : undefined}
									positive={result.passProbability >= 50}
									large
									delay={0}
								/>
							</motion.div>
							<motion.div variants={scaleUp}>
								<MetricCard 
									label="Long-term Expected Profit" 
									value={`${(result.netPnlPerAttempt || result.expectedPayout) >= 0 ? '+' : ''}$${Math.abs(result.netPnlPerAttempt || result.expectedPayout).toLocaleString()}`}
									numericValue={Math.abs(result.netPnlPerAttempt || result.expectedPayout)}
									change="Per eventual success"
									positive={(result.netPnlPerAttempt || result.expectedPayout) > 0}
									large
									delay={1}
								/>
							</motion.div>
							<motion.div variants={scaleUp}>
								<MetricCard 
									label="Avg Attempts" 
									value={(result.expectedAttemptsToPass || 1.0).toFixed(1)}
									numericValue={result.expectedAttemptsToPass || 1.0}
									change="To pass evaluation"
									large
									delay={2}
								/>
							</motion.div>
							<motion.div variants={scaleUp}>
								<MetricCard 
									label="ROI if Persistent" 
									value={result.expectedROI ? `${result.expectedROI > 0 ? '+' : ''}${result.expectedROI.toFixed(0)}%` : "N/A"}
									numericValue={result.expectedROI || 0}
									change="Requires multiple attempts"
									positive={result.expectedROI ? result.expectedROI > 0 : false}
									large
									delay={3}
								/>
							</motion.div>
						</div>
					</motion.section>

					{/* Low Pass Rate Warning */}
					{result.passProbability < 50 && (
						<motion.section variants={fadeUp} custom={1} className="results-section">
							<div className="callout callout-warning">
								<strong>⚠️ Low Pass Rate Strategy:</strong> With a {result.passProbability.toFixed(1)}% pass rate, 
								you should expect to fail {Math.round((result.expectedAttemptsToPass || 1) - 1)} time(s) before succeeding. 
								Total expected investment: ~${(result.expectedCostToPayout || 0).toFixed(0)} over 
								~{Math.round((result.expectedAttemptsToPass || 1) * (result.avgDaysToPass || 0) / 21)} months. 
								The positive ROI is achievable but requires persistence and sufficient capital.
							</div>
						</motion.section>
					)}

					{/* Secondary Metrics */}
					<motion.section variants={fadeUp} custom={1} className="results-section">
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
							{[
								{ label: "Fail Rate", value: `${(result.failProbability || 100 - result.passProbability).toFixed(1)}%` },
								{ label: "Avg Days", value: `${Math.round(result.avgDaysToPass || 0)}` },
								{ label: "Total Days", value: `${Math.round(result.totalDaysToPayout || 0)}` },
								{ label: "Eval Cost", value: `$${(result.initialPurchase || 149).toFixed(0)}` },
								{ label: "Monthly Rebill", value: `$${(result.monthlyRebill || 149).toFixed(0)}` },
								{ label: "Funded Setup", value: `$${(result.fundedSetup || 149).toFixed(0)}` },
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
						</div>
					</motion.section>

					{/* Equity Paths Visualization - Full Width */}
					<motion.section variants={fadeUp} custom={2} className="results-section">
						<div className="chart-container p-6 sm:p-8">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
								<div>
									<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
										Equity Paths Visualization
									</h3>
									<p className="text-sm text-[var(--text-muted)]">
										{accountConfig.propFirm} {accountConfig.challenge} - Simulation paths showing pass/fail outcomes
									</p>
								</div>
								<div className="flex items-center gap-4 text-xs">
									<span className="flex items-center gap-2">
										<span className="w-4 h-1 rounded bg-[var(--positive)]" />
										<span className="text-[var(--text-muted)]">Pass ({result.passProbability.toFixed(1)}%)</span>
									</span>
									<span className="flex items-center gap-2">
										<span className="w-4 h-1 rounded bg-[var(--negative)]" />
										<span className="text-[var(--text-muted)]">Fail ({(100 - result.passProbability).toFixed(1)}%)</span>
									</span>
								</div>
							</div>
							<div className="h-[320px] sm:h-[400px]">
								<EquityChart 
									equityCurves={result.equityCurves} 
									finalValues={result.finalValues}
									winningPathIndices={result.winningPathIndices}
									losingPathIndices={result.losingPathIndices}
								/>
							</div>
						</div>
					</motion.section>

					{/* Trade Distributions - Full Width */}
					<motion.section variants={fadeUp} custom={3} className="results-section">
						<div className="chart-container p-6 sm:p-8">
							<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
								Trade Distributions
							</h3>
							<TradeDistributionCharts result={result} />
						</div>
					</motion.section>

						{/* Cost Analysis */}
					<motion.section variants={fadeUp} custom={5} className="results-section">
						<h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Cost Analysis</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<motion.div 
								whileHover={{ scale: 1.01, y: -2 }}
								className="dash-card p-5"
							>
								<div className="text-base font-semibold mb-4 text-[var(--positive)]">
									If You Pass:
								</div>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">Avg Total Costs:</span>
										<span className="font-semibold text-[var(--text-primary)]">${(result.avgTotalCostsIfPass || 0).toFixed(0)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">Avg Gross Payout:</span>
										<span className={`font-semibold ${(result.avgGrossPayoutIfPass || 0) >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>${(result.avgGrossPayoutIfPass || 0).toFixed(0)}</span>
									</div>
									<div className="flex justify-between pt-3 border-t border-[var(--border)]">
										<span className="text-[var(--text-muted)]">Avg Net Profit:</span>
										<span className={`font-semibold ${(result.avgNetProfitIfPass || 0) >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>${(result.avgNetProfitIfPass || 0).toFixed(0)}</span>
									</div>
								</div>
							</motion.div>
							<motion.div 
								whileHover={{ scale: 1.01, y: -2 }}
								className="dash-card p-5"
							>
								<div className="text-base font-semibold mb-4 text-[var(--negative)]">
									If You Fail:
								</div>
								<div className="space-y-3 text-sm">
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">Avg Days Before Fail:</span>
										<span className="font-semibold text-[var(--text-primary)]">{Math.round(result.avgDaysBeforeFail || 0)}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">Avg Cost Lost:</span>
										<span className="font-semibold text-[var(--negative)]">${(result.avgCostLostIfFail || 0).toFixed(0)}</span>
									</div>
									<div className="flex justify-between pt-3 border-t border-[var(--border)]">
										<span className="text-[var(--text-muted)]">Fail in Eval:</span>
										<span className="font-semibold text-[var(--text-primary)]">{Math.round(result.failInEvalPercent || 0)}%</span>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--text-muted)]">Fail in Funded:</span>
										<span className="font-semibold text-[var(--text-primary)]">{Math.round(result.failInFundedPercent || 0)}%</span>
									</div>
								</div>
							</motion.div>
						</div>
					</motion.section>

					{/* Most Probable Outcomes */}
					{result.mostProbableOutcomes && result.mostProbableOutcomes.length > 0 && (
						<motion.section variants={fadeUp} custom={7} className="results-section">
							<MostProbableOutcomesTable outcomes={result.mostProbableOutcomes} />
						</motion.section>
					)}
				</motion.div>
			)}
		</div>
	);
}
