import math
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
        self.confidence_level = 0.95  # Default 95% CI

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
        
        # Calculate confidence interval for pass rate using Wilson score interval
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
        
        # Calculate confidence interval for pass rate
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

    def _calculate_confidence_interval(self, successes, total, confidence=None):
        """Calculate Wilson score confidence interval for pass rate."""
        if confidence is None:
            confidence = self.confidence_level
        
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
        Generate trading plan using CLUSTER-BASED analysis.
        
        Instead of averaging all winners (which mixes fast passes with slow grinds),
        this uses DBSCAN clustering to identify distinct outcome scenarios and
        provides MULTIPLE OPTIMAL STRATEGIES based on different criteria:
        
        1. Risk-Adjusted: Best probability/risk ratio
        2. Fastest Pass: Minimize days (aggressive)
        3. Safest Path: Minimize drawdown (conservative)  
        4. Highest Probability: Most likely to succeed
        
        Returns:
            Dictionary with multiple optimal strategies from different clusters
        """
        # First, get clustered scenarios
        scenarios = self.get_outcome_scenarios()
        
        # Find all winning clusters
        winning_clusters = [
            s for s in scenarios["scenarios"] 
            if s["label"] != -1 and s["outcome_type"] == "pass"
        ]
        
        # ============ FILTER OUT CLUSTERS WITH NEGATIVE DAILY PROFIT ============
        # Only keep clusters where the daily profit is positive (realistic to achieve)
        viable_winning_clusters = []
        for cluster in winning_clusters:
            # Get cluster trader numbers and analyze their daily performance
            cluster_trader_nums = self._get_cluster_trader_numbers(cluster, scenarios)
            cluster_data = self._analyze_cluster_paths(cluster_trader_nums)
            daily_pnl_median = cluster_data.get("daily_pnl_median", 0)
            
            # Only include if daily profit is positive
            if daily_pnl_median > 0:
                cluster["_daily_pnl_median"] = daily_pnl_median  # Cache for later use
                viable_winning_clusters.append(cluster)
        
        # Use viable clusters for strategy selection
        winning_clusters = viable_winning_clusters if viable_winning_clusters else winning_clusters
        
        # ============ RANK CLUSTERS BY DIFFERENT CRITERIA ============
        optimal_strategies = {}
        
        if winning_clusters:
            # 1. RISK-ADJUSTED: probability / (days * drawdown)
            for cluster in winning_clusters:
                days_factor = max(1, cluster["days_median"] / 21)
                dd_factor = max(0.1, cluster["max_drawdown_median"] / 1000)
                cluster["_risk_adj_score"] = cluster["probability"] / (days_factor * dd_factor)
            
            risk_adj_sorted = sorted(winning_clusters, key=lambda x: x["_risk_adj_score"], reverse=True)
            optimal_strategies["risk_adjusted"] = {
                "cluster": risk_adj_sorted[0],
                "label": "Risk-Adjusted",
                "description": "Best balance of probability, speed, and safety",
                "optimization": "Maximize: probability / (days × drawdown)"
            }
            
            # 2. FASTEST PASS: minimize days
            fastest_sorted = sorted(winning_clusters, key=lambda x: x["days_median"])
            optimal_strategies["fastest"] = {
                "cluster": fastest_sorted[0],
                "label": "Fastest Pass",
                "description": "Aggressive strategy - minimize time to pass",
                "optimization": "Minimize: days to pass"
            }
            
            # 3. SAFEST PATH: minimize drawdown
            safest_sorted = sorted(winning_clusters, key=lambda x: x["max_drawdown_median"])
            optimal_strategies["safest"] = {
                "cluster": safest_sorted[0],
                "label": "Safest Path",
                "description": "Conservative strategy - minimize risk exposure",
                "optimization": "Minimize: max drawdown"
            }
            
            # 4. HIGHEST PROBABILITY: maximize pass rate
            prob_sorted = sorted(winning_clusters, key=lambda x: x["probability"], reverse=True)
            optimal_strategies["highest_probability"] = {
                "cluster": prob_sorted[0],
                "label": "Highest Probability",
                "description": "Most likely outcome among winning scenarios",
                "optimization": "Maximize: cluster probability"
            }
            
            # 5. HIGHEST PAYOUT: maximize net P&L
            payout_sorted = sorted(winning_clusters, key=lambda x: x["final_pnl_median"], reverse=True)
            optimal_strategies["highest_payout"] = {
                "cluster": payout_sorted[0],
                "label": "Highest Payout",
                "description": "Maximize expected profit per pass",
                "optimization": "Maximize: median net P&L"
            }
        
        # ============ FALLBACK: PERCENTILE-BASED STRATEGIES ============
        # If DBSCAN only found 1 cluster, create synthetic strategies from percentiles
        unique_cluster_names = set(s.get("cluster", {}).get("name") for s in optimal_strategies.values())
        if len(unique_cluster_names) <= 1 and self.winning_trader_numbers:
            percentile_strategies = self._create_percentile_strategies()
            if percentile_strategies:
                optimal_strategies = percentile_strategies
        
        # Use risk-adjusted as the primary/default
        best_cluster = optimal_strategies.get("risk_adjusted", {}).get("cluster") if optimal_strategies else None
        
        # Prop firm limits
        max_loss_limit = self.acct_rules.get('Max Loss (Eval)', float('inf'))
        daily_loss_limit = self.acct_rules.get('Maximum Daily Loss', float('inf'))
        profit_target = self.acct_rules.get('Funding Target Balance', 0) - self.acct_rules.get('Initial Balance (Eval)', 0)
        
        # ============ COLLECT DATA FROM BEST CLUSTER ============
        if best_cluster:
            # Get trader numbers in this cluster
            cluster_trader_nums = self._get_cluster_trader_numbers(best_cluster, scenarios)
            
            # Collect detailed stats from cluster members
            cluster_data = self._analyze_cluster_paths(cluster_trader_nums)
            
            winners = {
                "count": best_cluster["count"],
                "cluster_name": best_cluster["name"],
                "cluster_probability": best_cluster["probability"],
                "cluster_description": best_cluster["description"],
                # Days from cluster
                "days_median": int(best_cluster["days_median"]),
                "days_range": best_cluster["days_range"],
                # Drawdown from cluster
                "max_dd_median": best_cluster["max_drawdown_median"],
                "max_dd_p90": best_cluster["max_drawdown_p90"],
                # Daily stats from cluster paths
                "daily_pnl_mean": cluster_data.get("daily_pnl_mean", 0),
                "daily_pnl_median": cluster_data.get("daily_pnl_median", 0),
                "worst_day_median": cluster_data.get("worst_day_median", 0),
                "worst_day_p10": cluster_data.get("worst_day_p10", 0),
                "daily_win_rate": best_cluster["daily_win_rate_median"],
                # Final P&L
                "final_pnl_median": best_cluster["final_pnl_median"],
                "final_pnl_range": best_cluster["final_pnl_range"],
            }
        else:
            # Fallback to all winners if no clusters found
            winners = self._analyze_all_winners_fallback()
        
        # ============ ANALYZE ALL LOSING CLUSTERS ============
        losing_clusters = [
            s for s in scenarios["scenarios"] 
            if s["label"] != -1 and s["outcome_type"] == "fail"
        ]
        
        if losing_clusters:
            # Combine stats from all losing clusters
            total_losers = sum(c["count"] for c in losing_clusters)
            weighted_days = sum(c["days_median"] * c["count"] for c in losing_clusters) / total_losers
            weighted_dd = sum(c["max_drawdown_median"] * c["count"] for c in losing_clusters) / total_losers
            
            losers = {
                "count": total_losers,
                "num_clusters": len(losing_clusters),
                "days_median": weighted_days,
                "max_dd_median": weighted_dd,
                "common_failure": "max_drawdown" if weighted_dd >= max_loss_limit * 0.9 else "daily_limit",
                "clusters": [{"name": c["name"], "probability": c["probability"], 
                             "description": c["description"]} for c in losing_clusters]
            }
        else:
            losers = None
        
        # ============ PRESCRIPTIVE RULES (from best cluster) ============
        if winners:
            days_median = winners.get("days_median", 30)
            
            # Daily target to match best cluster pace
            daily_target = profit_target / days_median if days_median > 0 else 0
            
            # For 30-day rebill target (~21 trading days per month)
            trading_days_per_month = 21
            daily_target_30d = profit_target / trading_days_per_month
            
            # Safe daily loss limit (what best cluster stayed within)
            worst_day_p10 = winners.get("worst_day_p10", 0)
            safe_daily_loss = abs(worst_day_p10) if worst_day_p10 else daily_loss_limit
            safe_daily_loss = min(safe_daily_loss, daily_loss_limit)
            
            # Max drawdown from best cluster - cap at prop firm limit
            safe_max_dd = min(winners.get("max_dd_p90", max_loss_limit), max_loss_limit)
            
            # Check if strategy is viable for 30-day rebill
            viable_for_30d = days_median <= trading_days_per_month
            
            # Calculate how many calendar months
            months_to_pass = days_median / trading_days_per_month
            
            rules = {
                "source": "best_cluster" if best_cluster else "all_winners",
                "daily_pnl_target": daily_target,
                "daily_pnl_target_30d": daily_target_30d,
                "daily_loss_stop": safe_daily_loss,
                "max_drawdown_safe": safe_max_dd,
                "prop_firm_max_loss": max_loss_limit,
                "target_days": int(days_median),
                "target_days_range": winners.get("days_range", (int(days_median * 0.75), int(days_median * 1.25))),
                "daily_win_rate_needed": winners.get("daily_win_rate", 50),
                "viable_for_30d": viable_for_30d,
                "trading_days_per_month": trading_days_per_month,
                "months_to_pass": months_to_pass,
            }
        else:
            rules = None
        
        # ============ BEST CASE PATH (from best cluster) ============
        best_path = self._get_best_path_from_cluster(best_cluster, scenarios) if best_cluster else None
        
        # Collect all daily P&Ls for Kelly calculation
        all_daily_pnls = self._collect_all_daily_pnls()
        
        # ============ GENERATE RULES FOR EACH OPTIMAL STRATEGY ============
        strategy_rules = {}
        for strategy_key, strategy_data in optimal_strategies.items():
            cluster = strategy_data["cluster"]
            strategy_rules[strategy_key] = self._generate_rules_for_cluster(
                cluster, scenarios, profit_target, max_loss_limit, daily_loss_limit
            )
            strategy_rules[strategy_key]["label"] = strategy_data["label"]
            strategy_rules[strategy_key]["description"] = strategy_data["description"]
            strategy_rules[strategy_key]["optimization"] = strategy_data["optimization"]
            strategy_rules[strategy_key]["cluster_info"] = {
                "name": cluster["name"],
                "probability": cluster["probability"],
                "days_median": cluster["days_median"],
                "max_drawdown_median": cluster["max_drawdown_median"],
                "final_pnl_median": cluster["final_pnl_median"],
                "daily_win_rate": cluster["daily_win_rate_median"],
            }
        
        return {
            "pass_rate": self.pct_wins,
            "pass_rate_ci": (self.pass_rate_ci_lower, self.pass_rate_ci_upper),
            "fail_rate": self.pct_fails,
            "num_simulations": self.num_traders,
            
            # ============ MULTIPLE OPTIMAL STRATEGIES (for tabs) ============
            "optimal_strategies": strategy_rules,
            
            # Default/primary strategy (risk-adjusted)
            "winners": winners,
            "best_cluster": best_cluster,
            "rules": rules,  # Default rules (risk-adjusted)
            
            # All winning clusters for reference
            "all_winning_clusters": [
                {"name": c["name"], "probability": c["probability"], 
                 "days_median": c["days_median"], "max_drawdown_median": c["max_drawdown_median"],
                 "final_pnl_median": c["final_pnl_median"], "description": c["description"]}
                for c in winning_clusters
            ] if winning_clusters else [],
            
            # Loser analysis  
            "losers": losers,
            
            # Best case scenario (from best cluster)
            "best_path": best_path,
            
            # Prop firm context
            "prop_firm": {
                "profit_target": profit_target,
                "max_loss": max_loss_limit,
                "daily_limit": daily_loss_limit,
            },
            
            # Phase-specific targets for Combine+Funded mode
            "phase_targets": self._get_phase_targets(),
            
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

    def _get_cluster_trader_numbers(self, cluster: dict, scenarios: dict) -> list:
        """Get trader numbers belonging to a specific cluster."""
        # Re-run clustering to get labels (cached in scenarios)
        # For now, identify by matching cluster characteristics
        cluster_traders = []
        
        for trader_num, trader in self.traders.items():
            # Match based on outcome and approximate characteristics
            if cluster["outcome_type"] == "pass" and not trader.account.won:
                continue
            if cluster["outcome_type"] == "fail" and trader.account.won:
                continue
            
            # Check if this trader's stats fall within cluster range
            days = trader.account.total_days
            days_range = cluster["days_range"]
            
            if days_range[0] <= days <= days_range[1]:
                cluster_traders.append(trader_num)
        
        return cluster_traders

    def _analyze_cluster_paths(self, trader_nums: list) -> dict:
        """Analyze paths from a specific cluster to get detailed daily stats."""
        daily_pnls = []
        worst_days = []
        best_days = []
        
        for trader_num in trader_nums:
            trader = self.traders[trader_num]
            running_balance = np.array(trader.running_balance)
            
            if len(running_balance) > 1:
                path_daily_pnls = np.diff(running_balance)
                daily_pnls.extend(path_daily_pnls)
                worst_days.append(np.min(path_daily_pnls))
                best_days.append(np.max(path_daily_pnls))
        
        if not daily_pnls:
            return {}
        
        daily_pnls = np.array(daily_pnls)
        worst_days = np.array(worst_days)
        
        return {
            "daily_pnl_mean": np.mean(daily_pnls),
            "daily_pnl_median": np.median(daily_pnls),
            "worst_day_median": np.median(worst_days),
            "worst_day_p10": np.percentile(worst_days, 10),
            "best_day_median": np.median(best_days) if best_days else 0,
            "daily_win_rate": np.mean(daily_pnls > 0) * 100,
        }

    def _analyze_all_winners_fallback(self) -> dict:
        """Fallback: analyze all winners when clustering doesn't produce results."""
        if not self.winning_trader_numbers:
            return None
        
        days = []
        max_dds = []
        daily_pnls = []
        worst_days = []
        final_pnls = []
        
        for trader_num in self.winning_trader_numbers:
            trader = self.traders[trader_num]
            running_balance = np.array(trader.running_balance)
            
            days.append(trader.account.total_days)
            final_pnls.append(trader.PnL)
            
            if len(running_balance) > 1:
                running_max = np.maximum.accumulate(running_balance)
                drawdowns = running_max - running_balance
                max_dds.append(np.max(drawdowns))
                
                path_daily = np.diff(running_balance)
                daily_pnls.extend(path_daily)
                worst_days.append(np.min(path_daily))
        
        days = np.array(days)
        daily_pnls = np.array(daily_pnls) if daily_pnls else np.array([0])
        worst_days = np.array(worst_days) if worst_days else np.array([0])
        max_dds = np.array(max_dds) if max_dds else np.array([0])
        
        return {
            "count": len(self.winning_trader_numbers),
            "cluster_name": "All Winners (no clustering)",
            "cluster_probability": self.pct_wins,
            "cluster_description": "Fallback: all winning paths averaged",
            "days_median": int(np.median(days)),
            "days_range": (int(np.min(days)), int(np.max(days))),
            "max_dd_median": np.median(max_dds),
            "max_dd_p90": np.percentile(max_dds, 90),
            "daily_pnl_mean": np.mean(daily_pnls),
            "daily_pnl_median": np.median(daily_pnls),
            "worst_day_median": np.median(worst_days),
            "worst_day_p10": np.percentile(worst_days, 10),
            "daily_win_rate": np.mean(daily_pnls > 0) * 100,
            "final_pnl_median": np.median(final_pnls),
            "final_pnl_range": (np.min(final_pnls), np.max(final_pnls)),
        }

    def _get_best_path_from_cluster(self, cluster: dict, scenarios: dict) -> dict:
        """Get the best (fastest) path from a cluster."""
        if not cluster:
            return None
        
        cluster_traders = self._get_cluster_trader_numbers(cluster, scenarios)
        
        if not cluster_traders:
            return None
        
        # Find fastest path in cluster
        fastest_days = float('inf')
        fastest_trader_num = None
        
        for trader_num in cluster_traders:
            trader = self.traders[trader_num]
            if trader.account.won and trader.account.total_days < fastest_days:
                fastest_days = trader.account.total_days
                fastest_trader_num = trader_num
        
        if fastest_trader_num is None:
            return None
        
        trader = self.traders[fastest_trader_num]
        running_balance = np.array(trader.running_balance)
        daily_pnls = np.diff(running_balance) if len(running_balance) > 1 else np.array([])
        
        if len(running_balance) > 1:
            running_max = np.maximum.accumulate(running_balance)
            drawdowns = running_max - running_balance
            max_dd = np.max(drawdowns)
        else:
            max_dd = 0
        
        winning_pnls = daily_pnls[daily_pnls > 0] if len(daily_pnls) > 0 else []
        losing_pnls = daily_pnls[daily_pnls < 0] if len(daily_pnls) > 0 else []
        
        return {
            "days": trader.account.total_days,
            "final_pnl": trader.PnL,
            "max_drawdown": max_dd,
            "avg_daily_pnl": np.mean(daily_pnls) if len(daily_pnls) > 0 else 0,
            "best_day": np.max(daily_pnls) if len(daily_pnls) > 0 else 0,
            "worst_day": np.min(daily_pnls) if len(daily_pnls) > 0 else 0,
            "winning_days": int(np.sum(daily_pnls > 0)) if len(daily_pnls) > 0 else 0,
            "losing_days": int(np.sum(daily_pnls < 0)) if len(daily_pnls) > 0 else 0,
            "daily_win_rate": (np.sum(daily_pnls > 0) / len(daily_pnls) * 100) if len(daily_pnls) > 0 else 0,
            "avg_winning_day": np.mean(winning_pnls) if len(winning_pnls) > 0 else 0,
            "avg_losing_day": np.mean(losing_pnls) if len(losing_pnls) > 0 else 0,
            "from_cluster": cluster["name"],
        }

    def _collect_all_daily_pnls(self) -> np.ndarray:
        """Collect all daily P&Ls from all traders for Kelly calculation."""
        all_daily_pnls = []
        
        for trader_num, trader in self.traders.items():
            running_balance = np.array(trader.running_balance)
            if len(running_balance) > 1:
                daily_pnls = np.diff(running_balance)
                all_daily_pnls.extend(daily_pnls)
        
        return np.array(all_daily_pnls) if all_daily_pnls else np.array([0])

    def _create_percentile_strategies(self) -> dict:
        """
        Create strategies based on percentile filtering of winners.
        Used as fallback when DBSCAN produces only 1 cluster.
        
        Creates 5 distinct groups:
        - Fastest 25%: Lowest days to pass
        - Safest 25%: Lowest max drawdown
        - Highest Payout 25%: Highest final P&L
        - Balanced/Median: Middle 50% on all metrics
        - Risk-Adjusted: Best composite score
        """
        if not self.winning_trader_numbers:
            return {}
        
        # Collect data from all winners
        winner_data = []
        for trader_num in self.winning_trader_numbers:
            trader = self.traders[trader_num]
            running_balance = np.array(trader.running_balance)
            
            if len(running_balance) > 1:
                running_max = np.maximum.accumulate(running_balance)
                drawdowns = running_max - running_balance
                max_dd = np.max(drawdowns)
                daily_pnls = np.diff(running_balance)
                daily_win_rate = np.mean(daily_pnls > 0) * 100
            else:
                max_dd = 0
                daily_win_rate = 50
            
            winner_data.append({
                "trader_num": trader_num,
                "days": trader.account.total_days,
                "max_drawdown": max_dd,
                "final_pnl": trader.PnL,
                "daily_win_rate": daily_win_rate,
            })
        
        if len(winner_data) < 4:
            return {}  # Not enough data for percentile splits
        
        # Convert to arrays for percentile calculations
        days_arr = np.array([w["days"] for w in winner_data])
        dd_arr = np.array([w["max_drawdown"] for w in winner_data])
        pnl_arr = np.array([w["final_pnl"] for w in winner_data])
        
        # Calculate percentile thresholds
        days_p25 = np.percentile(days_arr, 25)
        dd_p25 = np.percentile(dd_arr, 25)
        pnl_p75 = np.percentile(pnl_arr, 75)
        
        # Create synthetic clusters based on percentiles
        def create_cluster_from_filter(filter_func, name, description):
            filtered = [w for w in winner_data if filter_func(w)]
            if not filtered:
                return None
            
            days = [w["days"] for w in filtered]
            dds = [w["max_drawdown"] for w in filtered]
            pnls = [w["final_pnl"] for w in filtered]
            win_rates = [w["daily_win_rate"] for w in filtered]
            
            return {
                "name": name,
                "label": -99,  # Synthetic cluster marker
                "count": len(filtered),
                "probability": len(filtered) / len(self.traders) * 100,
                "outcome_type": "pass",
                "pass_rate": 100.0,
                "days_median": np.median(days),
                "days_range": (int(np.min(days)), int(np.max(days))),
                "max_drawdown_median": np.median(dds),
                "max_drawdown_p90": np.percentile(dds, 90),
                "final_pnl_median": np.median(pnls),
                "final_pnl_range": (np.min(pnls), np.max(pnls)),
                "daily_win_rate_median": np.median(win_rates),
                "description": description,
                "_trader_nums": [w["trader_num"] for w in filtered],
            }
        
        strategies = {}
        
        # 1. FASTEST 25%
        fastest_cluster = create_cluster_from_filter(
            lambda w: w["days"] <= days_p25,
            "Fastest 25%",
            f"Winners who passed in ≤{int(days_p25)} days (bottom quartile)"
        )
        if fastest_cluster:
            strategies["fastest"] = {
                "cluster": fastest_cluster,
                "label": "Fastest Pass",
                "description": "Top 25% fastest passes - aggressive timeline",
                "optimization": "Filter: days ≤ 25th percentile"
            }
        
        # 2. SAFEST 25% (lowest drawdown)
        safest_cluster = create_cluster_from_filter(
            lambda w: w["max_drawdown"] <= dd_p25,
            "Safest 25%",
            f"Winners with max DD ≤${int(dd_p25)} (bottom quartile)"
        )
        if safest_cluster:
            strategies["safest"] = {
                "cluster": safest_cluster,
                "label": "Safest Path",
                "description": "Top 25% lowest drawdown - conservative approach",
                "optimization": "Filter: max_drawdown ≤ 25th percentile"
            }
        
        # 3. HIGHEST PAYOUT 25%
        payout_cluster = create_cluster_from_filter(
            lambda w: w["final_pnl"] >= pnl_p75,
            "Top Payout 25%",
            f"Winners with P&L ≥${int(pnl_p75)} (top quartile)"
        )
        if payout_cluster:
            strategies["highest_payout"] = {
                "cluster": payout_cluster,
                "label": "Highest Payout",
                "description": "Top 25% highest payouts - maximize profit",
                "optimization": "Filter: final_pnl ≥ 75th percentile"
            }
        
        # 4. BALANCED (middle 50% on days)
        days_p25_val = np.percentile(days_arr, 25)
        days_p75_val = np.percentile(days_arr, 75)
        balanced_cluster = create_cluster_from_filter(
            lambda w: days_p25_val <= w["days"] <= days_p75_val,
            "Balanced (IQR)",
            f"Winners in {int(days_p25_val)}-{int(days_p75_val)} days (middle 50%)"
        )
        if balanced_cluster:
            strategies["highest_probability"] = {
                "cluster": balanced_cluster,
                "label": "Most Typical",
                "description": "Middle 50% of winners - most representative outcome",
                "optimization": "Filter: days in interquartile range (25th-75th)"
            }
        
        # 5. RISK-ADJUSTED (composite score)
        # Score each winner: lower days + lower DD + higher PnL = better
        for w in winner_data:
            days_score = 1 - (w["days"] - np.min(days_arr)) / (np.max(days_arr) - np.min(days_arr) + 1)
            dd_score = 1 - (w["max_drawdown"] - np.min(dd_arr)) / (np.max(dd_arr) - np.min(dd_arr) + 1)
            pnl_score = (w["final_pnl"] - np.min(pnl_arr)) / (np.max(pnl_arr) - np.min(pnl_arr) + 1)
            w["_composite_score"] = days_score + dd_score + pnl_score
        
        score_p75 = np.percentile([w["_composite_score"] for w in winner_data], 75)
        risk_adj_cluster = create_cluster_from_filter(
            lambda w: w["_composite_score"] >= score_p75,
            "Risk-Adjusted Top 25%",
            "Best composite score (fast + safe + profitable)"
        )
        if risk_adj_cluster:
            strategies["risk_adjusted"] = {
                "cluster": risk_adj_cluster,
                "label": "Risk-Adjusted",
                "description": "Top 25% by composite score (speed + safety + profit)",
                "optimization": "Filter: composite_score ≥ 75th percentile"
            }
        
        return strategies

    def _generate_rules_for_cluster(self, cluster: dict, scenarios: dict, 
                                     profit_target: float, max_loss_limit: float, 
                                     daily_loss_limit: float) -> dict:
        """Generate prescriptive trading rules for a specific cluster."""
        # Get detailed stats from cluster paths
        cluster_trader_nums = self._get_cluster_trader_numbers(cluster, scenarios)
        cluster_data = self._analyze_cluster_paths(cluster_trader_nums)
        
        days_median = int(cluster["days_median"])
        trading_days_per_month = 21
        
        # Daily target to match this cluster's pace
        daily_target = profit_target / days_median if days_median > 0 else 0
        daily_target_30d = profit_target / trading_days_per_month
        
        # ============ RECOMMENDED DAILY LOSS LIMIT ============
        # Calculate a sensible daily loss limit based on the strategy
        # The idea: your max daily loss should allow recovery within reason
        # 
        # Option 1: Use observed worst day from winning paths (p10)
        worst_day_p10 = cluster_data.get("worst_day_p10", 0)
        observed_worst_day = abs(worst_day_p10) if worst_day_p10 else 0
        
        # Option 2: Calculate based on risk/reward ratio
        # A common rule: max daily loss = 2-3x daily profit target
        # This ensures one bad day doesn't wipe out a week of progress
        risk_based_daily_loss = daily_target * 2.5 if daily_target > 0 else 0
        
        # Option 3: Prop firm limit (if they have one)
        has_firm_daily_limit = daily_loss_limit < 50000  # 99999 means no limit
        
        # Choose the recommended daily loss:
        # - If prop firm has a limit, use that as the cap
        # - Otherwise, use the more conservative of observed vs risk-based
        if has_firm_daily_limit:
            # Prop firm has a daily limit - use it but also show what winners did
            safe_daily_loss = min(observed_worst_day, daily_loss_limit) if observed_worst_day > 0 else daily_loss_limit
        else:
            # No firm limit - recommend based on risk/reward math
            # Use the smaller of: observed worst day from winners OR 2.5x daily target
            if observed_worst_day > 0 and risk_based_daily_loss > 0:
                safe_daily_loss = min(observed_worst_day, risk_based_daily_loss)
            elif risk_based_daily_loss > 0:
                safe_daily_loss = risk_based_daily_loss
            else:
                safe_daily_loss = observed_worst_day if observed_worst_day > 0 else max_loss_limit * 0.25
        
        # Max drawdown from this cluster
        safe_max_dd = min(cluster["max_drawdown_p90"], max_loss_limit)
        
        # Viability checks
        viable_for_30d = days_median <= trading_days_per_month
        months_to_pass = days_median / trading_days_per_month
        
        # ============ SCENARIO PERFORMANCE ============
        # Extract the scenario's actual performance metrics
        # Use cached value if available (from filtering), otherwise calculate
        scenario_daily_profit = cluster.get("_daily_pnl_median") or cluster_data.get("daily_pnl_median", daily_target)
        scenario_win_rate = cluster["daily_win_rate_median"] / 100  # Convert to decimal
        
        # ============ EVAL PHASE PROJECTION ============
        # Project: "If you achieve this scenario's performance, how long to pass eval?"
        if scenario_daily_profit > 0:
            projected_days_to_pass_eval = math.ceil(profit_target / scenario_daily_profit)
        else:
            projected_days_to_pass_eval = 999  # Can't pass with negative daily profit
        
        # ============ FUNDED PHASE PROJECTION ============
        # Project: "After passing eval, how long to reach payout eligibility?"
        min_winning_days = self.acct_rules.get('Minimum Winning Days for Payout', 5)
        winning_day_min_pnl = self.acct_rules.get('Winning Day PnL Minimum', 200)
        min_balance_for_payout = self.acct_rules.get('Minimum Winning Balance', 52000)
        initial_funded_balance = self.acct_rules.get('Initial Balance (Funded)', 50000)
        profit_share = self.acct_rules.get('Profit Share Fraction', 0.9)
        
        # Days needed to accumulate winning days (based on win rate)
        if scenario_win_rate > 0:
            # Expected days to get N winning days = N / win_rate
            projected_days_for_winning_days = math.ceil(min_winning_days / scenario_win_rate)
        else:
            projected_days_for_winning_days = 999
        
        # Profit accumulated in funded during those days
        funded_profit_at_payout = scenario_daily_profit * projected_days_for_winning_days
        funded_balance_at_payout = initial_funded_balance + funded_profit_at_payout
        
        # Check if min balance requirement is met
        profit_needed_for_min_balance = max(0, min_balance_for_payout - initial_funded_balance)
        if scenario_daily_profit > 0:
            days_for_min_balance = math.ceil(profit_needed_for_min_balance / scenario_daily_profit)
        else:
            days_for_min_balance = 999
        
        # Take the longer of the two requirements
        projected_days_to_payout = max(projected_days_for_winning_days, days_for_min_balance)
        
        # Recalculate funded profit at actual payout day
        funded_profit_at_payout = scenario_daily_profit * projected_days_to_payout
        funded_balance_at_payout = initial_funded_balance + funded_profit_at_payout
        
        # Calculate actual payout amount
        projected_payout = funded_profit_at_payout * profit_share
        
        # Total journey
        total_projected_days = projected_days_to_pass_eval + projected_days_to_payout
        
        return {
            "daily_pnl_target": daily_target,
            "daily_pnl_target_30d": daily_target_30d,
            "daily_loss_stop": safe_daily_loss,
            "max_drawdown_safe": safe_max_dd,
            "prop_firm_max_loss": max_loss_limit,
            "target_days": days_median,
            "target_days_range": cluster["days_range"],
            "daily_win_rate_needed": cluster["daily_win_rate_median"],
            "viable_for_30d": viable_for_30d,
            "trading_days_per_month": trading_days_per_month,
            "months_to_pass": months_to_pass,
            "expected_pnl": cluster["final_pnl_median"],
            "cluster_probability": cluster["probability"],
            
            # ============ SCENARIO PROJECTION ============
            "scenario_performance": {
                "daily_profit": scenario_daily_profit,
                "win_rate": cluster["daily_win_rate_median"],
                "max_drawdown": cluster["max_drawdown_median"],
            },
            "eval_projection": {
                "profit_target": profit_target,
                "days_to_pass": projected_days_to_pass_eval,
                "daily_profit_needed": scenario_daily_profit,
            },
            "funded_projection": {
                "min_winning_days_required": min_winning_days,
                "winning_day_minimum_pnl": winning_day_min_pnl,
                "min_balance_required": min_balance_for_payout,
                "days_to_payout": projected_days_to_payout,
                "funded_profit": funded_profit_at_payout,
                "funded_balance": funded_balance_at_payout,
                "profit_share_pct": profit_share * 100,
                "projected_payout": projected_payout,
            },
            "total_projection": {
                "total_days": total_projected_days,
                "eval_days": projected_days_to_pass_eval,
                "funded_days": projected_days_to_payout,
                "final_payout": projected_payout,
            },
        }

    def _get_phase_targets(self) -> dict:
        """
        Get phase-specific targets for different game types.
        
        Returns targets for:
        - Eval phase: profit target to pass combine
        - Funded phase: requirements for payout (winning days, min balance)
        - Payout calculation: profit share details
        """
        # Eval phase targets
        initial_eval = self.acct_rules.get('Initial Balance (Eval)', 50000)
        funding_target = self.acct_rules.get('Funding Target Balance', 53000)
        eval_profit_target = funding_target - initial_eval
        
        # Funded phase targets
        initial_funded = self.acct_rules.get('Initial Balance (Funded)', 50000)
        min_winning_days = self.acct_rules.get('Minimum Winning Days for Payout', 5)
        winning_day_minimum = self.acct_rules.get('Winning Day PnL Minimum', 200)
        min_balance_for_payout = self.acct_rules.get('Minimum Winning Balance', 52000)
        funded_profit_for_payout = min_balance_for_payout - initial_funded
        
        # Payout calculation details
        profit_share = self.acct_rules.get('Profit Share Fraction', 0.9)
        unshared_balance = self.acct_rules.get('Unshared Winning Balance (Funded)', 60000)
        
        # Calculate example payout at minimum balance
        if min_balance_for_payout > initial_funded:
            min_payout = (min_balance_for_payout - initial_funded) * profit_share
        else:
            min_payout = 0
        
        return {
            # Eval phase (Combine)
            "eval": {
                "initial_balance": initial_eval,
                "target_balance": funding_target,
                "profit_target": eval_profit_target,
                "max_loss": self.acct_rules.get('Max Loss (Eval)', 2000),
                "daily_loss_limit": self.acct_rules.get('Maximum Daily Loss', 1000),
            },
            # Funded phase
            "funded": {
                "initial_balance": initial_funded,
                "min_winning_days": min_winning_days,
                "winning_day_minimum": winning_day_minimum,
                "min_balance_for_payout": min_balance_for_payout,
                "profit_needed_for_payout": funded_profit_for_payout,
                "max_loss": self.acct_rules.get('Max Loss (Funded)', 2000),
            },
            # Payout details
            "payout": {
                "profit_share_pct": profit_share * 100,
                "unshared_balance_threshold": unshared_balance,
                "min_payout_at_threshold": min_payout,
            },
            # Summary for UI
            "summary": {
                "eval_target": f"${eval_profit_target:,.0f} profit to pass eval",
                "funded_requirements": f"{min_winning_days} winning days (≥${winning_day_minimum}/day), balance ≥${min_balance_for_payout:,.0f}",
                "payout_formula": f"{profit_share*100:.0f}% of profits above ${initial_funded:,.0f}",
            }
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
            winner_stats["avg_net_profit"] = np.mean(winner_gross_payouts) - np.mean(winner_total_costs)
        
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

    def get_outcome_scenarios(self, eps: float = 0.15, min_samples: int = None) -> dict:
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
            eps: DBSCAN neighborhood radius (in standardized space). 
                 Lower = more clusters (tighter grouping), higher = fewer clusters.
                 Default 0.15 for fine-grained clustering.
            min_samples: Minimum samples for core point (default: 2)
        
        Returns:
            Dictionary with scenario clusters ranked by probability
        """
        if min_samples is None:
            min_samples = 2  # Allow small clusters
        
        # Extract features from all paths
        features = []
        path_data = []
        
        for trader_num, trader in self.traders.items():
            running_balance = np.array(trader.running_balance)
            total_days = trader.account.total_days
            
            # Calculate days in eval vs funded
            # running_balance only records funded phase days
            days_in_funded = len(running_balance)
            days_in_eval = total_days - days_in_funded
            
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
            
            # Calculate actual payout (for winners)
            # trader.PnL already includes the payout from funded_full_payout()
            # but also subtracts costs, so actual_payout = PnL + total_costs
            if outcome == 1:
                # Estimate costs paid
                eval_cost = self.acct_fees.get('Eval Acct Cost', 0)
                monthly_cost = self.acct_fees.get('Monthly Eval Cost', 0)
                funded_setup = self.acct_fees.get('Funded Acct Setup Cost', 0)
                months_in_eval = max(0, (days_in_eval - 1) // 30)
                total_costs = eval_cost + (monthly_cost * months_in_eval) + funded_setup
                actual_payout = final_pnl + total_costs
            else:
                actual_payout = 0
            
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
                "days_in_eval": days_in_eval,
                "days_in_funded": days_in_funded,
                "max_drawdown": max_dd,
                "volatility": pnl_volatility,
                "final_pnl": final_pnl,
                "actual_payout": actual_payout,
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
            days_in_eval = [p["days_in_eval"] for p in cluster_paths]
            days_in_funded = [p["days_in_funded"] for p in cluster_paths]
            drawdowns = [p["max_drawdown"] for p in cluster_paths]
            final_pnls = [p["final_pnl"] for p in cluster_paths]
            actual_payouts = [p["actual_payout"] for p in cluster_paths]
            outcomes = [p["outcome"] for p in cluster_paths]
            win_rates = [p["daily_win_rate"] for p in cluster_paths]
            
            pass_count = sum(1 for o in outcomes if o == "pass")
            fail_count = len(outcomes) - pass_count
            
            # For winners, calculate payout stats
            winner_payouts = [p for p in actual_payouts if p > 0]
            
            cluster_info = {
                "label": label,
                "name": cluster_name,
                "count": len(cluster_paths),
                "probability": len(cluster_paths) / self.num_traders * 100,
                "outcome_type": "pass" if pass_count > fail_count else "fail",
                "pass_rate": pass_count / len(cluster_paths) * 100 if cluster_paths else 0,
                "days_median": np.median(days),
                "days_range": (int(np.min(days)), int(np.max(days))),
                # Phase breakdown
                "days_in_eval_median": np.median(days_in_eval),
                "days_in_funded_median": np.median(days_in_funded),
                # Drawdown and P&L
                "max_drawdown_median": np.median(drawdowns),
                "max_drawdown_p90": np.percentile(drawdowns, 90),
                "final_pnl_median": np.median(final_pnls),
                "final_pnl_range": (np.min(final_pnls), np.max(final_pnls)),
                "daily_win_rate_median": np.median(win_rates),
                # Actual payout (for winners)
                "actual_payout_median": np.median(winner_payouts) if winner_payouts else 0,
                "actual_payout_range": (np.min(winner_payouts), np.max(winner_payouts)) if winner_payouts else (0, 0),
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

