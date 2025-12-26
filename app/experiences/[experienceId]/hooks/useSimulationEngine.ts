"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { runSimulation } from "../lib/pyodideClient";
import type {
	SimulationMode,
	SimulationParams,
	ParsedTrade,
	SimulationResult,
} from "../types";

export interface SimulationProgress {
	/** Progress percentage (0-100) */
	progress: number;
	/** Estimated time remaining in seconds */
	estimatedSecondsRemaining: number;
	/** Elapsed time in seconds */
	elapsedSeconds: number;
	/** Estimated total time in seconds */
	estimatedTotalSeconds: number;
	/** Current phase description */
	phase: "loading" | "simulating" | "processing";
}

interface UseSimulationEngineReturn {
	isEngineLoading: boolean;
	isRunning: boolean;
	error: string | null;
	result: SimulationResult | null;
	progress: SimulationProgress | null;
	run: (
		mode: SimulationMode,
		params: SimulationParams,
		trades?: ParsedTrade[],
	) => Promise<void>;
	reset: () => void;
}

/**
 * Estimate simulation duration based on parameters
 * Based on empirical testing: ~10-50 paths/second depending on device
 * More conservative estimate for better UX (under-promise, over-deliver)
 */
function estimateSimulationTime(params: SimulationParams): number {
	const numPaths = params.numPaths || 1000;
	const numDays = params.numDays || 30;
	
	// Base performance: ~15 paths/second (conservative estimate)
	// More days = more computation per path
	const basePathsPerSecond = 15;
	const daysMultiplier = Math.max(1, numDays / 30); // Scale with days
	
	// Estimated seconds for simulation
	const simulationSeconds = (numPaths / basePathsPerSecond) * daysMultiplier;
	
	// Add overhead for Pyodide initialization and result processing
	const overheadSeconds = 2;
	
	return simulationSeconds + overheadSeconds;
}

/**
 * React hook for managing simulation engine state and execution.
 * Handles Pyodide loading, simulation execution, and error handling.
 */
export function useSimulationEngine(): UseSimulationEngineReturn {
	const [isEngineLoading, setIsEngineLoading] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<SimulationResult | null>(null);
	const [progress, setProgress] = useState<SimulationProgress | null>(null);
	
	const startTimeRef = useRef<number | null>(null);
	const estimatedTotalRef = useRef<number>(0);
	const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Update progress every 100ms
	useEffect(() => {
		if (isRunning || isEngineLoading) {
			progressIntervalRef.current = setInterval(() => {
				if (startTimeRef.current) {
					const elapsed = (Date.now() - startTimeRef.current) / 1000;
					const estimatedTotal = estimatedTotalRef.current;
					
					let phase: SimulationProgress["phase"];
					let progressPercent: number;
					
					if (isEngineLoading) {
						// Pyodide loading: 0-20% of total time
						phase = "loading";
						const loadingTime = Math.min(elapsed, estimatedTotal * 0.2);
						progressPercent = (loadingTime / estimatedTotal) * 20;
					} else {
						// Simulation: 20-95% of total time
						phase = "simulating";
						const simulationStart = estimatedTotal * 0.2;
						const simulationElapsed = Math.max(0, elapsed - simulationStart);
						const simulationDuration = estimatedTotal * 0.75;
						progressPercent = 20 + Math.min(75, (simulationElapsed / simulationDuration) * 75);
					}
					
					const remaining = Math.max(0, estimatedTotal - elapsed);
					
					setProgress({
						progress: Math.min(99, progressPercent),
						estimatedSecondsRemaining: Math.ceil(remaining),
						elapsedSeconds: Math.floor(elapsed),
						estimatedTotalSeconds: estimatedTotal,
						phase,
					});
				}
			}, 100);
		} else {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;
			}
			if (!isRunning && !isEngineLoading) {
				// Clear progress when complete
				setProgress(null);
				startTimeRef.current = null;
			}
		}
		
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current);
			}
		};
	}, [isRunning, isEngineLoading]);

	const run = useCallback(
		async (
			mode: SimulationMode,
			params: SimulationParams,
			trades?: ParsedTrade[],
		) => {
			setIsRunning(true);
			setError(null);
			setResult(null);
			
			// Estimate total time
			const estimatedTotal = estimateSimulationTime(params);
			estimatedTotalRef.current = estimatedTotal;
			startTimeRef.current = Date.now();
			
			setProgress({
				progress: 0,
				estimatedSecondsRemaining: Math.ceil(estimatedTotal),
				elapsedSeconds: 0,
				estimatedTotalSeconds: estimatedTotal,
				phase: "loading",
			});

			// Set loading state if Pyodide hasn't been loaded yet
			setIsEngineLoading(true);

			try {
				const simulationResult = await runSimulation(mode, params, trades);
				setResult(simulationResult);
				setError(null);
				// Set progress to 100% briefly before clearing
				if (startTimeRef.current) {
					const elapsed = (Date.now() - startTimeRef.current) / 1000;
					setProgress({
						progress: 100,
						estimatedSecondsRemaining: 0,
						elapsedSeconds: Math.floor(elapsed),
						estimatedTotalSeconds: estimatedTotal,
						phase: "processing",
					});
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: `Unknown error: ${String(err)}`;
				setError(errorMessage);
				setResult(null);
				setProgress(null);
			} finally {
				setIsRunning(false);
				setIsEngineLoading(false);
				startTimeRef.current = null;
			}
		},
		[],
	);

	const reset = useCallback(() => {
		setError(null);
		setResult(null);
		setIsRunning(false);
		setProgress(null);
		startTimeRef.current = null;
	}, []);

	return {
		isEngineLoading,
		isRunning,
		error,
		result,
		progress,
		run,
		reset,
	};
}
