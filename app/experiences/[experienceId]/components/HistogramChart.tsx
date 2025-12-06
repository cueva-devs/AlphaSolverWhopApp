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

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
);

interface HistogramChartProps {
	finalValues: number[];
	numBins?: number;
}

export default function HistogramChart({
	finalValues,
	numBins = 20,
}: HistogramChartProps) {
	const chartData = useMemo(() => {
		if (!finalValues || finalValues.length === 0) {
			return null;
		}

		// Calculate bin ranges
		const min = Math.min(...finalValues);
		const max = Math.max(...finalValues);
		const range = max - min;
		const binWidth = range / numBins;

		// Create bins
		const bins: number[] = new Array(numBins).fill(0);
		const binLabels: string[] = [];

		for (let i = 0; i < numBins; i++) {
			const binStart = min + i * binWidth;
			const binEnd = binStart + binWidth;
			binLabels.push(
				`$${Math.round(binStart).toLocaleString()} - $${Math.round(binEnd).toLocaleString()}`,
			);

			// Count values in this bin
			finalValues.forEach((value) => {
				if (value >= binStart && (i === numBins - 1 ? value <= binEnd : value < binEnd)) {
					bins[i]++;
				}
			});
		}

		return {
			labels: binLabels,
			datasets: [
				{
					label: "Frequency",
					data: bins,
					backgroundColor: "rgba(59, 130, 246, 0.6)", // blue-500 with transparency
					borderColor: "rgb(59, 130, 246)", // blue-500
					borderWidth: 1,
				},
			],
		};
	}, [finalValues, numBins]);

	if (!chartData) {
		return (
			<div className="flex items-center justify-center h-64 text-gray-10">
				No histogram data available
			</div>
		);
	}

	const options = {
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
				padding: 12,
				callbacks: {
					label: function (context: any) {
						const count = context.parsed.y;
						const total = finalValues.length;
						const percentage = ((count / total) * 100).toFixed(1);
						return `${count} paths (${percentage}%)`;
					},
				},
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
						size: 10,
					},
					maxRotation: 45,
					minRotation: 45,
				},
				title: {
					display: true,
					text: "Final Account Value / Payout ($)",
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
					stepSize: 1,
				},
				title: {
					display: true,
					text: "Frequency",
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
			<Bar data={chartData} options={options} />
		</div>
	);
}

