"use client";

import { useState } from "react";
import { Card, Text, Heading, Callout, Table, Spinner, Button, Select } from "@whop/react/components";
import type { SimulationResult, AccountConfig, OutcomeScenario } from "../types";
import EquityChart from "./EquityChart";
import TradeDistributionCharts from "./TradeDistributionCharts";

function MostProbableOutcomesTable({ outcomes }: { outcomes: OutcomeScenario[] }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [minProbability, setMinProbability] = useState(0.1);

	// Filter outcomes by minimum probability
	const filteredOutcomes = outcomes.filter(o => o.probability >= minProbability);

	const totalPages = Math.ceil(filteredOutcomes.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const endIndex = Math.min(startIndex + pageSize, filteredOutcomes.length);
	const paginatedOutcomes = filteredOutcomes.slice(startIndex, endIndex);

	const showPagination = filteredOutcomes.length > 10;
	const dominant = outcomes[0]; // Always use first from original (highest probability)
	const isPass = dominant.netPnl > 0;

	return (
		<Card size="2" variant="surface">
			<Heading size="4" as="h3" className="mb-3">
				Most Probable Outcomes
			</Heading>
			<Text size="1" color="gray" className="mb-3 block">
				Scenarios identified via density-based clustering of simulation paths.
			</Text>

			{/* Dominant Scenario Callout */}
			<div 
				className={`mb-4 p-3 rounded-r-md border-l-4 ${
					isPass 
						? 'bg-green-500/10 border-green-500' 
						: 'bg-red-500/10 border-red-500'
				}`}
			>
				<Text size="1" color="gray" className="uppercase tracking-wide block mb-1">
					Most Likely Outcome ({dominant.probability.toFixed(1)}%)
				</Text>
				<Text size="3" weight="bold" className={isPass ? 'text-green-500' : 'text-red-500'}>
					{dominant.scenario}
				</Text>
			</div>

			{/* Filters and pagination controls */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
				{/* Minimum probability filter */}
				<div className="flex items-center gap-2">
					<Text size="2" color="gray">Min Probability:</Text>
					<Select.Root 
						value={String(minProbability)} 
						onValueChange={(val) => {
							setMinProbability(Number(val));
							setCurrentPage(1);
						}}
					>
						<Select.Trigger className="w-24" />
						<Select.Content>
							<Select.Item value="0">All</Select.Item>
							<Select.Item value="0.1">≥ 0.1%</Select.Item>
							<Select.Item value="0.25">≥ 0.25%</Select.Item>
							<Select.Item value="0.5">≥ 0.5%</Select.Item>
							<Select.Item value="1">≥ 1%</Select.Item>
							<Select.Item value="2">≥ 2%</Select.Item>
							<Select.Item value="5">≥ 5%</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<Text size="2" color="gray">
					{filteredOutcomes.length} of {outcomes.length} scenarios
				</Text>

				{/* Page size selector */}
				{showPagination && (
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
							</Select.Content>
						</Select.Root>
					</div>
				)}
			</div>

			{/* Scenario Table */}
			<div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-a4 rounded-lg">
				<table className="w-full text-sm">
					<thead className="sticky top-0 bg-gray-a3">
						<tr className="border-b border-gray-a6">
							<th className="text-left py-2 px-3 font-semibold">Scenario</th>
							<th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Probability</th>
							<th className="text-right py-2 px-3 font-semibold">Days</th>
							<th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Max DD</th>
							<th className="text-right py-2 px-3 font-semibold whitespace-nowrap">Net P&L</th>
						</tr>
					</thead>
					<tbody>
						{paginatedOutcomes.map((outcome, idx) => (
							<tr key={startIndex + idx} className="border-b border-gray-a4 hover:bg-gray-a2">
								<td className="py-2 px-3">{outcome.scenario}</td>
								<td className="py-2 px-3 text-right">{outcome.probability.toFixed(1)}%</td>
								<td className="py-2 px-3 text-right">{outcome.days}</td>
								<td className="py-2 px-3 text-right">${outcome.maxDD.toFixed(0)}</td>
								<td className={`py-2 px-3 text-right font-medium ${
									outcome.netPnl >= 0 ? 'text-green-500' : 'text-red-500'
								}`}>
									${outcome.netPnl.toFixed(0)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination controls */}
			{showPagination && totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 mt-3">
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
		</Card>
	);
}

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
		<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
			{/* Left Column - Results */}
			<div className="flex-1 space-y-4 lg:space-y-6 overflow-y-auto pr-0 lg:pr-4">
				{/* Error Banner */}
				{error && (
					<Callout.Root color="red">
						<Callout.Text>
							<Text size="2" weight="bold" className="block mb-1">
								Simulation Error
							</Text>
							{error}
						</Callout.Text>
					</Callout.Root>
				)}

				{/* Loading State */}
				{isRunning && (
					<div className="flex flex-col items-center justify-center py-12">
						<Spinner size="4" className="mb-4" />
						<Text size="3" color="gray">
							Running simulation...
						</Text>
					</div>
				)}

				{/* Empty State - Landing Page Content */}
				{!result && !isRunning && !error && (
					<Card size="3" variant="surface" className="p-6">
						<div className="space-y-6">
							<div>
								<Heading size="6" as="h2" className="mb-3">
									🎯 What is AlphaSolver?
								</Heading>
								<Text size="3" color="gray">
									AlphaSolver is a <strong>Monte Carlo simulation tool</strong> designed to help prop firm traders understand their true probability of passing evaluations and getting funded.
								</Text>
							</div>

							<div>
								<Heading size="5" as="h3" className="mb-3">
									How It Works
								</Heading>
								<ol className="list-decimal list-inside space-y-2">
									<li>
										<Text size="2"><strong>Upload your trade log</strong> — Import your historical trades from NinjaTrader, TradingView, Tradovate, or any CSV format</Text>
									</li>
									<li>
										<Text size="2"><strong>Select your prop firm</strong> — Choose from Topstep, Take Profit Trader, Funded Futures Network, Tradeify, or create custom rules</Text>
									</li>
									<li>
										<Text size="2"><strong>Run the simulation</strong> — We simulate thousands of possible outcomes using your actual trading statistics</Text>
									</li>
									<li>
										<Text size="2"><strong>Get actionable insights</strong> — See your pass rate, expected costs, ROI, and optimal trading strategies</Text>
									</li>
								</ol>
							</div>

							<div>
								<Heading size="5" as="h3" className="mb-3">
									Why Use AlphaSolver?
								</Heading>
								<ul className="space-y-2">
									<li>
										<Text size="2">📊 <strong>Data-driven decisions</strong> — Know your actual odds before paying for an evaluation</Text>
									</li>
									<li>
										<Text size="2">💰 <strong>Cost analysis</strong> — Understand the true cost of getting funded including resets and monthly fees</Text>
									</li>
									<li>
										<Text size="2">🎲 <strong>Risk assessment</strong> — See best and worst case scenarios based on your trading style</Text>
									</li>
									<li>
										<Text size="2">📈 <strong>Strategy optimization</strong> — Get personalized recommendations for daily profit targets and risk limits</Text>
									</li>
								</ul>
							</div>

							<div className="pt-4 border-t border-gray-a5">
								<Heading size="5" as="h3" className="mb-2">
									Get Started
								</Heading>
								<Text size="2" color="gray">
									👈 <strong>Upload your trade log</strong> in the sidebar and click <strong>Run Simulation</strong> to see your personalized results.
								</Text>
							</div>
						</div>
					</Card>
				)}

				{/* Results Content */}
				{result && !isRunning && (
					<>
						{/* Outcome Probability */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Outcome Probability
							</Heading>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Text size="1" color="gray" className="mb-1">
										Pass Rate
									</Text>
									<Heading size="7" color="green">
										{result.passProbability.toFixed(1)}%
									</Heading>
									{result.passRateCiLower !== undefined && result.passRateCiUpper !== undefined && (
										<Text size="1" color="gray">
											95% CI: [{result.passRateCiLower.toFixed(1)}%, {result.passRateCiUpper.toFixed(1)}%]
										</Text>
									)}
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Fail Rate
									</Text>
									<Heading size="7" color="red">
										{(result.failProbability || 100 - result.passProbability).toFixed(1)}%
									</Heading>
									{result.timeoutRate !== undefined && result.timeoutRate > 0 && (
										<Text size="1" color="gray">
											Timeout: {result.timeoutRate.toFixed(1)}%
										</Text>
									)}
								</div>
							</div>
						</Card>

						{/* Expected Value */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Expected Value
							</Heading>
							<div className="space-y-2">
								<div>
									<Text size="1" color="gray" className="mb-1">
										Net P&L Per Attempt
									</Text>
									<Text size="5" weight="bold">
										${(result.netPnlPerAttempt || result.expectedPayout).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Expected Attempts to Pass
									</Text>
									<Text size="5" weight="bold">
										{(result.expectedAttemptsToPass || 1.0).toFixed(1)}
									</Text>
								</div>
							</div>
						</Card>

						{/* Timeline */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Timeline (Winners)
							</Heading>
							<div className="grid grid-cols-3 gap-3">
								<div>
									<Text size="1" color="gray" className="mb-1 block">
										Avg Days in Eval
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.avgDaysToPass || 0)}
									</Text>
									{(() => {
										const evalMonths = (result.avgDaysToPass || 0) / 30;
										const rebills = evalMonths >= 1 ? Math.max(0, Math.floor(evalMonths) - 1) : 0;
										return (
											<Text size="1" color={rebills > 0 ? "red" : "gray"}>
												{rebills > 0 ? `~${rebills} rebill(s)` : "No rebill"}
											</Text>
										);
									})()}
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1 block">
										Avg Days in Funded
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.avgDaysInFunded || 0)}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1 block">
										Total Days to Payout
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.totalDaysToPayout || 0)}
									</Text>
									<Text size="1" color="gray">
										~{((result.totalDaysToPayout || 0) / 21).toFixed(1)} months
									</Text>
								</div>
							</div>
						</Card>

						{/* Cost Analysis */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Cost Analysis
							</Heading>
							<div className="space-y-3">
								<div className="grid grid-cols-3 gap-2">
									<div>
										<Text size="1" color="gray">Initial Purchase</Text>
										<Text size="2" weight="bold">
											${(result.initialPurchase || 149).toFixed(0)}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray">Monthly Rebill</Text>
										<Text size="2" weight="bold">
											${(result.monthlyRebill || 149).toFixed(0)}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray">Funded Setup</Text>
										<Text size="2" weight="bold">
											${(result.fundedSetup || 149).toFixed(0)}
										</Text>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-a5">
									<Text size="1" weight="bold" className="mb-2 block">
										If You Pass:
									</Text>
									<div className="space-y-1">
										<div className="flex justify-between">
											<Text size="1" color="gray">Avg Total Costs:</Text>
											<Text size="1" weight="bold">
												${(result.avgTotalCostsIfPass || 0).toFixed(0)}
											</Text>
										</div>
										<div className="flex justify-between">
											<Text size="1" color="gray">Avg Gross Payout:</Text>
											<Text size="1" weight="bold">
												${(result.avgGrossPayoutIfPass || 0).toFixed(0)}
											</Text>
										</div>
										<div className="flex justify-between">
											<Text size="1" color="gray">Avg Net Profit:</Text>
											<Text size="1" weight="bold" color="green">
												${(result.avgNetProfitIfPass || 0).toFixed(0)}
											</Text>
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-a5">
									<Text size="1" weight="bold" className="mb-2 block">
										If You Fail:
									</Text>
									<div className="space-y-1">
										<div className="flex justify-between">
											<Text size="1" color="gray">Avg Days Before Fail:</Text>
											<Text size="1" weight="bold">
												{Math.round(result.avgDaysBeforeFail || 0)}
											</Text>
										</div>
										<div className="flex justify-between">
											<Text size="1" color="gray">Avg Cost Lost:</Text>
											<Text size="1" weight="bold" color="red">
												${(result.avgCostLostIfFail || 0).toFixed(0)}
											</Text>
										</div>
										<Text size="1" color="gray" className="mt-1">
											Fail in Eval: {Math.round(result.failInEvalPercent || 0)}% | Fail in Funded: {Math.round(result.failInFundedPercent || 0)}%
										</Text>
									</div>
								</div>
							</div>
						</Card>

						{/* Investment Summary */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Investment Summary
							</Heading>
							<div className="space-y-2">
								<div>
									<Text size="1" color="gray" className="mb-1">
										Expected Cost to Payout
									</Text>
									<Text size="5" weight="bold">
										${(result.expectedCostToPayout || 0).toFixed(0)}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Expected Gross Payout
									</Text>
									<Text size="5" weight="bold">
										${(result.expectedGrossPayout || result.expectedPayout).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Expected ROI
									</Text>
									<Text size="5" weight="bold" color="green">
										{result.expectedROI ? `+${result.expectedROI.toFixed(1)}%` : "N/A"}
									</Text>
								</div>
							</div>
						</Card>

						{/* Most Probable Outcomes */}
						{result.mostProbableOutcomes && result.mostProbableOutcomes.length > 0 && (
							<MostProbableOutcomesTable outcomes={result.mostProbableOutcomes} />
						)}
					</>
				)}
			</div>

			{/* Right Column - Visualizations */}
			<div className="w-full lg:w-96 flex-shrink-0 space-y-4 lg:space-y-6 overflow-y-auto">
				{result && !isRunning && (
					<>
						{/* Simulation Paths Chart */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								{accountConfig.propFirm} {accountConfig.challenge} - Simulation Paths
							</Heading>
							<EquityChart 
								equityCurves={result.equityCurves} 
								finalValues={result.finalValues}
								winningPathIndices={result.winningPathIndices}
								losingPathIndices={result.losingPathIndices}
							/>
						</Card>

						{/* Trade Distributions */}
						<Card size="2" variant="surface">
							<Heading size="4" as="h3" className="mb-3">
								Trade Distributions
							</Heading>
							<TradeDistributionCharts result={result} />
						</Card>
					</>
				)}
			</div>
		</div>
	);
}
