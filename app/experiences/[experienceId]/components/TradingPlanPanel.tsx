"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TradingPlan, OptimalStrategy, ClusterInfo, BestPath, GameType, PhaseTargets } from "../types";

interface TradingPlanPanelProps {
	tradingPlan: TradingPlan | null | undefined;
	isRunning: boolean;
	hasTradeLog: boolean;
	hasRunSimulation: boolean;
	gameType: GameType;
}

function formatCurrency(value: number): string {
	return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`;
}

// Animation variants
const fadeUp = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.05, delayChildren: 0.1 }
	}
};

function MetricCard({ label, value, delta, positive, negative }: { 
	label: string; 
	value: string; 
	delta?: string;
	positive?: boolean;
	negative?: boolean;
}) {
	return (
		<div className={`metric-card p-4 ${positive ? 'metric-positive' : negative ? 'metric-negative' : ''}`}>
			<div className="relative z-10">
				<span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">
					{label}
				</span>
				<span className={`text-xl font-semibold block ${
					positive ? 'text-[var(--positive)]' : 
					negative ? 'text-[var(--negative)]' : 
					'text-[var(--text-primary)]'
				}`}>
					{value}
				</span>
				{delta && (
					<span className="text-xs text-[var(--text-muted)] block mt-1">{delta}</span>
				)}
			</div>
		</div>
	);
}

function StrategyTab({ strategy, gameType }: { strategy: OptimalStrategy; gameType: GameType }) {
	const clusterInfo = strategy.cluster_info;
	const maxDD = strategy.max_drawdown_safe;
	const propLimit = strategy.prop_firm_max_loss || 0;
	const scenario = strategy.scenario_performance;
	const evalProj = strategy.eval_projection;
	const fundedProj = strategy.funded_projection;
	const totalProj = strategy.total_projection;
	const showFundedPhase = gameType === "combine" || gameType === "funded_only";

	return (
		<motion.div 
			className="space-y-6"
			initial="hidden"
			animate="visible"
			variants={staggerContainer}
		>
			{/* Strategy description */}
			<motion.div variants={fadeUp}>
				<h4 className="text-lg font-semibold text-[var(--text-primary)]">{strategy.description}</h4>
				<p className="text-sm text-[var(--text-muted)] mt-1">Optimization: {strategy.optimization}</p>
			</motion.div>

			{/* Scenario Performance Summary */}
			{scenario && (
				<motion.div variants={fadeUp} className="callout callout-info">
					<strong>Scenario Performance:</strong> {formatCurrency(scenario.daily_profit)}/day | 
					<strong> Win Rate:</strong> {formatPercent(scenario.win_rate)} | 
					<strong> Max DD:</strong> {formatCurrency(scenario.max_drawdown)} |
					<strong> Cluster:</strong> {clusterInfo?.name || 'N/A'} ({formatPercent(clusterInfo?.probability || 0)})
				</motion.div>
			)}

			{/* Viability */}
			{totalProj && totalProj.total_days <= 21 ? (
				<motion.div variants={fadeUp} className="callout callout-success">
					Projected to reach payout in ~{totalProj.total_days} days (within 1 month)
				</motion.div>
			) : totalProj ? (
				<motion.div variants={fadeUp} className="callout callout-warning">
					Extended timeline: ~{totalProj.total_days} days to payout
				</motion.div>
			) : null}

			{/* Scenario Projections for Combine+Funded */}
			{showFundedPhase && evalProj && fundedProj && (
				<div className="space-y-5">
					{/* Eval Phase Projection */}
					{gameType !== "funded_only" && (
						<motion.div 
							variants={fadeUp}
							className="p-5 rounded-lg bg-[var(--accent-dim)] border border-[rgba(59,130,246,0.25)]"
						>
							<div className="flex items-center gap-2 mb-4">
								<span className="badge badge-accent">Eval Phase</span>
								<span className="text-sm font-medium text-[var(--text-primary)]">If you achieve this scenario...</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<MetricCard 
									label="Days to Pass" 
									value={`${evalProj.days_to_pass} days`}
									delta={`At ${formatCurrency(scenario?.daily_profit || 0)}/day`}
								/>
								<MetricCard 
									label="Profit Target" 
									value={formatCurrency(evalProj.profit_target)}
									delta="To pass eval"
								/>
								<MetricCard 
									label="Max Drawdown" 
									value={formatCurrency(maxDD)}
									delta={`Limit: ${formatCurrency(propLimit)}`}
								/>
							</div>
						</motion.div>
					)}

					{/* Funded Phase Projection */}
					<motion.div 
						variants={fadeUp}
						className="p-5 rounded-lg bg-[var(--positive-dim)] border border-[rgba(34,197,94,0.25)]"
					>
						<div className="flex items-center gap-2 mb-4">
							<span className="badge badge-positive">{gameType === "funded_only" ? "Funded Phase" : "Then in Funded..."}</span>
							<span className="text-sm font-medium text-[var(--text-primary)]">Payout Eligibility</span>
						</div>
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
							<MetricCard 
								label="Days to Payout" 
								value={`${fundedProj.days_to_payout} days`}
								delta={`Need ${fundedProj.min_winning_days_required} winning days`}
							/>
							<MetricCard 
								label="Funded Profit" 
								value={formatCurrency(fundedProj.funded_profit)}
								delta={`Balance: ${formatCurrency(fundedProj.funded_balance)}`}
							/>
							<MetricCard 
								label="Profit Share" 
								value={`${fundedProj.profit_share_pct}%`}
								delta="Of funded profits"
							/>
							<MetricCard 
								label="Projected Payout" 
								value={formatCurrency(fundedProj.projected_payout)}
								delta="Your take-home"
								positive={fundedProj.projected_payout >= 0}
								negative={fundedProj.projected_payout < 0}
							/>
						</div>
					</motion.div>

					{/* Total Journey Summary */}
					{totalProj && (
						<motion.div 
							variants={fadeUp}
							className="p-5 rounded-lg bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)]"
						>
							<div className="flex items-center gap-2 mb-4">
								<span className="badge badge-purple">Total Journey</span>
								<span className="text-sm font-medium text-[var(--text-primary)]">Eval → Funded → Payout</span>
							</div>
							<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
								<MetricCard label="Eval Days" value={`${totalProj.eval_days}`} />
								<MetricCard label="Funded Days" value={`${totalProj.funded_days}`} />
								<MetricCard label="Total Days" value={`${totalProj.total_days}`} />
								<MetricCard 
								label="Final Payout" 
								value={formatCurrency(totalProj.final_payout)} 
								positive={totalProj.final_payout >= 0}
								negative={totalProj.final_payout < 0}
							/>
							</div>
						</motion.div>
					)}
				</div>
			)}

			{/* Combine Only: Simple metrics */}
			{gameType === "combine_only" && evalProj && (
				<motion.div 
					variants={fadeUp}
					className="p-5 rounded-lg bg-[var(--accent-dim)] border border-[rgba(59,130,246,0.25)]"
				>
					<div className="flex items-center gap-2 mb-4">
						<span className="badge badge-accent">Eval Projection</span>
						<span className="text-sm font-medium text-[var(--text-primary)]">If you achieve this scenario...</span>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<MetricCard 
							label="Days to Pass" 
							value={`${evalProj.days_to_pass} days`}
							delta={`At ${formatCurrency(scenario?.daily_profit || 0)}/day`}
						/>
						<MetricCard 
							label="Profit Target" 
							value={formatCurrency(evalProj.profit_target)}
							delta="To pass eval"
						/>
						<MetricCard 
							label="Max Drawdown" 
							value={formatCurrency(maxDD)}
							delta={`Limit: ${formatCurrency(propLimit)}`}
						/>
					</div>
					<p className="text-xs text-[var(--text-muted)] mt-4">
						Note: Combine Only mode - no payout calculation (just passing the evaluation)
					</p>
				</motion.div>
			)}

			{/* Key targets summary */}
			<motion.div variants={fadeUp} className="dash-card p-5">
				<h5 className="text-base font-semibold text-[var(--text-primary)] mb-4">
					Key Targets for {strategy.label}:
				</h5>
				<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
					{showFundedPhase && totalProj ? (
						<>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Daily profit needed:</span>
								<span className="font-medium">{formatCurrency(scenario?.daily_profit || 0)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Win rate needed:</span>
								<span className="font-medium">{formatPercent(scenario?.win_rate || 0)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Eval days:</span>
								<span className="font-medium">{totalProj.eval_days}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Funded days:</span>
								<span className="font-medium">{totalProj.funded_days}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Total days:</span>
								<span className="font-medium">{totalProj.total_days}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Max drawdown:</span>
								<span className="font-medium">{formatCurrency(maxDD)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Projected payout:</span>
								<span className={`font-medium ${totalProj.final_payout >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>{formatCurrency(totalProj.final_payout)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Cluster probability:</span>
								<span className="font-medium">{formatPercent(strategy.cluster_probability || 0)}</span>
							</div>
						</>
					) : (
						<>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Daily profit:</span>
								<span className="font-medium">{formatCurrency(scenario?.daily_profit || strategy.daily_pnl_target)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Win rate:</span>
								<span className="font-medium">{formatPercent(scenario?.win_rate || strategy.daily_win_rate_needed)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Days to pass:</span>
								<span className="font-medium">{evalProj?.days_to_pass || strategy.target_days}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Max drawdown:</span>
								<span className="font-medium">{formatCurrency(maxDD)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Daily loss limit:</span>
								<span className="font-medium">{formatCurrency(strategy.daily_loss_stop)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-[var(--text-muted)]">Cluster probability:</span>
								<span className="font-medium">{formatPercent(strategy.cluster_probability || 0)}</span>
							</div>
						</>
					)}
				</div>
			</motion.div>
		</motion.div>
	);
}

function PhaseTargetsDisplay({ phaseTargets, gameType }: { phaseTargets: PhaseTargets | undefined; gameType: GameType }) {
	if (!phaseTargets) return null;

	const { eval: evalPhase, funded, payout, summary } = phaseTargets;

	// Combine Only: Just show eval targets
	if (gameType === "combine_only") {
		return (
			<div className="p-5 rounded-lg bg-[var(--accent-dim)] border border-[rgba(59,130,246,0.25)] space-y-4">
				<div className="flex items-center gap-2">
					<span className="badge badge-accent">Combine Only</span>
					<span className="text-sm font-medium text-[var(--text-primary)]">Evaluation Phase Targets</span>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					<MetricCard label="Profit Target" value={formatCurrency(evalPhase.profit_target)} delta={`Reach ${formatCurrency(evalPhase.target_balance)}`} />
					<MetricCard label="Max Loss Limit" value={formatCurrency(evalPhase.max_loss)} />
					<MetricCard label="Daily Loss Limit" value={formatCurrency(evalPhase.daily_loss_limit)} />
					<MetricCard label="Starting Balance" value={formatCurrency(evalPhase.initial_balance)} />
				</div>
				<p className="text-xs text-[var(--text-muted)]">Goal: Pass the evaluation. No payout calculation in this mode.</p>
			</div>
		);
	}

	// Funded Only: Just show funded targets
	if (gameType === "funded_only") {
		return (
			<div className="p-5 rounded-lg bg-[var(--positive-dim)] border border-[rgba(34,197,94,0.25)] space-y-4">
				<div className="flex items-center gap-2">
					<span className="badge badge-positive">Funded Only</span>
					<span className="text-sm font-medium text-[var(--text-primary)]">Funded Phase Targets</span>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					<MetricCard label="Min Winning Days" value={`${funded.min_winning_days} days`} delta={`≥${formatCurrency(funded.winning_day_minimum)}/day`} />
					<MetricCard label="Min Balance for Payout" value={formatCurrency(funded.min_balance_for_payout)} />
					<MetricCard label="Profit Share" value={`${payout.profit_share_pct}%`} />
					<MetricCard label="Max Loss Limit" value={formatCurrency(funded.max_loss)} />
				</div>
				<p className="text-xs text-[var(--text-muted)]">{summary.payout_formula}</p>
			</div>
		);
	}

	// Combine + Funded: Show both phases
	return (
		<div className="space-y-5">
			{/* Phase 1: Evaluation */}
			<div className="p-5 rounded-lg bg-[var(--accent-dim)] border border-[rgba(59,130,246,0.25)] space-y-4">
				<div className="flex items-center gap-2">
					<span className="badge badge-accent">Phase 1</span>
					<span className="text-sm font-medium text-[var(--text-primary)]">Pass Evaluation</span>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<MetricCard label="Profit Target" value={formatCurrency(evalPhase.profit_target)} delta={`Reach ${formatCurrency(evalPhase.target_balance)}`} />
					<MetricCard label="Max Loss" value={formatCurrency(evalPhase.max_loss)} />
					<MetricCard label="Daily Loss Limit" value={formatCurrency(evalPhase.daily_loss_limit)} />
				</div>
			</div>

			{/* Phase 2: Funded Payout */}
			<div className="p-5 rounded-lg bg-[var(--positive-dim)] border border-[rgba(34,197,94,0.25)] space-y-4">
				<div className="flex items-center gap-2">
					<span className="badge badge-positive">Phase 2</span>
					<span className="text-sm font-medium text-[var(--text-primary)]">Reach Payout in Funded</span>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
					<MetricCard label="Min Winning Days" value={`${funded.min_winning_days} days`} delta={`≥${formatCurrency(funded.winning_day_minimum)}/day`} />
					<MetricCard label="Min Balance" value={formatCurrency(funded.min_balance_for_payout)} delta={`+${formatCurrency(funded.profit_needed_for_payout)} profit`} />
					<MetricCard label="Profit Share" value={`${payout.profit_share_pct}%`} />
					<MetricCard label="Min Payout" value={formatCurrency(payout.min_payout_at_threshold)} delta="At minimum balance" />
				</div>
				<p className="text-xs text-[var(--text-muted)]">{summary.payout_formula}</p>
			</div>
		</div>
	);
}

function WinningClustersTable({ clusters }: { clusters: ClusterInfo[] }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [expandedRow, setExpandedRow] = useState<number | null>(null);

	const totalPages = Math.ceil(clusters.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, clusters.length);
	const paginatedClusters = clusters.slice(startIndex, endIndex);

	const showPagination = clusters.length > 10;

	return (
		<div className="space-y-4">
			{/* Page size selector - only show if many results */}
			{showPagination && (
				<div className="flex items-center justify-between">
					<span className="text-sm text-[var(--text-muted)]">
						Showing {startIndex + 1}-{endIndex} of {clusters.length} clusters
					</span>
					<div className="flex items-center gap-2">
						<span className="text-sm text-[var(--text-muted)]">Rows:</span>
						<select 
							className="select w-20"
							value={String(pageSize)} 
							onChange={(e) => {
								setPageSize(Number(e.target.value));
								setCurrentPage(1);
							}}
						>
							<option value="10">10</option>
							<option value="25">25</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</div>
				</div>
			)}

			{/* Table with hover expansion */}
			<div className="cluster-table-container">
				<div className="overflow-x-auto border border-[var(--border)] rounded-lg">
					<table className="data-table">
						<thead className="sticky top-0">
							<tr>
								<th>Cluster</th>
								<th className="text-right">Probability</th>
								<th className="text-right">Median Days</th>
								<th className="text-right">Max Drawdown</th>
								<th className="text-right">Acct Profit</th>
								<th className="cluster-description-header">
									Description
									<span className="text-[var(--text-dim)] font-normal ml-2">(hover to expand)</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{paginatedClusters.map((cluster, idx) => {
								const globalIdx = startIndex + idx;
								const isExpanded = expandedRow === globalIdx;
								
								return (
									<motion.tr 
										key={globalIdx}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: idx * 0.03 }}
										className={`cluster-row ${isExpanded ? 'expanded' : ''}`}
										onMouseEnter={() => setExpandedRow(globalIdx)}
										onMouseLeave={() => setExpandedRow(null)}
									>
										<td className="font-medium whitespace-nowrap">{cluster.name}</td>
										<td className="text-right whitespace-nowrap">{formatPercent(cluster.probability)}</td>
										<td className="text-right whitespace-nowrap">{Math.round(cluster.days_median)}</td>
										<td className="text-right whitespace-nowrap">{formatCurrency(cluster.max_drawdown_median)}</td>
										<td className="text-right whitespace-nowrap">{formatCurrency(cluster.final_pnl_median)}</td>
										<td className="cluster-description-cell">
											<div className="cluster-description-wrapper">
												<div className={`cluster-description-text ${isExpanded ? 'expanded' : ''}`}>
													{cluster.description}
												</div>
												{!isExpanded && cluster.description.length > 50 && (
													<span className="cluster-description-fade" />
												)}
											</div>
										</td>
									</motion.tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination controls */}
			{showPagination && totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<button 
						className="btn btn-soft btn-sm"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(1)}
					>
						First
					</button>
					<button 
						className="btn btn-soft btn-sm"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
					>
						Prev
					</button>
					<span className="px-4 text-sm text-[var(--text-muted)]">
						Page {currentPage} of {totalPages}
					</span>
					<button 
						className="btn btn-soft btn-sm"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
					>
						Next
					</button>
					<button 
						className="btn btn-soft btn-sm"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(totalPages)}
					>
						Last
					</button>
				</div>
			)}
		</div>
	);
}

export default function TradingPlanPanel({ 
	tradingPlan, 
	isRunning, 
	hasTradeLog,
	hasRunSimulation,
	gameType
}: TradingPlanPanelProps) {
	const [activeStrategy, setActiveStrategy] = useState<string | null>(null);

	// Show loading state
	if (isRunning) {
		return (
			<div className="trading-plan-container">
				<div className="chart-container p-8 sm:p-12">
					<div className="flex flex-col items-center justify-center py-12">
						<div className="spinner spinner-lg mb-4" />
						<span className="text-base text-[var(--text-muted)]">Running simulation...</span>
					</div>
				</div>
			</div>
		);
	}

	// No trade log uploaded
	if (!hasTradeLog) {
		return (
			<div className="trading-plan-container">
				<div className="chart-container p-8 sm:p-12 text-center">
					<div className="w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mx-auto mb-6">
						<svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
						Trading Plan
					</h2>
					<p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
						Go to the <strong className="text-[var(--accent)]">Run</strong> tab to upload a trade log and generate your personalized trading plan.
					</p>
				</div>
			</div>
		);
	}

	// Trade log uploaded but simulation not run
	if (!hasRunSimulation || !tradingPlan) {
		return (
			<div className="trading-plan-container">
				<div className="chart-container p-8 sm:p-12 text-center">
					<div className="w-16 h-16 rounded-full bg-[var(--accent-dim)] flex items-center justify-center mx-auto mb-6">
						<svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
						Ready to Generate Plan
					</h2>
					<p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-4">
						Click <strong className="text-[var(--accent)]">Run Simulation</strong> in the Run tab to generate Monte Carlo-based trading recommendations.
					</p>
					<p className="text-xs text-[var(--text-dim)]">
						The trading plan uses actual simulation results to provide accurate risk assessments.
					</p>
				</div>
			</div>
		);
	}

	const { 
		passRate, 
		passRateCi, 
		numSimulations, 
		winners, 
		losers, 
		optimalStrategies,
		allWinningClusters,
		bestPath,
		simulatedEv,
		phaseTargets
	} = tradingPlan;

	// Strategy order
	const strategyOrder = ["risk_adjusted", "fastest", "safest", "highest_probability", "highest_payout"];
	const availableStrategies = strategyOrder.filter(key => optimalStrategies && key in optimalStrategies);

	// Set default active strategy if not set
	if (!activeStrategy && availableStrategies.length > 0) {
		setActiveStrategy(availableStrategies[0]);
	}

	// Check if all strategies point to same cluster
	const uniqueClusters = new Set(
		availableStrategies.map(k => optimalStrategies[k]?.cluster_info?.name || '')
	);

	return (
		<motion.div 
			className="trading-plan-container"
			initial="hidden"
			animate="visible"
			variants={staggerContainer}
		>
			{/* Optimal Strategies */}
			{availableStrategies.length > 0 ? (
				<motion.section variants={fadeUp} className="trading-plan-section">
					<div className="chart-container p-6 sm:p-8">
						<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Trading Plan — Optimal Strategies</h2>
						<p className="text-sm text-[var(--text-muted)] mb-6">
							Different optimization criteria produce different recommendations. Choose based on your risk tolerance.
						</p>

						{uniqueClusters.size === 1 && availableStrategies.length > 1 && (
							<div className="callout callout-warning mb-6">
								<strong>Note:</strong> All optimization criteria selected the same cluster ({Array.from(uniqueClusters)[0]}). 
								This happens when there's only one dominant winning pattern.
							</div>
						)}

						{/* Strategy Tabs */}
						<div className="tabs-list mb-6">
							{availableStrategies.map(key => (
								<button
									key={key}
									className={`tab-trigger ${activeStrategy === key ? 'active' : ''}`}
									onClick={() => setActiveStrategy(key)}
								>
									{optimalStrategies[key]?.label || key}
								</button>
							))}
						</div>

						{/* Strategy Content */}
						<AnimatePresence mode="wait">
							{activeStrategy && optimalStrategies[activeStrategy] && (
								<motion.div
									key={activeStrategy}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<StrategyTab strategy={optimalStrategies[activeStrategy]} gameType={gameType} />
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.section>
			) : (
				<motion.section variants={fadeUp} className="trading-plan-section">
					<div className="chart-container p-6 sm:p-8">
						<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Trading Plan</h2>
						<div className="callout callout-error">
							<strong>No Winning Paths</strong> — This strategy did not pass in any simulation. 
							Consider adjusting your approach or selecting a different account tier.
						</div>
					</div>
				</motion.section>
			)}

			{/* Winning Scenario Clusters */}
			{allWinningClusters && allWinningClusters.length > 0 && (
				<motion.section variants={fadeUp} className="trading-plan-section">
					<div className="chart-container p-6 sm:p-8">
						<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Winning Scenario Clusters</h2>
						<p className="text-sm text-[var(--text-muted)] mb-6">
							Clustering algorithm identified these distinct winning patterns in the simulation
						</p>

						<WinningClustersTable clusters={allWinningClusters} />

						{allWinningClusters.length > 1 && (
							<div className="callout callout-info mt-6">
								<strong>{allWinningClusters.length} distinct winning patterns</strong> — Days range: {
									Math.min(...allWinningClusters.map(c => c.days_median))
								} to {
									Math.max(...allWinningClusters.map(c => c.days_median))
								}
							</div>
						)}
					</div>
				</motion.section>
			)}
		</motion.div>
	);
}
