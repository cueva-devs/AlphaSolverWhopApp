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

	return (
		<section className="h-full min-h-[400px] lg:min-h-0 bg-gray-a2 border border-gray-a4 rounded-lg p-4 sm:p-6 flex flex-col focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-a6 focus-within:ring-offset-2 focus-within:ring-offset-gray-1">
			<h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-12">
				Strategy Setup
			</h2>

			{/* Tab Switcher */}
			<div className="flex border-b border-gray-a4 mb-4">
				<button
					type="button"
					onClick={() => setActiveTab("parametric")}
					className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:ring-offset-2 focus:ring-offset-gray-a2 ${
						activeTab === "parametric"
							? "text-gray-12 border-b-2 border-gray-a6"
							: "text-gray-10 hover:text-gray-11"
					}`}
				>
					Parametric
				</button>
				<button
					type="button"
					onClick={() => planConfig.allowCsv && setActiveTab("bootstrapped")}
					disabled={!planConfig.allowCsv}
					className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-a6 focus:ring-offset-2 focus:ring-offset-gray-a2 relative ${
						!planConfig.allowCsv
							? "text-gray-8 cursor-not-allowed opacity-50"
							: activeTab === "bootstrapped"
								? "text-gray-12 border-b-2 border-gray-a6"
								: "text-gray-10 hover:text-gray-11"
					}`}
				>
					Bootstrapped (CSV)
					{!planConfig.allowCsv && (
						<svg
							className="inline-block w-3 h-3 ml-1 text-gray-9"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
								clipRule="evenodd"
							/>
						</svg>
					)}
				</button>
			</div>

			{/* CSV Upgrade Message */}
			{!planConfig.allowCsv && activeTab === "bootstrapped" && (
				<div className="mb-4 p-4 bg-gray-a3 border border-gray-a5 rounded-lg">
					<div className="flex items-start gap-3">
						<svg
							className="w-5 h-5 text-gray-10 flex-shrink-0 mt-0.5"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fillRule="evenodd"
								d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
								clipRule="evenodd"
							/>
						</svg>
						<div className="flex-1">
							<p className="text-sm text-gray-11 font-medium mb-1">
								Upgrade to access CSV mode
							</p>
							<p className="text-xs text-gray-9">
								Your current plan ({planConfig.label}) doesn't include CSV
								import functionality. Upgrade on Whop to unlock this feature.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Form Content */}
			<div className="flex-1 overflow-y-auto">
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

			{/* Developer Debug Panel */}
			<PyodideDebugPanel />
		</section>
	);
}

