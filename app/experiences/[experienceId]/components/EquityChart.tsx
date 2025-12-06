"use client";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
);

interface EquityChartProps {
	equityCurves: number[][];
	finalValues?: number[];
	maxSamples?: number;
}

export default function EquityChart({
	equityCurves,
	finalValues,
	maxSamples = 10,
}: EquityChartProps) {
	const chartData = useMemo(() => {
		if (!equityCurves || equityCurves.length === 0) {
			return null;
		}

		// Separate winning and losing paths
		const winningCurves: number[][] = [];
		const losingCurves: number[][] = [];
		
		// Sample curves for visualization
		const sampleSize = Math.min(equityCurves.length, maxSamples);
		const step = Math.max(1, Math.floor(equityCurves.length / sampleSize));
		
		// Determine which paths are winners/losers
		// Use finalValues if available (positive = winner), otherwise use equity curve final value
		const initialBalance = 50000; // Default Topstep balance
		
		for (let i = 0; i < equityCurves.length; i += step) {
			const curve = equityCurves[i];
			if (curve.length > 0) {
				let isWinner = false;
				if (finalValues && finalValues[i] !== undefined) {
					// Use finalValues to determine winner (positive PnL = winner)
					isWinner = finalValues[i] > 0;
				} else {
					// Fallback: use equity curve final value
					const finalValue = curve[curve.length - 1];
					isWinner = finalValue >= initialBalance;
				}
				
				if (isWinner) {
					winningCurves.push(curve);
				} else {
					losingCurves.push(curve);
				}
			}
		}

		// Find the maximum length to determine x-axis labels
		const allCurves = [...winningCurves, ...losingCurves];
		const maxLength = Math.max(...allCurves.map((curve) => curve.length));
		const labels = Array.from({ length: maxLength }, (_, i) => i + 1);

		const datasets = [
			// Winning paths in green
			...winningCurves.map((curve) => ({
				label: "Pass",
				data: curve,
				borderColor: "rgba(34, 197, 94, 0.6)", // green-500 with transparency
				backgroundColor: "rgba(34, 197, 94, 0.1)",
				borderWidth: 1,
				fill: false,
				tension: 0.1,
				pointRadius: 0,
				pointHoverRadius: 3,
			})),
			// Losing paths in red
			...losingCurves.map((curve) => ({
				label: "Fail",
				data: curve,
				borderColor: "rgba(239, 68, 68, 0.6)", // red-500 with transparency
				backgroundColor: "rgba(239, 68, 68, 0.1)",
				borderWidth: 1,
				fill: false,
				tension: 0.1,
				pointRadius: 0,
				pointHoverRadius: 3,
			})),
		];

		return {
			labels,
			datasets,
		};
	}, [equityCurves, finalValues, maxSamples]);

	if (!chartData) {
		return (
			<div className="flex items-center justify-center h-80 text-purple-300 text-sm">
				No equity curve data available
			</div>
		);
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: true,
				position: "top" as const,
				labels: {
					color: "rgb(196, 181, 253)",
					font: {
						size: 11,
					},
					usePointStyle: true,
					padding: 10,
				},
			},
			tooltip: {
				mode: "index" as const,
				intersect: false,
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				titleColor: "rgb(229, 231, 235)",
				bodyColor: "rgb(229, 231, 235)",
				borderColor: "rgb(139, 92, 246)",
				borderWidth: 1,
				padding: 12,
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
				title: {
					display: true,
					text: "Trading Days",
					color: "rgb(196, 181, 253)",
					font: {
						size: 11,
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
					callback: function (value: any) {
						return "$" + value.toLocaleString();
					},
				},
				title: {
					display: true,
					text: "Account Balance ($)",
					color: "rgb(196, 181, 253)",
					font: {
						size: 11,
					},
				},
			},
		},
	};

	return (
		<div className="h-80 w-full">
			{chartData ? (
				<Line data={chartData} options={options} />
			) : (
				<div className="flex items-center justify-center h-full text-purple-300 text-sm">
					No equity curve data available
				</div>
			)}
		</div>
	);
}

