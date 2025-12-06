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
			await pyodide.loadPackage(["numpy", "pandas"]);

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

		// Call the Python entry function
		const pythonCode = `
import json
from alphasolver_entry import run_simulation

params_json = ${JSON.stringify(paramsJson)}
trades_json = ${JSON.stringify(tradesJson)}
mode = ${JSON.stringify(mode)}

try:
    result = run_simulation(mode, params_json, trades_json)
    result_json = json.dumps(result)
    result_json
except Exception as e:
    raise Exception(f"Python simulation error: {str(e)}")
`;

		const resultJson = await pyodide.runPythonAsync(pythonCode);

		// Parse the result
		let result: SimulationResult;
		try {
			result = JSON.parse(resultJson);
		} catch (parseError) {
			// If resultJson is already an object (Pyodide might return it as such)
			if (typeof resultJson === "object" && resultJson !== null) {
				result = pyodide.toJs(resultJson) as SimulationResult;
			} else {
				throw new SimulationError(
					"Failed to parse simulation results. The simulation may have returned invalid data.",
					parseError,
				);
			}
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
