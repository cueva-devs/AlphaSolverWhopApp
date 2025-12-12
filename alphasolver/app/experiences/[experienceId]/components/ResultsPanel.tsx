"use client";

import { Card, Text, Heading, Callout, Table, Spinner } from "@whop/react/components";
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

				{/* Empty State */}
				{!result && !isRunning && !error && (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Text size="9" color="gray" className="mb-4">
							📊
						</Text>
						<Text size="3" color="gray">
							Run a simulation to see results
						</Text>
					</div>
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
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Fail Rate
									</Text>
									<Heading size="7" color="red">
										{(result.failProbability || 100 - result.passProbability).toFixed(1)}%
									</Heading>
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
							<div className="space-y-2">
								<div>
									<Text size="1" color="gray" className="mb-1">
										Avg Days to Pass
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.avgDaysToPass || 0)}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Avg Days in Funded
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.avgDaysInFunded || 0)}
									</Text>
								</div>
								<div>
									<Text size="1" color="gray" className="mb-1">
										Total Days to Payout
									</Text>
									<Text size="5" weight="bold">
										{Math.round(result.totalDaysToPayout || 0)}
										<Text size="1" color="gray" className="ml-2">
											≈ {Math.round((result.totalDaysToPayout || 0) / 30 * 10) / 10} months
										</Text>
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
							<Card size="2" variant="surface">
								<Heading size="4" as="h3" className="mb-3">
									Most Probable Outcomes
								</Heading>
								<Text size="1" color="gray" className="mb-2 block">
									Scenarios identified via density-based clustering of simulation paths.
								</Text>
								<div className="overflow-x-auto">
									<Table.Root>
										<Table.Header>
											<Table.Row>
												<Table.ColumnHeaderCell>Scenario</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell className="text-right">Probability</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell className="text-right">Days</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell className="text-right">Max DD</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell className="text-right">Net P&L</Table.ColumnHeaderCell>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{result.mostProbableOutcomes.map((outcome, idx) => (
												<Table.Row key={idx}>
													<Table.Cell>
														<Text size="2">{outcome.scenario}</Text>
													</Table.Cell>
													<Table.Cell className="text-right">
														<Text size="2">{outcome.probability.toFixed(1)}%</Text>
													</Table.Cell>
													<Table.Cell className="text-right">
														<Text size="2">{outcome.days}</Text>
													</Table.Cell>
													<Table.Cell className="text-right">
														<Text size="2">${outcome.maxDD.toFixed(0)}</Text>
													</Table.Cell>
													<Table.Cell className="text-right">
														<Text size="2">${outcome.netPnl.toFixed(0)}</Text>
													</Table.Cell>
												</Table.Row>
											))}
										</Table.Body>
									</Table.Root>
								</div>
								<Text size="1" color="gray" className="mt-2">
									Note: Some paths were outliers (unusual outcomes)
								</Text>
							</Card>
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
