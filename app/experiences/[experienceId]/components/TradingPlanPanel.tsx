"use client";

import { useState } from "react";
import { Card, Heading, Text, Tabs, Callout, Badge, Button, Select } from "@whop/react/components";
import type { TradingPlan, OptimalStrategy, ClusterInfo, BestPath } from "../types";

interface TradingPlanPanelProps {
	tradingPlan: TradingPlan | null | undefined;
	isRunning: boolean;
	hasTradeLog: boolean;
	hasRunSimulation: boolean;
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

function StrategyTab({ strategy }: { strategy: OptimalStrategy }) {
	const clusterInfo = strategy.cluster_info;
	const viable = strategy.viable_for_30d;
	const maxDD = strategy.max_drawdown_safe;
	const propLimit = strategy.prop_firm_max_loss || 0;

	return (
		<div className="space-y-4">
			{/* Strategy description */}
			<div>
				<Text size="3" weight="bold" className="block">{strategy.description}</Text>
				<Text size="2" color="gray">Optimization: {strategy.optimization}</Text>
			</div>

			{/* Cluster info */}
			<Callout.Root color="blue">
				<Callout.Text>
					<strong>From Cluster:</strong> {clusterInfo?.name || 'N/A'} | 
					<strong> Probability:</strong> {formatPercent(clusterInfo?.probability || 0)} | 
					<strong> Median Days:</strong> {Math.round(clusterInfo?.days_median || 0)} | 
					<strong> Max DD:</strong> {formatCurrency(clusterInfo?.max_drawdown_median || 0)} |
					<strong> Expected P&L:</strong> {formatCurrency(clusterInfo?.final_pnl_median || 0)}
				</Callout.Text>
			</Callout.Root>

			{/* Viability */}
			{viable ? (
				<Callout.Root color="green">
					<Callout.Text>✓ Viable for 1-month pass (~21 trading days)</Callout.Text>
				</Callout.Root>
			) : (
				<Callout.Root color="yellow">
					<Callout.Text>⚠ Extended timeline: {strategy.target_days} days (~{strategy.months_to_pass.toFixed(1)} months)</Callout.Text>
				</Callout.Root>
			)}

			{/* Metrics grid */}
			<div className="grid grid-cols-3 gap-3">
				<MetricCard 
					label="Daily P&L Target" 
					value={formatCurrency(strategy.daily_pnl_target)}
				/>
				<MetricCard 
					label="Daily Loss Stop" 
					value={formatCurrency(strategy.daily_loss_stop)}
				/>
				<MetricCard 
					label="Max Drawdown (Safe)" 
					value={formatCurrency(maxDD)}
					delta={`Limit: ${formatCurrency(propLimit)}`}
				/>
				<MetricCard 
					label="Target Days" 
					value={`${strategy.target_days}`}
					delta={`Range: ${strategy.target_days_range[0]}-${strategy.target_days_range[1]}`}
				/>
				<MetricCard 
					label="Win Rate Needed" 
					value={formatPercent(strategy.daily_win_rate_needed)}
				/>
				<MetricCard 
					label="Expected Payout" 
					value={formatCurrency(strategy.expected_pnl || 0)}
				/>
			</div>

			{/* Key targets summary */}
			<div className="bg-gray-a3 rounded-lg p-4 mt-4">
				<Text size="2" weight="bold" className="block mb-2">Key Targets for {strategy.label}:</Text>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<Text size="2">Daily profit: <strong>{formatCurrency(strategy.daily_pnl_target)}</strong></Text>
					<Text size="2">Daily loss limit: <strong>{formatCurrency(strategy.daily_loss_stop)}</strong></Text>
					<Text size="2">Max drawdown: <strong>{formatCurrency(maxDD)}</strong></Text>
					<Text size="2">Duration: <strong>{strategy.target_days} days</strong></Text>
					<Text size="2">Win rate: <strong>{formatPercent(strategy.daily_win_rate_needed)}</strong></Text>
					<Text size="2">Cluster probability: <strong>{formatPercent(strategy.cluster_probability || 0)}</strong></Text>
				</div>
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
							<th className="text-left py-2 px-3 whitespace-nowrap">Expected P&L</th>
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
	hasRunSimulation 
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
		simulatedEv
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
								<StrategyTab strategy={optimalStrategies[key]} />
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
						DBSCAN identified these distinct winning patterns in the simulation
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
