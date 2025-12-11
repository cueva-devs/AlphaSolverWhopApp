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
	// Trading plan (cluster-based)
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
export interface TradingPlanStrategy {
	label: string;
	description: string;
	optimization: string;
	daily_pnl_target: number;
	daily_pnl_target_30d: number;
	daily_loss_stop: number;
	max_drawdown_safe: number;
	prop_firm_max_loss: number;
	target_days: number;
	target_days_range: [number, number];
	daily_win_rate_needed: number;
	viable_for_30d: boolean;
	trading_days_per_month: number;
	months_to_pass: number;
	expected_pnl?: number;
	cluster_probability?: number;
	cluster_info?: {
		name: string;
		probability: number;
		days_median: number;
		max_drawdown_median: number;
		final_pnl_median: number;
		daily_win_rate: number;
	};
}

export interface TradingPlanWinners {
	count: number;
	cluster_name?: string;
	cluster_probability?: number;
	cluster_description?: string;
	days_median: number;
	days_range?: [number, number];
	max_dd_median: number;
	max_dd_p90?: number;
	daily_pnl_mean?: number;
	daily_pnl_median?: number;
	worst_day_median?: number;
	worst_day_p10?: number;
	daily_win_rate?: number;
	final_pnl_median?: number;
	final_pnl_range?: [number, number];
}

export interface TradingPlanLosers {
	count: number;
	num_clusters?: number;
	days_median: number;
	max_dd_median: number;
	common_failure: string;
	clusters?: Array<{
		name: string;
		probability: number;
		description: string;
	}>;
}

export interface TradingPlanBestPath {
	days: number;
	final_pnl: number;
	max_drawdown: number;
	avg_daily_pnl: number;
	best_day: number;
	worst_day: number;
	winning_days: number;
	losing_days: number;
	daily_win_rate: number;
	avg_winning_day: number;
	avg_losing_day: number;
	from_cluster?: string;
}

export interface TradingPlan {
	passRate: number;
	passRateCi: [number, number];
	failRate: number;
	numSimulations: number;
	optimalStrategies: Record<string, TradingPlanStrategy>;
	winners: TradingPlanWinners | null;
	losers: TradingPlanLosers | null;
	bestPath: TradingPlanBestPath | null;
	rules: TradingPlanStrategy | null;
	propFirm: {
		profit_target: number;
		max_loss: number;
		daily_limit: number;
	};
	kelly: {
		full_kelly: number;
		half_kelly: number;
		quarter_kelly: number;
		win_rate: number;
		win_loss_ratio: number;
		avg_win?: number;
		avg_loss?: number;
		basis?: string;
	};
	allWinningClusters: Array<{
		name: string;
		probability: number;
		days_median: number;
		max_drawdown_median: number;
		final_pnl_median: number;
		description: string;
	}>;
}

