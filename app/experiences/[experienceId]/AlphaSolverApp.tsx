"use client";

import { useState, useRef } from "react";
import StrategyPanel from "./components/StrategyPanel";
import ResultsPanel from "./components/ResultsPanel";
import AccountConfigPanel from "./components/AccountConfig";
import TradingPlanPanel from "./components/TradingPlanPanel";
import { useSimulationEngine } from "./hooks/useSimulationEngine";
import { parseTradeCsv } from "./lib/csvUtils";
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
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [csvFormat, setCsvFormat] = useState<"NinjaTrader" | "Generic" | "Custom">("NinjaTrader");
	const [parsedTrades, setParsedTrades] = useState<ParsedTrade[] | null>(null);
	const [isParsingCsv, setIsParsingCsv] = useState(false);
	const [csvError, setCsvError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleRunSimulation = async (
		mode: SimulationMode,
		params: ParametricParams | BootstrappedParams,
		trades?: ParsedTrade[],
	) => {
		await run(mode, params, trades);
	};

	const handleFileSelect = () => {
		fileInputRef.current?.click();
	};

	const parseCsvFile = async (file: File, format: "NinjaTrader" | "Generic" | "Custom") => {
		// Validate file type
		if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
			setCsvError("Please select a valid CSV file");
			setCsvFile(null);
			setParsedTrades(null);
			return;
		}

		setCsvFile(file);
		setCsvError(null);
		setIsParsingCsv(true);

		try {
			const trades = await parseTradeCsv(file, {
				template: format,
			});
			setParsedTrades(trades);
		} catch (error) {
			setCsvError(
				error instanceof Error
					? error.message
					: "Failed to parse CSV file. Please check the file format.",
			);
			setParsedTrades(null);
		} finally {
			setIsParsingCsv(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		await parseCsvFile(file, csvFormat);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const file = e.dataTransfer.files?.[0];
		if (!file) return;
		await parseCsvFile(file, csvFormat);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
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
								<select
									value={csvFormat}
									onChange={async (e) => {
										const newFormat = e.target.value as "NinjaTrader" | "Generic" | "Custom";
										setCsvFormat(newFormat);
										// Re-parse if file is already loaded
										if (csvFile) {
											await parseCsvFile(csvFile, newFormat);
										}
									}}
									className="w-full px-3 py-2 bg-slate-700/50 border border-purple-800/30 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									<option value="NinjaTrader">NinjaTrader</option>
									<option value="Generic">Generic</option>
									<option value="Custom">Custom</option>
								</select>
							</div>
							<div>
								<label className="block text-xs text-purple-300 mb-1">
									Upload Trade Log
								</label>
								<input
									ref={fileInputRef}
									type="file"
									accept=".csv,text/csv"
									onChange={handleFileChange}
									className="hidden"
								/>
								<div
									onDragOver={handleDragOver}
									onDrop={handleDrop}
									className="border-2 border-dashed border-purple-800/50 rounded-lg p-6 text-center cursor-pointer hover:border-purple-600 transition-colors"
									onClick={handleFileSelect}
								>
									{isParsingCsv ? (
										<div className="flex flex-col items-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mb-2"></div>
											<p className="text-xs text-purple-300">Parsing CSV...</p>
										</div>
									) : csvFile ? (
										<div className="space-y-2">
											<p className="text-xs text-green-400 font-medium">
												✓ Loaded {parsedTrades?.length || 0} trades
											</p>
											<p className="text-xs text-purple-300">
												{csvFile.name}
											</p>
											<p className="text-xs text-purple-400">
												{(csvFile.size / 1024).toFixed(2)} KB
											</p>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													setCsvFile(null);
													setParsedTrades(null);
													setCsvError(null);
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
												className="text-xs px-3 py-1 bg-red-600/50 hover:bg-red-600 rounded-md text-white transition-colors mt-2"
											>
												Remove
											</button>
										</div>
									) : (
										<>
											<p className="text-xs text-purple-300 mb-2">
												Drag and drop file here
											</p>
											<p className="text-xs text-purple-400 mb-3">
												Limit 200MB per file...
											</p>
											<button
												type="button"
												className="text-xs px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
											>
												Browse files
											</button>
										</>
									)}
								</div>
								{csvError && (
									<p className="mt-2 text-xs text-red-400">{csvError}</p>
								)}
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
							parsedTrades={parsedTrades}
							csvFormat={csvFormat}
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
							<TradingPlanPanel
								tradingPlan={result?.tradingPlan}
								isRunning={isRunning || isEngineLoading}
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}

