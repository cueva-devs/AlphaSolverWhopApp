"use client";

import { useState } from "react";
import type { TradingPlan, TradingPlanStrategy } from "../types";

interface TradingPlanPanelProps {
	tradingPlan: TradingPlan | null | undefined;
	isRunning: boolean;
}

const STRATEGY_ORDER = [
	"risk_adjusted",
	"fastest",
	"safest",
	"highest_probability",
	"highest_payout",
] as const;

const STRATEGY_ICONS: Record<string, string> = {
	risk_adjusted: "⚖️",
	fastest: "⚡",
	safest: "🛡️",
	highest_probability: "📊",
	highest_payout: "💰",
};

function formatCurrency(value: number | undefined | null): string {
	if (value === undefined || value === null) return "$0";
	return `$${Math.round(value).toLocaleString()}`;
}

function formatPercent(value: number | undefined | null): string {
	if (value === undefined || value === null) return "0%";
	return `${value.toFixed(1)}%`;
}

function StrategyTab({
	strategy,
	strategyKey,
	propFirm,
}: {
	strategy: TradingPlanStrategy;
	strategyKey: string;
	propFirm: TradingPlan["propFirm"];
}) {
	const clusterInfo = strategy.cluster_info;
	const viable = strategy.viable_for_30d;

	return (
		<div className="space-y-4">
			{/* Strategy Description */}
			<div>
				<p className="text-purple-200 font-medium">{strategy.description}</p>
				<p className="text-purple-400 text-xs mt-1">
					Optimization: {strategy.optimization}
				</p>
			</div>

			{/* Cluster Info */}
			{clusterInfo && (
				<div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
						<span>
							<span className="text-blue-300">Cluster:</span>{" "}
							<span className="text-white">{clusterInfo.name}</span>
						</span>
						<span>
							<span className="text-blue-300">Probability:</span>{" "}
							<span className="text-white">
								{formatPercent(clusterInfo.probability)}
							</span>
						</span>
						<span>
							<span className="text-blue-300">Days:</span>{" "}
							<span className="text-white">{clusterInfo.days_median}</span>
						</span>
						<span>
							<span className="text-blue-300">Max DD:</span>{" "}
							<span className="text-white">
								{formatCurrency(clusterInfo.max_drawdown_median)}
							</span>
						</span>
						<span>
							<span className="text-blue-300">Expected P&L:</span>{" "}
							<span className="text-white">
								{formatCurrency(clusterInfo.final_pnl_median)}
							</span>
						</span>
					</div>
				</div>
			)}

			{/* Viability Badge */}
			{viable ? (
				<div className="bg-green-900/30 border border-green-700/50 rounded-lg p-2 text-green-300 text-sm">
					✓ Viable for 1-month pass (~21 trading days)
				</div>
			) : (
				<div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-2 text-yellow-300 text-sm">
					⚠ Extended timeline: {strategy.target_days} days (~
					{strategy.months_to_pass?.toFixed(1)} months)
				</div>
			)}

			{/* Metrics Grid */}
			<div className="grid grid-cols-3 gap-4">
				<div className="bg-slate-700/50 rounded-lg p-3">
					<p className="text-purple-400 text-xs mb-1">Daily P&L Target</p>
					<p className="text-white text-lg font-semibold">
						{formatCurrency(strategy.daily_pnl_target)}
					</p>
					<p className="text-purple-400 text-xs mt-1">
						Range: {strategy.target_days_range?.[0]}-
						{strategy.target_days_range?.[1]} days
					</p>
				</div>

				<div className="bg-slate-700/50 rounded-lg p-3">
					<p className="text-purple-400 text-xs mb-1">Daily Loss Stop</p>
					<p className="text-white text-lg font-semibold">
						{formatCurrency(strategy.daily_loss_stop)}
					</p>
					<p className="text-purple-400 text-xs mt-1">
						Win Rate: {formatPercent(strategy.daily_win_rate_needed)}
					</p>
				</div>

				<div className="bg-slate-700/50 rounded-lg p-3">
					<p className="text-purple-400 text-xs mb-1">Max Drawdown (Safe)</p>
					<p className="text-white text-lg font-semibold">
						{formatCurrency(strategy.max_drawdown_safe)}
					</p>
					<p className="text-purple-400 text-xs mt-1">
						Limit: {formatCurrency(propFirm?.max_loss)}
					</p>
				</div>
			</div>

			{/* Key Targets Summary */}
			<div className="bg-slate-700/30 rounded-lg p-4 border border-purple-800/30">
				<h4 className="text-purple-200 font-medium mb-2">
					Key Targets for {strategy.label}
				</h4>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div>
						<span className="text-purple-400">Daily profit:</span>{" "}
						<span className="text-white font-medium">
							{formatCurrency(strategy.daily_pnl_target)}
						</span>
					</div>
					<div>
						<span className="text-purple-400">Daily loss limit:</span>{" "}
						<span className="text-white font-medium">
							{formatCurrency(strategy.daily_loss_stop)}
						</span>
					</div>
					<div>
						<span className="text-purple-400">Max drawdown:</span>{" "}
						<span className="text-white font-medium">
							{formatCurrency(strategy.max_drawdown_safe)}
						</span>
					</div>
					<div>
						<span className="text-purple-400">Duration:</span>{" "}
						<span className="text-white font-medium">
							{strategy.target_days} days
						</span>
					</div>
					<div>
						<span className="text-purple-400">Win rate:</span>{" "}
						<span className="text-white font-medium">
							{formatPercent(strategy.daily_win_rate_needed)}
						</span>
					</div>
					<div>
						<span className="text-purple-400">Cluster probability:</span>{" "}
						<span className="text-white font-medium">
							{formatPercent(strategy.cluster_probability)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function TradingPlanPanel({
	tradingPlan,
	isRunning,
}: TradingPlanPanelProps) {
	const [activeStrategy, setActiveStrategy] = useState<string>("risk_adjusted");

	if (isRunning) {
		return (
			<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
				<div className="flex items-center justify-center py-12">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
					<span className="ml-3 text-purple-300">
						Generating trading plan...
					</span>
				</div>
			</div>
		);
	}

	if (!tradingPlan) {
		return (
			<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
				<h2 className="text-lg font-semibold text-purple-200 mb-4">
					Trading Plan
				</h2>
				<p className="text-purple-300 text-sm">
					Run a simulation to generate your trading plan analysis.
				</p>
			</div>
		);
	}

	const optimalStrategies = tradingPlan.optimalStrategies || {};
	const propFirm = tradingPlan.propFirm || { profit_target: 0, max_loss: 0, daily_limit: 0 };
	const allWinningClusters = tradingPlan.allWinningClusters || [];
	const winners = tradingPlan.winners;
	const losers = tradingPlan.losers;

	// Get available strategies in order
	const availableStrategies = STRATEGY_ORDER.filter(
		(key) => optimalStrategies && optimalStrategies[key]
	);

	// Check if all strategies point to the same cluster
	const uniqueClusters = new Set(
		availableStrategies.map(
			(key) => optimalStrategies[key]?.cluster_info?.name || ""
		)
	);
	const allSameCluster = uniqueClusters.size === 1;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
				<h2 className="text-lg font-semibold text-purple-200 mb-2">
					Trading Plan — Optimal Strategies
				</h2>
				<p className="text-purple-400 text-sm">
					Different optimization criteria produce different recommendations.
					Choose based on your risk tolerance.
				</p>

				{/* Pass Rate Summary */}
				<div className="flex gap-6 mt-4">
					<div>
						<span className="text-purple-400 text-sm">Pass Rate:</span>{" "}
						<span className="text-white font-semibold">
							{formatPercent(tradingPlan.passRate)}
						</span>
						<span className="text-purple-400 text-xs ml-2">
							CI: [{tradingPlan.passRateCi?.[0]?.toFixed(1)}%,{" "}
							{tradingPlan.passRateCi?.[1]?.toFixed(1)}%]
						</span>
					</div>
					<div>
						<span className="text-purple-400 text-sm">Simulations:</span>{" "}
						<span className="text-white font-semibold">
							{tradingPlan.numSimulations?.toLocaleString()}
						</span>
					</div>
				</div>

				{/* Warning if all same cluster */}
				{allSameCluster && availableStrategies.length > 1 && (
					<div className="mt-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 text-yellow-300 text-sm">
						<strong>Note:</strong> All optimization criteria selected the same
						cluster ({Array.from(uniqueClusters)[0]}). This happens when
						there&apos;s only one dominant winning pattern.
					</div>
				)}
			</div>

			{/* Strategy Tabs */}
			{availableStrategies.length === 0 && (
				<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
					<p className="text-yellow-300 text-sm">
						⚠ No winning strategies found. The simulation may not have produced any passing paths, or the trading plan data is still loading.
					</p>
				</div>
			)}
			{availableStrategies.length > 0 && (
				<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg overflow-hidden">
					{/* Tab Headers */}
					<div className="flex border-b border-purple-800/50 overflow-x-auto">
						{availableStrategies.map((key) => {
							const strategy = optimalStrategies[key];
							const isActive = activeStrategy === key;
							return (
								<button
									key={key}
									type="button"
									onClick={() => setActiveStrategy(key)}
									className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
										isActive
											? "bg-purple-900/50 text-purple-200 border-b-2 border-purple-400"
											: "text-purple-400 hover:text-purple-300 hover:bg-slate-700/30"
									}`}
								>
									<span className="mr-2">{STRATEGY_ICONS[key]}</span>
									{strategy?.label || key}
								</button>
							);
						})}
					</div>

					{/* Tab Content */}
					<div className="p-6">
						{activeStrategy && optimalStrategies[activeStrategy] ? (
							<StrategyTab
								strategy={optimalStrategies[activeStrategy]}
								strategyKey={activeStrategy}
								propFirm={propFirm}
							/>
						) : availableStrategies.length > 0 && optimalStrategies[availableStrategies[0]] ? (
							<StrategyTab
								strategy={optimalStrategies[availableStrategies[0]]}
								strategyKey={availableStrategies[0]}
								propFirm={propFirm}
							/>
						) : (
							<p className="text-purple-400">No strategy data available</p>
						)}
					</div>
				</div>
			)}

			{/* Winning Clusters Table */}
			{allWinningClusters && allWinningClusters.length > 0 && (
				<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
					<h3 className="text-md font-semibold text-purple-200 mb-2">
						Winning Scenario Clusters
					</h3>
					<p className="text-purple-400 text-xs mb-4">
						DBSCAN identified these distinct winning patterns in the simulation
					</p>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-purple-800/50">
									<th className="text-left py-2 px-3 text-purple-300 font-medium">
										Cluster
									</th>
									<th className="text-right py-2 px-3 text-purple-300 font-medium">
										Probability
									</th>
									<th className="text-right py-2 px-3 text-purple-300 font-medium">
										Days
									</th>
									<th className="text-right py-2 px-3 text-purple-300 font-medium">
										Max DD
									</th>
									<th className="text-right py-2 px-3 text-purple-300 font-medium">
										Expected P&L
									</th>
									<th className="text-left py-2 px-3 text-purple-300 font-medium">
										Description
									</th>
								</tr>
							</thead>
							<tbody>
								{allWinningClusters.map((cluster, idx) => (
									<tr
										key={idx}
										className="border-b border-purple-800/20 hover:bg-slate-700/30"
									>
										<td className="py-2 px-3 text-white">{cluster.name}</td>
										<td className="py-2 px-3 text-right text-white">
											{formatPercent(cluster.probability)}
										</td>
										<td className="py-2 px-3 text-right text-white">
											{Math.round(cluster.days_median)}
										</td>
										<td className="py-2 px-3 text-right text-white">
											{formatCurrency(cluster.max_drawdown_median)}
										</td>
										<td className="py-2 px-3 text-right text-white">
											{formatCurrency(cluster.final_pnl_median)}
										</td>
										<td className="py-2 px-3 text-purple-300 text-xs">
											{cluster.description}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Path Analysis */}
			<div className="grid grid-cols-2 gap-4">
				{/* Winners */}
				<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
					<h3 className="text-md font-semibold text-green-300 mb-3">
						Winning Paths
					</h3>
					{winners ? (
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-purple-400">Count:</span>
								<span className="text-white">
									{winners.count?.toLocaleString()} (
									{formatPercent(tradingPlan.passRate)})
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-purple-400">Median Days:</span>
								<span className="text-white">{winners.days_median}</span>
							</div>
							{winners.days_range && (
								<div className="flex justify-between">
									<span className="text-purple-400">Days Range:</span>
									<span className="text-white">
										{winners.days_range[0]} - {winners.days_range[1]}
									</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-purple-400">Median Max DD:</span>
								<span className="text-white">
									{formatCurrency(winners.max_dd_median)}
								</span>
							</div>
						</div>
					) : (
						<p className="text-purple-400 text-sm">No winning paths</p>
					)}
				</div>

				{/* Losers */}
				<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
					<h3 className="text-md font-semibold text-red-300 mb-3">
						Losing Paths
					</h3>
					{losers ? (
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-purple-400">Count:</span>
								<span className="text-white">
									{losers.count?.toLocaleString()} (
									{formatPercent(tradingPlan.failRate)})
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-purple-400">Median Days:</span>
								<span className="text-white">
									{Math.round(losers.days_median)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-purple-400">Median Max DD:</span>
								<span className="text-white">
									{formatCurrency(losers.max_dd_median)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-purple-400">Common Failure:</span>
								<span className="text-white capitalize">
									{losers.common_failure?.replace("_", " ")}
								</span>
							</div>
						</div>
					) : (
						<p className="text-green-400 text-sm">No losing paths!</p>
					)}
				</div>
			</div>
		</div>
	);
}
