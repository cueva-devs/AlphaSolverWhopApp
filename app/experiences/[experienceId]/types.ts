export interface ParametricParams {
	stopSize: number;
	takeProfitSize: number;
	winRate: number;
	averageMFE: number;
	tradesPerDay: number;
	numPaths: number;
	numDays: number;
}

export interface BootstrappedParams {
	numPaths: number;
	numDays: number;
	template: "NinjaTrader" | "Generic" | "Custom";
	pnlColumn?: string;
	dateColumn?: string;
	mfeColumn?: string;
}

export interface ParsedTrade {
	date: string;
	pnl: number;
	mfe: number;
}

export type SimulationMode = "parametric" | "bootstrapped";

export type SimulationParams = ParametricParams | BootstrappedParams;

export interface SimulationResult {
	expectedPayout: number;
	passProbability: number;
	maxDrawdown: number;
	equityCurves: number[][];
	finalValues: number[];
	// Additional metrics
	averageFinalValue?: number;
	medianFinalValue?: number;
	winRate?: number;
	totalTrades?: number;
}

