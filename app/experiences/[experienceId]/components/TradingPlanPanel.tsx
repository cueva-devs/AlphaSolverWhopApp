"use client";

import { useState } from "react";
import { Card, Heading, Text, Tabs, Callout, Badge, Button, Select } from "@whop/react/components";
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

function MetricCard({ label, value, delta, help }: { label: string; value: string; delta?: string; help?: string }) {
	return (
		<div className="bg-gray-a2 rounded-lg p-3">
			<Text size="1" color="gray" className="block mb-1">{label}</Text>
			<Text size="4" weight="bold" className="block">{value}</Text>
			{delta && <Text size="1" color="gray" className="block mt-1">{delta}</Text>}
		</div>
	);
}

function StrategyTab({ strategy, gameType }: { strategy: OptimalStrategy; gameType: GameType }) {
	const clusterInfo = strategy.cluster_info;
	const viable = strategy.viable_for_30d;
	const maxDD = strategy.max_drawdown_safe;
	const propLimit = strategy.prop_firm_max_loss || 0;
	const scenario = strategy.scenario_performance;
	const evalProj = strategy.eval_projection;
	const fundedProj = strategy.funded_projection;
	const totalProj = strategy.total_projection;
	const showFundedPhase = gameType === "combine" || gameType === "funded_only";

	return (
		<div className="space-y-4">
			{/* Strategy description */}
			<div>
				<Text size="3" weight="bold" className="block">{strategy.description}</Text>
				<Text size="2" color="gray">Optimization: {strategy.optimization}</Text>
			</div>

			{/* Scenario Performance Summary */}
			{scenario && (
				<Callout.Root color="blue">
					<Callout.Text>
						<strong>Scenario Performance:</strong> {formatCurrency(scenario.daily_profit)}/day | 
						<strong> Win Rate:</strong> {formatPercent(scenario.win_rate)} | 
						<strong> Max DD:</strong> {formatCurrency(scenario.max_drawdown)} |
						<strong> Cluster:</strong> {clusterInfo?.name || 'N/A'} ({formatPercent(clusterInfo?.probability || 0)})
					</Callout.Text>
				</Callout.Root>
			)}

			{/* Viability */}
			{totalProj && totalProj.total_days <= 21 ? (
				<Callout.Root color="green">
					<Callout.Text>✓ Projected to reach payout in ~{totalProj.total_days} days (within 1 month)</Callout.Text>
				</Callout.Root>
			) : totalProj ? (
				<Callout.Root color="yellow">
					<Callout.Text>⚠ Extended timeline: ~{totalProj.total_days} days to payout</Callout.Text>
				</Callout.Root>
			) : null}

			{/* Scenario Projections for Combine+Funded */}
			{showFundedPhase && evalProj && fundedProj && (
				<div className="space-y-3">
					{/* Eval Phase Projection */}
					{gameType !== "funded_only" && (
						<div className="bg-blue-a2 border border-blue-a5 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-3">
								<Badge color="blue">Eval Phase</Badge>
								<Text size="2" weight="bold">If you achieve this scenario...</Text>
							</div>
							<div className="grid grid-cols-3 gap-3">
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
						</div>
					)}

					{/* Funded Phase Projection */}
					<div className="bg-green-a2 border border-green-a5 rounded-lg p-4">
						<div className="flex items-center gap-2 mb-3">
							<Badge color="green">{gameType === "funded_only" ? "Funded Phase" : "Then in Funded..."}</Badge>
							<Text size="2" weight="bold">Payout Eligibility</Text>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
							/>
						</div>
					</div>

					{/* Total Journey Summary */}
					{totalProj && (
						<div className="bg-purple-a2 border border-purple-a5 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-3">
								<Badge color="purple">Total Journey</Badge>
								<Text size="2" weight="bold">Eval → Funded → Payout</Text>
							</div>
							<div className="grid grid-cols-4 gap-3">
								<MetricCard 
									label="Eval Days" 
									value={`${totalProj.eval_days}`}
								/>
								<MetricCard 
									label="Funded Days" 
									value={`${totalProj.funded_days}`}
								/>
								<MetricCard 
									label="Total Days" 
									value={`${totalProj.total_days}`}
								/>
								<MetricCard 
									label="Final Payout" 
									value={formatCurrency(totalProj.final_payout)}
								/>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Combine Only: Simple metrics */}
			{gameType === "combine_only" && evalProj && (
				<div className="bg-blue-a2 border border-blue-a5 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-3">
						<Badge color="blue">Eval Projection</Badge>
						<Text size="2" weight="bold">If you achieve this scenario...</Text>
					</div>
					<div className="grid grid-cols-3 gap-3">
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
					<Text size="1" color="gray" className="mt-3 block">
						Note: Combine Only mode - no payout calculation (just passing the evaluation)
					</Text>
				</div>
			)}

			{/* Key targets summary */}
			<div className="bg-gray-a3 rounded-lg p-4 mt-4">
				<Text size="2" weight="bold" className="block mb-2">Key Targets for {strategy.label}:</Text>
				<div className="grid grid-cols-2 gap-2 text-sm">
					{showFundedPhase && totalProj ? (
						<>
							<Text size="2">Daily profit needed: <strong>{formatCurrency(scenario?.daily_profit || 0)}</strong></Text>
							<Text size="2">Win rate needed: <strong>{formatPercent(scenario?.win_rate || 0)}</strong></Text>
							<Text size="2">Eval days: <strong>{totalProj.eval_days}</strong></Text>
							<Text size="2">Funded days: <strong>{totalProj.funded_days}</strong></Text>
							<Text size="2">Total days: <strong>{totalProj.total_days}</strong></Text>
							<Text size="2">Max drawdown: <strong>{formatCurrency(maxDD)}</strong></Text>
							<Text size="2">Projected payout: <strong>{formatCurrency(totalProj.final_payout)}</strong></Text>
							<Text size="2">Cluster probability: <strong>{formatPercent(strategy.cluster_probability || 0)}</strong></Text>
						</>
					) : (
						<>
							<Text size="2">Daily profit: <strong>{formatCurrency(scenario?.daily_profit || strategy.daily_pnl_target)}</strong></Text>
							<Text size="2">Win rate: <strong>{formatPercent(scenario?.win_rate || strategy.daily_win_rate_needed)}</strong></Text>
							<Text size="2">Days to pass: <strong>{evalProj?.days_to_pass || strategy.target_days}</strong></Text>
							<Text size="2">Max drawdown: <strong>{formatCurrency(maxDD)}</strong></Text>
							<Text size="2">Daily loss limit: <strong>{formatCurrency(strategy.daily_loss_stop)}</strong></Text>
							<Text size="2">Cluster probability: <strong>{formatPercent(strategy.cluster_probability || 0)}</strong></Text>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function PhaseTargetsDisplay({ phaseTargets, gameType }: { phaseTargets: PhaseTargets | undefined; gameType: GameType }) {
	if (!phaseTargets) return null;

	const { eval: evalPhase, funded, payout, summary } = phaseTargets;

	// Combine Only: Just show eval targets
	if (gameType === "combine_only") {
		return (
			<div className="bg-blue-a2 border border-blue-a5 rounded-lg p-4 space-y-3">
				<div className="flex items-center gap-2">
					<Badge color="blue">Combine Only</Badge>
					<Text size="2" weight="bold">Evaluation Phase Targets</Text>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<MetricCard label="Profit Target" value={formatCurrency(evalPhase.profit_target)} delta={`Reach ${formatCurrency(evalPhase.target_balance)}`} />
					<MetricCard label="Max Loss Limit" value={formatCurrency(evalPhase.max_loss)} />
					<MetricCard label="Daily Loss Limit" value={formatCurrency(evalPhase.daily_loss_limit)} />
					<MetricCard label="Starting Balance" value={formatCurrency(evalPhase.initial_balance)} />
				</div>
				<Text size="1" color="gray">Goal: Pass the evaluation. No payout calculation in this mode.</Text>
			</div>
		);
	}

	// Funded Only: Just show funded targets
	if (gameType === "funded_only") {
		return (
			<div className="bg-green-a2 border border-green-a5 rounded-lg p-4 space-y-3">
				<div className="flex items-center gap-2">
					<Badge color="green">Funded Only</Badge>
					<Text size="2" weight="bold">Funded Phase Targets</Text>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<MetricCard label="Min Winning Days" value={`${funded.min_winning_days} days`} delta={`≥${formatCurrency(funded.winning_day_minimum)}/day`} />
					<MetricCard label="Min Balance for Payout" value={formatCurrency(funded.min_balance_for_payout)} />
					<MetricCard label="Profit Share" value={`${payout.profit_share_pct}%`} />
					<MetricCard label="Max Loss Limit" value={formatCurrency(funded.max_loss)} />
				</div>
				<Text size="1" color="gray">{summary.payout_formula}</Text>
			</div>
		);
	}

	// Combine + Funded: Show both phases
	return (
		<div className="space-y-3">
			{/* Phase 1: Evaluation */}
			<div className="bg-blue-a2 border border-blue-a5 rounded-lg p-4 space-y-2">
				<div className="flex items-center gap-2">
					<Badge color="blue">Phase 1</Badge>
					<Text size="2" weight="bold">Pass Evaluation</Text>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					<MetricCard label="Profit Target" value={formatCurrency(evalPhase.profit_target)} delta={`Reach ${formatCurrency(evalPhase.target_balance)}`} />
					<MetricCard label="Max Loss" value={formatCurrency(evalPhase.max_loss)} />
					<MetricCard label="Daily Loss Limit" value={formatCurrency(evalPhase.daily_loss_limit)} />
				</div>
			</div>

			{/* Phase 2: Funded Payout */}
			<div className="bg-green-a2 border border-green-a5 rounded-lg p-4 space-y-2">
				<div className="flex items-center gap-2">
					<Badge color="green">Phase 2</Badge>
					<Text size="2" weight="bold">Reach Payout in Funded</Text>
				</div>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<MetricCard label="Min Winning Days" value={`${funded.min_winning_days} days`} delta={`≥${formatCurrency(funded.winning_day_minimum)}/day`} />
					<MetricCard label="Min Balance" value={formatCurrency(funded.min_balance_for_payout)} delta={`+${formatCurrency(funded.profit_needed_for_payout)} profit`} />
					<MetricCard label="Profit Share" value={`${payout.profit_share_pct}%`} />
					<MetricCard label="Min Payout" value={formatCurrency(payout.min_payout_at_threshold)} delta="At minimum balance" />
				</div>
				<Text size="1" color="gray">{summary.payout_formula}</Text>
			</div>
		</div>
	);
}

function WinningClustersTable({ clusters }: { clusters: ClusterInfo[] }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const totalPages = Math.ceil(clusters.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, clusters.length);
	const paginatedClusters = clusters.slice(startIndex, endIndex);

	const showPagination = clusters.length > 10;

	return (
		<div className="space-y-3">
			{/* Page size selector - only show if many results */}
			{showPagination && (
				<div className="flex items-center justify-between">
					<Text size="2" color="gray">
						Showing {startIndex + 1}-{endIndex} of {clusters.length} clusters
					</Text>
					<div className="flex items-center gap-2">
						<Text size="2" color="gray">Rows:</Text>
						<Select.Root 
							value={String(pageSize)} 
							onValueChange={(val) => {
								setPageSize(Number(val));
								setCurrentPage(1);
							}}
						>
							<Select.Trigger className="w-20" />
							<Select.Content>
								<Select.Item value="10">10</Select.Item>
								<Select.Item value="25">25</Select.Item>
								<Select.Item value="50">50</Select.Item>
								<Select.Item value="100">100</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			)}

			{/* Table with max height and scroll */}
			<div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-a4 rounded-lg">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-gray-a3">
						<tr className="border-b border-gray-a6">
							<th className="text-left py-2 px-3 whitespace-nowrap">Cluster</th>
							<th className="text-left py-2 px-3 whitespace-nowrap">Probability</th>
							<th className="text-left py-2 px-3 whitespace-nowrap">Median Days</th>
							<th className="text-left py-2 px-3 whitespace-nowrap">Max Drawdown</th>
							<th className="text-left py-2 px-3 whitespace-nowrap">Acct Profit</th>
							<th className="text-left py-2 px-3">Description</th>
						</tr>
					</thead>
					<tbody>
						{paginatedClusters.map((cluster, idx) => (
							<tr key={startIndex + idx} className="border-b border-gray-a4 hover:bg-gray-a2">
								<td className="py-2 px-3 font-medium whitespace-nowrap">{cluster.name}</td>
								<td className="py-2 px-3 whitespace-nowrap">{formatPercent(cluster.probability)}</td>
								<td className="py-2 px-3 whitespace-nowrap">{Math.round(cluster.days_median)}</td>
								<td className="py-2 px-3 whitespace-nowrap">{formatCurrency(cluster.max_drawdown_median)}</td>
								<td className="py-2 px-3 whitespace-nowrap">{formatCurrency(cluster.final_pnl_median)}</td>
								<td className="py-2 px-3 text-gray-11 max-w-xs truncate" title={cluster.description}>{cluster.description}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination controls */}
			{showPagination && totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button 
						variant="soft" 
						size="1"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(1)}
					>
						««
					</Button>
					<Button 
						variant="soft" 
						size="1"
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
					>
						«
					</Button>
					<Text size="2" className="px-3">
						Page {currentPage} of {totalPages}
					</Text>
					<Button 
						variant="soft" 
						size="1"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
					>
						»
					</Button>
					<Button 
						variant="soft" 
						size="1"
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(totalPages)}
					>
						»»
					</Button>
				</div>
			)}
		</div>
	);
}

function BestCaseSection({ bestPath }: { bestPath: BestPath }) {
	return (
		<div className="space-y-4">
			<Callout.Root color="green">
				<Callout.Text>
					<strong>Fastest simulation passed in {bestPath.days} trading days</strong>
				</Callout.Text>
			</Callout.Root>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				<MetricCard label="Days to Pass" value={`${bestPath.days}`} />
				<MetricCard label="Final P&L" value={formatCurrency(bestPath.final_pnl)} />
				<MetricCard label="Avg Daily P&L" value={formatCurrency(bestPath.avg_daily_pnl)} />
				<MetricCard label="Daily Win Rate" value={formatPercent(bestPath.daily_win_rate)} />
			</div>
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
	// Show loading state
	if (isRunning) {
		return (
			<Card size="2" variant="surface">
				<div className="flex items-center justify-center py-12">
					<Text size="3" color="gray">Running simulation...</Text>
				</div>
			</Card>
		);
	}

	// No trade log uploaded
	if (!hasTradeLog) {
		return (
			<Card size="2" variant="surface">
				<Heading size="5" as="h2" className="mb-4">Trading Plan</Heading>
				<Callout.Root color="blue">
					<Callout.Text>
						Upload a trade log in the sidebar to generate your personalized trading plan.
					</Callout.Text>
				</Callout.Root>
			</Card>
		);
	}

	// Trade log uploaded but simulation not run
	if (!hasRunSimulation || !tradingPlan) {
		return (
			<Card size="2" variant="surface">
				<Heading size="5" as="h2" className="mb-4">Trading Plan</Heading>
				<Callout.Root color="blue">
					<Callout.Text>
						Click <strong>Run Simulation</strong> in the sidebar to generate Monte Carlo-based trading recommendations.
					</Callout.Text>
				</Callout.Root>
				<Text size="2" color="gray" className="mt-2">
					The trading plan uses actual simulation results to provide accurate risk assessments.
				</Text>
			</Card>
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

	// Check if all strategies point to same cluster
	const uniqueClusters = new Set(
		availableStrategies.map(k => optimalStrategies[k]?.cluster_info?.name || '')
	);

	return (
		<div className="space-y-6">
			{/* Simulation Results Summary */}
			<Card size="2" variant="surface">
				<Heading size="5" as="h2" className="mb-4">Simulation Results</Heading>
				<Text size="1" color="gray" className="mb-4 block">
					{numSimulations?.toLocaleString() || 0} simulations
				</Text>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					<MetricCard 
						label="Pass Rate" 
						value={formatPercent(passRate)}
						delta={`CI: [${formatPercent(passRateCi?.[0] || 0)}, ${formatPercent(passRateCi?.[1] || 0)}]`}
					/>
					<MetricCard 
						label="Winners" 
						value={winners?.count?.toLocaleString() || "0"}
					/>
					<MetricCard 
						label="Losers" 
						value={losers?.count?.toLocaleString() || "0"}
					/>
					<MetricCard 
						label="Simulated EV" 
						value={formatCurrency(simulatedEv || 0)}
					/>
				</div>
			</Card>

			{/* Optimal Strategies */}
			{availableStrategies.length > 0 ? (
				<Card size="2" variant="surface">
					<Heading size="5" as="h2" className="mb-2">Trading Plan — Optimal Strategies</Heading>
					<Text size="2" color="gray" className="mb-4 block">
						Different optimization criteria produce different recommendations. Choose based on your risk tolerance.
					</Text>

					{uniqueClusters.size === 1 && availableStrategies.length > 1 && (
						<Callout.Root color="yellow" className="mb-4">
							<Callout.Text>
								<strong>Note:</strong> All optimization criteria selected the same cluster ({Array.from(uniqueClusters)[0]}). 
								This happens when there's only one dominant winning pattern.
							</Callout.Text>
						</Callout.Root>
					)}

					<Tabs.Root defaultValue={availableStrategies[0]}>
						<Tabs.List>
							{availableStrategies.map(key => (
								<Tabs.Trigger key={key} value={key}>
									{optimalStrategies[key]?.label || key}
								</Tabs.Trigger>
							))}
						</Tabs.List>

						{availableStrategies.map(key => (
							<Tabs.Content key={key} value={key} className="mt-4">
								<StrategyTab strategy={optimalStrategies[key]} gameType={gameType} />
							</Tabs.Content>
						))}
					</Tabs.Root>
				</Card>
			) : (
				<Card size="2" variant="surface">
					<Heading size="5" as="h2" className="mb-4">Trading Plan</Heading>
					<Callout.Root color="red">
						<Callout.Text>
							<strong>No Winning Paths</strong> — This strategy did not pass in any simulation. 
							Consider adjusting your approach or selecting a different account tier.
						</Callout.Text>
					</Callout.Root>
				</Card>
			)}

			{/* Winning Scenario Clusters */}
			{allWinningClusters && allWinningClusters.length > 0 && (
				<Card size="2" variant="surface">
					<Heading size="5" as="h2" className="mb-2">Winning Scenario Clusters</Heading>
					<Text size="2" color="gray" className="mb-4 block">
						Clustering algorithm identified these distinct winning patterns in the simulation
					</Text>

					<WinningClustersTable clusters={allWinningClusters} />

					{allWinningClusters.length > 1 && (
						<Callout.Root color="blue" className="mt-4">
							<Callout.Text>
								<strong>{allWinningClusters.length} distinct winning patterns</strong> — Days range: {
									Math.min(...allWinningClusters.map(c => c.days_median))
								} to {
									Math.max(...allWinningClusters.map(c => c.days_median))
								}
							</Callout.Text>
						</Callout.Root>
					)}
				</Card>
			)}

			{/* Best Case Scenario */}
			{bestPath && (
				<Card size="2" variant="surface">
					<Heading size="5" as="h2" className="mb-4">Best Case Scenario</Heading>
					<BestCaseSection bestPath={bestPath} />
				</Card>
			)}
		</div>
	);
}
