"use client";

import StrategyPanel from "./components/StrategyPanel";
import ResultsPanel from "./components/ResultsPanel";
import { useSimulationEngine } from "./hooks/useSimulationEngine";
import type {
	ParametricParams,
	BootstrappedParams,
	ParsedTrade,
	SimulationMode,
} from "./types";
import type { PlanId, PlanConfig } from "./config/planConfig";

interface AlphaSolverAppProps {
	experienceId: string;
	companyId?: string;
	planId: PlanId;
	planConfig: PlanConfig;
}

export default function AlphaSolverApp({
	experienceId,
	companyId,
	planId,
	planConfig,
}: AlphaSolverAppProps) {
	const { run, result, isRunning, error, isEngineLoading } =
		useSimulationEngine();

	const handleRunSimulation = async (
		mode: SimulationMode,
		params: ParametricParams | BootstrappedParams,
		trades?: ParsedTrade[],
	) => {
		await run(mode, params, trades);
	};

	return (
		<div className="min-h-screen bg-gray-1 text-gray-12 flex flex-col">
			<header className="border-b border-gray-a4 bg-gray-a2 px-4 sm:px-6 py-4">
				<div className="flex justify-between items-center gap-4">
					<h1 className="text-base sm:text-lg font-semibold text-gray-12">
						AlphaSolver – Prop Evaluation Simulator
					</h1>
					<div className="flex flex-col items-end gap-1 text-xs sm:text-sm text-gray-10">
						<div>Plan: {planConfig.label}</div>
						<div>Powered by Whop</div>
					</div>
				</div>
			</header>

			<main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 sm:p-6 min-h-0">
				<StrategyPanel
					onRunSimulation={handleRunSimulation}
					planConfig={planConfig}
				/>
				<ResultsPanel
					result={result}
					isRunning={isRunning || isEngineLoading}
					error={error}
				/>
			</main>
		</div>
	);
}

