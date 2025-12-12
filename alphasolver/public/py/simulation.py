"""
Minimal Simulation class for Pyodide - core Monte Carlo logic only.

This version removes matplotlib, scipy, and sklearn dependencies
to work cleanly in Pyodide.
"""

import numpy as np
from trader import Trader


class Simulation:
    def __init__(self, trading_strat, num_traders, acct_rules, acct_fees):
        self.min_winning_trader_number = None
        self.max_winning_trader_number = None
        self.winning_trader_numbers = []
        self.losing_trader_numbers = []
        self.timeout_trader_numbers = []
        self.strategy = trading_strat
        self.num_traders = num_traders
        self.acct_rules = acct_rules
        self.acct_fees = acct_fees
        trader_array = [Trader(self.strategy, acct_rules=acct_rules, acct_fees=acct_fees) for i in range(num_traders)]
        self.traders = {i: j for (i, j) in zip(range(num_traders), trader_array)}
        self.avg_pnl = 0
        self.avg_days = 0
        self.avg_days_to_win = 0
        self.avg_days_to_lose = 0
        self.pct_wins = 0
        self.pct_fails = 0
        self.pct_timeout = 0
        self.avg_win_pnl = 0
        self.avg_lose_pnl = 0
        self.pct_pass_eval = 0
        self.max_payout = 0
        self.min_payout = float('inf')
        self.max_days_to_win = 0
        self.min_days_to_win = float('inf')
        self.max_days_to_lose = 0
        self.min_days_to_lose = float('inf')
        
        # For confidence interval calculation
        self.pass_rate_ci_lower = 0
        self.pass_rate_ci_upper = 0

    def run(self):
        """Run the Monte Carlo simulation for all traders."""
        sum_pnl = 0
        sum_days = 0
        sum_win_days = 0
        sum_loss_days = 0
        sum_winning_traders = 0
        sum_losing_traders = 0
        sum_winning_pnl = 0
        sum_losing_pnl = 0
        sum_passed_eval = 0

        # Run simulation for each trader path
        for trader_num in range(len(self.traders)):
            while not (self.traders[trader_num].account.won or self.traders[trader_num].account.failed):
                self.traders[trader_num].trade_for_day()
                # Safety timeout to prevent infinite loops
                if self.traders[trader_num].account.total_days > 700:
                    break
            
            sum_days += self.traders[trader_num].account.total_days
            sum_pnl += self.traders[trader_num].PnL
            
            if not self.traders[trader_num].account.in_eval:
                sum_passed_eval += 1
            
            if self.traders[trader_num].account.won:
                self.winning_trader_numbers.append(trader_num)
                sum_winning_traders += 1
                sum_win_days += self.traders[trader_num].account.total_days
                sum_winning_pnl += self.traders[trader_num].PnL
                
                if self.traders[trader_num].account.total_days < self.min_days_to_win:
                    self.min_days_to_win = self.traders[trader_num].account.total_days
                if self.traders[trader_num].account.total_days > self.max_days_to_win:
                    self.max_days_to_win = self.traders[trader_num].account.total_days
                if self.traders[trader_num].PnL < self.min_payout:
                    self.min_payout = self.traders[trader_num].PnL
                    self.min_winning_trader_number = trader_num
                if self.traders[trader_num].PnL > self.max_payout:
                    self.max_payout = self.traders[trader_num].PnL
                    self.max_winning_trader_number = trader_num

            elif self.traders[trader_num].account.failed:
                self.losing_trader_numbers.append(trader_num)
                if self.traders[trader_num].account.total_days < self.min_days_to_lose:
                    self.min_days_to_lose = self.traders[trader_num].account.total_days
                if self.traders[trader_num].account.total_days > self.max_days_to_lose:
                    self.max_days_to_lose = self.traders[trader_num].account.total_days
                sum_losing_traders += 1
                sum_loss_days += self.traders[trader_num].account.total_days
                sum_losing_pnl += self.traders[trader_num].PnL
            else:
                # Timeout (exceeded 700 days)
                self.timeout_trader_numbers.append(trader_num)

        # Calculate aggregate statistics
        self.avg_pnl = sum_pnl / len(self.traders)
        self.avg_days = sum_days / len(self.traders)
        
        if sum_winning_traders > 0:
            self.avg_days_to_win = sum_win_days / sum_winning_traders
            self.avg_win_pnl = sum_winning_pnl / sum_winning_traders
        else:
            self.avg_days_to_win = 0
            self.avg_win_pnl = 0
            
        if sum_losing_traders > 0:
            self.avg_days_to_lose = sum_loss_days / sum_losing_traders
            self.avg_lose_pnl = sum_losing_pnl / sum_losing_traders
        else:
            self.avg_days_to_lose = 0
            self.avg_lose_pnl = 0
            
        self.pct_wins = (sum_winning_traders / len(self.traders)) * 100
        self.pct_fails = (sum_losing_traders / len(self.traders)) * 100
        self.pct_timeout = (len(self.timeout_trader_numbers) / len(self.traders)) * 100
        self.pct_pass_eval = (sum_passed_eval / len(self.traders)) * 100
        
        # Calculate 95% confidence interval for pass rate using Wilson score interval
        self._calculate_confidence_interval(sum_winning_traders, len(self.traders))

    def _calculate_confidence_interval(self, successes, total, confidence=0.95):
        """Calculate Wilson score confidence interval for pass rate."""
        if total == 0:
            self.pass_rate_ci_lower = 0
            self.pass_rate_ci_upper = 0
            return
        
        p = successes / total
        # z-score for 95% confidence (1.96) - hardcoded to avoid scipy dependency
        z = 1.96 if confidence == 0.95 else 2.576  # 99% confidence
        
        denominator = 1 + z**2 / total
        center = (p + z**2 / (2 * total)) / denominator
        margin = z * np.sqrt((p * (1 - p) + z**2 / (4 * total)) / total) / denominator
        
        self.pass_rate_ci_lower = max(0, (center - margin)) * 100
        self.pass_rate_ci_upper = min(1, (center + margin)) * 100

