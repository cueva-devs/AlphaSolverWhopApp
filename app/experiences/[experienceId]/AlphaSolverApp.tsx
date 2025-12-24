"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RunPanel from "./components/RunPanel";
import ResultsPanel from "./components/ResultsPanel";
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

type TabType = "run" | "simulation" | "trading_plan";

export default function AlphaSolverApp({
	experienceId,
	companyId,
	userId,
	planId,
	planConfig,
	upgradeUrl,
	isWhopIframe = true,
}: AlphaSolverAppProps) {
	const { run, result, isRunning, error, isEngineLoading, reset } =
		useSimulationEngine();
	const [activeTab, setActiveTab] = useState<TabType>("run");
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

	// Scroll position preservation
	const scrollPositions = useRef<Record<TabType, number>>({
		run: 0,
		simulation: 0,
		trading_plan: 0,
	});
	const contentRef = useRef<HTMLDivElement>(null);
	
	// Track if we've already navigated to results after simulation completion
	const hasNavigatedToResults = useRef(false);

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

	// Handle tab change with scroll position preservation
	const handleTabChange = useCallback((newTab: TabType) => {
		// Save current scroll position
		if (contentRef.current) {
			scrollPositions.current[activeTab] = contentRef.current.scrollTop;
		}
		
		setActiveTab(newTab);
		// Restore new tab's scroll position after render
		requestAnimationFrame(() => {
			if (contentRef.current) {
				contentRef.current.scrollTop = scrollPositions.current[newTab];
			}
		});
	}, [activeTab]);

	// Reset navigation flag and scroll position when a new simulation starts
	useEffect(() => {
		if (isRunning || isEngineLoading) {
			hasNavigatedToResults.current = false;
			// Reset scroll position for simulation tab so it starts at top for new results
			scrollPositions.current.simulation = 0;
		}
	}, [isRunning, isEngineLoading]);

	// Auto-navigate to simulation tab when simulation completes (only once)
	useEffect(() => {
		// Check if simulation just completed and we haven't navigated yet
		if (!isRunning && !isEngineLoading && result !== null && activeTab !== "simulation" && !hasNavigatedToResults.current) {
			// Add a small delay to allow UI to settle before navigation
			const timer = setTimeout(() => {
				handleTabChange("simulation");
				hasNavigatedToResults.current = true;
				
				// Scroll to top when auto-navigating to simulation tab
				requestAnimationFrame(() => {
					if (contentRef.current) {
						contentRef.current.scrollTop = 0;
					}
				});
			}, 500);
			
			return () => clearTimeout(timer);
		}
	}, [isRunning, isEngineLoading, result, activeTab, handleTabChange]);

	// Navigate to results after simulation
	const handleNavigateToResults = useCallback(() => {
		handleTabChange("simulation");
	}, [handleTabChange]);

	// Actually execute the simulation (extracted for reuse)
	const executeSimulation = async (params: BootstrappedParams, trades: ParsedTrade[]) => {
		// Clear previous results before starting new simulation
		reset();
		
		// Use server-side credit via Vercel KV (only for non-unlimited users)
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

	// Show confirmation dialog before running (only for non-unlimited users)
	const handleRequestRun = (params: BootstrappedParams, trades: ParsedTrade[]) => {
		// Check credits first
		if (planConfig.dailyCredits !== -1 && creditsRemaining <= 0) {
			setCsvError("No credits remaining. Credits reset daily at midnight.");
			return;
		}
		
		// For unlimited users, run directly without confirmation
		if (planConfig.dailyCredits === -1) {
			executeSimulation(params, trades);
			return;
		}
		
		// For non-unlimited users, show confirmation dialog
		setPendingRun({ params, trades });
		setShowRunConfirm(true);
	};

	// Actually run the simulation after confirmation
	const handleConfirmRun = async () => {
		setShowRunConfirm(false);
		
		if (!pendingRun) return;
		
		const { params, trades } = pendingRun;
		setPendingRun(null);
		
		await executeSimulation(params, trades);
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

	const handleCsvFormatChange = async (newFormat: CsvFormat) => {
		setCsvFormat(newFormat);
		// Re-parse if file is already loaded
		if (csvFile) {
			await parseCsvFile(csvFile, newFormat);
		}
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

	const handleRemoveFile = () => {
		setCsvFile(null);
		setParsedTrades(null);
		setCsvError(null);
		setAiMapping(null);
		setAiMappingConfirmed(false);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="app-shell-tabs">
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

			{/* Sticky Tab Bar */}
			<nav className="sticky-tabs">
				<div className="sticky-tabs-inner">
					<button
						className={`sticky-tab ${activeTab === 'run' ? 'active' : ''}`}
						onClick={() => handleTabChange('run')}
					>
						Run
					</button>
					<button
						className={`sticky-tab ${activeTab === 'simulation' ? 'active' : ''}`}
						onClick={() => handleTabChange('simulation')}
					>
						Simulation
					</button>
					<button
						className={`sticky-tab ${activeTab === 'trading_plan' ? 'active' : ''}`}
						onClick={() => handleTabChange('trading_plan')}
					>
						Trading Plan
					</button>
				</div>
			</nav>

			{/* Tab Content with scroll */}
			<div className="tab-content-scroll" ref={contentRef}>
				<AnimatePresence mode="wait">
					{activeTab === 'run' && (
						<motion.div
							key="run"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							<RunPanel
								accountConfig={accountConfig}
								onAccountConfigChange={setAccountConfig}
								csvFile={csvFile}
								csvFormat={csvFormat}
								parsedTrades={parsedTrades}
								isParsingCsv={isParsingCsv}
								csvError={csvError}
								onCsvFormatChange={handleCsvFormatChange}
								onFileSelect={handleFileSelect}
								onFileChange={handleFileChange}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
								onRemoveFile={handleRemoveFile}
								fileInputRef={fileInputRef}
								aiMapping={aiMapping}
								aiMappingConfirmed={aiMappingConfirmed}
								isAnalyzingCsv={isAnalyzingCsv}
								onAnalyzeCsv={handleAnalyzeCsv}
								onConfirmAiMapping={handleConfirmAiMapping}
								onResetAiMapping={handleResetAiMapping}
								planConfig={planConfig}
								creditsDisplay={creditsDisplay}
								creditsRemaining={creditsRemaining}
								noCreditsRemaining={noCreditsRemaining}
								isLoadingCredits={isLoadingCredits}
								upgradeUrl={upgradeUrl}
								isWhopIframe={isWhopIframe}
								result={result}
								onExportRun={handleExportRun}
								onImportRun={() => importInputRef.current?.click()}
								estimatedFileSize={result ? estimateFileSize(result) : "0 KB"}
								isRunning={isRunning}
								isEngineLoading={isEngineLoading}
								onRunSimulation={handleRequestRun}
								onNavigateToResults={handleNavigateToResults}
							/>
						</motion.div>
					)}
					{activeTab === 'simulation' && (
						<motion.div
							key="simulation"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
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
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
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
	);
}
