// Prop Firm Configuration
// Data sourced from official prop firm websites (Dec 2024)
// Matches PropAlphaEvalSolver/streamlit_app.py PROP_FIRMS

export interface AccountRules {
	'Initial Balance (Eval)': number;
	'Initial Balance (Funded)': number;
	'Max Loss (Eval)': number;
	'Max Loss (Funded)': number;
	'Funding Target Balance': number;
	'Unshared Winning Balance (Funded)': number;
	'Profit Share Fraction': number;
	'Winning Day PnL Minimum': number;
	'Maximum Daily Loss': number;
	'Maximum Daily Win': number;
	'Minimum Winning Days for Payout': number;
	'Minimum Winning Balance': number;
}

export interface AccountFees {
	'Eval Acct Cost': number;
	'Funded Acct Setup Cost': number;
	'Per Side Trade Cost': number;
	'Trade Entry Slippage': number;
	'Trade Stop Slippage': number;
	'Monthly Eval Cost': number;
}

export interface ChallengeConfig {
	rules: AccountRules;
	fees: AccountFees;
}

export interface PropFirmConfig {
	challenges: Record<string, ChallengeConfig>;
}

export const PROP_FIRMS: Record<string, PropFirmConfig> = {
	"Topstep": {
		challenges: {
			"50k": {
				rules: {
					'Initial Balance (Eval)': 50000,
					'Initial Balance (Funded)': 50000,
					'Max Loss (Eval)': 2000,
					'Max Loss (Funded)': 2000,
					'Funding Target Balance': 53000,
					'Unshared Winning Balance (Funded)': 60000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 200,
					'Maximum Daily Loss': 1000,
					'Maximum Daily Win': 1500,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 52000
				},
				fees: {
					'Eval Acct Cost': 49,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 49
				}
			},
			"100k": {
				rules: {
					'Initial Balance (Eval)': 100000,
					'Initial Balance (Funded)': 100000,
					'Max Loss (Eval)': 3000,
					'Max Loss (Funded)': 3000,
					'Funding Target Balance': 106000,
					'Unshared Winning Balance (Funded)': 110000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 200,
					'Maximum Daily Loss': 2000,
					'Maximum Daily Win': 3000,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 103000
				},
				fees: {
					'Eval Acct Cost': 99,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 99
				}
			},
			"150k": {
				rules: {
					'Initial Balance (Eval)': 150000,
					'Initial Balance (Funded)': 150000,
					'Max Loss (Eval)': 4500,
					'Max Loss (Funded)': 4500,
					'Funding Target Balance': 159000,
					'Unshared Winning Balance (Funded)': 165000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 200,
					'Maximum Daily Loss': 3000,
					'Maximum Daily Win': 4500,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 154500
				},
				fees: {
					'Eval Acct Cost': 149,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 149
				}
			}
		}
	},
	"Take Profit Trader": {
		challenges: {
			"25k": {
				rules: {
					'Initial Balance (Eval)': 25000,
					'Initial Balance (Funded)': 25000,
					'Max Loss (Eval)': 1500,
					'Max Loss (Funded)': 1500,
					'Funding Target Balance': 26500,
					'Unshared Winning Balance (Funded)': 27000,
					'Profit Share Fraction': 0.8,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 1,
					'Minimum Winning Balance': 26500
				},
				fees: {
					'Eval Acct Cost': 150,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 150
				}
			},
			"50k": {
				rules: {
					'Initial Balance (Eval)': 50000,
					'Initial Balance (Funded)': 50000,
					'Max Loss (Eval)': 3000,
					'Max Loss (Funded)': 3000,
					'Funding Target Balance': 53000,
					'Unshared Winning Balance (Funded)': 55000,
					'Profit Share Fraction': 0.8,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 1,
					'Minimum Winning Balance': 53000
				},
				fees: {
					'Eval Acct Cost': 170,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 170
				}
			},
			"75k": {
				rules: {
					'Initial Balance (Eval)': 75000,
					'Initial Balance (Funded)': 75000,
					'Max Loss (Eval)': 4500,
					'Max Loss (Funded)': 4500,
					'Funding Target Balance': 79500,
					'Unshared Winning Balance (Funded)': 82500,
					'Profit Share Fraction': 0.8,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 1,
					'Minimum Winning Balance': 79500
				},
				fees: {
					'Eval Acct Cost': 245,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 245
				}
			},
			"100k": {
				rules: {
					'Initial Balance (Eval)': 100000,
					'Initial Balance (Funded)': 100000,
					'Max Loss (Eval)': 6000,
					'Max Loss (Funded)': 6000,
					'Funding Target Balance': 106000,
					'Unshared Winning Balance (Funded)': 110000,
					'Profit Share Fraction': 0.8,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 1,
					'Minimum Winning Balance': 106000
				},
				fees: {
					'Eval Acct Cost': 330,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 330
				}
			},
			"150k": {
				rules: {
					'Initial Balance (Eval)': 150000,
					'Initial Balance (Funded)': 150000,
					'Max Loss (Eval)': 9000,
					'Max Loss (Funded)': 9000,
					'Funding Target Balance': 159000,
					'Unshared Winning Balance (Funded)': 165000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 1,
					'Minimum Winning Balance': 159000
				},
				fees: {
					'Eval Acct Cost': 360,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 360
				}
			}
		}
	},
	"Funded Futures Network": {
		challenges: {
			"25k": {
				rules: {
					'Initial Balance (Eval)': 25000,
					'Initial Balance (Funded)': 25000,
					'Max Loss (Eval)': 1500,
					'Max Loss (Funded)': 1500,
					'Funding Target Balance': 27000,
					'Unshared Winning Balance (Funded)': 28000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 27000
				},
				fees: {
					'Eval Acct Cost': 125,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 125
				}
			},
			"50k": {
				rules: {
					'Initial Balance (Eval)': 50000,
					'Initial Balance (Funded)': 50000,
					'Max Loss (Eval)': 2000,
					'Max Loss (Funded)': 2000,
					'Funding Target Balance': 53000,
					'Unshared Winning Balance (Funded)': 55000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 53000
				},
				fees: {
					'Eval Acct Cost': 150,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 150
				}
			},
			"100k": {
				rules: {
					'Initial Balance (Eval)': 100000,
					'Initial Balance (Funded)': 100000,
					'Max Loss (Eval)': 3600,
					'Max Loss (Funded)': 3600,
					'Funding Target Balance': 106000,
					'Unshared Winning Balance (Funded)': 110000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 106000
				},
				fees: {
					'Eval Acct Cost': 305,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 305
				}
			},
			"150k": {
				rules: {
					'Initial Balance (Eval)': 150000,
					'Initial Balance (Funded)': 150000,
					'Max Loss (Eval)': 4950,
					'Max Loss (Funded)': 4950,
					'Funding Target Balance': 159000,
					'Unshared Winning Balance (Funded)': 165000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 159000
				},
				fees: {
					'Eval Acct Cost': 350,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 350
				}
			},
			"250k": {
				rules: {
					'Initial Balance (Eval)': 250000,
					'Initial Balance (Funded)': 250000,
					'Max Loss (Eval)': 6000,
					'Max Loss (Funded)': 6000,
					'Funding Target Balance': 265000,
					'Unshared Winning Balance (Funded)': 275000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 100,
					'Maximum Daily Loss': 99999,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 5,
					'Minimum Winning Balance': 265000
				},
				fees: {
					'Eval Acct Cost': 580,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 580
				}
			}
		}
	},
	"Tradeify": {
		challenges: {
			"50k": {
				rules: {
					'Initial Balance (Eval)': 50000,
					'Initial Balance (Funded)': 50000,
					'Max Loss (Eval)': 2000,
					'Max Loss (Funded)': 2000,
					'Funding Target Balance': 53000,
					'Unshared Winning Balance (Funded)': 55000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 150,
					'Maximum Daily Loss': 1250,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 7,
					'Minimum Winning Balance': 52100
				},
				fees: {
					'Eval Acct Cost': 150,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 150
				}
			},
			"100k": {
				rules: {
					'Initial Balance (Eval)': 100000,
					'Initial Balance (Funded)': 100000,
					'Max Loss (Eval)': 3500,
					'Max Loss (Funded)': 3500,
					'Funding Target Balance': 106000,
					'Unshared Winning Balance (Funded)': 110000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 200,
					'Maximum Daily Loss': 2500,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 7,
					'Minimum Winning Balance': 103600
				},
				fees: {
					'Eval Acct Cost': 250,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 250
				}
			},
			"150k": {
				rules: {
					'Initial Balance (Eval)': 150000,
					'Initial Balance (Funded)': 150000,
					'Max Loss (Eval)': 5000,
					'Max Loss (Funded)': 5000,
					'Funding Target Balance': 159000,
					'Unshared Winning Balance (Funded)': 165000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 250,
					'Maximum Daily Loss': 3750,
					'Maximum Daily Win': 99999,
					'Minimum Winning Days for Payout': 7,
					'Minimum Winning Balance': 155100
				},
				fees: {
					'Eval Acct Cost': 350,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 350
				}
			}
		}
	},
	"Custom": {
		challenges: {
			"Custom": {
				rules: {
					'Initial Balance (Eval)': 50000,
					'Initial Balance (Funded)': 50000,
					'Max Loss (Eval)': 2000,
					'Max Loss (Funded)': 2000,
					'Funding Target Balance': 53000,
					'Unshared Winning Balance (Funded)': 60000,
					'Profit Share Fraction': 0.9,
					'Winning Day PnL Minimum': 200,
					'Maximum Daily Loss': 1000,
					'Maximum Daily Win': 1500,
					'Minimum Winning Days for Payout': 30,
					'Minimum Winning Balance': 60000
				},
				fees: {
					'Eval Acct Cost': 0,
					'Funded Acct Setup Cost': 0,
					'Per Side Trade Cost': 0,
					'Trade Entry Slippage': 0,
					'Trade Stop Slippage': 0,
					'Monthly Eval Cost': 0
				}
			}
		}
	}
};

// CSV Format Templates - matches trading_strategies.py CSV_TEMPLATES
export const CSV_TEMPLATES = {
	"NinjaTrader": {
		description: "NinjaTrader Trade Performance export",
		pnlColumn: "Profit",
		dateColumn: "Entry time",
		mfeColumn: "MFE"
	},
	"TradingView (Strategy Tester)": {
		description: "TradingView Strategy Tester export (List of Trades)",
		pnlColumn: "Profit",
		dateColumn: "Date/Time",
		mfeColumn: null
	},
	"TradingView (Broker History)": {
		description: "TradingView Broker Account History export",
		pnlColumn: "Profit",
		dateColumn: "Close Time",
		mfeColumn: null
	},
	"Rithmic / R|Trader": {
		description: "Rithmic R|Trader trade export",
		pnlColumn: "Profit",
		dateColumn: "Entry Time",
		mfeColumn: null
	},
	"Tradovate": {
		description: "Tradovate trade history export",
		pnlColumn: "P&L",
		dateColumn: "Time",
		mfeColumn: null
	},
	"Generic (Simple)": {
		description: "Simple CSV with date, pnl, and optional mfe columns",
		pnlColumn: "pnl",
		dateColumn: "date",
		mfeColumn: "mfe"
	},
	"Custom": {
		description: "Specify your own column names",
		pnlColumn: "",
		dateColumn: "",
		mfeColumn: ""
	}
};

export type CsvTemplateName = keyof typeof CSV_TEMPLATES;

// Helper functions
export function getPropFirmList(): string[] {
	return Object.keys(PROP_FIRMS);
}

export function getChallengeList(propFirm: string): string[] {
	return Object.keys(PROP_FIRMS[propFirm]?.challenges || {});
}

export function getAccountConfig(propFirm: string, challenge: string): ChallengeConfig | null {
	return PROP_FIRMS[propFirm]?.challenges[challenge] || null;
}

export function getCsvTemplateList(): CsvTemplateName[] {
	return Object.keys(CSV_TEMPLATES) as CsvTemplateName[];
}
