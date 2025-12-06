"use client";

import { useState, useEffect } from "react";
import { useSimulationEngine } from "../hooks/useSimulationEngine";
import type { ParametricParams } from "../types";

/**
 * Debug panel for testing Pyodide integration end-to-end.
 * This is a dev-only component to verify that:
 * - Pyodide loads correctly
 * - Python modules import successfully
 * - run_simulation can be called and returns results
 */
export default function PyodideDebugPanel() {
	const { run, result, isRunning, error, isEngineLoading } =
		useSimulationEngine();
	const [testStatus, setTestStatus] = useState<string | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const [lastResult, setLastResult] = useState<any>(null);
	const [hasRunTest, setHasRunTest] = useState(false);

	// Update status based on hook state changes
	useEffect(() => {
		if (!hasRunTest) return;

		if (isEngineLoading) {
			setTestStatus("Loading Pyodide engine...");
		} else if (isRunning) {
			setTestStatus("Running simulation...");
		} else if (error) {
			// Categorize error type
			let errorType = "Unknown";
			if (error.includes("Pyodide") || error.includes("CDN")) {
				errorType = "Pyodide Loading Error";
			} else if (
				error.includes("import") ||
				error.includes("ModuleNotFoundError") ||
				error.includes("Failed to load Python file")
			) {
				errorType = "Python Import Error";
			} else if (
				error.includes("simulation") ||
				error.includes("run_simulation") ||
				error.includes("Python simulation error")
			) {
				errorType = "Python Execution Error";
			}

			setLastError(`[${errorType}]\n${error}`);
			setLastResult(null);
			setTestStatus("Failed ✗");
		} else if (result) {
			setLastResult(result);
			setLastError(null);
			setTestStatus("Success ✓");
		}
	}, [isEngineLoading, isRunning, error, result, hasRunTest]);

	const handleSmokeTest = async () => {
		setTestStatus("Initializing...");
		setLastError(null);
		setLastResult(null);
		setHasRunTest(true);

		// Minimal test parameters for smoke test
		const testParams: ParametricParams = {
			stopSize: 50,
			takeProfitSize: 100,
			winRate: 60,
			averageMFE: 80,
			tradesPerDay: 2,
			numPaths: 100, // Small number for quick test
			numDays: 30, // Minimal days
		};

		try {
			await run("parametric", testParams);
			// Status will be updated via useEffect when hook state changes
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: `Unknown error: ${String(err)}`;

			// Categorize error type
			let errorType = "Unknown";
			if (
				errorMessage.includes("Pyodide") ||
				errorMessage.includes("CDN") ||
				errorMessage.includes("browser environment")
			) {
				errorType = "Pyodide Loading Error";
			} else if (
				errorMessage.includes("import") ||
				errorMessage.includes("ModuleNotFoundError") ||
				errorMessage.includes("Failed to load Python file")
			) {
				errorType = "Python Import Error";
			} else if (
				errorMessage.includes("simulation") ||
				errorMessage.includes("run_simulation") ||
				errorMessage.includes("Python simulation error")
			) {
				errorType = "Python Execution Error";
			}

			setLastError(`[${errorType}]\n${errorMessage}`);
			setTestStatus("Failed ✗");
		}
	};

	const getStatusMessage = () => {
		if (isEngineLoading) {
			return "Engine loading...";
		}
		if (isRunning) {
			return "Running simulation...";
		}
		if (testStatus) {
			return testStatus;
		}
		return "Ready";
	};

	return (
		<div className="mt-6 p-4 border border-gray-a6 rounded-lg bg-gray-a1">
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-semibold text-gray-11">
					Developer Tools
				</h3>
				<button
					onClick={handleSmokeTest}
					disabled={isRunning || isEngineLoading}
					className="px-3 py-1.5 text-xs font-medium bg-blue-9 hover:bg-blue-10 disabled:bg-gray-8 disabled:cursor-not-allowed text-white rounded transition-colors"
				>
					{isRunning || isEngineLoading
						? "Running..."
						: "Run Pyodide Smoke Test"}
				</button>
			</div>

			<div className="space-y-2 text-xs">
				<div className="flex items-center gap-2">
					<span className="text-gray-10">Status:</span>
					<span
						className={`font-mono ${
							isEngineLoading || isRunning
								? "text-yellow-11"
								: testStatus?.includes("Success")
									? "text-green-11"
									: testStatus?.includes("Failed")
										? "text-red-11"
										: "text-gray-11"
						}`}
					>
						{getStatusMessage()}
					</span>
				</div>

				{lastError && (
					<div className="mt-3 p-2 bg-red-3 border border-red-6 rounded text-red-11">
						<div className="font-semibold mb-1">Error:</div>
						<pre className="text-xs whitespace-pre-wrap break-words font-mono">
							{lastError}
						</pre>
					</div>
				)}

				{lastResult && (
					<div className="mt-3 p-2 bg-green-3 border border-green-6 rounded">
						<div className="font-semibold mb-2 text-green-11">
							Test Result:
						</div>
						<div className="text-xs text-gray-10 mb-2">
							Key metrics: Expected Payout: $
							{lastResult.expectedPayout?.toFixed(2) || "N/A"}, Pass
							Probability:{" "}
							{((lastResult.passProbability || 0) * 100).toFixed(1)}%, Max
							Drawdown: ${lastResult.maxDrawdown?.toFixed(2) || "N/A"}
						</div>
						<pre className="text-xs overflow-auto max-h-64 bg-gray-2 p-2 rounded border border-gray-a4 font-mono text-gray-11">
							{JSON.stringify(lastResult, null, 2)}
						</pre>
					</div>
				)}
			</div>
		</div>
	);
}

