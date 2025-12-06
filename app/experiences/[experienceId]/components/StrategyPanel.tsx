"use client";

import { useState } from "react";
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
}

type TabMode = "parametric" | "bootstrapped";

export default function StrategyPanel({
	onRunSimulation,
	planConfig,
}: StrategyPanelProps) {
	const [activeTab, setActiveTab] = useState<TabMode>("parametric");

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
	const [numPaths, setNumPaths] = useState(Math.min(20000, planConfig.maxPaths));

	return (
		<div className="space-y-4">
			{/* Monte Carlo Runs */}
			<div>
				<label className="block text-xs text-purple-300 mb-1">
					Monte Carlo Runs
				</label>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setNumPaths(Math.max(1, numPaths - 1000))}
						className="px-2 py-1 bg-slate-700/50 border border-purple-800/30 rounded text-purple-200 hover:bg-slate-700 text-sm"
					>
						-
					</button>
					<input
						type="number"
						value={numPaths}
						onChange={(e) => {
							const val = parseInt(e.target.value) || 0;
							setNumPaths(Math.min(Math.max(1, val), planConfig.maxPaths));
						}}
						className="flex-1 px-3 py-2 bg-slate-700/50 border border-purple-800/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
					/>
					<button
						type="button"
						onClick={() => setNumPaths(Math.min(numPaths + 1000, planConfig.maxPaths))}
						className="px-2 py-1 bg-slate-700/50 border border-purple-800/30 rounded text-purple-200 hover:bg-slate-700 text-sm"
					>
						+
					</button>
				</div>
			</div>

			{/* Advanced (Expandable) */}
			<div>
				<button
					type="button"
					onClick={() => setShowAdvanced(!showAdvanced)}
					className="flex items-center gap-2 text-xs font-medium text-purple-300 hover:text-purple-200 transition-colors"
				>
					<span>{showAdvanced ? "▼" : "▶"}</span>
					<span>Advanced</span>
				</button>
				{showAdvanced && (
					<div className="mt-2 space-y-3">
						{activeTab === "parametric" ? (
							<ParametricForm
								onSubmit={handleParametricSubmit}
								planConfig={planConfig}
							/>
						) : (
							<BootstrappedForm
								onSubmit={handleBootstrappedSubmit}
								planConfig={planConfig}
							/>
						)}
					</div>
				)}
			</div>

			{/* Run Simulation Button */}
			<button
				type="button"
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
					}
				}}
				className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
			>
				Run Simulation
			</button>
		</div>
	);
}

