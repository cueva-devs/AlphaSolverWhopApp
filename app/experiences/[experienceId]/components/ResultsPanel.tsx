"use client";

import type { SimulationResult, AccountConfig } from "../types";
import EquityChart from "./EquityChart";
import TradeDistributionCharts from "./TradeDistributionCharts";

interface ResultsPanelProps {
	result: SimulationResult | null;
	isRunning: boolean;
	error: string | null;
	accountConfig: AccountConfig;
}

export default function ResultsPanel({
	result,
	isRunning,
	error,
	accountConfig,
}: ResultsPanelProps) {
	return (
		<div className="flex gap-6 h-full">
			{/* Left Column - Results */}
			<div className="flex-1 space-y-6 overflow-y-auto pr-4">
				{/* Error Banner */}
				{error && (
					<div className="p-4 bg-red-900/50 border border-red-800 rounded-lg">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<svg
									className="w-5 h-5 text-red-400"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<h3 className="text-sm font-semibold text-red-400 mb-1">
									Simulation Error
								</h3>
								<p className="text-sm text-red-300">{error}</p>
							</div>
						</div>
					</div>
				)}

				{/* Loading State */}
				{isRunning && (
					<div className="flex flex-col items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
						<p className="text-sm text-purple-300">Running simulation...</p>
					</div>
				)}

				{/* Empty State */}
				{!result && !isRunning && !error && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<svg
							className="w-16 h-16 text-purple-600 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
						<p className="text-sm text-purple-300">
							Run a simulation to see results
						</p>
					</div>
				)}

				{/* Results Content */}
				{result && !isRunning && (
					<>
						{/* Outcome Probability */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Outcome Probability
							</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<div className="text-xs text-purple-300 mb-1">Pass Rate</div>
									<div className="text-2xl font-bold text-green-400">
										{result.passProbability.toFixed(1)}%
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">Fail Rate</div>
									<div className="text-2xl font-bold text-red-400">
										{(result.failProbability || 100 - result.passProbability).toFixed(1)}%
									</div>
								</div>
							</div>
						</div>

						{/* Expected Value */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Expected Value
							</h3>
							<div className="space-y-2">
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Net P&L Per Attempt
									</div>
									<div className="text-lg font-semibold text-white">
										${(result.netPnlPerAttempt || result.expectedPayout).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Expected Attempts to Pass
									</div>
									<div className="text-lg font-semibold text-white">
										{(result.expectedAttemptsToPass || 1.0).toFixed(1)}
									</div>
								</div>
							</div>
						</div>

						{/* Timeline */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Timeline (Winners)
							</h3>
							<div className="space-y-2">
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Avg Days to Pass
									</div>
									<div className="text-lg font-semibold text-white">
										{Math.round(result.avgDaysToPass || 0)}
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Avg Days in Funded
									</div>
									<div className="text-lg font-semibold text-white">
										{Math.round(result.avgDaysInFunded || 0)}
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Total Days to Payout
									</div>
									<div className="text-lg font-semibold text-white">
										{Math.round(result.totalDaysToPayout || 0)}
										<span className="text-xs text-purple-400 ml-2">
											≈ {Math.round((result.totalDaysToPayout || 0) / 30 * 10) / 10} months
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Cost Analysis */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Cost Analysis
							</h3>
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-2 text-xs">
									<div>
										<div className="text-purple-300">Initial Purchase</div>
										<div className="text-white font-semibold">
											${(result.initialPurchase || 149).toFixed(0)}
										</div>
									</div>
									<div>
										<div className="text-purple-300">Monthly Rebill</div>
										<div className="text-white font-semibold">
											${(result.monthlyRebill || 149).toFixed(0)}
										</div>
									</div>
									<div>
										<div className="text-purple-300">Funded Setup</div>
										<div className="text-white font-semibold">
											${(result.fundedSetup || 149).toFixed(0)}
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-purple-800/30">
									<div className="text-xs font-semibold text-purple-200 mb-2">
										If You Pass:
									</div>
									<div className="space-y-1 text-xs">
										<div className="flex justify-between">
											<span className="text-purple-300">Avg Total Costs:</span>
											<span className="text-white font-semibold">
												${(result.avgTotalCostsIfPass || 0).toFixed(0)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-purple-300">Avg Gross Payout:</span>
											<span className="text-white font-semibold">
												${(result.avgGrossPayoutIfPass || 0).toFixed(0)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-purple-300">Avg Net Profit:</span>
											<span className="text-green-400 font-semibold">
												${(result.avgNetProfitIfPass || 0).toFixed(0)}
											</span>
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-purple-800/30">
									<div className="text-xs font-semibold text-purple-200 mb-2">
										If You Fail:
									</div>
									<div className="space-y-1 text-xs">
										<div className="flex justify-between">
											<span className="text-purple-300">Avg Days Before Fail:</span>
											<span className="text-white font-semibold">
												{Math.round(result.avgDaysBeforeFail || 0)}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-purple-300">Avg Cost Lost:</span>
											<span className="text-red-400 font-semibold">
												${(result.avgCostLostIfFail || 0).toFixed(0)}
											</span>
										</div>
										<div className="text-xs text-purple-300 mt-1">
											Fail in Eval: {Math.round(result.failInEvalPercent || 0)}% | Fail in Funded: {Math.round(result.failInFundedPercent || 0)}%
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Investment Summary */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Investment Summary
							</h3>
							<div className="space-y-2">
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Expected Cost to Payout
									</div>
									<div className="text-lg font-semibold text-white">
										${(result.expectedCostToPayout || 0).toFixed(0)}
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">
										Expected Gross Payout
									</div>
									<div className="text-lg font-semibold text-white">
										${(result.expectedGrossPayout || result.expectedPayout).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</div>
								</div>
								<div>
									<div className="text-xs text-purple-300 mb-1">Expected ROI</div>
									<div className="text-lg font-semibold text-green-400">
										{result.expectedROI ? `+${result.expectedROI.toFixed(1)}%` : "N/A"}
									</div>
								</div>
							</div>
						</div>

						{/* Most Probable Outcomes */}
						{result.mostProbableOutcomes && result.mostProbableOutcomes.length > 0 && (
							<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
								<h3 className="text-sm font-semibold text-purple-200 mb-3">
									Most Probable Outcomes
								</h3>
								<div className="text-xs text-purple-300 mb-2">
									Scenarios identified via density-based clustering of simulation paths.
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b border-purple-800/30">
												<th className="text-left py-2 text-purple-300">Scenario</th>
												<th className="text-right py-2 text-purple-300">Probability</th>
												<th className="text-right py-2 text-purple-300">Days</th>
												<th className="text-right py-2 text-purple-300">Max DD</th>
												<th className="text-right py-2 text-purple-300">Net P&L</th>
											</tr>
										</thead>
										<tbody>
											{result.mostProbableOutcomes.map((outcome, idx) => (
												<tr key={idx} className="border-b border-purple-800/20">
													<td className="py-2 text-white">{outcome.scenario}</td>
													<td className="text-right py-2 text-white">
														{outcome.probability.toFixed(1)}%
													</td>
													<td className="text-right py-2 text-white">{outcome.days}</td>
													<td className="text-right py-2 text-white">
														${outcome.maxDD.toFixed(0)}
													</td>
													<td className="text-right py-2 text-white">
														${outcome.netPnl.toFixed(0)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								<div className="text-xs text-purple-400 mt-2">
									Note: Some paths were outliers (unusual outcomes)
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Right Column - Visualizations */}
			<div className="w-96 flex-shrink-0 space-y-6 overflow-y-auto">
				{result && !isRunning && (
					<>
						{/* Simulation Paths Chart */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								{accountConfig.propFirm} {accountConfig.challenge} - Simulation Paths
							</h3>
							<EquityChart 
								equityCurves={result.equityCurves} 
								finalValues={result.finalValues}
								winningPathIndices={result.winningPathIndices}
								losingPathIndices={result.losingPathIndices}
							/>
						</div>

						{/* Trade Distributions */}
						<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-purple-200 mb-3">
								Trade Distributions
							</h3>
							<TradeDistributionCharts result={result} />
						</div>
					</>
				)}
			</div>
		</div>
	);
}
