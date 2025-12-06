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
	maxSamples?: number;
}

export default function EquityChart({
	equityCurves,
	maxSamples = 10,
}: EquityChartProps) {
	const chartData = useMemo(() => {
		if (!equityCurves || equityCurves.length === 0) {
			return null;
		}

		// Sample a subset of equity curves for visualization
		const sampleSize = Math.min(equityCurves.length, maxSamples);
		const step = Math.max(1, Math.floor(equityCurves.length / sampleSize));
		const sampledCurves = equityCurves.filter((_, index) => index % step === 0);

		// Find the maximum length to determine x-axis labels
		const maxLength = Math.max(...sampledCurves.map((curve) => curve.length));
		const labels = Array.from({ length: maxLength }, (_, i) => i + 1);

		// Generate colors for each line
		const colors = [
			"rgb(59, 130, 246)", // blue-500
			"rgb(16, 185, 129)", // emerald-500
			"rgb(245, 101, 101)", // red-400
			"rgb(251, 191, 36)", // amber-400
			"rgb(139, 92, 246)", // violet-500
			"rgb(236, 72, 153)", // pink-500
			"rgb(34, 197, 94)", // green-500
			"rgb(249, 115, 22)", // orange-500
			"rgb(168, 85, 247)", // purple-500
			"rgb(14, 165, 233)", // sky-500
		];

		const datasets = sampledCurves.map((curve, index) => ({
			label: `Path ${index + 1}`,
			data: curve,
			borderColor: colors[index % colors.length],
			backgroundColor: colors[index % colors.length] + "20", // Add transparency
			borderWidth: 1.5,
			fill: false,
			tension: 0.1,
			pointRadius: 0,
			pointHoverRadius: 4,
		}));

		return {
			labels,
			datasets,
		};
	}, [equityCurves, maxSamples]);

	if (!chartData) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-10">
				No equity curve data available
			</div>
		);
	}

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false, // Hide legend for cleaner look
			},
			tooltip: {
				mode: "index" as const,
				intersect: false,
				backgroundColor: "rgba(0, 0, 0, 0.8)",
				titleColor: "rgb(229, 231, 235)",
				bodyColor: "rgb(229, 231, 235)",
				borderColor: "rgb(75, 85, 99)",
				borderWidth: 1,
				padding: 12,
			},
		},
		scales: {
			x: {
				grid: {
					color: "rgba(75, 85, 99, 0.2)",
					drawBorder: false,
				},
				ticks: {
					color: "rgb(156, 163, 175)",
					font: {
						size: 11,
					},
				},
				title: {
					display: true,
					text: "Time Step",
					color: "rgb(209, 213, 219)",
					font: {
						size: 12,
					},
				},
			},
			y: {
				grid: {
					color: "rgba(75, 85, 99, 0.2)",
					drawBorder: false,
				},
				ticks: {
					color: "rgb(156, 163, 175)",
					font: {
						size: 11,
					},
					callback: function (value: any) {
						return "$" + value.toLocaleString();
					},
				},
				title: {
					display: true,
					text: "Account Value ($)",
					color: "rgb(209, 213, 219)",
					font: {
						size: 12,
					},
				},
			},
		},
	};

	return (
		<div className="h-64 w-full">
			<Line data={chartData} options={options} />
		</div>
	);
}

