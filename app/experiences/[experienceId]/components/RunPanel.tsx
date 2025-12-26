"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AccountConfigPanel from "./AccountConfig";
import type {
	BootstrappedParams,
	ParsedTrade,
	AccountConfig,
	CsvFormat,
	SimulationResult,
} from "../types";
import { getCsvTemplateList } from "../config/propFirmConfig";
import type { AiColumnMapping } from "../lib/aiMappingSchema";
import type { PlanConfig } from "../config/planConfig";
import type { SimulationProgress } from "../hooks/useSimulationEngine";

// Witty loading messages that cycle - poking fun at trader mistakes
const LOADING_MESSAGES = [
	"Calculating so you don't blow your account...",
	"Running simulations to save you money...",
	"Preventing revenge trades and tilt...",
	"Protecting your spouse's credit card...",
	"Analyzing thousands of possible outcomes...",
	"Finding your true pass probability...",
	"Modeling risk like a quant fund...",
	"Preventing expensive mistakes...",
	"Calculating your edge...",
	"Running Monte Carlo magic...",
	"Simulating so you don't go on tilt...",
	"Protecting you from yourself...",
	"Crunching numbers to save your account...",
	"Preventing the classic 'one more trade' mistake...",
	"Analyzing why you keep blowing accounts...",
	"Finding out if you're actually profitable...",
	"Simulating your trading future (spoiler: it's expensive)...",
	"Protecting your relationship with your broker...",
	"Calculating how many resets you'll need...",
	"Preventing the 'I'll make it back' trap...",
	"Analyzing your true win rate (not the one you tell yourself)...",
	"Simulating reality vs your trading journal...",
	"Protecting you from the 'this time is different' mindset...",
	"Calculating your actual edge (hint: it might be negative)...",
	"Preventing the 'just one more eval' cycle...",
];

interface RunPanelProps {
	// Account config
	accountConfig: AccountConfig;
	onAccountConfigChange: (config: AccountConfig) => void;
	
	// CSV / Trade log
	csvFile: File | null;
	csvFormat: CsvFormat;
	parsedTrades: ParsedTrade[] | null;
	isParsingCsv: boolean;
	csvError: string | null;
	onCsvFormatChange: (format: CsvFormat) => void;
	onFileSelect: () => void;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onRemoveFile: () => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	
	// AI Upload
	aiMapping: AiColumnMapping | null;
	aiMappingConfirmed: boolean;
	isAnalyzingCsv: boolean;
	onAnalyzeCsv: () => void;
	onConfirmAiMapping: () => void;
	onResetAiMapping: () => void;
	
	// Plan config
	planConfig: PlanConfig;
	creditsDisplay: string;
	creditsRemaining: number;
	noCreditsRemaining: boolean;
	isLoadingCredits: boolean;
	upgradeUrl?: string;
	isWhopIframe?: boolean;
	
	// Import/Export
	result: SimulationResult | null;
	onExportRun: () => void;
	onImportRun: () => void;
	estimatedFileSize: string;
	
	// Simulation
	isRunning: boolean;
	isEngineLoading: boolean;
	progress: SimulationProgress | null;
	onRunSimulation: (params: BootstrappedParams, trades: ParsedTrade[]) => void;
	onNavigateToResults: () => void;
}

// Animation variants
const fadeUp = {
	hidden: { opacity: 0, y: 10 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.05, delayChildren: 0.1 }
	}
};

export default function RunPanel({
	accountConfig,
	onAccountConfigChange,
	csvFile,
	csvFormat,
	parsedTrades,
	isParsingCsv,
	csvError,
	onCsvFormatChange,
	onFileSelect,
	onFileChange,
	onDragOver,
	onDrop,
	onRemoveFile,
	fileInputRef,
	aiMapping,
	aiMappingConfirmed,
	isAnalyzingCsv,
	onAnalyzeCsv,
	onConfirmAiMapping,
	onResetAiMapping,
	planConfig,
	creditsDisplay,
	creditsRemaining,
	noCreditsRemaining,
	isLoadingCredits,
	upgradeUrl,
	isWhopIframe = true,
	result,
	onExportRun,
	onImportRun,
	estimatedFileSize,
	isRunning,
	isEngineLoading,
	progress,
	onRunSimulation,
	onNavigateToResults,
}: RunPanelProps) {
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [numPaths, setNumPaths] = useState(Math.min(10000, planConfig.maxPaths));
	const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
	const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const isSimulationRunning = isRunning || isEngineLoading;

	// Cycle through messages every 2.5 seconds (with 0.4s fade, so ~2.1s visible)
	useEffect(() => {
		// Clear any existing interval first
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (isSimulationRunning) {
			// Start cycling messages immediately - use a more resilient approach
			const updateMessage = () => {
				// Use functional update to avoid stale closures
				setLoadingMessageIndex((prev) => {
					try {
						// Ensure we have valid messages array
						if (!LOADING_MESSAGES || LOADING_MESSAGES.length === 0) {
							return 0;
						}
						// Validate current index
						const currentIndex = (prev >= 0 && prev < LOADING_MESSAGES.length) ? prev : 0;
						// Calculate next index
						const next = (currentIndex + 1) % LOADING_MESSAGES.length;
						return next;
					} catch (error) {
						// If anything fails, just return 0 to reset
						return 0;
					}
				});
			};

			// Set up interval with error handling
			intervalRef.current = setInterval(() => {
				try {
					updateMessage();
				} catch (error) {
					// Silently handle any errors - don't let them break the interval
					// The interval will continue running even if one update fails
				}
			}, 2500);
			
			return () => {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
			};
		} else {
			// Reset to first message when simulation stops
			setLoadingMessageIndex(0);
		}
	}, [isSimulationRunning]);

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

	const canRun = parsedTrades && parsedTrades.length > 0 && !isRunning && !isEngineLoading;

		return (
		<motion.div 
			className="run-panel-container"
			initial="hidden"
			animate="visible"
			variants={staggerContainer}
		>
			{/* Marketing Intro Section - Only show for free plan users */}
			{planConfig.dailyCredits !== -1 && (
				<motion.section variants={fadeUp} className="run-section run-intro-section">
					<div className="run-intro-content">
						<h2 className="text-2xl sm:text-3xl font-['Space_Grotesk',_sans-serif] font-bold mb-4">
							<span className="text-[var(--text-primary)]">Know your </span>
							<span className="headline-gradient">true odds</span>
						</h2>
						<p className="text-base text-[var(--text-secondary)] leading-relaxed mb-6">
							AlphaSolver is a <strong className="text-[var(--text-primary)]">Monte Carlo simulation tool</strong> designed to help prop firm traders understand their true probability of passing evaluations and getting funded.
						</p>

						<div className="grid sm:grid-cols-2 gap-4">
							{[
								{
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
										</svg>
									),
									title: "Data-driven decisions",
									desc: "Know your actual odds before paying for an evaluation"
								},
								{
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									),
									title: "Cost analysis",
									desc: "Understand the true cost including resets and fees"
								},
								{
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
										</svg>
									),
									title: "Risk assessment",
									desc: "See best and worst case scenarios"
								},
								{
									icon: (
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
										</svg>
									),
									title: "Strategy optimization",
									desc: "Get personalized trading plan recommendations"
								}
							].map((item, i) => (
								<motion.div
									key={i}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 + i * 0.1 }}
									className="dash-card p-4"
								>
									<div className="w-10 h-10 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center text-[var(--accent)] mb-3">
										{item.icon}
									</div>
									<div className="font-semibold mb-1 text-sm text-[var(--text-primary)]">{item.title}</div>
									<div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
								</motion.div>
							))}
						</div>
					</div>
				</motion.section>
			)}

			{/* Plan & Credits Section - Only show for free plan users */}
			{planConfig.dailyCredits !== -1 && (
				<motion.section variants={fadeUp} className="run-section">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-[var(--text-primary)]">
							{planConfig.label} Plan
						</h3>
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
				</motion.section>
			)}

			{/* Import / Export */}
			<motion.section variants={fadeUp} className="run-section">
				<h3 className="section-header">Import / Export</h3>
				<div className="flex gap-3">
					<button
						className="btn btn-soft btn-md flex-1"
						disabled={!result || !planConfig.allowExport}
						onClick={onExportRun}
						title={!planConfig.allowExport ? "Upgrade to Unlimited to export runs" : undefined}
					>
						Export Run
					</button>
					<button
						className="btn btn-soft btn-md flex-1"
						onClick={onImportRun}
					>
						Import Run
					</button>
				</div>
				{result && (
					<p className="text-xs text-[var(--text-muted)] mt-2">
						Est. file size: {estimatedFileSize}
					</p>
				)}
			</motion.section>

			{/* Account Configuration */}
			<motion.section variants={fadeUp} className="run-section">
				<h3 className="section-header">Account</h3>
				<AccountConfigPanel
					config={accountConfig}
					onChange={onAccountConfigChange}
				/>
			</motion.section>

			{/* Trade Log Upload */}
			<motion.section variants={fadeUp} className="run-section">
				<h3 className="section-header">Trade Log</h3>
				<div className="space-y-4">
					<div>
						<label className="section-label">CSV Format</label>
						<select
							className="select"
							value={csvFormat}
							onChange={(e) => onCsvFormatChange(e.target.value as CsvFormat)}
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
											onClick={onAnalyzeCsv}
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
												onClick={onResetAiMapping}
											>
												Re-analyze
											</button>
											<button
												className="btn btn-success btn-sm flex-1"
												onClick={onConfirmAiMapping}
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
											onClick={onResetAiMapping}
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
							onChange={onFileChange}
							className="hidden"
						/>
						<div
							onDragOver={onDragOver}
							onDrop={onDrop}
							className={`file-drop-zone ${csvFile ? 'has-file' : ''}`}
							onClick={onFileSelect}
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
											onRemoveFile();
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
											onFileSelect();
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
			</motion.section>

			{/* Simulation Controls */}
			<motion.section variants={fadeUp} className="run-section">
				<h3 className="section-header">Simulation</h3>
				<div className="space-y-5">
					{/* Monte Carlo Runs */}
					<div>
						<label className="section-label">Monte Carlo Runs</label>
						<div className="flex items-center gap-2">
							<button
								type="button"
								className="btn btn-stepper"
								onClick={() => setNumPaths(Math.max(1, numPaths - 1000))}
								disabled={numPaths <= 1}
							>
								-
							</button>
							<input
								type="number"
								value={numPaths}
								min={1}
								max={250000}
								onChange={(e) => {
									const val = parseInt(e.target.value) || 0;
									setNumPaths(Math.min(Math.max(1, val), 250000));
								}}
								className="input input-number flex-1"
							/>
							<button
								type="button"
								className="btn btn-stepper"
								onClick={() => setNumPaths(Math.min(numPaths + 1000, 250000))}
								disabled={numPaths >= 250000}
							>
								+
							</button>
						</div>
						<p className="text-xs text-[var(--text-muted)] mt-2">
							Max: 250,000 paths
						</p>
					</div>

					{/* Advanced (Expandable) */}
					<div>
						<button
							type="button"
							className="expand-trigger"
							onClick={() => setShowAdvanced(!showAdvanced)}
						>
							<svg 
								className={`expand-icon ${showAdvanced ? 'expanded' : ''}`}
								viewBox="0 0 24 24" 
								fill="none" 
								stroke="currentColor" 
								strokeWidth="2"
							>
								<path d="M9 18l6-6-6-6" />
							</svg>
							<span className="text-sm font-medium text-[var(--text-primary)]">
								Advanced
							</span>
						</button>
						
						<AnimatePresence>
							{showAdvanced && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.2 }}
									className="overflow-hidden"
								>
									<div className="expand-content mt-3 space-y-4">
										<div>
											<label className="section-label">Confidence Interval</label>
											<select
												className="select"
												value={String(confidenceLevel)}
												onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
											>
												<option value="0.90">90% CI</option>
												<option value="0.95">95% CI (default)</option>
												<option value="0.99">99% CI</option>
											</select>
											<p className="text-xs text-[var(--text-muted)] mt-2">
												Higher CI = wider range, more conservative estimate
											</p>
										</div>
										<p className="text-xs text-[var(--text-muted)] leading-relaxed">
											Bootstrapped simulation uses your uploaded trade log to resample historical trades.
											This provides more realistic results based on your actual trading performance.
										</p>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Run Simulation Button or Report Ready */}
					{result && !isSimulationRunning ? (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className="report-ready-card"
							onClick={onNavigateToResults}
						>
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-[var(--positive-dim)] flex items-center justify-center">
									<svg className="w-6 h-6 text-[var(--positive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<div className="flex-1">
									<div className="text-lg font-semibold text-[var(--positive)]">Report Ready</div>
									<div className="text-sm text-[var(--text-muted)]">Click to view simulation results</div>
								</div>
								<svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</div>
						</motion.div>
					) : isSimulationRunning ? (
						<div className="simulation-loading">
							<div className="flex flex-col items-center justify-center py-8">
								<div className="relative mb-4">
									<div className="w-16 h-16 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
									<div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[var(--positive)] rounded-full animate-spin" style={{ animationDelay: '0.15s', animationDuration: '1.5s' }} />
								</div>
								<div className="text-base font-semibold text-[var(--text-primary)] mb-1">
									{isEngineLoading ? "Loading simulation engine..." : "Running simulation..."}
								</div>
								<div className="text-sm text-[var(--text-muted)] mt-2 text-center px-4 min-h-[20px] flex items-center justify-center">
									<AnimatePresence mode="wait" initial={false}>
										{LOADING_MESSAGES && LOADING_MESSAGES.length > 0 && (
											<motion.span
												key={`msg-${loadingMessageIndex}`}
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												transition={{ 
													duration: 0.4,
													ease: [0.4, 0, 0.2, 1] // Smooth easing curve
												}}
											>
												{LOADING_MESSAGES[loadingMessageIndex] || LOADING_MESSAGES[0] || "Running simulation..."}
											</motion.span>
										)}
									</AnimatePresence>
								</div>
							</div>
						</div>
					) : (
						<>
							<motion.button
								type="button"
								className="btn btn-primary btn-lg w-full"
								onClick={handleRunSimulation}
								disabled={!canRun}
								whileHover={canRun ? { scale: 1.02 } : {}}
								whileTap={canRun ? { scale: 0.98 } : {}}
							>
								Run Simulation
							</motion.button>
							
							{(!parsedTrades || parsedTrades.length === 0) && (
								<div className="callout callout-warning">
									Please upload a trade log CSV file first
								</div>
							)}
						</>
					)}
				</div>
			</motion.section>
		</motion.div>
	);
}

