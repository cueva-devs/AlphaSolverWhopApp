"use client";

import { useState, useRef } from "react";
import { Card, Tabs, Select, Button, Text, Heading, Callout, Spinner } from "@whop/react/components";
import StrategyPanel from "./components/StrategyPanel";
import ResultsPanel from "./components/ResultsPanel";
import AccountConfigPanel from "./components/AccountConfig";
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
		<div className="min-h-screen bg-gray-1 flex flex-col">
			{/* TEST BANNER - Remove after confirming deployment works */}
			<div className="bg-blue-6 text-blue-11 text-center py-2 px-4">
				<Text size="2" weight="bold">
					✓ Frosted UI Design System Active - Build: {new Date().toISOString().split('T')[0]}
				</Text>
			</div>
			<main className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-0 overflow-hidden">
				{/* Left Sidebar */}
				<aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
					{/* Account Section */}
					<Card size="2" variant="surface">
						<Heading size="4" as="h2" className="mb-3">
							Account
						</Heading>
						<AccountConfigPanel
							config={accountConfig}
							onChange={setAccountConfig}
						/>
					</Card>

					{/* Trade Log Section */}
					<Card size="2" variant="surface">
						<Heading size="4" as="h2" className="mb-3">
							Trade Log
						</Heading>
						<div className="space-y-3">
							<div>
								<Text size="2" weight="medium" className="mb-2 block">
									CSV Format
								</Text>
								<Select.Root
									value={csvFormat}
									onValueChange={async (value) => {
										const newFormat = value as "NinjaTrader" | "Generic" | "Custom";
										setCsvFormat(newFormat);
										// Re-parse if file is already loaded
										if (csvFile) {
											await parseCsvFile(csvFile, newFormat);
										}
									}}
								>
									<Select.Trigger />
									<Select.Content>
										<Select.Item value="NinjaTrader">NinjaTrader</Select.Item>
										<Select.Item value="Generic">Generic</Select.Item>
										<Select.Item value="Custom">Custom</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>
							<div>
								<Text size="2" weight="medium" className="mb-2 block">
									Upload Trade Log
								</Text>
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
									className="border-2 border-dashed border-gray-a6 rounded-lg p-6 text-center cursor-pointer hover:border-gray-a8 transition-colors bg-gray-a2"
									onClick={handleFileSelect}
								>
									{isParsingCsv ? (
										<div className="flex flex-col items-center">
											<Spinner size="2" className="mb-2" />
											<Text size="2" color="gray">
												Parsing CSV...
											</Text>
										</div>
									) : csvFile ? (
										<div className="space-y-2">
											<Text size="2" weight="medium" color="green">
												✓ Loaded {parsedTrades?.length || 0} trades
											</Text>
											<Text size="2" color="gray">
												{csvFile.name}
											</Text>
											<Text size="1" color="gray">
												{(csvFile.size / 1024).toFixed(2)} KB
											</Text>
											<Button
												type="button"
												size="1"
												variant="soft"
												color="red"
												onClick={(e) => {
													e.stopPropagation();
													setCsvFile(null);
													setParsedTrades(null);
													setCsvError(null);
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
												className="mt-2"
											>
												Remove
											</Button>
										</div>
									) : (
										<>
											<Text size="2" color="gray" className="mb-2">
												Drag and drop file here
											</Text>
											<Text size="1" color="gray" className="mb-3">
												Limit 200MB per file...
											</Text>
											<Button
												type="button"
												size="2"
												variant="soft"
												onClick={(e) => {
													e.stopPropagation();
													handleFileSelect();
												}}
											>
												Browse files
											</Button>
										</>
									)}
								</div>
								{csvError && (
									<Callout.Root color="red" className="mt-2">
										<Callout.Text size="2">{csvError}</Callout.Text>
									</Callout.Root>
								)}
							</div>
						</div>
					</Card>

					{/* Simulation Section */}
					<Card size="2" variant="surface">
						<Heading size="4" as="h2" className="mb-3">
							Simulation
						</Heading>
						<StrategyPanel
							onRunSimulation={handleRunSimulation}
							planConfig={planConfig}
							parsedTrades={parsedTrades}
							csvFormat={csvFormat}
						/>
					</Card>
				</aside>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Tabs */}
					<Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
						<Tabs.List>
							<Tabs.Trigger value="simulation">Simulation</Tabs.Trigger>
							<Tabs.Trigger value="trading_plan">Trading Plan</Tabs.Trigger>
						</Tabs.List>

						{/* Tab Content */}
						<div className="flex-1 overflow-y-auto mt-4">
							<Tabs.Content value="simulation">
								<ResultsPanel
									result={result}
									isRunning={isRunning || isEngineLoading}
									error={error}
									accountConfig={accountConfig}
								/>
							</Tabs.Content>
							<Tabs.Content value="trading_plan">
								<Card size="2" variant="surface">
									<Heading size="5" as="h2" className="mb-4">
										Trading Plan
									</Heading>
									<Text size="3" color="gray">
										Trading plan analysis will be available here.
									</Text>
								</Card>
							</Tabs.Content>
						</div>
					</Tabs.Root>
				</div>
			</main>
		</div>
	);
}
