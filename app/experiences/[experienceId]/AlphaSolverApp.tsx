"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StrategyPanel from "./components/StrategyPanel";
import ResultsPanel from "./components/ResultsPanel";
import AccountConfigPanel from "./components/AccountConfig";
import TradingPlanPanel from "./components/TradingPlanPanel";
import { useSimulationEngine } from "./hooks/useSimulationEngine";
import { parseTradeCsv } from "./lib/csvUtils";
import type {
	BootstrappedParams,
	ParsedTrade,
	AccountConfig,
	CsvFormat,
} from "./types";
import { CSV_TEMPLATES, getCsvTemplateList, getAccountConfig } from "./config/propFirmConfig";
import type { AiColumnMapping } from "./lib/aiMappingSchema";
import { extractCsvPreview, getAiColumnMapping, parseCsvWithAiMapping } from "./lib/aiMappingService";
import type { PlanId, PlanConfig } from "./config/planConfig";
import { createSavedRun, exportRun, importRun, estimateFileSize } from "./lib/saveRunUtils";
import { 
	useCreditServer, 
	checkCreditsServer,
	getCreditsDisplayFromState,
	type CreditsState 
} from "./lib/creditsService";
import type { SavedRun } from "./types";

interface AlphaSolverAppProps {
	experienceId: string;
	companyId?: string;
	userId?: string;
	planId: PlanId;
	planConfig: PlanConfig;
	upgradeUrl?: string;
	isWhopIframe?: boolean;
}

type TabType = "simulation" | "trading_plan";

// Animation variants
const fadeIn = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function AlphaSolverApp({
	experienceId,
	companyId,
	userId,
	planId,
	planConfig,
	upgradeUrl,
	isWhopIframe = true,
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
	const [csvFormat, setCsvFormat] = useState<CsvFormat>("NinjaTrader");
	const [parsedTrades, setParsedTrades] = useState<ParsedTrade[] | null>(null);
	const [isParsingCsv, setIsParsingCsv] = useState(false);
	const [csvError, setCsvError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const importInputRef = useRef<HTMLInputElement>(null);
	
	// AI Upload state
	const [isAnalyzingCsv, setIsAnalyzingCsv] = useState(false);
	const [aiMapping, setAiMapping] = useState<AiColumnMapping | null>(null);
	const [aiMappingConfirmed, setAiMappingConfirmed] = useState(false);
	const [lastParams, setLastParams] = useState<BootstrappedParams | null>(null);
	const [creditsState, setCreditsState] = useState<CreditsState | null>(null);
	const [isLoadingCredits, setIsLoadingCredits] = useState(true);
	
	// Confirmation dialog state
	const [showRunConfirm, setShowRunConfirm] = useState(false);
	const [pendingRun, setPendingRun] = useState<{ params: BootstrappedParams; trades: ParsedTrade[] } | null>(null);

	// Computed values from credits state
	const creditsDisplay = planConfig.dailyCredits === -1 
		? "Unlimited" 
		: getCreditsDisplayFromState(creditsState, planConfig.dailyCredits);
	const creditsRemaining = creditsState?.creditsRemaining ?? planConfig.dailyCredits;
	const noCreditsRemaining = planConfig.dailyCredits !== -1 && creditsRemaining <= 0;

	// Fetch credits from Vercel KV on mount
	useEffect(() => {
		const fetchCredits = async () => {
			if (planConfig.dailyCredits === -1) {
				setIsLoadingCredits(false);
				return;
			}
			if (!userId) {
				setIsLoadingCredits(false);
				return;
			}
			
			try {
				const serverCredits = await checkCreditsServer(userId, experienceId !== "direct" ? experienceId : undefined);
				setCreditsState(serverCredits);
			} catch (e) {
				console.error("Failed to fetch credits:", e);
			} finally {
				setIsLoadingCredits(false);
			}
		};
		
		fetchCredits();
	}, [userId, experienceId, planConfig]);

	// Show confirmation dialog before running
	const handleRequestRun = (params: BootstrappedParams, trades: ParsedTrade[]) => {
		// Check credits first
		if (planConfig.dailyCredits !== -1 && creditsRemaining <= 0) {
			setCsvError("No credits remaining. Credits reset daily at midnight.");
			return;
		}
		
		setPendingRun({ params, trades });
		setShowRunConfirm(true);
	};

	// Actually run the simulation after confirmation
	const handleConfirmRun = async () => {
		setShowRunConfirm(false);
		
		if (!pendingRun) return;
		
		const { params, trades } = pendingRun;
		setPendingRun(null);
		
		// Use server-side credit via Vercel KV
		if (planConfig.dailyCredits !== -1) {
			if (!userId) {
				setCsvError("Unable to verify user. Please refresh the page.");
				return;
			}
			
			try {
				const result = await useCreditServer(userId, experienceId !== "direct" ? experienceId : undefined);
				if (!result) {
					setCsvError("Failed to connect to server. Please try again.");
					return;
				}
				if (!result.success) {
					setCsvError(result.error || "No credits remaining. Credits reset daily at midnight UTC.");
					return;
				}
				// Update credits state with new values from server
				setCreditsState({
					creditsRemaining: result.credits,
					maxCredits: result.maxCredits,
					lastResetDate: new Date().toISOString().split("T")[0],
					isUnlimited: false,
				});
			} catch (e) {
				console.error("Credit use error:", e);
				setCsvError("Failed to use credit. Please try again.");
				return;
			}
		}
		
		// Get base account config and merge with overrides
		const baseConfig = getAccountConfig(accountConfig.propFirm, accountConfig.challenge);
		
		const mergedRules: Record<string, number> = baseConfig ? { ...baseConfig.rules } : {};
		const mergedFees: Record<string, number> = baseConfig ? { ...baseConfig.fees } : {};
		
		// Apply rule overrides
		if (accountConfig.ruleOverrides) {
			Object.entries(accountConfig.ruleOverrides).forEach(([key, value]) => {
				if (value !== undefined) {
					mergedRules[key] = value;
				}
			});
		}
		
		// Apply fee overrides
		if (accountConfig.feeOverrides) {
			Object.entries(accountConfig.feeOverrides).forEach(([key, value]) => {
				if (value !== undefined) {
					mergedFees[key] = value;
				}
			});
		}
		
		// Add account config to params
		const paramsWithAccount: BootstrappedParams = {
			...params,
			accountRules: mergedRules,
			accountFees: mergedFees,
			gameType: accountConfig.gameType,
		};
		
		setLastParams(paramsWithAccount);
		setCsvError(null);
		await run("bootstrapped", paramsWithAccount, trades);
	};

	const handleCancelRun = () => {
		setShowRunConfirm(false);
		setPendingRun(null);
	};

	const handleFileSelect = () => {
		fileInputRef.current?.click();
	};

	// Export current run
	const handleExportRun = async () => {
		if (!result || !parsedTrades || !lastParams) return;
		
		try {
			const savedRun = createSavedRun(
				result,
				parsedTrades,
				accountConfig,
				lastParams,
				csvFormat,
				`${accountConfig.propFirm} ${accountConfig.challenge}`
			);
			await exportRun(savedRun);
		} catch (err) {
			setCsvError(err instanceof Error ? err.message : "Failed to export run");
		}
	};

	// Import a saved run
	const handleImportRun = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		try {
			const savedRun = await importRun(file);
			
			// Restore all state
			setParsedTrades(savedRun.trades);
			setAccountConfig(savedRun.accountConfig);
			setCsvFormat(savedRun.csvFormat);
			setLastParams(savedRun.params);
			
			// Directly set the result (no need to re-run simulation)
			await run("bootstrapped", savedRun.params, savedRun.trades);
		} catch (err) {
			setCsvError(err instanceof Error ? err.message : "Failed to import run");
		}
		
		// Reset input
		if (importInputRef.current) {
			importInputRef.current.value = "";
		}
	};

	const parseCsvFile = async (file: File, format: CsvFormat, mapping?: AiColumnMapping) => {
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
			let trades: ParsedTrade[];
			
			if (format === "AI Upload" && mapping) {
				// Use AI mapping to parse
				trades = await parseCsvWithAiMapping(file, mapping);
			} else if (format === "AI Upload" && !mapping) {
				// AI Upload selected but no mapping yet - just store the file
				setIsParsingCsv(false);
				return;
			} else {
				// Use standard template parsing
				trades = await parseTradeCsv(file, {
					template: format,
				});
			}
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

	// AI Upload: Analyze CSV headers and get column mapping from AI
	const handleAnalyzeCsv = async () => {
		if (!csvFile) {
			setCsvError("Please select a CSV file first");
			return;
		}

		if (!planConfig.allowAiUpload) {
			setCsvError("AI Upload is a paid feature. Please upgrade your plan.");
			return;
		}

		setIsAnalyzingCsv(true);
		setCsvError(null);
		setAiMapping(null);
		setAiMappingConfirmed(false);
		setParsedTrades(null);

		try {
			// Extract headers and sample rows
			const { headers, sampleRows } = await extractCsvPreview(csvFile);

			// Call AI mapping API
			const result = await getAiColumnMapping(headers, sampleRows);

			if (result.success && result.mapping) {
				setAiMapping(result.mapping);
			} else {
				setCsvError(result.error || "Failed to analyze CSV. Please try a different template.");
			}
		} catch (error) {
			setCsvError(error instanceof Error ? error.message : "Failed to analyze CSV");
		} finally {
			setIsAnalyzingCsv(false);
		}
	};

	// Confirm AI mapping and parse the CSV
	const handleConfirmAiMapping = async () => {
		if (!csvFile || !aiMapping) return;
		
		setAiMappingConfirmed(true);
		await parseCsvFile(csvFile, "AI Upload", aiMapping);
	};

	// Reset AI mapping state
	const handleResetAiMapping = () => {
		setAiMapping(null);
		setAiMappingConfirmed(false);
		setParsedTrades(null);
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		
		// Reset AI mapping when file changes
		setAiMapping(null);
		setAiMappingConfirmed(false);
		
		await parseCsvFile(file, csvFormat, aiMapping || undefined);
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
		<div className="app-shell">
			{/* Run Confirmation Dialog */}
			<AnimatePresence>
				{showRunConfirm && (
					<motion.div 
						className="dialog-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div 
							className="dialog-content"
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
						>
							<h3 className="dialog-title">Confirm Simulation</h3>
							<p className="dialog-description">
								This will use 1 of your {creditsDisplay} daily credits.
								{planConfig.dailyCredits !== -1 && ` You'll have ${Math.max(0, creditsRemaining - 1)} left.`}
							</p>
							<div className="dialog-actions">
								<button 
									className="btn btn-soft btn-md flex-1"
									onClick={handleCancelRun}
								>
									Cancel
								</button>
								<button 
									className="btn btn-primary btn-md flex-1"
									onClick={handleConfirmRun}
								>
									Run Simulation
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Hidden import input */}
			<input
				ref={importInputRef}
				type="file"
				accept=".alphasolver"
				onChange={handleImportRun}
				className="hidden"
			/>
			
			<main className="flex-1 flex flex-col lg:flex-row gap-5 p-5 min-h-0 overflow-hidden">
				{/* Left Sidebar */}
				<aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
					{/* Plan & Credits Section */}
					<motion.div 
						className="sidebar-panel"
						initial="hidden"
						animate="visible"
						variants={slideUp}
					>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-sm font-semibold text-[var(--text-primary)]">
								{planConfig.label} Plan
							</h2>
							<div className="credits-display">
								<span className="credits-label">Daily Runs</span>
								{isLoadingCredits ? (
									<div className="spinner mt-1" />
								) : (
									<div className={`credits-value ${planConfig.dailyCredits === -1 ? 'unlimited' : noCreditsRemaining ? 'depleted' : ''}`}>
										{creditsDisplay}
									</div>
								)}
							</div>
						</div>
						{planConfig.dailyCredits !== -1 && (
							<div className="space-y-3">
								<p className="text-xs text-[var(--text-muted)]">
									Credits reset daily at midnight UTC.
								</p>
								{noCreditsRemaining && upgradeUrl && (
									<div className="space-y-2">
										<a href={upgradeUrl} target="_blank" rel="noopener noreferrer" className="block">
											<button className="btn btn-primary btn-md w-full">
												Upgrade to Unlimited
											</button>
										</a>
										{isWhopIframe && (
											<p className="text-xs text-[var(--text-muted)] text-center">
												Or contact your community admin to upgrade
											</p>
										)}
									</div>
								)}
								{noCreditsRemaining && !upgradeUrl && isWhopIframe && (
									<div className="callout callout-warning">
										Contact your community admin to upgrade your plan, or come back tomorrow.
									</div>
								)}
							</div>
						)}
					</motion.div>

					{/* Save/Load Section */}
					<motion.div 
						className="sidebar-panel"
						initial="hidden"
						animate="visible"
						variants={slideUp}
						transition={{ delay: 0.05 }}
					>
						<h2 className="section-header">Save / Load</h2>
						<div className="flex gap-2">
							<button
								className="btn btn-soft btn-sm flex-1"
								disabled={!result || !parsedTrades || !planConfig.allowExport}
								onClick={handleExportRun}
								title={!planConfig.allowExport ? "Upgrade to Unlimited to export runs" : undefined}
							>
								Export Run
							</button>
							<button
								className="btn btn-soft btn-sm flex-1"
								onClick={() => importInputRef.current?.click()}
							>
								Import Run
							</button>
						</div>
						{result && (
							<p className="text-xs text-[var(--text-muted)] mt-2">
								Est. file size: {estimateFileSize(result)}
							</p>
						)}
					</motion.div>

					{/* Account Section */}
					<motion.div 
						className="sidebar-panel"
						initial="hidden"
						animate="visible"
						variants={slideUp}
						transition={{ delay: 0.1 }}
					>
						<h2 className="section-header">Account</h2>
						<AccountConfigPanel
							config={accountConfig}
							onChange={setAccountConfig}
						/>
					</motion.div>

					{/* Trade Log Section */}
					<motion.div 
						className="sidebar-panel"
						initial="hidden"
						animate="visible"
						variants={slideUp}
						transition={{ delay: 0.15 }}
					>
						<h2 className="section-header">Trade Log</h2>
						<div className="space-y-4">
							<div>
								<label className="section-label">CSV Format</label>
								<select
									className="select"
									value={csvFormat}
									onChange={async (e) => {
										const newFormat = e.target.value as CsvFormat;
										setCsvFormat(newFormat);
										// Re-parse if file is already loaded
										if (csvFile) {
											await parseCsvFile(csvFile, newFormat);
										}
									}}
								>
									{getCsvTemplateList().map((template) => (
										<option key={template} value={template}>{template}</option>
									))}
								</select>
								
								{csvFormat === "Custom" && (
									<div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border)]">
										<p className="text-xs text-[var(--text-muted)] mb-2">
											Download the CSV template to ensure your data is formatted correctly.
										</p>
										<a 
											href="/sample_template.csv" 
											download="alphasolver_template.csv"
											className="btn btn-primary btn-sm w-full"
										>
											Download CSV Template
										</a>
									</div>
								)}
								
								{csvFormat === "AI Upload" && (
									<div className="mt-3 p-3 bg-[var(--accent-dim)] rounded-lg border border-[rgba(59,130,246,0.25)]">
										{!planConfig.allowAiUpload ? (
											<div className="callout callout-warning">
												AI Upload is a paid feature. Upgrade to Unlimited to use automatic column detection.
											</div>
										) : !csvFile ? (
											<p className="text-xs text-[var(--text-secondary)]">
												Upload a CSV file, then click "Analyze CSV" to automatically detect columns.
											</p>
										) : !aiMapping ? (
											<div className="space-y-3">
												<p className="text-xs text-[var(--text-secondary)]">
													AI will analyze your CSV headers and map them to the required columns.
												</p>
												<button
													className="btn btn-primary btn-sm w-full"
													onClick={handleAnalyzeCsv}
													disabled={isAnalyzingCsv}
												>
													{isAnalyzingCsv ? (
														<>
															<span className="spinner" />
															Analyzing...
														</>
													) : "Analyze CSV"}
												</button>
											</div>
										) : !aiMappingConfirmed ? (
											<div className="space-y-3">
												<p className="text-xs font-medium text-[var(--text-primary)]">
													AI Detected Columns:
												</p>
												<div className="space-y-1 text-xs">
													<div className="flex justify-between">
														<span className="text-[var(--text-muted)]">PNL:</span>
														<span className="font-medium">{aiMapping.pnl.column} ({aiMapping.pnl.format})</span>
													</div>
													<div className="flex justify-between">
														<span className="text-[var(--text-muted)]">Date:</span>
														<span className="font-medium">{aiMapping.date.column} ({aiMapping.date.format})</span>
													</div>
													{aiMapping.mfe && (
														<div className="flex justify-between">
															<span className="text-[var(--text-muted)]">MFE:</span>
															<span className="font-medium">{aiMapping.mfe.column} ({aiMapping.mfe.format})</span>
														</div>
													)}
													{aiMapping.row_filter && (
														<div className="flex justify-between">
															<span className="text-[var(--text-muted)]">Filter:</span>
															<span className="font-medium">{aiMapping.row_filter.column} {aiMapping.row_filter.condition} "{aiMapping.row_filter.value}"</span>
														</div>
													)}
												</div>
												<div className="flex gap-2">
													<button
														className="btn btn-soft btn-sm flex-1"
														onClick={handleResetAiMapping}
													>
														Re-analyze
													</button>
													<button
														className="btn btn-success btn-sm flex-1"
														onClick={handleConfirmAiMapping}
													>
														Confirm & Parse
													</button>
												</div>
											</div>
										) : (
											<div className="space-y-2">
												<p className="text-xs font-medium text-[var(--positive)]">
													AI Mapping Confirmed
												</p>
												<div className="space-y-1 text-xs text-[var(--text-muted)]">
													<p>PNL: {aiMapping.pnl.column}</p>
													<p>Date: {aiMapping.date.column}</p>
													{aiMapping.mfe && <p>MFE: {aiMapping.mfe.column}</p>}
												</div>
												<button
													className="btn btn-soft btn-sm"
													onClick={handleResetAiMapping}
												>
													Change Mapping
												</button>
											</div>
										)}
									</div>
								)}
							</div>
							
							<div>
								<label className="section-label">Upload Trade Log</label>
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
									className={`file-drop-zone ${csvFile ? 'has-file' : ''}`}
									onClick={handleFileSelect}
								>
									{isParsingCsv ? (
										<div className="flex flex-col items-center gap-2">
											<div className="spinner" />
											<span className="text-sm text-[var(--text-muted)]">
												Parsing CSV...
											</span>
										</div>
									) : csvFile ? (
										<div className="space-y-2">
											{csvFormat === "AI Upload" && !aiMappingConfirmed ? (
												<p className="text-sm font-medium text-[var(--accent)]">
													File ready for AI analysis
												</p>
											) : (
												<p className="text-sm font-medium text-[var(--positive)]">
													Loaded {parsedTrades?.length || 0} trades
												</p>
											)}
											<p className="text-xs text-[var(--text-muted)]">
												{csvFile.name}
											</p>
											<p className="text-xs text-[var(--text-dim)]">
												{(csvFile.size / 1024).toFixed(2)} KB
											</p>
											<button
												className="btn btn-danger btn-sm mt-2"
												onClick={(e) => {
													e.stopPropagation();
													setCsvFile(null);
													setParsedTrades(null);
													setCsvError(null);
													setAiMapping(null);
													setAiMappingConfirmed(false);
													if (fileInputRef.current) {
														fileInputRef.current.value = "";
													}
												}}
											>
												Remove
											</button>
										</div>
									) : (
										<>
											<p className="text-sm text-[var(--text-muted)] mb-1">
												Drag and drop file here
											</p>
											<p className="text-xs text-[var(--text-dim)] mb-3">
												Limit 200MB per file
											</p>
											<button
												className="btn btn-soft btn-sm"
												onClick={(e) => {
													e.stopPropagation();
													handleFileSelect();
												}}
											>
												Browse files
											</button>
										</>
									)}
								</div>
								{csvError && (
									<div className="callout callout-error mt-3">
										{csvError}
									</div>
								)}
							</div>
						</div>
					</motion.div>

					{/* Simulation Section */}
					<motion.div 
						className="sidebar-panel"
						initial="hidden"
						animate="visible"
						variants={slideUp}
						transition={{ delay: 0.2 }}
					>
						<h2 className="section-header">Simulation</h2>
						<StrategyPanel
							onRunSimulation={handleRequestRun}
							planConfig={planConfig}
							parsedTrades={parsedTrades}
							csvFormat={csvFormat}
							isRunning={isRunning || isEngineLoading}
						/>
					</motion.div>
				</aside>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
					{/* Tabs */}
					<div className="tabs-list mb-4">
						<button
							className={`tab-trigger ${activeTab === 'simulation' ? 'active' : ''}`}
							onClick={() => setActiveTab('simulation')}
						>
							Simulation
						</button>
						<button
							className={`tab-trigger ${activeTab === 'trading_plan' ? 'active' : ''}`}
							onClick={() => setActiveTab('trading_plan')}
						>
							Trading Plan
						</button>
					</div>

					{/* Tab Content */}
					<div className="flex-1 overflow-y-auto">
						<AnimatePresence mode="wait">
							{activeTab === 'simulation' && (
								<motion.div
									key="simulation"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<ResultsPanel
										result={result}
										isRunning={isRunning || isEngineLoading}
										error={error}
										accountConfig={accountConfig}
									/>
								</motion.div>
							)}
							{activeTab === 'trading_plan' && (
								<motion.div
									key="trading_plan"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<TradingPlanPanel
										tradingPlan={result?.tradingPlan}
										isRunning={isRunning || isEngineLoading}
										hasTradeLog={!!parsedTrades && parsedTrades.length > 0}
										hasRunSimulation={!!result}
										gameType={accountConfig.gameType}
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</main>
		</div>
	);
}
