"use client";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";
import type { SimulationResult } from "../types";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
);

interface TradeDistributionChartsProps {
	result: SimulationResult;
}

export default function TradeDistributionCharts({
	result,
}: TradeDistributionChartsProps) {
	// Trades Per Day Distribution
	const tradesPerDayData = useMemo(() => {
		if (!result.tradesPerDayDistribution || result.tradesPerDayDistribution.length === 0) {
			return null;
		}

		const maxTrades = result.tradesPerDayDistribution.length;
		const labels = Array.from({ length: maxTrades }, (_, i) => i.toString());
		const mean = result.avgTradesPerDay || 0;

		return {
			labels,
			datasets: [
				{
					label: "Frequency",
					data: result.tradesPerDayDistribution,
					backgroundColor: "rgba(139, 92, 246, 0.5)",
					borderColor: "rgba(139, 92, 246, 1)",
					borderWidth: 1,
				},
			],
			mean,
		};
	}, [result.tradesPerDayDistribution, result.avgTradesPerDay]);

	// Trade P&L Distribution
	const tradePnlData = useMemo(() => {
		if (!result.tradePnlDistribution || result.tradePnlDistribution.length === 0) {
			return null;
		}

		// Create labels based on distribution
		const binCount = result.tradePnlDistribution.length;
		const minPnl = -2000; // Estimate
		const maxPnl = 1500; // Estimate
		const binWidth = (maxPnl - minPnl) / binCount;
		const labels = Array.from({ length: binCount }, (_, i) =>
			Math.round(minPnl + i * binWidth).toString(),
		);
		const mean = result.avgTradePnl || 0;

		return {
			labels,
			datasets: [
				{
					label: "Frequency",
					data: result.tradePnlDistribution,
					backgroundColor: "rgba(139, 92, 246, 0.5)",
					borderColor: "rgba(139, 92, 246, 1)",
					borderWidth: 1,
				},
			],
			mean,
		};
	}, [result.tradePnlDistribution, result.avgTradePnl]);

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				titleColor: "rgb(229, 231, 235)",
				bodyColor: "rgb(229, 231, 235)",
				borderColor: "rgb(75, 85, 99)",
				borderWidth: 1,
			},
		},
		scales: {
			x: {
				grid: {
					color: "rgba(139, 92, 246, 0.1)",
					drawBorder: false,
				},
				ticks: {
					color: "rgb(196, 181, 253)",
					font: {
						size: 10,
					},
				},
			},
			y: {
				grid: {
					color: "rgba(139, 92, 246, 0.1)",
					drawBorder: false,
				},
				ticks: {
					color: "rgb(196, 181, 253)",
					font: {
						size: 10,
					},
				},
			},
		},
	};

	return (
		<div className="space-y-6">
			{/* Trades Per Day Distribution */}
			{tradesPerDayData && (
				<div>
					<h4 className="text-xs font-semibold text-gray-11 mb-2">
						Trades Per Day Distribution
					</h4>
					<div className="h-48 relative">
						<Bar data={tradesPerDayData} options={chartOptions} />
						{tradesPerDayData.mean > 0 && (
							<div
								className="absolute top-0 bottom-0 w-0.5 bg-blue-6 opacity-50"
								style={{
									left: `${(tradesPerDayData.mean / tradesPerDayData.labels.length) * 100}%`,
								}}
							>
								<div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-11 whitespace-nowrap">
									Mean: {tradesPerDayData.mean.toFixed(1)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Trade P&L Distribution */}
			{tradePnlData && (
				<div>
					<h4 className="text-xs font-semibold text-gray-11 mb-2">
						Trade P&L Distribution
					</h4>
					<div className="h-48 relative">
						<Bar data={tradePnlData} options={chartOptions} />
						{tradePnlData.mean !== 0 && (
							<div
								className="absolute top-0 bottom-0 w-0.5 bg-blue-6 opacity-50 border-dashed"
								style={{
									left: `${((tradePnlData.mean - parseFloat(tradePnlData.labels[0])) / (parseFloat(tradePnlData.labels[tradePnlData.labels.length - 1]) - parseFloat(tradePnlData.labels[0]))) * 100}%`,
								}}
							>
								<div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-11 whitespace-nowrap">
									Mean: ${tradePnlData.mean.toFixed(2)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{!tradesPerDayData && !tradePnlData && (
				<div className="text-xs text-gray-10 text-center py-8">
					Trade distribution data not available
				</div>
			)}
		</div>
	);
}

