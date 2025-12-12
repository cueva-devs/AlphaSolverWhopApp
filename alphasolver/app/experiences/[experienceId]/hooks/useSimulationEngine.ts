"use client";

import { useState, useCallback, useEffect } from "react";
import { runSimulation } from "../lib/pyodideClient";
import type {
	SimulationMode,
	SimulationParams,
	ParsedTrade,
	SimulationResult,
} from "../types";

interface UseSimulationEngineReturn {
	isEngineLoading: boolean;
	isRunning: boolean;
	error: string | null;
	result: SimulationResult | null;
	run: (
		mode: SimulationMode,
		params: SimulationParams,
		trades?: ParsedTrade[],
	) => Promise<void>;
	reset: () => void;
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

	// Note: Pyodide will be loaded lazily on first run() call
	// This avoids blocking the UI on initial mount

	const run = useCallback(
		async (
			mode: SimulationMode,
			params: SimulationParams,
			trades?: ParsedTrade[],
		) => {
			setIsRunning(true);
			setError(null);
			setResult(null);

			// Set loading state if Pyodide hasn't been loaded yet
			setIsEngineLoading(true);

			try {
				const simulationResult = await runSimulation(mode, params, trades);
				setResult(simulationResult);
				setError(null);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: `Unknown error: ${String(err)}`;
				setError(errorMessage);
				setResult(null);
			} finally {
				setIsRunning(false);
				setIsEngineLoading(false);
			}
		},
		[],
	);

	const reset = useCallback(() => {
		setError(null);
		setResult(null);
		setIsRunning(false);
	}, []);

	return {
		isEngineLoading,
		isRunning,
		error,
		result,
		run,
		reset,
	};
}

