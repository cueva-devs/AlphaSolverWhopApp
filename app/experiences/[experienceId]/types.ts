export type CsvFormat = 
	| "NinjaTrader" 
	| "TradingView (Strategy Tester)" 
	| "TradingView (Broker History)" 
	| "Rithmic / R|Trader" 
	| "Tradovate" 
	| "Generic (Simple)" 
	| "Custom";

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
	template: CsvFormat;
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
export type PropFirm = "Topstep" | "Take Profit Trader" | "Funded Futures Network" | "Tradeify" | "Custom";
export type ChallengeSize = string; // Dynamic based on prop firm

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
	// Trading plan
	tradingPlan?: TradingPlan;
}

export interface OutcomeScenario {
	scenario: string;
	probability: number;
	days: number;
	maxDD: number;
	netPnl: number;
}

// Trading Plan Types
export interface ClusterInfo {
	name: string;
	probability: number;
	days_median: number;
	max_drawdown_median: number;
	final_pnl_median: number;
	description: string;
}

export interface OptimalStrategy {
	label: string;
	description: string;
	optimization: string;
	cluster_info: ClusterInfo;
	viable_for_30d: boolean;
	months_to_pass: number;
	target_days: number;
	target_days_range: [number, number];
	daily_pnl_target: number;
	daily_loss_stop: number;
	daily_win_rate_needed: number;
	max_drawdown_safe: number;
	prop_firm_max_loss?: number;
	expected_pnl: number;
	cluster_probability: number;
}

export interface WinnerLoserStats {
	count: number;
	days_median?: number;
	days_range?: [number, number];
	avg_daily_pnl?: number;
	daily_win_rate?: number;
	max_drawdown_median?: number;
	final_pnl_median?: number;
}

export interface BestPath {
	days: number;
	final_pnl: number;
	avg_daily_pnl: number;
	daily_win_rate: number;
	max_drawdown: number;
}

export interface TradingPlan {
	passRate: number;
	passRateCi: [number, number];
	failRate: number;
	numSimulations: number;
	optimalStrategies: Record<string, OptimalStrategy>;
	winners: WinnerLoserStats | null;
	losers: WinnerLoserStats | null;
	bestPath: BestPath | null;
	rules: Record<string, unknown> | null;
	propFirm: Record<string, number>;
	allWinningClusters: ClusterInfo[];
	simulatedEv?: number;
}

