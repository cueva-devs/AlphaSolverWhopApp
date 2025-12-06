"use client";

import { useState } from "react";
import StrategyPanel from "./components/StrategyPanel";
import ResultsPanel from "./components/ResultsPanel";
import AccountConfigPanel from "./components/AccountConfig";
import { useSimulationEngine } from "./hooks/useSimulationEngine";
import type {
	ParametricParams,
	BootstrappedParams,
	ParsedTrade,
	SimulationMode,
	AccountConfig,
} from "./types";
import type { PlanId, PlanConfig } from "./config/planConfig";

interface AlphaSolverAppProps {
	experienceId: string;
	companyId?: string;
	planId: PlanId;
	planConfig: PlanConfig;
}

type TabType = "simulation" | "trading_plan";

export default function AlphaSolverApp({
	experienceId,
	companyId,
	planId,
	planConfig,
}: AlphaSolverAppProps) {
	const { run, result, isRunning, error, isEngineLoading } =
		useSimulationEngine();
	const [activeTab, setActiveTab] = useState<TabType>("simulation");
	const [accountConfig, setAccountConfig] = useState<AccountConfig>({
		gameType: "combine",
		propFirm: "Topstep",
		challenge: "50k",
	});

	const handleRunSimulation = async (
		mode: SimulationMode,
		params: ParametricParams | BootstrappedParams,
		trades?: ParsedTrade[],
	) => {
		await run(mode, params, trades);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
			{/* Header */}
			<header className="border-b border-purple-800/50 bg-slate-900/80 backdrop-blur-sm px-6 py-4">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-white mb-1">PropSim</h1>
						<p className="text-sm text-purple-200">
							Monte Carlo simulation for prop firm trading challenges
						</p>
					</div>
					<div className="text-xs text-purple-300">Deploy</div>
				</div>
			</header>

			<main className="flex-1 flex gap-6 p-6 min-h-0 overflow-hidden">
				{/* Left Sidebar */}
				<aside className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
					{/* Account Section */}
					<section className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
						<h2 className="text-sm font-semibold text-purple-200 mb-3">
							Account
						</h2>
						<AccountConfigPanel
							config={accountConfig}
							onChange={setAccountConfig}
						/>
					</section>

					{/* Trade Log Section */}
					<section className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
						<h2 className="text-sm font-semibold text-purple-200 mb-3">
							Trade Log
						</h2>
						<div className="space-y-3">
							<div>
								<label className="block text-xs text-purple-300 mb-1">
									CSV Format
								</label>
								<select className="w-full px-3 py-2 bg-slate-700/50 border border-purple-800/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
									<option>NinjaTrader</option>
									<option>Generic</option>
									<option>Custom</option>
								</select>
							</div>
							<div>
								<label className="block text-xs text-purple-300 mb-1">
									Upload Trade Log
								</label>
								<div className="border-2 border-dashed border-purple-800/50 rounded-lg p-6 text-center">
									<p className="text-xs text-purple-300 mb-2">
										Drag and drop file here
									</p>
									<p className="text-xs text-purple-400 mb-3">
										Limit 200MB per file...
									</p>
									<button className="text-xs px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors">
										Browse files
									</button>
								</div>
							</div>
						</div>
					</section>

					{/* Simulation Section */}
					<section className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-4">
						<h2 className="text-sm font-semibold text-purple-200 mb-3">
							Simulation
						</h2>
						<StrategyPanel
							onRunSimulation={handleRunSimulation}
							planConfig={planConfig}
						/>
					</section>
				</aside>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Tabs */}
					<div className="flex gap-6 mb-4 border-b border-purple-800/50">
						<button
							type="button"
							onClick={() => setActiveTab("simulation")}
							className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
								activeTab === "simulation"
									? "border-purple-400 text-purple-300"
									: "border-transparent text-purple-400 hover:text-purple-300"
							}`}
						>
							Simulation
						</button>
						<button
							type="button"
							onClick={() => setActiveTab("trading_plan")}
							className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
								activeTab === "trading_plan"
									? "border-purple-400 text-purple-300"
									: "border-transparent text-purple-400 hover:text-purple-300"
							}`}
						>
							Trading Plan
						</button>
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-y-auto">
						{activeTab === "simulation" ? (
							<ResultsPanel
								result={result}
								isRunning={isRunning || isEngineLoading}
								error={error}
								accountConfig={accountConfig}
							/>
						) : (
							<div className="bg-slate-800/50 border border-purple-800/30 rounded-lg p-6">
								<h2 className="text-lg font-semibold text-purple-200 mb-4">
									Trading Plan
								</h2>
								<p className="text-purple-300 text-sm">
									Trading plan analysis will be available here.
								</p>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

