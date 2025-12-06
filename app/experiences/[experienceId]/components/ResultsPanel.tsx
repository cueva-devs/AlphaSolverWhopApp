"use client";

import type { SimulationResult } from "../types";
import EquityChart from "./EquityChart";
import HistogramChart from "./HistogramChart";

interface ResultsPanelProps {
	result: SimulationResult | null;
	isRunning: boolean;
	error: string | null;
}

export default function ResultsPanel({
	result,
	isRunning,
	error,
}: ResultsPanelProps) {
	return (
		<section className="h-full min-h-[400px] lg:min-h-0 bg-gray-a2 border border-gray-a4 rounded-lg p-4 sm:p-6 flex flex-col focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-a6 focus-within:ring-offset-2 focus-within:ring-offset-gray-1">
			<h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-12">
				Results
			</h2>

			<div className="flex-1 overflow-y-auto space-y-4">
				{/* Error Banner */}
				{error && (
					<div className="p-4 bg-red-a2 border border-red-a5 rounded-lg">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<svg
									className="w-5 h-5 text-red-11"
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
								<h3 className="text-sm font-semibold text-red-11 mb-1">
									Simulation Error
								</h3>
								<p className="text-sm text-red-10">{error}</p>
							</div>
						</div>
					</div>
				)}

				{/* Loading State */}
				{isRunning && (
					<div className="flex flex-col items-center justify-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-a6 mb-4"></div>
						<p className="text-sm text-gray-10">
							Running simulation...
						</p>
					</div>
				)}

				{/* Empty State */}
				{!result && !isRunning && !error && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<svg
							className="w-16 h-16 text-gray-9 mb-4"
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
						<p className="text-sm text-gray-10">
							Run a simulation to see results
						</p>
					</div>
				)}

				{/* Results Content */}
				{result && !isRunning && (
					<>
						{/* Key Metrics Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
								<div className="text-xs text-gray-9 mb-1">
									Expected Payout
								</div>
								<div className="text-xl font-semibold text-gray-12">
									${result.expectedPayout.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</div>
							</div>

							<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
								<div className="text-xs text-gray-9 mb-1">
									Pass Probability
								</div>
								<div className="text-xl font-semibold text-gray-12">
									{result.passProbability.toFixed(1)}%
								</div>
							</div>

							<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
								<div className="text-xs text-gray-9 mb-1">
									Max Drawdown
								</div>
								<div className="text-xl font-semibold text-gray-12">
									{(result.maxDrawdown * 100).toFixed(1)}%
								</div>
							</div>
						</div>

						{/* Additional Metrics */}
						{(result.averageFinalValue !== undefined ||
							result.medianFinalValue !== undefined ||
							result.winRate !== undefined) && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								{result.averageFinalValue !== undefined && (
									<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
										<div className="text-xs text-gray-9 mb-1">
											Average Final Value
										</div>
										<div className="text-lg font-medium text-gray-11">
											${result.averageFinalValue.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
									</div>
								)}

								{result.medianFinalValue !== undefined && (
									<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
										<div className="text-xs text-gray-9 mb-1">
											Median Final Value
										</div>
										<div className="text-lg font-medium text-gray-11">
											${result.medianFinalValue.toLocaleString(undefined, {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</div>
									</div>
								)}

								{result.winRate !== undefined && (
									<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
										<div className="text-xs text-gray-9 mb-1">Win Rate</div>
										<div className="text-lg font-medium text-gray-11">
											{result.winRate.toFixed(1)}%
										</div>
									</div>
								)}
							</div>
						)}

						{/* Equity Chart */}
						<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-gray-12 mb-3">
								Equity Curves
							</h3>
							<EquityChart equityCurves={result.equityCurves} />
						</div>

						{/* Histogram Chart */}
						<div className="bg-gray-a3 border border-gray-a5 rounded-lg p-4">
							<h3 className="text-sm font-semibold text-gray-12 mb-3">
								Final Value Distribution
							</h3>
							<HistogramChart finalValues={result.finalValues} />
						</div>
					</>
				)}
			</div>
		</section>
	);
}

