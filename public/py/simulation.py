import numpy as np
from trader import Trader
from io import BytesIO
import matplotlib.pyplot as plt
from scipy import stats
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler


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
        # simulate trading for all traders
        sum_pnl = 0
        sum_days = 0
        sum_win_days = 0
        sum_loss_days = 0
        sum_winning_traders = 0
        sum_losing_traders = 0
        sum_winning_pnl = 0
        sum_losing_pnl = 0
        sum_passed_eval = 0

        # TODO: parallelize to run this part on multiple cores
        for trader_num in range(len(self.traders)):
            while not (self.traders[trader_num].account.won or self.traders[trader_num].account.failed):
                self.traders[trader_num].trade_for_day()
                if self.traders[trader_num].account.total_days > 700:
                    print(f"traded too damn long with no win, acct balance: {self.traders[trader_num].account.balance}")
                    print(f'winning days: {self.traders[trader_num].account.winning_days}')
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

    def run_eval_only(self):
        # simulate trading for all traders
        sum_days = 0
        sum_win_days = 0
        sum_loss_days = 0
        sum_winning_traders = 0
        sum_losing_traders = 0
        sum_passed_eval = 0

        for trader_num in range(len(self.traders)):
            while not self.traders[trader_num].passed_eval and not self.traders[trader_num].account.failed:
                self.traders[trader_num].trade_for_day()
                if self.traders[trader_num].account.total_days > 700:
                    print(f"traded too damn long with no win, acct balance: {self.traders[trader_num].account.balance}")
                    print(f'winning days: {self.traders[trader_num].account.winning_days}')
                    break
            sum_days += self.traders[trader_num].account.total_days
            if not self.traders[trader_num].account.in_eval:
                sum_passed_eval += 1
                sum_win_days += self.traders[trader_num].account.total_days

            else:
                sum_losing_traders += 1
                sum_loss_days += self.traders[trader_num].account.total_days

        self.avg_days = sum_days / len(self.traders)
        if sum_passed_eval > 0:
            self.avg_days_to_win = sum_win_days / sum_passed_eval
        else:
            self.avg_days_to_win = 0
            self.avg_win_pnl = 0
        if sum_losing_traders > 0:
            self.avg_days_to_lose = sum_loss_days / sum_losing_traders
        else:
            self.avg_days_to_lose = 0
            self.avg_lose_pnl = 0
        self.pct_wins = (sum_winning_traders / len(self.traders)) * 100
        self.pct_pass_eval = (sum_passed_eval / len(self.traders)) * 100

    def run_funded_only(self):
        # simulate trading for all traders
        sum_pnl = 0
        sum_days = 0
        sum_win_days = 0
        sum_loss_days = 0
        sum_winning_traders = 0
        sum_losing_traders = 0
        sum_winning_pnl = 0
        sum_losing_pnl = 0

        # TODO: parallelize?
        for trader_num in range(len(self.traders)):
            self.traders[trader_num].account.passed_eval()
            while not (self.traders[trader_num].account.won or self.traders[trader_num].account.failed):
                self.traders[trader_num].trade_for_day()
                if self.traders[trader_num].account.total_days > 700:
                    print(f"traded too damn long with no win, acct balance: {self.traders[trader_num].account.balance}")
                    print(f'winning days: {self.traders[trader_num].account.winning_days}')
                    break
            sum_days += self.traders[trader_num].account.total_days
            sum_pnl += self.traders[trader_num].PnL
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
                self.timeout_trader_numbers.append(trader_num)

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
        
        # Calculate 95% confidence interval for pass rate
        self._calculate_confidence_interval(sum_winning_traders, len(self.traders))

    def sim_results(self):
        return {
            "Estimated Subscription EV": f"${self.avg_pnl:.2f}",
            "Average Number of Days Traded": f"{self.avg_days:.1f}",
            "Percent Wins (Full Payout)": f"{self.pct_wins:.2f}%",
            "Average Days Traded On Winning Runs": f"{self.avg_days_to_win:.1f}",
            "Max Days Traded On Winning Run": f"{self.max_days_to_win}",
            "Min Days Traded On Winning Run": f"{self.min_days_to_win}",
            "Average Days Traded On Losing Runs": f"{self.avg_days_to_lose:.1f}",
            "Max Days Traded On Losing Run": f"{self.max_days_to_lose}",
            "Min Days Traded On Losing Run": f"{self.min_days_to_lose}",
            "Average Winning Payout": f"${self.avg_win_pnl:.2f}",
            "Max Winning Payout": f"${self.max_payout:.2f}",
            "Min Winning Payout": f"${self.min_payout:.2f}",
            "Average Loss Cost": f"${self.avg_lose_pnl:.2f}",
            "Percent Pass Eval": f"{self.pct_pass_eval:.2f}%"
        }

    def eval_only_sim_results(self):
        return {
            "Average Number of Days Traded": f"{self.avg_days:.1f}",
            "Average Days Traded On Winning Runs": f"{self.avg_days_to_win:.1f}",
            "Average Days Traded On Losing Runs": f"{self.avg_days_to_lose:.1f}",
            "Percent Pass Combine": f"{self.pct_pass_eval:.2f}%"
        }

    def funded_only_sim_results(self):
        return {
            "Estimated Account EV": f"${self.avg_pnl:.2f}",
            "Average Number of Days Traded": f"{self.avg_days:.1f}",
            "Percent Wins (Full Payout)": f"{self.pct_wins:.2f}%"
        }

    def _calculate_confidence_interval(self, successes, total, confidence=0.95):
        """Calculate Wilson score confidence interval for pass rate."""
        if total == 0:
            self.pass_rate_ci_lower = 0
            self.pass_rate_ci_upper = 0
            return
        
        p = successes / total
        z = stats.norm.ppf(1 - (1 - confidence) / 2)
        
        denominator = 1 + z**2 / total
        center = (p + z**2 / (2 * total)) / denominator
        margin = z * np.sqrt((p * (1 - p) + z**2 / (4 * total)) / total) / denominator
        
        self.pass_rate_ci_lower = max(0, (center - margin)) * 100
        self.pass_rate_ci_upper = min(1, (center + margin)) * 100

    def get_monte_carlo_trading_plan(self) -> dict:
        """
        Generate trading plan by analyzing WINNING paths vs LOSING paths.
        Extracts actionable rules from successful simulations.
        
        Returns:
            Dictionary with prescriptive trading rules based on winning paths
        """
        # Separate winners and losers for analysis
        winner_data = {"days": [], "max_dd": [], "daily_pnls": [], "final_pnl": [], "worst_day": [], "best_day": []}
        loser_data = {"days": [], "max_dd": [], "daily_pnls": [], "final_pnl": [], "worst_day": [], "best_day": []}
        all_daily_pnls = []
        
        for trader_num, trader in self.traders.items():
            running_balance = np.array(trader.running_balance)
            
            if len(running_balance) > 1:
                # Calculate metrics for this path
                running_max = np.maximum.accumulate(running_balance)
                drawdowns = running_max - running_balance
                max_dd = np.max(drawdowns)
                daily_pnls = np.diff(running_balance)
                worst_day = np.min(daily_pnls) if len(daily_pnls) > 0 else 0
                best_day = np.max(daily_pnls) if len(daily_pnls) > 0 else 0
                
                all_daily_pnls.extend(daily_pnls)
                
                data = winner_data if trader.account.won else loser_data
                data["days"].append(trader.account.total_days)
                data["max_dd"].append(max_dd)
                data["daily_pnls"].extend(daily_pnls)
                data["final_pnl"].append(trader.PnL)
                data["worst_day"].append(worst_day)
                data["best_day"].append(best_day)
        
        # Convert to numpy
        all_daily_pnls = np.array(all_daily_pnls) if all_daily_pnls else np.array([0])
        
        # Prop firm limits
        max_loss_limit = self.acct_rules.get('Max Loss (Eval)', float('inf'))
        daily_loss_limit = self.acct_rules.get('Maximum Daily Loss', float('inf'))
        profit_target = self.acct_rules.get('Funding Target Balance', 0) - self.acct_rules.get('Initial Balance (Eval)', 0)
        
        # ============ ANALYZE WINNERS ============
        if winner_data["days"]:
            w_days = np.array(winner_data["days"])
            w_dd = np.array(winner_data["max_dd"])
            w_daily = np.array(winner_data["daily_pnls"])
            w_worst = np.array(winner_data["worst_day"])
            
            winners = {
                "count": len(w_days),
                # Days distribution (full percentiles for clarity)
                "days_min": int(np.min(w_days)),
                "days_p5": int(np.percentile(w_days, 5)),
                "days_p10": int(np.percentile(w_days, 10)),
                "days_p25": int(np.percentile(w_days, 25)),
                "days_median": int(np.median(w_days)),
                "days_p75": int(np.percentile(w_days, 75)),
                "days_p90": int(np.percentile(w_days, 90)),
                "days_max": int(np.max(w_days)),
                # Drawdown
                "max_dd_median": np.median(w_dd),
                "max_dd_p90": np.percentile(w_dd, 90),
                # Daily P&L
                "daily_pnl_mean": np.mean(w_daily),
                "daily_pnl_median": np.median(w_daily),
                "worst_day_median": np.median(w_worst),
                "worst_day_p10": np.percentile(w_worst, 10),
                "daily_win_rate": np.mean(w_daily > 0) * 100,
            }
        else:
            winners = None
        
        # ============ BEST CASE PATH (fastest winner) ============
        best_path = None
        if self.winning_trader_numbers:
            # Find the fastest winning path
            fastest_days = float('inf')
            fastest_trader_num = None
            
            for trader_num in self.winning_trader_numbers:
                trader = self.traders[trader_num]
                if trader.account.total_days < fastest_days:
                    fastest_days = trader.account.total_days
                    fastest_trader_num = trader_num
            
            if fastest_trader_num is not None:
                trader = self.traders[fastest_trader_num]
                running_balance = np.array(trader.running_balance)
                daily_pnls = np.diff(running_balance) if len(running_balance) > 1 else []
                
                # Calculate stats for best path
                running_max = np.maximum.accumulate(running_balance) if len(running_balance) > 1 else [0]
                drawdowns = running_max - running_balance if len(running_balance) > 1 else [0]
                
                # Daily stats for best path (no Kelly - that's misleading post-hoc)
                winning_pnls = daily_pnls[daily_pnls > 0] if len(daily_pnls) > 0 else []
                losing_pnls = daily_pnls[daily_pnls < 0] if len(daily_pnls) > 0 else []
                path_avg_win = np.mean(winning_pnls) if len(winning_pnls) > 0 else 0
                path_avg_loss = np.mean(losing_pnls) if len(losing_pnls) > 0 else 0
                
                best_path = {
                    "days": trader.account.total_days,
                    "final_pnl": trader.PnL,
                    "max_drawdown": np.max(drawdowns) if len(drawdowns) > 0 else 0,
                    "avg_daily_pnl": np.mean(daily_pnls) if len(daily_pnls) > 0 else 0,
                    "best_day": np.max(daily_pnls) if len(daily_pnls) > 0 else 0,
                    "worst_day": np.min(daily_pnls) if len(daily_pnls) > 0 else 0,
                    "winning_days": int(np.sum(np.array(daily_pnls) > 0)) if len(daily_pnls) > 0 else 0,
                    "losing_days": int(np.sum(np.array(daily_pnls) < 0)) if len(daily_pnls) > 0 else 0,
                    "daily_win_rate": (np.sum(np.array(daily_pnls) > 0) / len(daily_pnls) * 100) if len(daily_pnls) > 0 else 0,
                    "avg_winning_day": path_avg_win,
                    "avg_losing_day": path_avg_loss,
                }
        
        # ============ ANALYZE LOSERS ============
        if loser_data["days"]:
            l_days = np.array(loser_data["days"])
            l_dd = np.array(loser_data["max_dd"])
            l_daily = np.array(loser_data["daily_pnls"])
            l_worst = np.array(loser_data["worst_day"])
            
            losers = {
                "count": len(l_days),
                "days_median": np.median(l_days),
                "max_dd_median": np.median(l_dd),
                "daily_pnl_mean": np.mean(l_daily),
                "worst_day_median": np.median(l_worst),
                "common_failure": "max_drawdown" if np.median(l_dd) >= max_loss_limit * 0.9 else "daily_limit",
            }
        else:
            losers = None
        
        # ============ PRESCRIPTIVE RULES (from winners) ============
        if winners:
            # Daily target to match winning pace
            daily_target = profit_target / winners["days_median"] if winners["days_median"] > 0 else 0
            
            # For 30-day rebill target (~21 trading days per month)
            trading_days_per_month = 21
            daily_target_30d = profit_target / trading_days_per_month
            
            # Safe daily loss limit (what winners stayed within)
            safe_daily_loss = abs(winners["worst_day_p10"]) if winners["worst_day_p10"] else daily_loss_limit
            safe_daily_loss = min(safe_daily_loss, daily_loss_limit)  # Can't exceed prop firm limit
            
            # Max drawdown winners experienced - cap at prop firm limit
            safe_max_dd = min(winners["max_dd_p90"], max_loss_limit)
            
            # Check if strategy is viable for 30-day rebill (~21 trading days)
            viable_for_30d = winners["days_median"] <= trading_days_per_month
            
            # Calculate how many calendar months winners take
            months_to_pass = winners["days_median"] / trading_days_per_month
            
            rules = {
                "daily_pnl_target": daily_target,
                "daily_pnl_target_30d": daily_target_30d,  # What you'd need for ~21 trading days
                "daily_loss_stop": safe_daily_loss,
                "max_drawdown_safe": safe_max_dd,
                "prop_firm_max_loss": max_loss_limit,
                "target_days": int(winners["days_median"]),  # Trading days
                "target_days_range": (int(winners["days_p25"]), int(winners["days_p75"])),
                "daily_win_rate_needed": winners["daily_win_rate"],
                "viable_for_30d": viable_for_30d,
                "trading_days_per_month": trading_days_per_month,
                "months_to_pass": months_to_pass,
            }
        else:
            rules = None
        
        return {
            "pass_rate": self.pct_wins,
            "pass_rate_ci": (self.pass_rate_ci_lower, self.pass_rate_ci_upper),
            "fail_rate": self.pct_fails,
            "num_simulations": self.num_traders,
            
            # Winner analysis
            "winners": winners,
            
            # Loser analysis  
            "losers": losers,
            
            # Best case scenario
            "best_path": best_path,
            
            # Prescriptive rules from winners
            "rules": rules,
            
            # Prop firm context
            "prop_firm": {
                "profit_target": profit_target,
                "max_loss": max_loss_limit,
                "daily_limit": daily_loss_limit,
            },
            
            # Kelly from simulation
            "kelly": self._calculate_mc_kelly(all_daily_pnls),
            
            # For compatibility
            "simulated_ev": self.avg_pnl,
            "prob_ruin": self.pct_fails,
        }
    
    def _calculate_mc_kelly(self, daily_pnls: np.ndarray) -> dict:
        """
        Calculate Kelly Criterion from the underlying trade strategy.
        Uses per-trade statistics which is more meaningful than daily P&L.
        """
        # Get per-trade stats from the strategy (more accurate than daily)
        strategy = self.strategy
        
        # Use trade-level win rate and avg win/loss
        win_rate = getattr(strategy, 'win_rate', 0)
        avg_win = getattr(strategy, 'avg_win', 0)
        avg_loss = getattr(strategy, 'avg_loss', 0)
        
        if avg_loss == 0 or win_rate == 0:
            # Fallback to daily P&L calculation
            if len(daily_pnls) == 0:
                return {"full_kelly": 0, "half_kelly": 0, "quarter_kelly": 0, 
                        "win_rate": 0, "win_loss_ratio": 0, "basis": "N/A"}
            
            wins = daily_pnls > 0
            win_rate = np.mean(wins)
            winning = daily_pnls[daily_pnls > 0]
            losing = daily_pnls[daily_pnls < 0]
            avg_win = np.mean(winning) if len(winning) > 0 else 0
            avg_loss = np.mean(losing) if len(losing) > 0 else 0
            basis = "daily"
        else:
            basis = "per-trade"
        
        if avg_loss == 0 or win_rate == 0:
            return {"full_kelly": 0, "half_kelly": 0, "quarter_kelly": 0, 
                    "win_rate": win_rate * 100 if win_rate <= 1 else win_rate, 
                    "win_loss_ratio": 0, "basis": basis}
        
        # Win/Loss ratio
        win_loss_ratio = abs(avg_win / avg_loss)
        
        # Kelly formula: K = W - (1-W)/R
        # Ensure win_rate is a proportion (0-1)
        w = win_rate if win_rate <= 1 else win_rate / 100
        full_kelly = w - ((1 - w) / win_loss_ratio)
        full_kelly = max(0, full_kelly)  # Can't be negative
        
        return {
            "full_kelly": full_kelly * 100,
            "half_kelly": full_kelly * 50,
            "quarter_kelly": full_kelly * 25,
            "win_rate": w * 100,
            "win_loss_ratio": win_loss_ratio,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "basis": basis,  # "per-trade" or "daily"
        }

    def plot_outcomes(self, title):
        # Store the equity curve for this simulation along with its color
        # Plot each equity curve with the computed y-axis limits
        # Compute y-axis limits for the plots

        plt.figure(figsize=(12, 8))  # Set the figure size to 8 inches wide and 6 inches tall
        final_winning_balances = [self.traders[i].running_balance[-1] for i in self.winning_trader_numbers]
        median_final_balance = np.median(np.array(final_winning_balances))
        median_balance_number = None
        for i in self.winning_trader_numbers:
            if self.traders[i].running_balance[-1] == median_final_balance:
                median_balance_number = i
        max_winning_trader = self.traders[self.max_winning_trader_number]
        min_winning_trader = self.traders[self.min_winning_trader_number]
        plt.plot(max_winning_trader.running_balance, color='blue', label='max payout')
        if median_balance_number:
            plt.plot(self.traders[median_balance_number].running_balance, color='black', label='median payout')
        plt.plot(min_winning_trader.running_balance, color='red', label='min payout')
        min_value = min(min(max_winning_trader.running_balance), min(min_winning_trader.running_balance))
        max_value = max(max(max_winning_trader.running_balance), max(min_winning_trader.running_balance))
        plt.ylim(min_value, max_value)
        plt.xlabel('Number of Days Traded')
        plt.ylabel('Account Balance')
        plt.title(title)
        plt.legend(loc='upper right')
        # plt.show()  # display the plot once after all curves have been plotted
        # TODO: hockey stick plot, histogram (condition on win?)
        buf = BytesIO()  # Create a bytes buffer to save the image
        plt.savefig(buf, format="png")  # Save the image to the buffer
        plt.close()  # Close the plot

        buf.seek(0)  # Move the cursor to the start of the buffer
        return buf  # Return the buffer containing the image data

    def plot_equity_curves(self, num_paths=50, title="Monte Carlo Equity Curves"):
        """
        Plot multiple equity curves showing winning (green) and losing (red) paths.
        
        Args:
            num_paths: Number of paths to display (will show mix of winners and losers)
            title: Plot title
        
        Returns:
            BytesIO buffer containing the plot image
        """
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Get initial balance for reference line
        initial_balance = self.acct_rules.get('Initial Balance (Funded)', 
                                               self.acct_rules.get('Initial Balance (Eval)', 50000))
        
        # Sample paths to display
        num_winners = min(len(self.winning_trader_numbers), num_paths // 2)
        num_losers = min(len(self.losing_trader_numbers), num_paths // 2)
        
        # Randomly sample traders to display
        if num_winners > 0:
            winner_sample = np.random.choice(self.winning_trader_numbers, 
                                             size=min(num_winners, len(self.winning_trader_numbers)), 
                                             replace=False)
        else:
            winner_sample = []
            
        if num_losers > 0:
            loser_sample = np.random.choice(self.losing_trader_numbers, 
                                            size=min(num_losers, len(self.losing_trader_numbers)), 
                                            replace=False)
        else:
            loser_sample = []
        
        # Plot losing paths first (so winners are on top)
        for trader_num in loser_sample:
            balance = self.traders[trader_num].running_balance
            if len(balance) > 0:
                ax.plot(range(len(balance)), balance, color='#ff4444', alpha=0.3, linewidth=0.8)
        
        # Plot winning paths
        for trader_num in winner_sample:
            balance = self.traders[trader_num].running_balance
            if len(balance) > 0:
                ax.plot(range(len(balance)), balance, color='#44ff44', alpha=0.5, linewidth=0.8)
        
        # Add reference line at initial balance
        ax.axhline(y=initial_balance, color='white', linestyle='--', alpha=0.5, label='Initial Balance')
        
        ax.set_xlabel('Trading Days', fontsize=12)
        ax.set_ylabel('Account Balance ($)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')
        
        # Add legend
        from matplotlib.lines import Line2D
        legend_elements = [
            Line2D([0], [0], color='#44ff44', linewidth=2, label=f'Pass ({len(self.winning_trader_numbers):,})'),
            Line2D([0], [0], color='#ff4444', linewidth=2, label=f'Fail ({len(self.losing_trader_numbers):,})'),
        ]
        ax.legend(handles=legend_elements, loc='upper left')
        
        # Format y-axis with dollar signs
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor='#0e1117', edgecolor='none')
        plt.close()
        buf.seek(0)
        return buf

    def plot_trades_per_day_distribution(self):
        """
        Plot histogram of trades per day from the bootstrapped strategy.
        
        Returns:
            BytesIO buffer containing the plot image, or None if not bootstrapped
        """
        from trading_strategies import BootstrappedTradingStrategy
        
        if not isinstance(self.strategy, BootstrappedTradingStrategy):
            return None
        
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(6, 4))
        
        trades_dist = self.strategy.trades_per_day_distribution
        
        # Create histogram
        counts, bins, patches = ax.hist(trades_dist, bins=range(0, max(trades_dist) + 2), 
                                        color='#4a9eff', alpha=0.7, edgecolor='white', align='left')
        
        ax.set_xlabel('Trades Per Day', fontsize=11)
        ax.set_ylabel('Frequency', fontsize=11)
        ax.set_title('Trades Per Day Distribution', fontsize=12, fontweight='bold')
        
        # Add mean line
        mean_trades = np.mean(trades_dist)
        ax.axvline(x=mean_trades, color='#ffaa00', linestyle='--', linewidth=2, 
                   label=f'Mean: {mean_trades:.1f}')
        ax.legend()
        
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor='#0e1117', edgecolor='none')
        plt.close()
        buf.seek(0)
        return buf

    def plot_pnl_distribution(self):
        """
        Plot histogram of P&L per trade from the bootstrapped strategy.
        
        Returns:
            BytesIO buffer containing the plot image, or None if not bootstrapped
        """
        from trading_strategies import BootstrappedTradingStrategy
        
        if not isinstance(self.strategy, BootstrappedTradingStrategy):
            return None
        
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(6, 4))
        
        pnl_pool = self.strategy.pnl_pool
        
        # Create histogram with colors for positive/negative
        ax.hist(pnl_pool, bins=30, color='#4a9eff', alpha=0.7, edgecolor='white')
        
        # Add vertical line at 0
        ax.axvline(x=0, color='white', linestyle='-', linewidth=1, alpha=0.5)
        
        # Add mean line
        mean_pnl = np.mean(pnl_pool)
        color = '#44ff44' if mean_pnl >= 0 else '#ff4444'
        ax.axvline(x=mean_pnl, color=color, linestyle='--', linewidth=2, 
                   label=f'Mean: ${mean_pnl:.2f}')
        
        ax.set_xlabel('P&L ($)', fontsize=11)
        ax.set_ylabel('Frequency', fontsize=11)
        ax.set_title('Trade P&L Distribution', fontsize=12, fontweight='bold')
        ax.legend()
        
        # Format x-axis with dollar signs
        ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        plt.tight_layout()
        
        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor='#0e1117', edgecolor='none')
        plt.close()
        buf.seek(0)
        return buf

    def get_enhanced_results(self):
        """Get enhanced results with confidence intervals and breakdown."""
        return {
            "pass_rate": self.pct_wins,
            "pass_rate_ci_lower": self.pass_rate_ci_lower,
            "pass_rate_ci_upper": self.pass_rate_ci_upper,
            "fail_rate": self.pct_fails,
            "timeout_rate": self.pct_timeout,
            "avg_days": self.avg_days,
            "avg_win_pnl": self.avg_win_pnl,
            "avg_lose_pnl": self.avg_lose_pnl,
            "num_simulations": self.num_traders,
            "num_wins": len(self.winning_trader_numbers),
            "num_fails": len(self.losing_trader_numbers),
            "num_timeouts": len(self.timeout_trader_numbers)
        }

    def get_cost_breakdown(self) -> dict:
        """
        Calculate detailed cost breakdown for winners and losers.
        Shows exactly how many eval attempts, months, and costs are expected.
        
        Returns:
            Dictionary with itemized costs and timeline expectations
        """
        eval_cost = self.acct_fees.get('Eval Acct Cost', 0)
        monthly_cost = self.acct_fees.get('Monthly Eval Cost', 0)
        funded_setup = self.acct_fees.get('Funded Acct Setup Cost', 0)
        
        # Analyze winners
        winner_stats = {
            "count": 0,
            "avg_eval_days": 0,
            "avg_funded_days": 0,
            "avg_total_days": 0,
            "avg_eval_months": 0,
            "avg_gross_payout": 0,
            "avg_total_costs": 0,
            "avg_net_payout": 0,
            "median_eval_days": 0,
            "median_funded_days": 0,
        }
        
        # Analyze losers
        loser_stats = {
            "count": 0,
            "avg_days_before_fail": 0,
            "avg_months_paid": 0,
            "avg_total_cost": 0,
            "pct_fail_in_eval": 0,
            "pct_fail_in_funded": 0,
        }
        
        # Collect data from winning traders
        winner_eval_days = []
        winner_funded_days = []
        winner_gross_payouts = []
        winner_total_costs = []
        
        for trader_num in self.winning_trader_numbers:
            trader = self.traders[trader_num]
            
            # Calculate days in each phase
            # We need to track when they passed eval - approximate from running_balance
            total_days = trader.account.total_days
            
            # Estimate eval days: months_traded tells us how many 30-day periods in eval
            # More accurate: count days before running_balance started (funded phase)
            funded_days = len(trader.running_balance)
            eval_days = total_days - funded_days
            
            winner_eval_days.append(eval_days)
            winner_funded_days.append(funded_days)
            
            # Calculate costs for this winner
            eval_months = (eval_days // 30) + 1  # Initial purchase counts as month 1
            total_eval_cost = eval_cost + (max(0, eval_months - 1) * monthly_cost)
            total_costs = total_eval_cost + funded_setup
            
            # Gross payout (before costs)
            gross_payout = trader.account.funded_full_payout() if trader.account.won else 0
            
            winner_gross_payouts.append(gross_payout)
            winner_total_costs.append(total_costs)
        
        if self.winning_trader_numbers:
            winner_stats["count"] = len(self.winning_trader_numbers)
            winner_stats["avg_eval_days"] = np.mean(winner_eval_days)
            winner_stats["avg_funded_days"] = np.mean(winner_funded_days)
            winner_stats["avg_total_days"] = np.mean(winner_eval_days) + np.mean(winner_funded_days)
            winner_stats["avg_eval_months"] = np.mean(winner_eval_days) / 30
            winner_stats["median_eval_days"] = np.median(winner_eval_days)
            winner_stats["median_funded_days"] = np.median(winner_funded_days)
            winner_stats["avg_gross_payout"] = np.mean(winner_gross_payouts)
            winner_stats["avg_total_costs"] = np.mean(winner_total_costs)
            winner_stats["avg_net_payout"] = np.mean(winner_gross_payouts) - np.mean(winner_total_costs)
        
        # Collect data from losing traders
        loser_days = []
        loser_costs = []
        losers_in_eval = 0
        losers_in_funded = 0
        
        for trader_num in self.losing_trader_numbers:
            trader = self.traders[trader_num]
            total_days = trader.account.total_days
            loser_days.append(total_days)
            
            # Did they fail in eval or funded?
            if trader.account.in_eval:
                losers_in_eval += 1
                eval_months = (total_days // 30) + 1
                cost = eval_cost + (max(0, eval_months - 1) * monthly_cost)
            else:
                losers_in_funded += 1
                # They passed eval, so paid eval + funded setup
                funded_days = len(trader.running_balance)
                eval_days = total_days - funded_days
                eval_months = (eval_days // 30) + 1
                cost = eval_cost + (max(0, eval_months - 1) * monthly_cost) + funded_setup
            
            loser_costs.append(cost)
        
        if self.losing_trader_numbers:
            loser_stats["count"] = len(self.losing_trader_numbers)
            loser_stats["avg_days_before_fail"] = np.mean(loser_days)
            loser_stats["avg_months_paid"] = np.mean(loser_days) / 30
            loser_stats["avg_total_cost"] = np.mean(loser_costs)
            loser_stats["pct_fail_in_eval"] = (losers_in_eval / len(self.losing_trader_numbers)) * 100
            loser_stats["pct_fail_in_funded"] = (losers_in_funded / len(self.losing_trader_numbers)) * 100
        
        # Calculate expected values considering both outcomes
        pass_rate = self.pct_wins / 100
        fail_rate = self.pct_fails / 100
        
        # Expected cost per attempt (weighted by outcome probability)
        expected_cost_if_win = winner_stats["avg_total_costs"] if winner_stats["count"] > 0 else 0
        expected_cost_if_lose = loser_stats["avg_total_cost"] if loser_stats["count"] > 0 else 0
        
        # How many attempts expected to get one win?
        attempts_to_win = 1 / pass_rate if pass_rate > 0 else float('inf')
        
        # Total expected cost to achieve one payout
        if pass_rate > 0:
            # Geometric distribution: expected failures before success = (1-p)/p
            expected_failures = (1 - pass_rate) / pass_rate
            total_expected_cost = expected_cost_if_win + (expected_failures * expected_cost_if_lose)
        else:
            total_expected_cost = float('inf')
        
        return {
            "fees": {
                "eval_cost": eval_cost,
                "monthly_rebill": monthly_cost,
                "funded_setup": funded_setup,
            },
            "winners": winner_stats,
            "losers": loser_stats,
            "expected": {
                "attempts_to_win": attempts_to_win,
                "total_cost_to_payout": total_expected_cost,
                "expected_gross_payout": winner_stats["avg_gross_payout"],
                "expected_net_profit": winner_stats["avg_gross_payout"] - total_expected_cost if pass_rate > 0 else 0,
                "roi_pct": ((winner_stats["avg_gross_payout"] - total_expected_cost) / total_expected_cost * 100) if total_expected_cost > 0 and pass_rate > 0 else 0,
            },
            "pass_rate": self.pct_wins,
        }

    def get_outcome_scenarios(self, eps: float = 0.5, min_samples: int = None) -> dict:
        """
        Use DBSCAN to identify distinct outcome scenarios from Monte Carlo paths.
        Returns clusters ranked by density (most probable outcomes first).
        
        Features used for clustering:
        - days_to_outcome: How long the path lasted
        - max_drawdown: Worst peak-to-trough decline
        - daily_pnl_volatility: Consistency of returns
        - final_pnl: Net result
        - outcome: Win (1) or Loss (0)
        
        Args:
            eps: DBSCAN neighborhood radius (in standardized space)
            min_samples: Minimum samples for core point (default: 1% of simulations, min 5)
        
        Returns:
            Dictionary with scenario clusters ranked by probability
        """
        if min_samples is None:
            min_samples = max(5, int(self.num_traders * 0.01))
        
        # Extract features from all paths
        features = []
        path_data = []
        
        for trader_num, trader in self.traders.items():
            running_balance = np.array(trader.running_balance)
            total_days = trader.account.total_days
            
            # Calculate path features
            if len(running_balance) > 1:
                daily_pnls = np.diff(running_balance)
                running_max = np.maximum.accumulate(running_balance)
                drawdowns = running_max - running_balance
                max_dd = np.max(drawdowns)
                pnl_volatility = np.std(daily_pnls)
                daily_win_rate = np.mean(daily_pnls > 0)
            else:
                max_dd = 0
                pnl_volatility = 0
                daily_win_rate = 0
            
            # Outcome: 1 = win, 0 = loss
            outcome = 1 if trader.account.won else 0
            final_pnl = trader.PnL
            
            features.append([
                total_days,
                max_dd,
                pnl_volatility,
                final_pnl,
                outcome
            ])
            
            path_data.append({
                "trader_num": trader_num,
                "days": total_days,
                "max_drawdown": max_dd,
                "volatility": pnl_volatility,
                "final_pnl": final_pnl,
                "outcome": "pass" if outcome == 1 else "fail",
                "daily_win_rate": daily_win_rate * 100
            })
        
        features = np.array(features)
        
        # Standardize features for DBSCAN
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Run DBSCAN
        dbscan = DBSCAN(eps=eps, min_samples=min_samples)
        labels = dbscan.fit_predict(features_scaled)
        
        # Analyze clusters
        unique_labels = set(labels)
        clusters = []
        
        for label in unique_labels:
            if label == -1:
                # Noise points - still report but mark as outliers
                cluster_name = "Outliers"
            else:
                cluster_name = f"Scenario {label + 1}"
            
            mask = labels == label
            cluster_indices = np.where(mask)[0]
            cluster_paths = [path_data[i] for i in cluster_indices]
            
            # Calculate cluster statistics
            days = [p["days"] for p in cluster_paths]
            drawdowns = [p["max_drawdown"] for p in cluster_paths]
            final_pnls = [p["final_pnl"] for p in cluster_paths]
            outcomes = [p["outcome"] for p in cluster_paths]
            win_rates = [p["daily_win_rate"] for p in cluster_paths]
            
            pass_count = sum(1 for o in outcomes if o == "pass")
            fail_count = len(outcomes) - pass_count
            
            cluster_info = {
                "label": label,
                "name": cluster_name,
                "count": len(cluster_paths),
                "probability": len(cluster_paths) / self.num_traders * 100,
                "outcome_type": "pass" if pass_count > fail_count else "fail",
                "pass_rate": pass_count / len(cluster_paths) * 100 if cluster_paths else 0,
                "days_median": np.median(days),
                "days_range": (int(np.min(days)), int(np.max(days))),
                "max_drawdown_median": np.median(drawdowns),
                "max_drawdown_p90": np.percentile(drawdowns, 90),
                "final_pnl_median": np.median(final_pnls),
                "final_pnl_range": (np.min(final_pnls), np.max(final_pnls)),
                "daily_win_rate_median": np.median(win_rates),
            }
            
            # Generate human-readable description
            cluster_info["description"] = self._describe_scenario(cluster_info)
            
            clusters.append(cluster_info)
        
        # Sort by probability (most common scenarios first), but put outliers last
        clusters.sort(key=lambda x: (-1 if x["label"] == -1 else x["probability"]), reverse=True)
        
        # Identify the dominant scenario
        non_outlier_clusters = [c for c in clusters if c["label"] != -1]
        dominant = non_outlier_clusters[0] if non_outlier_clusters else None
        
        return {
            "scenarios": clusters,
            "dominant_scenario": dominant,
            "num_scenarios": len([c for c in clusters if c["label"] != -1]),
            "outlier_pct": next((c["probability"] for c in clusters if c["label"] == -1), 0),
            "clustering_params": {"eps": eps, "min_samples": min_samples}
        }
    
    def _describe_scenario(self, cluster: dict) -> str:
        """Generate a human-readable description of a scenario cluster."""
        outcome = cluster["outcome_type"].upper()
        days = cluster["days_median"]
        dd = cluster["max_drawdown_median"]
        pnl = cluster["final_pnl_median"]
        prob = cluster["probability"]
        
        # Categorize timeline
        if days <= 21:
            timeline = "Fast"
        elif days <= 45:
            timeline = "Moderate"
        elif days <= 90:
            timeline = "Extended"
        else:
            timeline = "Long"
        
        # Categorize drawdown severity
        max_loss_limit = self.acct_rules.get('Max Loss (Eval)', 2000)
        dd_pct = dd / max_loss_limit * 100 if max_loss_limit > 0 else 0
        
        if dd_pct <= 30:
            dd_desc = "low drawdown"
        elif dd_pct <= 60:
            dd_desc = "moderate drawdown"
        elif dd_pct <= 85:
            dd_desc = "high drawdown"
        else:
            dd_desc = "near-limit drawdown"
        
        if outcome == "PASS":
            return f"{timeline} pass ({days:.0f} days), {dd_desc}, ${pnl:,.0f} net"
        else:
            return f"{timeline} failure ({days:.0f} days), {dd_desc}"

