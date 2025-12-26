"use client";

import type {
	SimulationMode,
	SimulationParams,
	ParsedTrade,
	SimulationResult,
} from "../types";

// Pyodide types (minimal type definitions)
declare global {
	interface Window {
		loadPyodide?: (config: {
			indexURL: string;
		}) => Promise<PyodideInterface>;
	}
}

interface PyodideInterface {
	runPython: (code: string) => any;
	runPythonAsync: (code: string) => Promise<any>;
	loadPackage: (packages: string[]) => Promise<void>;
	FS: {
		writeFile: (path: string, data: string) => void;
		readFile: (path: string) => string;
	};
	toJs: (obj: any) => any;
}

class SimulationError extends Error {
	constructor(message: string, public originalError?: unknown) {
		super(message);
		this.name = "SimulationError";
	}
}

let pyodideInstance: PyodideInterface | null = null;
let isLoading = false;
let loadPromise: Promise<PyodideInterface> | null = null;

const PYODIDE_VERSION = "v0.24.1";
const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/pyodide.js`;

const PYTHON_FILES = [
	"account_models.py",
	"trader.py",
	"trading_strategies.py",
	"simulation.py",
	"alphasolver_entry.py",
] as const;

/**
 * Loads Pyodide from CDN and initializes it.
 * This is a singleton - Pyodide is only loaded once.
 */
export async function loadPyodide(): Promise<PyodideInterface> {
	if (pyodideInstance) {
		return pyodideInstance;
	}

	if (isLoading && loadPromise) {
		return loadPromise;
	}

	isLoading = true;
	loadPromise = (async () => {
		try {
			// Load Pyodide script if not already loaded
			if (typeof window === "undefined") {
				throw new SimulationError(
					"Pyodide can only be loaded in a browser environment",
				);
			}

			if (!window.loadPyodide) {
				// Load the Pyodide script dynamically
				await new Promise<void>((resolve, reject) => {
					// Check if script already exists
					const existingScript = document.querySelector(
						`script[src="${PYODIDE_CDN_URL}"]`,
					);
					if (existingScript) {
						// Wait for it to load
						existingScript.addEventListener("load", () => resolve());
						existingScript.addEventListener("error", () =>
							reject(
								new SimulationError(
									"Failed to load Pyodide script",
								),
							),
						);
						return;
					}

					const script = document.createElement("script");
					script.src = PYODIDE_CDN_URL;
					script.onload = () => {
						// Give Pyodide a moment to initialize
						setTimeout(resolve, 100);
					};
					script.onerror = () =>
						reject(
							new SimulationError(
								"Failed to load Pyodide from CDN. Please check your internet connection.",
							),
						);
					document.head.appendChild(script);
				});

				// Verify loadPyodide is available
				if (!window.loadPyodide) {
					throw new SimulationError(
						"Pyodide failed to initialize. Please refresh the page.",
					);
				}
			}

			// Initialize Pyodide
			const pyodide = await window.loadPyodide!({
				indexURL: `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`,
			});

			// Load required packages
			// json is part of the Python stdlib, so only load external packages
			// matplotlib, scipy, and sklearn are needed for simulation analysis (clustering, confidence intervals, plotting)
			await pyodide.loadPackage(["numpy", "pandas", "matplotlib", "scipy", "scikit-learn"]);

			// Create a directory for our Python modules and add it to sys.path
			pyodide.runPython(`
import sys
import os
os.makedirs('/py_modules', exist_ok=True)
if '/py_modules' not in sys.path:
    sys.path.insert(0, '/py_modules')
`);

			// Load Python files from /public/py/ and write them to filesystem
			for (const filename of PYTHON_FILES) {
				try {
					const response = await fetch(`/py/${filename}`);
					if (!response.ok) {
						throw new SimulationError(
							`Failed to load Python file: ${filename}. Make sure it exists in /public/py/`,
						);
					}
					const pythonCode = await response.text();
					// Write file to Pyodide filesystem
					pyodide.FS.writeFile(`/py_modules/${filename}`, pythonCode);
				} catch (error) {
					if (error instanceof SimulationError) {
						throw error;
					}
					throw new SimulationError(
						`Error loading Python file ${filename}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}

			// Import modules in the correct order using importlib
			// This ensures dependencies are available when imported
			const moduleNames = PYTHON_FILES.map((f) => f.replace(".py", ""));
			for (const moduleName of moduleNames) {
				try {
					const importCode = `
import importlib.util
import sys

module_name = ${JSON.stringify(moduleName)}
file_path = "/py_modules/" + module_name + ".py"

spec = importlib.util.spec_from_file_location(module_name, file_path)
if spec and spec.loader:
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
`;
					await pyodide.runPythonAsync(importCode);
				} catch (error) {
					throw new SimulationError(
						`Error importing Python module ${moduleName}: ${error instanceof Error ? error.message : String(error)}`,
					);
				}
			}

			pyodideInstance = pyodide;
			isLoading = false;
			return pyodide;
		} catch (error) {
			isLoading = false;
			loadPromise = null;
			if (error instanceof SimulationError) {
				throw error;
			}
			throw new SimulationError(
				`Failed to initialize Pyodide: ${error instanceof Error ? error.message : String(error)}`,
				error,
			);
		}
	})();

	return loadPromise;
}

/**
 * Runs a simulation using Pyodide and Python code.
 * @param mode - Simulation mode: "parametric" or "bootstrapped"
 * @param params - Simulation parameters
 * @param trades - Optional parsed trades for bootstrapped mode
 * @returns Simulation results
 */
export async function runSimulation(
	mode: SimulationMode,
	params: SimulationParams,
	trades?: ParsedTrade[],
): Promise<SimulationResult> {
	try {
		// Ensure Pyodide is loaded
		const pyodide = await loadPyodide();

		// Convert params to JSON string
		const paramsJson = JSON.stringify(params);

		// Convert trades to JSON string if provided
		const tradesJson = trades ? JSON.stringify(trades) : "null";

		// For large simulations (50k+), process in chunks to prevent browser hangs
		const numPaths = params.numPaths || 1000;
		const CHUNK_SIZE = 5000; // Process 5k paths per chunk for better responsiveness
		const USE_CHUNKING = numPaths >= 50000; // Use chunking for 50k+ paths
		
		let resultJson: any;
		
		if (USE_CHUNKING) {
			// Process simulation in chunks with yields between chunks
			const numChunks = Math.ceil(numPaths / CHUNK_SIZE);
			
			// Process chunks sequentially with yields
			const allResults: any[] = [];
			
			for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
				const startPath = chunkIdx * CHUNK_SIZE;
				const endPath = Math.min(startPath + CHUNK_SIZE, numPaths);
				const chunkPaths = endPath - startPath;
				
				if (chunkPaths <= 0) break;
				
				// Create params for this chunk
				const chunkParams = { ...params, numPaths: chunkPaths };
				const chunkParamsJson = JSON.stringify(chunkParams);
				
				const pythonCode = `
import json
from alphasolver_entry import run_simulation

params_json = ${JSON.stringify(chunkParamsJson)}
trades_json = ${JSON.stringify(tradesJson)}
mode = ${JSON.stringify(mode)}

def execute_simulation():
    try:
        result = run_simulation(mode, params_json, trades_json)
        result_json = json.dumps(result, allow_nan=False)
        return result_json
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        raise Exception(f"Python simulation error: {str(e)}\\nTraceback:\\n{error_trace}")

execute_simulation()
`;
				
				try {
					// Run chunk
					const chunkResultJson = await pyodide.runPythonAsync(pythonCode);
					const chunkResult = typeof chunkResultJson === "string" 
						? JSON.parse(chunkResultJson) 
						: pyodide.toJs(chunkResultJson);
					allResults.push(chunkResult);
					
					// Yield to browser between chunks to prevent hanging
					await new Promise<void>(resolve => setTimeout(resolve, 50));
				} catch (chunkError) {
					const errorMsg =
						chunkError instanceof Error
							? chunkError.message
							: String(chunkError);
					throw new SimulationError(
						`Chunk ${chunkIdx + 1}/${numChunks} failed: ${errorMsg}`,
						chunkError,
					);
				}
			}
			
			// Merge results from all chunks
			if (allResults.length === 0) {
				throw new SimulationError("No chunks processed");
			}
			
			// Merge equity curves, final values, and path indices
			const mergedEquityCurves: number[][] = [];
			const mergedFinalValues: number[] = [];
			const mergedWinningPaths: number[] = [];
			const mergedLosingPaths: number[] = [];
			
			let pathOffset = 0;
			let totalWinning = 0;
			let totalLosing = 0;
			let sumExpectedPayout = 0;
			let sumMaxDd = 0;
			
			for (const chunkResult of allResults) {
				if (Array.isArray(chunkResult.equityCurves)) {
					mergedEquityCurves.push(...chunkResult.equityCurves);
				}
				if (Array.isArray(chunkResult.finalValues)) {
					mergedFinalValues.push(...chunkResult.finalValues);
				}
				if (Array.isArray(chunkResult.winningPathIndices)) {
					mergedWinningPaths.push(...chunkResult.winningPathIndices.map((p: number) => p + pathOffset));
					totalWinning += chunkResult.winningPathIndices.length;
				}
				if (Array.isArray(chunkResult.losingPathIndices)) {
					mergedLosingPaths.push(...chunkResult.losingPathIndices.map((p: number) => p + pathOffset));
					totalLosing += chunkResult.losingPathIndices.length;
				}
				
				const chunkSize = chunkResult.finalValues?.length || 0;
				if (chunkSize > 0) {
					sumExpectedPayout += (chunkResult.expectedPayout || 0) * chunkSize;
					sumMaxDd += (chunkResult.maxDrawdown || 0);
					pathOffset += chunkSize;
				}
			}
			
			// Create merged result
			const totalPaths = mergedFinalValues.length;
			const firstResult = allResults[0];
			
			resultJson = JSON.stringify({
				...firstResult,
				equityCurves: mergedEquityCurves,
				finalValues: mergedFinalValues,
				winningPathIndices: mergedWinningPaths,
				losingPathIndices: mergedLosingPaths,
				expectedPayout: totalPaths > 0 ? sumExpectedPayout / totalPaths : 0,
				passProbability: totalPaths > 0 ? (totalWinning / totalPaths) * 100 : 0,
				failProbability: totalPaths > 0 ? (totalLosing / totalPaths) * 100 : 0,
				maxDrawdown: allResults.length > 0 ? sumMaxDd / allResults.length : 0,
				averageFinalValue: mergedFinalValues.length > 0 
					? mergedFinalValues.reduce((a, b) => a + b, 0) / mergedFinalValues.length 
					: 0,
				medianFinalValue: mergedFinalValues.length > 0
					? (() => {
							const sorted = [...mergedFinalValues].sort((a, b) => a - b);
							const mid = Math.floor(sorted.length / 2);
							return sorted.length % 2 === 0 
								? (sorted[mid - 1] + sorted[mid]) / 2 
								: sorted[mid];
						})()
					: 0,
			});
		} else {
			// Standard processing for smaller simulations
			const pythonCode = `
import json
from alphasolver_entry import run_simulation

params_json = ${JSON.stringify(paramsJson)}
trades_json = ${JSON.stringify(tradesJson)}
mode = ${JSON.stringify(mode)}

def execute_simulation():
    try:
        result = run_simulation(mode, params_json, trades_json)
        # Ensure result is JSON-serializable and convert to JSON string
        result_json = json.dumps(result, allow_nan=False)
        return result_json
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        raise Exception(f"Python simulation error: {str(e)}\\nTraceback:\\n{error_trace}")

execute_simulation()
`;

			try {
				resultJson = await pyodide.runPythonAsync(pythonCode);
			} catch (pyError) {
				// If Python code raises an exception, it will be caught here
				const errorMsg =
					pyError instanceof Error
						? pyError.message
						: String(pyError);
				throw new SimulationError(
					`Python execution error: ${errorMsg}`,
					pyError,
				);
			}
		}

		// Check if result is undefined or null
		if (resultJson === undefined || resultJson === null) {
			throw new SimulationError(
				"Python simulation returned undefined or null. The simulation may have failed silently. Check browser console for Python errors.",
			);
		}

		// Parse the result
		let result: SimulationResult;
		try {
			// If resultJson is already an object (Pyodide might return it as such)
			if (typeof resultJson === "object" && resultJson !== null) {
				result = pyodide.toJs(resultJson) as SimulationResult;
			} else if (typeof resultJson === "string") {
				result = JSON.parse(resultJson);
			} else {
				throw new SimulationError(
					`Failed to parse simulation results. Unexpected type: ${typeof resultJson}. Value: ${String(resultJson).substring(0, 200)}`,
				);
			}
		} catch (parseError) {
			const errorMsg =
				parseError instanceof Error
					? parseError.message
					: String(parseError);
			throw new SimulationError(
				`Failed to parse simulation results: ${errorMsg}. Raw result type: ${typeof resultJson}, value: ${String(resultJson).substring(0, 500)}`,
				parseError,
			);
		}

		// Validate result structure
		if (
			typeof result.expectedPayout !== "number" ||
			typeof result.passProbability !== "number" ||
			typeof result.maxDrawdown !== "number" ||
			!Array.isArray(result.equityCurves) ||
			!Array.isArray(result.finalValues)
		) {
			throw new SimulationError(
				"Simulation returned invalid result structure. Expected fields: expectedPayout, passProbability, maxDrawdown, equityCurves, finalValues",
			);
		}

		return result;
	} catch (error) {
		if (error instanceof SimulationError) {
			throw error;
		}

		// Handle Python errors
		const errorMessage =
			error instanceof Error
				? error.message
				: `Unknown error: ${String(error)}`;

		// Try to extract more details from Python errors
		if (errorMessage.includes("Python simulation error")) {
			throw new SimulationError(
				errorMessage.replace("Python simulation error: ", ""),
				error,
			);
		}

		throw new SimulationError(
			`Simulation failed: ${errorMessage}`,
			error,
		);
	}
}

export { SimulationError };
