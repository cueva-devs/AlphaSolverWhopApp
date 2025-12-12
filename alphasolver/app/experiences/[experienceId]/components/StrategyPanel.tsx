"use client";

import { useState, useEffect } from "react";
import { TextInput, Button, Text, Tabs, Callout } from "@whop/react/components";
import ParametricForm from "./ParametricForm";
import BootstrappedForm from "./BootstrappedForm";
import PyodideDebugPanel from "./PyodideDebugPanel";
import type {
	ParametricParams,
	BootstrappedParams,
	ParsedTrade,
	SimulationMode,
} from "../types";
import type { PlanConfig } from "../config/planConfig";

interface StrategyPanelProps {
	onRunSimulation: (
		mode: SimulationMode,
		params: ParametricParams | BootstrappedParams,
		trades?: ParsedTrade[],
	) => void;
	planConfig: PlanConfig;
	parsedTrades?: ParsedTrade[] | null;
	csvFormat?: "NinjaTrader" | "Generic" | "Custom";
}

type TabMode = "parametric" | "bootstrapped";

export default function StrategyPanel({
	onRunSimulation,
	planConfig,
	parsedTrades,
	csvFormat = "NinjaTrader",
}: StrategyPanelProps) {
	const [activeTab, setActiveTab] = useState<TabMode>(
		parsedTrades ? "bootstrapped" : "parametric",
	);

	// Switch to bootstrapped mode when trades are loaded
	useEffect(() => {
		if (parsedTrades && parsedTrades.length > 0) {
			setActiveTab("bootstrapped");
		}
	}, [parsedTrades]);

	const handleParametricSubmit = (params: ParametricParams) => {
		onRunSimulation("parametric", params);
	};

	const handleBootstrappedSubmit = (
		params: BootstrappedParams,
		trades: ParsedTrade[],
	) => {
		onRunSimulation("bootstrapped", params, trades);
	};

	const [showAdvanced, setShowAdvanced] = useState(false);
	// Default to 10000 runs, but cap at plan limit
	const [numPaths, setNumPaths] = useState(Math.min(10000, planConfig.maxPaths));

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
					<TextInput
						type="number"
						size="2"
						value={numPaths.toString()}
						onChange={(e) => {
							const val = parseInt(e.target.value) || 0;
							setNumPaths(Math.min(Math.max(1, val), planConfig.maxPaths));
						}}
						className="flex-1"
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
					<div className="mt-2 space-y-3">
						<Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as TabMode)}>
							<Tabs.List>
								<Tabs.Trigger value="parametric">Parametric</Tabs.Trigger>
								<Tabs.Trigger value="bootstrapped">Bootstrapped</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content value="parametric">
								<ParametricForm
									onSubmit={handleParametricSubmit}
									planConfig={planConfig}
								/>
							</Tabs.Content>
							<Tabs.Content value="bootstrapped">
								<BootstrappedForm
									onSubmit={handleBootstrappedSubmit}
									planConfig={planConfig}
								/>
							</Tabs.Content>
						</Tabs.Root>
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
				onClick={() => {
					if (activeTab === "parametric") {
						handleParametricSubmit({
							stopSize: 100,
							takeProfitSize: 200,
							winRate: 50,
							averageMFE: 150,
							tradesPerDay: 5,
							numPaths,
							numDays: Math.min(100, planConfig.maxDays),
						});
					} else if (activeTab === "bootstrapped" && parsedTrades) {
						handleBootstrappedSubmit(
							{
								template: csvFormat,
								numPaths,
								numDays: Math.min(100, planConfig.maxDays),
							},
							parsedTrades,
						);
					}
				}}
				disabled={activeTab === "bootstrapped" && !parsedTrades}
			>
				Run Simulation
			</Button>
			{activeTab === "bootstrapped" && !parsedTrades && (
				<Callout.Root color="amber">
					<Callout.Text size="2">
						Please upload a CSV file first
					</Callout.Text>
				</Callout.Root>
			)}
		</div>
	);
}

