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

export type GameType = "combine" | "funded" | "combine_only" | "funded_only";
export type PropFirm = "Topstep" | "Apex" | "FTMO" | "E8" | "Custom";
export type ChallengeSize = "10k" | "25k" | "50k" | "100k" | "150k" | "250k" | "300k";

export interface AccountConfig {
	gameType: GameType;
	propFirm: PropFirm;
	challenge: ChallengeSize;
}

export interface SimulationResult {
	expectedPayout: number;
	passProbability: number;
	failProbability: number;
	maxDrawdown: number;
	equityCurves: number[][];
	finalValues: number[];
	// Path outcomes for accurate chart coloring
	winningPathIndices?: number[];
	losingPathIndices?: number[];
	// Additional metrics
	averageFinalValue?: number;
	medianFinalValue?: number;
	winRate?: number;
	totalTrades?: number;
	// Enhanced metrics
	netPnlPerAttempt?: number;
	expectedAttemptsToPass?: number;
	avgDaysToPass?: number;
	avgDaysInFunded?: number;
	totalDaysToPayout?: number;
	// Cost analysis
	initialPurchase?: number;
	monthlyRebill?: number;
	fundedSetup?: number;
	avgTotalCostsIfPass?: number;
	avgGrossPayoutIfPass?: number;
	avgNetProfitIfPass?: number;
	avgDaysBeforeFail?: number;
	avgCostLostIfFail?: number;
	failInEvalPercent?: number;
	failInFundedPercent?: number;
	expectedCostToPayout?: number;
	expectedGrossPayout?: number;
	expectedROI?: number;
	// Trade distributions
	tradesPerDayDistribution?: number[];
	tradePnlDistribution?: number[];
	avgTradesPerDay?: number;
	avgTradePnl?: number;
	// Most probable outcomes
	mostProbableOutcomes?: OutcomeScenario[];
}

export interface OutcomeScenario {
	scenario: string;
	probability: number;
	days: number;
	maxDD: number;
	netPnl: number;
}

