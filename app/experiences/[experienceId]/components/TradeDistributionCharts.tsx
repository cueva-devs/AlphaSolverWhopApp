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
					backgroundColor: "rgba(59, 130, 246, 0.5)",
					borderColor: "rgba(59, 130, 246, 1)",
					borderWidth: 1,
					borderRadius: 4,
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
		const minPnl = -2000;
		const maxPnl = 1500;
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
					backgroundColor: "rgba(59, 130, 246, 0.5)",
					borderColor: "rgba(59, 130, 246, 1)",
					borderWidth: 1,
					borderRadius: 4,
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
				backgroundColor: "#1a1f2e",
				titleColor: "#f4f4f5",
				bodyColor: "#a1a1aa",
				borderColor: "#1e2432",
				borderWidth: 1,
				padding: 10,
				cornerRadius: 6,
				titleFont: {
					size: 11,
					weight: 500 as const,
				},
				bodyFont: {
					size: 10,
				},
			},
		},
		scales: {
			x: {
				grid: {
					color: "rgba(30, 36, 50, 0.5)",
					drawBorder: false,
				},
				ticks: {
					color: "#52525b",
					font: {
						size: 10,
					},
				},
			},
			y: {
				grid: {
					color: "rgba(30, 36, 50, 0.5)",
					drawBorder: false,
				},
				ticks: {
					color: "#52525b",
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
					<h4 className="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
						Trades Per Day Distribution
					</h4>
					<div className="h-48 relative">
						<Bar data={tradesPerDayData} options={chartOptions} />
						{tradesPerDayData.mean > 0 && (
							<div
								className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] opacity-60"
								style={{
									left: `${(tradesPerDayData.mean / tradesPerDayData.labels.length) * 100}%`,
								}}
							>
								<div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-[var(--text-muted)] whitespace-nowrap font-mono">
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
					<h4 className="text-xs font-semibold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
						Trade P&L Distribution
					</h4>
					<div className="h-48 relative">
						<Bar data={tradePnlData} options={chartOptions} />
						{tradePnlData.mean !== 0 && (
							<div
								className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] opacity-60"
								style={{
									left: `${((tradePnlData.mean - parseFloat(tradePnlData.labels[0])) / (parseFloat(tradePnlData.labels[tradePnlData.labels.length - 1]) - parseFloat(tradePnlData.labels[0]))) * 100}%`,
								}}
							>
								<div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-[var(--text-muted)] whitespace-nowrap font-mono">
									Mean: ${tradePnlData.mean.toFixed(2)}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{!tradesPerDayData && !tradePnlData && (
				<div className="text-sm text-[var(--text-muted)] text-center py-8">
					Trade distribution data not available
				</div>
			)}
		</div>
	);
}
