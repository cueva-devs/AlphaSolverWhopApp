"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
	BootstrappedParams,
	ParsedTrade,
	CsvFormat,
} from "../types";
import type { PlanConfig } from "../config/planConfig";

interface StrategyPanelProps {
	onRunSimulation: (
		params: BootstrappedParams,
		trades: ParsedTrade[],
	) => void;
	planConfig: PlanConfig;
	parsedTrades?: ParsedTrade[] | null;
	csvFormat?: CsvFormat;
	isRunning?: boolean;
}

export default function StrategyPanel({
	onRunSimulation,
	planConfig,
	parsedTrades,
	csvFormat = "NinjaTrader",
	isRunning = false,
}: StrategyPanelProps) {
	const [showAdvanced, setShowAdvanced] = useState(false);
	// Default to 10000 runs, but cap at plan limit
	const [numPaths, setNumPaths] = useState(Math.min(10000, planConfig.maxPaths));
	// Confidence level for CI (90%, 95%, 99%)
	const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);

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

	const canRun = parsedTrades && parsedTrades.length > 0 && !isRunning;

	return (
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

			{/* Run Simulation Button */}
			<motion.button
				type="button"
				className="btn btn-primary btn-lg w-full"
				onClick={handleRunSimulation}
				disabled={!canRun}
				whileHover={canRun ? { scale: 1.02 } : {}}
				whileTap={canRun ? { scale: 0.98 } : {}}
			>
				{isRunning ? (
					<>
						<span className="spinner" />
						Running...
					</>
				) : "Run Simulation"}
			</motion.button>
			
			{(!parsedTrades || parsedTrades.length === 0) && (
				<div className="callout callout-warning">
					Please upload a trade log CSV file first
				</div>
			)}
		</div>
	);
}
