"use client";

import { useState } from "react";
import { Button, Text, Callout, Select } from "@whop/react/components";
import type {
	BootstrappedParams,
	ParsedTrade,
	CsvFormat,
} from "../types";
import type { PlanConfig } from "../config/planConfig";

interface StrategyPanelProps {
	onRunSimulation: (
		params: BootstrappedParams,
		trades: ParsedTrade[],
	) => void;
	planConfig: PlanConfig;
	parsedTrades?: ParsedTrade[] | null;
	csvFormat?: CsvFormat;
	isRunning?: boolean;
}

export default function StrategyPanel({
	onRunSimulation,
	planConfig,
	parsedTrades,
	csvFormat = "NinjaTrader",
	isRunning = false,
}: StrategyPanelProps) {
	const [showAdvanced, setShowAdvanced] = useState(false);
	// Default to 10000 runs, but cap at plan limit
	const [numPaths, setNumPaths] = useState(Math.min(10000, planConfig.maxPaths));
	// Confidence level for CI (90%, 95%, 99%)
	const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);

	const handleRunSimulation = () => {
		if (parsedTrades && parsedTrades.length > 0) {
			onRunSimulation(
				{
					template: csvFormat,
					numPaths,
					numDays: Math.min(100, planConfig.maxDays),
					confidenceLevel,
				},
				parsedTrades,
			);
		}
	};

	return (
		<div className="space-y-4">
			{/* Monte Carlo Runs */}
			<div>
				<Text size="2" weight="medium" className="mb-2 block">
					Monte Carlo Runs
				</Text>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						size="1"
						variant="soft"
						onClick={() => setNumPaths(Math.max(1, numPaths - 1000))}
					>
						-
					</Button>
					<input
						type="number"
						value={numPaths.toString()}
						onChange={(e) => {
							const val = parseInt(e.target.value) || 0;
							setNumPaths(Math.min(Math.max(1, val), planConfig.maxPaths));
						}}
						className="flex-1 px-3 py-2 bg-gray-a3 border border-gray-a5 rounded-md text-gray-12 text-2 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-transparent"
					/>
					<Button
						type="button"
						size="1"
						variant="soft"
						onClick={() => setNumPaths(Math.min(numPaths + 1000, planConfig.maxPaths))}
					>
						+
					</Button>
				</div>
			</div>

			{/* Advanced (Expandable) */}
			<div>
				<Button
					type="button"
					variant="ghost"
					size="2"
					onClick={() => setShowAdvanced(!showAdvanced)}
					className="flex items-center gap-2 p-0 h-auto"
				>
					<Text size="2" weight="medium">
						{showAdvanced ? "▼" : "▶"} Advanced
					</Text>
				</Button>
				{showAdvanced && (
					<div className="mt-2 p-3 bg-gray-a2 border border-gray-a5 rounded-md space-y-3">
						<div>
							<Text size="2" weight="medium" className="mb-2 block">
								Confidence Interval
							</Text>
							<Select.Root
								value={String(confidenceLevel)}
								onValueChange={(val) => setConfidenceLevel(parseFloat(val))}
							>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value="0.90">90% CI</Select.Item>
									<Select.Item value="0.95">95% CI (default)</Select.Item>
									<Select.Item value="0.99">99% CI</Select.Item>
								</Select.Content>
							</Select.Root>
							<Text size="1" color="gray" className="mt-1 block">
								Higher CI = wider range, more conservative estimate
							</Text>
						</div>
						<Text size="1" color="gray">
							Bootstrapped simulation uses your uploaded trade log to resample historical trades.
							This provides more realistic results based on your actual trading performance.
						</Text>
					</div>
				)}
			</div>

			{/* Run Simulation Button */}
			<Button
				type="button"
				size="3"
				variant="solid"
				color="blue"
				className="w-full"
				onClick={handleRunSimulation}
				disabled={!parsedTrades || parsedTrades.length === 0 || isRunning}
			>
				{isRunning ? "Running..." : "Run Simulation"}
			</Button>
			{(!parsedTrades || parsedTrades.length === 0) && (
				<Callout.Root color="amber">
					<Callout.Text size="2">
						Please upload a trade log CSV file first
					</Callout.Text>
				</Callout.Root>
			)}
		</div>
	);
}

