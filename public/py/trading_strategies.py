import numpy as np
import pandas as pd
from typing import Optional
# import matplotlib.pyplot as plt


class TradingStrategy:
    def __init__(self, odds, mfe, trades_per_day, stop_width, tp_width):
        self.odds = odds  # probability of success
        self.mfe = mfe  # in currency
        self.trades_per_day = trades_per_day
        # TODO: randomize trades per day?
        self.bracket_stop_width_currency = stop_width
        self.bracket_tp_width_currency = tp_width

    def simulate_return(self, per_side_cost=0, entry_slippage=0, stop_slippage=0):
        # Simulate the return for a single trade using the strategy stats
        return np.random.choice([self.bracket_tp_width_currency - per_side_cost - entry_slippage,
                                 -self.bracket_stop_width_currency - per_side_cost - entry_slippage - stop_slippage],
                                p=[self.odds, 1 - self.odds])

    def simulate_favorable_excursion(self):
        if self.mfe == 0:
            return 0
        if self.mfe * 2 <= self.bracket_tp_width_currency:
            return np.random.uniform(0, 2 * self.mfe)
        else:
            tp_minus_mfe = self.bracket_tp_width_currency - self.mfe
            if tp_minus_mfe > 0:
                return np.random.uniform(self.mfe - tp_minus_mfe, self.bracket_tp_width_currency)
            else:
                return self.mfe


class BootstrappedTradingStrategy:
    """
    A trading strategy that uses bootstrapping from historical trade data.
    
    This implements the Monte Carlo bootstrapping method where:
    1. Extract distribution of trades-per-day from real trading log
    2. For each simulated day, randomly sample number of trades from that distribution
    3. Randomly sample that many trades (with replacement) from the entire trade pool
    4. Sum their P&Ls to get the day's total P&L
    """
    
    def __init__(self, trade_log_df: pd.DataFrame, pnl_column: str = 'pnl', 
                 date_column: Optional[str] = 'date', no_trade_override: Optional[float] = None):
        """
        Initialize the bootstrapped strategy from a trade log DataFrame.
        
        Args:
            trade_log_df: DataFrame containing historical trades
            pnl_column: Name of the column containing P&L values
            date_column: Name of the column containing trade dates (for extracting trades-per-day distribution)
            no_trade_override: Optional manual override for p(No-Trade) as a decimal (e.g., 0.25 for 25%)
        """
        self.trade_log = trade_log_df.copy()
        self.pnl_column = pnl_column
        self.date_column = date_column
        self.no_trade_override = no_trade_override
        
        # Extract all P&L values as the trade pool
        self.pnl_pool = self.trade_log[pnl_column].values
        
        # Calculate trades-per-day distribution (including no-trade days)
        if date_column and date_column in self.trade_log.columns:
            self.trades_per_day_distribution, self.p_no_trade, self.no_trade_stats = \
                self._extract_trades_per_day_distribution_with_gaps()
        else:
            # If no date column, assume 1 trade per row represents 1 day
            self.trades_per_day_distribution = np.array([1])
            self.p_no_trade = 0.0
            self.no_trade_stats = {}
        
        # Apply manual override if specified
        if no_trade_override is not None:
            self._apply_no_trade_override(no_trade_override)
        
        # Calculate statistics for display
        self.total_trades = len(self.pnl_pool)
        # Average trades per day (excluding zero-trade days for this stat)
        non_zero_days = self.trades_per_day_distribution[self.trades_per_day_distribution > 0]
        self.avg_trades_per_day = np.mean(non_zero_days) if len(non_zero_days) > 0 else 0
        self.win_rate = np.mean(self.pnl_pool > 0)
        self.avg_win = np.mean(self.pnl_pool[self.pnl_pool > 0]) if np.any(self.pnl_pool > 0) else 0
        self.avg_loss = np.mean(self.pnl_pool[self.pnl_pool < 0]) if np.any(self.pnl_pool < 0) else 0
        self.avg_pnl = np.mean(self.pnl_pool)
        
        # For compatibility with existing code that checks trades_per_day
        self.trades_per_day = self.avg_trades_per_day
        
        # MFE tracking (optional - can be added if MFE column exists)
        self.mfe_pool = None
        if 'mfe' in self.trade_log.columns:
            self.mfe_pool = self.trade_log['mfe'].values
    
    def _count_business_days(self, start_date, end_date) -> int:
        """Count business days (Mon-Fri) between two dates, excluding weekends."""
        # Generate all dates in range
        all_dates = pd.date_range(start=start_date, end=end_date, freq='B')  # 'B' = business days
        return len(all_dates)
    
    def _extract_trades_per_day_distribution_with_gaps(self):
        """
        Extract trades-per-day distribution including no-trade days.
        
        Returns:
            trades_per_day: Array including zeros for no-trade days
            p_no_trade: Probability of no trades on a given day
            stats: Dictionary with detailed statistics
        """
        # Get unique trading dates from the log
        trading_dates = pd.to_datetime(self.trade_log[self.date_column]).dt.date.unique()
        trading_dates = sorted(trading_dates)
        
        if len(trading_dates) < 2:
            # Not enough data to calculate gaps
            trades_per_day = self.trade_log.groupby(self.date_column).size().values
            return trades_per_day, 0.0, {"days_with_trades": len(trading_dates)}
        
        # Calculate date range
        first_date = trading_dates[0]
        last_date = trading_dates[-1]
        
        # Count business days in the range
        total_business_days = self._count_business_days(first_date, last_date)
        days_with_trades = len(trading_dates)
        no_trade_days = total_business_days - days_with_trades
        
        # Get trades per day for days that had trades
        trades_on_trading_days = self.trade_log.groupby(self.date_column).size().values
        
        # Create full distribution including zeros for no-trade days
        if no_trade_days > 0:
            zeros = np.zeros(no_trade_days, dtype=int)
            trades_per_day = np.concatenate([trades_on_trading_days, zeros])
        else:
            trades_per_day = trades_on_trading_days
        
        # Calculate p(No-Trade)
        p_no_trade = no_trade_days / total_business_days if total_business_days > 0 else 0.0
        
        stats = {
            "first_date": first_date,
            "last_date": last_date,
            "total_business_days": total_business_days,
            "days_with_trades": days_with_trades,
            "no_trade_days": no_trade_days,
            "p_no_trade": p_no_trade
        }
        
        return trades_per_day, p_no_trade, stats
    
    def _apply_no_trade_override(self, override_pct: float):
        """
        Apply a manual override for p(No-Trade).
        
        Args:
            override_pct: Desired p(No-Trade) as decimal (0.0 to 1.0)
        """
        if override_pct <= 0:
            # Remove all zeros from distribution
            self.trades_per_day_distribution = self.trades_per_day_distribution[
                self.trades_per_day_distribution > 0
            ]
            self.p_no_trade = 0.0
        elif override_pct >= 1:
            # All days are no-trade days (edge case)
            self.trades_per_day_distribution = np.array([0])
            self.p_no_trade = 1.0
        else:
            # Adjust distribution to match desired p(No-Trade)
            non_zero_days = self.trades_per_day_distribution[self.trades_per_day_distribution > 0]
            num_non_zero = len(non_zero_days)
            
            # Calculate how many zeros we need
            # If we want p = override_pct, and we have N non-zero days:
            # zeros / (zeros + N) = override_pct
            # zeros = override_pct * (zeros + N)
            # zeros - override_pct * zeros = override_pct * N
            # zeros * (1 - override_pct) = override_pct * N
            # zeros = (override_pct * N) / (1 - override_pct)
            num_zeros = int(round((override_pct * num_non_zero) / (1 - override_pct)))
            
            zeros = np.zeros(num_zeros, dtype=int)
            self.trades_per_day_distribution = np.concatenate([non_zero_days, zeros])
            self.p_no_trade = override_pct
    
    def sample_trades_for_day(self) -> int:
        """Randomly sample the number of trades to take on a simulated day."""
        return int(np.random.choice(self.trades_per_day_distribution))
    
    def simulate_return(self, per_side_cost=0, entry_slippage=0, stop_slippage=0) -> float:
        """
        Simulate the return for a single trade by sampling from the historical trade pool.
        
        Note: Costs and slippage can optionally be applied on top of historical P&L.
        """
        sampled_pnl = np.random.choice(self.pnl_pool)
        
        # Apply additional costs if specified
        total_cost = per_side_cost + entry_slippage
        if sampled_pnl < 0:
            total_cost += stop_slippage
        
        return sampled_pnl - total_cost
    
    def simulate_favorable_excursion(self) -> float:
        """
        Simulate MFE for a trade. If MFE data exists in the log, sample from it.
        Otherwise, return 0 (conservative assumption).
        """
        if self.mfe_pool is not None:
            return np.random.choice(self.mfe_pool)
        return 0
    
    def get_statistics(self) -> dict:
        """Return statistics about the trade log for display."""
        stats = {
            "Total Trades": self.total_trades,
            "Days with Trades": self.no_trade_stats.get("days_with_trades", len(self.trades_per_day_distribution)),
            "p(No-Trade)": f"{self.p_no_trade * 100:.1f}%",
            "Avg Trades/Day": f"{self.avg_trades_per_day:.1f}",
            "Win Rate": f"{self.win_rate * 100:.1f}%",
            "Avg Win": f"${self.avg_win:.2f}",
            "Avg Loss": f"${self.avg_loss:.2f}",
            "Avg P&L/Trade": f"${self.avg_pnl:.2f}",
        }
        
        # Add date range if available
        if self.no_trade_stats.get("first_date"):
            stats["Date Range"] = f"{self.no_trade_stats['first_date']} to {self.no_trade_stats['last_date']}"
            stats["Business Days"] = self.no_trade_stats.get("total_business_days", "N/A")
        
        return stats
    
    # ==================== KELLY CRITERION & EDGE ANALYSIS ====================
    
    def calculate_kelly_criterion(self) -> dict:
        """
        Calculate Kelly Criterion for optimal position sizing.
        
        Kelly % = W - [(1-W) / R]
        Where:
            W = Win rate
            R = Win/Loss ratio (avg win / |avg loss|)
        
        Returns dict with full Kelly and fractional Kelly values.
        """
        if self.avg_loss == 0 or self.win_rate == 0:
            return {
                "full_kelly": 0,
                "half_kelly": 0,
                "quarter_kelly": 0,
                "win_loss_ratio": 0,
                "edge_exists": False
            }
        
        # R = reward/risk ratio
        win_loss_ratio = abs(self.avg_win / self.avg_loss)
        
        # Kelly formula: K = W - (1-W)/R
        full_kelly = self.win_rate - ((1 - self.win_rate) / win_loss_ratio)
        
        return {
            "full_kelly": max(0, full_kelly),  # Can't be negative
            "half_kelly": max(0, full_kelly * 0.5),
            "quarter_kelly": max(0, full_kelly * 0.25),
            "win_loss_ratio": win_loss_ratio,
            "edge_exists": full_kelly > 0
        }
    
    def calculate_expected_value(self) -> dict:
        """
        Calculate expected value per trade and related metrics.
        """
        # EV = (Win% * Avg Win) + (Loss% * Avg Loss)
        ev_per_trade = (self.win_rate * self.avg_win) + ((1 - self.win_rate) * self.avg_loss)
        
        # Expected daily P&L (accounting for no-trade days)
        effective_trades_per_day = self.avg_trades_per_day * (1 - self.p_no_trade)
        ev_per_day = ev_per_trade * effective_trades_per_day
        
        # Profit factor = Gross Wins / Gross Losses
        gross_wins = np.sum(self.pnl_pool[self.pnl_pool > 0])
        gross_losses = abs(np.sum(self.pnl_pool[self.pnl_pool < 0]))
        profit_factor = gross_wins / gross_losses if gross_losses > 0 else float('inf')
        
        return {
            "ev_per_trade": ev_per_trade,
            "ev_per_day": ev_per_day,
            "profit_factor": profit_factor,
            "gross_wins": gross_wins,
            "gross_losses": gross_losses
        }
    
    def calculate_edge_confidence(self) -> dict:
        """
        Calculate statistical confidence in the trading edge.
        Uses Wilson score interval for win rate CI and t-test for mean P&L.
        """
        from scipy import stats as scipy_stats
        
        n = self.total_trades
        
        # Wilson score interval for win rate (95% CI)
        wins = np.sum(self.pnl_pool > 0)
        z = 1.96  # 95% confidence
        
        denominator = 1 + z**2 / n
        center = (self.win_rate + z**2 / (2*n)) / denominator
        spread = z * np.sqrt((self.win_rate * (1 - self.win_rate) + z**2 / (4*n)) / n) / denominator
        
        win_rate_ci_lower = max(0, center - spread)
        win_rate_ci_upper = min(1, center + spread)
        
        # T-test: Is mean P&L significantly different from zero?
        t_stat, p_value = scipy_stats.ttest_1samp(self.pnl_pool, 0)
        
        # Standard error of mean P&L
        std_pnl = np.std(self.pnl_pool, ddof=1)
        sem_pnl = std_pnl / np.sqrt(n)
        
        # 95% CI for mean P&L
        pnl_ci_lower = self.avg_pnl - 1.96 * sem_pnl
        pnl_ci_upper = self.avg_pnl + 1.96 * sem_pnl
        
        # Edge is statistically significant if p < 0.05 and mean > 0
        edge_significant = p_value < 0.05 and self.avg_pnl > 0
        
        return {
            "win_rate_ci_lower": win_rate_ci_lower,
            "win_rate_ci_upper": win_rate_ci_upper,
            "pnl_ci_lower": pnl_ci_lower,
            "pnl_ci_upper": pnl_ci_upper,
            "t_statistic": t_stat,
            "p_value": p_value,
            "edge_significant": edge_significant,
            "sample_size": n,
            "std_pnl": std_pnl
        }
    
    def calculate_risk_metrics(self) -> dict:
        """
        Calculate risk-related metrics for the trading plan.
        """
        # Max drawdown from trade sequence
        cumulative = np.cumsum(self.pnl_pool)
        running_max = np.maximum.accumulate(cumulative)
        drawdowns = running_max - cumulative
        max_drawdown = np.max(drawdowns)
        
        # Consecutive losses analysis
        losses = self.pnl_pool < 0
        max_consecutive_losses = 0
        current_streak = 0
        for is_loss in losses:
            if is_loss:
                current_streak += 1
                max_consecutive_losses = max(max_consecutive_losses, current_streak)
            else:
                current_streak = 0
        
        # Worst single trade
        worst_trade = np.min(self.pnl_pool)
        best_trade = np.max(self.pnl_pool)
        
        # Daily P&L volatility (if we have date info)
        daily_pnls = []
        if self.date_column and self.date_column in self.trade_log.columns:
            daily_pnls = self.trade_log.groupby(self.date_column)[self.pnl_column].sum().values
        
        daily_std = np.std(daily_pnls) if len(daily_pnls) > 1 else 0
        
        return {
            "max_drawdown": max_drawdown,
            "max_consecutive_losses": max_consecutive_losses,
            "worst_trade": worst_trade,
            "best_trade": best_trade,
            "daily_pnl_std": daily_std,
            "avg_daily_pnl": np.mean(daily_pnls) if len(daily_pnls) > 0 else self.avg_pnl * self.avg_trades_per_day
        }
    
    def generate_trading_plan(self, account_size: float, 
                               prop_firm_rules: Optional[dict] = None,
                               challenge_days: int = 30) -> dict:
        """
        Generate a comprehensive trading plan based on the trade log analysis.
        
        Args:
            account_size: Current account balance
            prop_firm_rules: Dictionary with prop firm rules (from account_rule_presets)
            challenge_days: Days before rebill/reset (default 30)
        
        Returns:
            Dictionary containing the complete trading plan
        """
        kelly = self.calculate_kelly_criterion()
        ev = self.calculate_expected_value()
        confidence = self.calculate_edge_confidence()
        risk = self.calculate_risk_metrics()
        
        # Extract prop firm rules (with sensible defaults)
        if prop_firm_rules:
            max_daily_loss = prop_firm_rules.get('Maximum Daily Loss', account_size * 0.02)
            max_total_loss = prop_firm_rules.get('Max Loss (Eval)', account_size * 0.04)
            profit_target = prop_firm_rules.get('Funding Target Balance', account_size) - account_size
            if profit_target <= 0:
                profit_target = account_size * 0.06  # Default 6% target
        else:
            max_daily_loss = account_size * 0.02  # 2% default
            max_total_loss = account_size * 0.04  # 4% default
            profit_target = account_size * 0.06   # 6% default
        
        # Position sizing - constrained by prop firm rules
        kelly_risk_pct = kelly["quarter_kelly"] * 100
        # Max risk per trade should not exceed 50% of daily loss limit
        max_risk_from_daily = (max_daily_loss * 0.5) / account_size * 100
        recommended_risk_pct = min(kelly_risk_pct, max_risk_from_daily, 1.0) if kelly["edge_exists"] else 0
        max_risk_per_trade = account_size * (recommended_risk_pct / 100)
        
        # Daily loss limit from prop firm rules
        daily_loss_limit = max_daily_loss
        
        # Calculate max losing trades before hitting daily limit
        avg_loss_abs = abs(self.avg_loss) if self.avg_loss != 0 else 1
        max_losing_trades = max(1, int(daily_loss_limit / avg_loss_abs))
        
        # Prop firm challenge calculations
        # Must hit target before rebill (challenge_days)
        daily_target_for_rebill = profit_target / challenge_days
        
        # Estimate days to target based on EV
        if ev["ev_per_day"] > 0:
            estimated_days = int(np.ceil(profit_target / ev["ev_per_day"]))
        else:
            estimated_days = None
        
        # Risk assessment for prop firm
        # Check if worst historical trade would blow daily limit
        worst_trade_risk = abs(risk["worst_trade"]) > max_daily_loss
        # Check if historical max DD would blow account
        max_dd_risk = risk["max_drawdown"] > max_total_loss
        
        # Probability assessment
        if not kelly["edge_exists"]:
            prob_assessment = "unfavorable"
        elif estimated_days and estimated_days > challenge_days:
            prob_assessment = "risky - may not hit target before rebill"
        elif max_dd_risk:
            prob_assessment = "risky - historical drawdown exceeds max loss"
        elif worst_trade_risk:
            prob_assessment = "caution - worst trade exceeds daily limit"
        elif kelly["edge_exists"] and confidence["edge_significant"]:
            prob_assessment = "favorable"
        else:
            prob_assessment = "uncertain - edge not statistically confirmed"
        
        plan = {
            # Edge Summary
            "edge_summary": {
                "has_edge": kelly["edge_exists"],
                "edge_significant": confidence["edge_significant"],
                "win_rate": self.win_rate,
                "win_rate_ci": (confidence["win_rate_ci_lower"], confidence["win_rate_ci_upper"]),
                "profit_factor": ev["profit_factor"],
                "expected_value_per_trade": ev["ev_per_trade"],
                "p_value": confidence["p_value"]
            },
            
            # Kelly & Position Sizing
            "position_sizing": {
                "full_kelly_pct": kelly["full_kelly"] * 100,
                "half_kelly_pct": kelly["half_kelly"] * 100,
                "quarter_kelly_pct": kelly["quarter_kelly"] * 100,
                "recommended_risk_pct": recommended_risk_pct,
                "max_risk_per_trade": max_risk_per_trade,
                "win_loss_ratio": kelly["win_loss_ratio"]
            },
            
            # Daily Trading Rules (constrained by prop firm)
            "daily_rules": {
                "optimal_trades_per_day": round(self.avg_trades_per_day),
                "daily_loss_limit": daily_loss_limit,
                "max_losing_trades_before_stop": max_losing_trades,
                "expected_daily_pnl": ev["ev_per_day"],
                "daily_pnl_std": risk["daily_pnl_std"],
                "daily_target_for_rebill": daily_target_for_rebill
            },
            
            # Risk Management (with prop firm context)
            "risk_management": {
                "max_consecutive_losses_seen": risk["max_consecutive_losses"],
                "worst_trade": risk["worst_trade"],
                "best_trade": risk["best_trade"],
                "historical_max_drawdown": risk["max_drawdown"],
                "prop_firm_max_daily_loss": max_daily_loss,
                "prop_firm_max_total_loss": max_total_loss,
                "worst_trade_exceeds_daily": worst_trade_risk,
                "max_dd_exceeds_total": max_dd_risk,
                "recommended_stop_losses": min(max_losing_trades, 3)  # Conservative: stop after 3 or daily limit
            },
            
            # Prop Firm Target
            "prop_target": {
                "profit_target": profit_target,
                "challenge_days": challenge_days,
                "daily_target_for_rebill": daily_target_for_rebill,
                "estimated_days_to_target": estimated_days,
                "on_track_for_rebill": estimated_days is not None and estimated_days <= challenge_days,
                "probability_assessment": prob_assessment
            },
            
            # Confidence Assessment
            "confidence": {
                "sample_size": confidence["sample_size"],
                "data_quality": "sufficient" if confidence["sample_size"] >= 30 else "limited",
                "statistical_significance": "significant" if confidence["p_value"] < 0.05 else "not significant",
                "recommendation": self._get_plan_recommendation(kelly, confidence, risk, max_dd_risk, worst_trade_risk)
            }
        }
        
        return plan
    
    def _get_plan_recommendation(self, kelly: dict, confidence: dict, risk: dict, 
                                  max_dd_risk: bool = False, worst_trade_risk: bool = False) -> str:
        """Generate a text recommendation based on the analysis."""
        if confidence["sample_size"] < 30:
            return "⚠️ Insufficient data. Collect more trades before trading prop firm capital."
        
        if not kelly["edge_exists"]:
            return "🔴 No statistical edge detected. Do not trade this strategy on prop firm."
        
        if max_dd_risk:
            return "🔴 Historical drawdown exceeds prop firm max loss. Reduce position size significantly or skip this challenge."
        
        if worst_trade_risk:
            return "⚠️ Your worst trade exceeds daily loss limit. Use tighter stops or reduce size."
        
        if not confidence["edge_significant"]:
            return "⚠️ Edge detected but not statistically significant. Trade minimum size and collect more data."
        
        if kelly["full_kelly"] > 0.25:
            return "🟢 Strong edge detected. Use quarter Kelly sizing and respect daily loss limits strictly."
        
        return "🟡 Modest edge detected. Trade conservatively and monitor performance closely."


def parse_trade_log(uploaded_file, pnl_column: str = 'pnl', 
                    date_column: Optional[str] = 'date') -> BootstrappedTradingStrategy:
    """
    Parse an uploaded CSV file and create a BootstrappedTradingStrategy.
    
    Expected CSV format:
    - Must have a P&L column (default name: 'pnl')
    - Optionally has a date column (default name: 'date') for trades-per-day distribution
    - Optionally has an 'mfe' column for maximum favorable excursion data
    
    Example CSV:
    date,pnl,mfe
    2024-01-02,150.00,200.00
    2024-01-02,-75.00,25.00
    2024-01-02,200.00,200.00
    2024-01-03,100.00,150.00
    ...
    """
    df = pd.read_csv(uploaded_file)
    
    # Validate required columns
    if pnl_column not in df.columns:
        raise ValueError(f"CSV must contain a '{pnl_column}' column with P&L values")
    
    # Parse date column if it exists
    if date_column and date_column in df.columns:
        df[date_column] = pd.to_datetime(df[date_column]).dt.date
    
    return BootstrappedTradingStrategy(df, pnl_column=pnl_column, date_column=date_column)


# ============================================================================
# CSV PARSER TEMPLATES
# ============================================================================

CSV_TEMPLATES = {
    "Generic (Simple)": {
        "description": "Simple CSV with date, pnl, and optional mfe columns",
        "pnl_column": "pnl",
        "date_column": "date",
        "mfe_column": "mfe",
        "parser": None  # Uses default parser
    },
    "NinjaTrader": {
        "description": "NinjaTrader Trade Performance export",
        "pnl_column": "Profit",
        "date_column": "Entry time",
        "mfe_column": "MFE",
        "parser": "ninjatrader"
    },
    "TradingView (Strategy Tester)": {
        "description": "TradingView Strategy Tester export (List of Trades)",
        "pnl_column": "Profit",
        "date_column": "Date/Time",
        "mfe_column": None,
        "parser": "tradingview_strategy"
    },
    "TradingView (Broker History)": {
        "description": "TradingView Broker Account History export",
        "pnl_column": "Profit",
        "date_column": "Close Time",
        "mfe_column": None,
        "parser": "tradingview_broker"
    },
    "Rithmic / R|Trader": {
        "description": "Rithmic R|Trader trade export",
        "pnl_column": "Profit",
        "date_column": "Entry Time",
        "mfe_column": None,
        "parser": "rithmic"
    },
    "Tradovate": {
        "description": "Tradovate trade history export",
        "pnl_column": "P&L",
        "date_column": "Time",
        "mfe_column": None,
        "parser": "tradovate"
    },
    "MetaTrader 4 (MT4)": {
        "description": "MetaTrader 4 Account History export (HTML saved as CSV or copy-paste)",
        "pnl_column": "Profit",
        "date_column": "Time",
        "mfe_column": None,
        "parser": "metatrader4"
    },
    "MetaTrader 5 (MT5)": {
        "description": "MetaTrader 5 Account History export",
        "pnl_column": "Profit",
        "date_column": "Time",
        "mfe_column": None,
        "parser": "metatrader5"
    },
    "Custom": {
        "description": "Specify your own column names",
        "pnl_column": "",
        "date_column": "",
        "mfe_column": "",
        "parser": None
    }
}


def parse_currency_value(value) -> float:
    """
    Parse a currency string like '$252.60' or '($222.40)' into a float.
    Handles:
    - Dollar signs: $100.00 -> 100.00
    - Parentheses for negative: ($100.00) -> -100.00
    - Commas: $1,000.00 -> 1000.00
    """
    if pd.isna(value):
        return 0.0
    
    if isinstance(value, (int, float)):
        return float(value)
    
    s = str(value).strip()
    
    # Check if negative (parentheses)
    is_negative = s.startswith('(') and s.endswith(')')
    
    # Remove currency symbols, parentheses, commas
    s = s.replace('$', '').replace('(', '').replace(')', '').replace(',', '')
    
    try:
        result = float(s)
        return -result if is_negative else result
    except ValueError:
        return 0.0


def parse_ninjatrader_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a NinjaTrader Trade Performance CSV export.
    
    NinjaTrader columns used:
    - 'Entry time': Trade entry datetime (for date grouping)
    - 'Profit': P&L in currency format like '$252.60' or '($222.40)'
    - 'MFE': Maximum Favorable Excursion in currency format
    """
    df = pd.read_csv(uploaded_file)
    
    # Validate required columns
    required_cols = ['Entry time', 'Profit']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"NinjaTrader CSV missing required columns: {missing}")
    
    # Parse the Profit column (currency format)
    df['pnl'] = df['Profit'].apply(parse_currency_value)
    
    # Parse the MFE column if it exists
    if 'MFE' in df.columns:
        df['mfe'] = df['MFE'].apply(parse_currency_value)
    
    # Parse the date from Entry time
    df['date'] = pd.to_datetime(df['Entry time']).dt.date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date', 
                                        no_trade_override=no_trade_override)


def parse_tradingview_strategy_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a TradingView Strategy Tester CSV export (List of Trades tab).
    
    TradingView Strategy Tester columns:
    - 'Trade #': Trade number
    - 'Type': Entry/Exit
    - 'Signal': Long/Short
    - 'Date/Time': Trade datetime
    - 'Price': Entry/Exit price
    - 'Profit': P&L (may include %, need to handle)
    - 'Profit %': Percentage profit
    - 'Cumulative Profit': Running total
    """
    df = pd.read_csv(uploaded_file)
    
    # TradingView may have different column names, try common variations
    profit_cols = ['Profit', 'Profit, $', 'Net Profit', 'P/L']
    date_cols = ['Date/Time', 'Exit Date/Time', 'Close Date', 'Time']
    
    # Find profit column
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        # Try to find any column with 'profit' in the name
        for col in df.columns:
            if 'profit' in col.lower() and '%' not in col.lower():
                pnl_col = col
                break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if date_col is None:
        for col in df.columns:
            if 'date' in col.lower() or 'time' in col.lower():
                date_col = col
                break
    
    # Parse profit (handle currency format)
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date
    if date_col:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_tradingview_broker_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a TradingView Broker Account History CSV export.
    
    TradingView Broker History columns (varies by broker):
    - 'Symbol': Instrument traded
    - 'Side': Buy/Sell
    - 'Qty': Quantity
    - 'Open Time' / 'Entry Time': Entry datetime
    - 'Close Time' / 'Exit Time': Exit datetime  
    - 'Open Price': Entry price
    - 'Close Price': Exit price
    - 'Profit' / 'P&L' / 'Net P/L': Realized P&L
    - 'Commission': Trading fees
    """
    df = pd.read_csv(uploaded_file)
    
    # Find profit column
    profit_cols = ['Profit', 'P&L', 'Net P/L', 'Realized P&L', 'Net Profit']
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        for col in df.columns:
            if 'profit' in col.lower() or 'p&l' in col.lower() or 'pnl' in col.lower():
                pnl_col = col
                break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column (prefer close time)
    date_cols = ['Close Time', 'Exit Time', 'Close Date', 'Open Time', 'Entry Time', 'Time', 'Date']
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    # Parse profit
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date
    if date_col:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_rithmic_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a Rithmic / R|Trader trade export CSV.
    
    Common Rithmic columns:
    - 'Entry Time': Entry datetime
    - 'Exit Time': Exit datetime
    - 'Symbol': Instrument
    - 'Side': Buy/Sell
    - 'Qty': Quantity
    - 'Entry Price': Entry price
    - 'Exit Price': Exit price
    - 'Profit': Realized P&L
    - 'Commission': Fees
    """
    df = pd.read_csv(uploaded_file)
    
    # Find profit column
    profit_cols = ['Profit', 'P&L', 'Net Profit', 'Realized PnL']
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column
    date_cols = ['Entry Time', 'Exit Time', 'Time', 'Date']
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    # Parse profit
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date
    if date_col:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_tradovate_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a Tradovate trade history CSV export.
    
    Tradovate columns:
    - 'Time': Trade datetime
    - 'Contract': Instrument
    - 'B/S': Buy/Sell
    - 'Qty': Quantity
    - 'Price': Trade price
    - 'P&L': Realized P&L
    - 'Fees': Commission/fees
    """
    df = pd.read_csv(uploaded_file)
    
    # Find profit column
    profit_cols = ['P&L', 'Profit', 'Net P&L', 'Realized P&L']
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column
    date_cols = ['Time', 'Date', 'DateTime', 'Close Time']
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    # Parse profit
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date
    if date_col:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_metatrader4_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a MetaTrader 4 Account History export.
    
    MT4 exports trade history as HTML by default. Users typically:
    1. Copy-paste from Account History tab to Excel/CSV
    2. Save HTML report and convert to CSV
    
    Common MT4 columns:
    - 'Order' / 'Ticket': Trade ticket number
    - 'Time' / 'Open Time' / 'Close Time': Trade datetime
    - 'Type': buy/sell/balance
    - 'Size' / 'Volume' / 'Lots': Position size
    - 'Symbol': Currency pair/instrument
    - 'Price' / 'Open Price': Entry price
    - 'S/L': Stop loss level
    - 'T/P': Take profit level
    - 'Close Price': Exit price
    - 'Commission': Commission charged
    - 'Swap': Overnight swap charges
    - 'Profit': Realized P&L
    """
    df = pd.read_csv(uploaded_file)
    
    # Normalize column names (strip whitespace, handle variations)
    df.columns = df.columns.str.strip()
    
    # Find profit column
    profit_cols = ['Profit', 'profit', 'P/L', 'PnL', 'Net Profit']
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        # Try case-insensitive search
        for col in df.columns:
            if 'profit' in col.lower():
                pnl_col = col
                break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column (prefer Close Time for closed trades)
    date_cols = ['Close Time', 'Time', 'Open Time', 'Date', 'Close Date']
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if date_col is None:
        for col in df.columns:
            if 'time' in col.lower() or 'date' in col.lower():
                date_col = col
                break
    
    # Filter out balance operations and keep only trades
    if 'Type' in df.columns:
        # Keep only buy/sell trades, exclude balance/deposit/withdrawal
        trade_types = ['buy', 'sell']
        df = df[df['Type'].str.lower().isin(trade_types)].copy()
    elif 'type' in df.columns:
        trade_types = ['buy', 'sell']
        df = df[df['type'].str.lower().isin(trade_types)].copy()
    
    if len(df) == 0:
        raise ValueError("No trades found after filtering. Make sure your CSV contains buy/sell trades.")
    
    # Parse profit (handle currency format)
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date
    if date_col:
        # MT4 datetime format is typically: YYYY.MM.DD HH:MM or YYYY.MM.DD HH:MM:SS
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_metatrader5_csv(uploaded_file, no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a MetaTrader 5 Account History export.
    
    MT5 can export to CSV/HTML/XML. Common columns:
    - 'Time': Trade datetime (may have separate Open Time / Close Time)
    - 'Deal': Deal ticket number
    - 'Order': Order ticket number
    - 'Symbol': Instrument
    - 'Type': buy/sell/balance
    - 'Direction': in/out
    - 'Volume': Position size in lots
    - 'Price': Execution price
    - 'S/L': Stop loss
    - 'T/P': Take profit
    - 'Commission': Commission
    - 'Swap': Swap charges
    - 'Profit': Realized P&L
    - 'Fee': Additional fees
    - 'Comment': Trade comment
    """
    df = pd.read_csv(uploaded_file)
    
    # Normalize column names
    df.columns = df.columns.str.strip()
    
    # Find profit column
    profit_cols = ['Profit', 'profit', 'P/L', 'PnL', 'Net Profit']
    pnl_col = None
    for col in profit_cols:
        if col in df.columns:
            pnl_col = col
            break
    
    if pnl_col is None:
        for col in df.columns:
            if 'profit' in col.lower():
                pnl_col = col
                break
    
    if pnl_col is None:
        raise ValueError(f"Could not find profit column. Found columns: {list(df.columns)}")
    
    # Find date column
    date_cols = ['Time', 'Close Time', 'Open Time', 'Date']
    date_col = None
    for col in date_cols:
        if col in df.columns:
            date_col = col
            break
    
    if date_col is None:
        for col in df.columns:
            if 'time' in col.lower() or 'date' in col.lower():
                date_col = col
                break
    
    # Filter out non-trade entries
    # MT5 may have 'Type' column with buy/sell or 'Direction' with in/out
    if 'Type' in df.columns:
        trade_types = ['buy', 'sell']
        type_col = df['Type'].str.lower()
        df = df[type_col.isin(trade_types)].copy()
    elif 'type' in df.columns:
        trade_types = ['buy', 'sell']
        type_col = df['type'].str.lower()
        df = df[type_col.isin(trade_types)].copy()
    elif 'Direction' in df.columns:
        # For deal-based exports, 'out' means closing a position (realized P&L)
        df = df[df['Direction'].str.lower() == 'out'].copy()
    
    if len(df) == 0:
        raise ValueError("No trades found after filtering. Make sure your CSV contains closed trades.")
    
    # Parse profit
    df['pnl'] = df[pnl_col].apply(parse_currency_value)
    
    # Parse date (MT5 format: YYYY.MM.DD HH:MM:SS)
    if date_col:
        df['date'] = pd.to_datetime(df[date_col], errors='coerce').dt.date
    else:
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    
    return BootstrappedTradingStrategy(df, pnl_column='pnl', date_column='date',
                                        no_trade_override=no_trade_override)


def parse_trade_log_with_template(uploaded_file, template_name: str,
                                   custom_pnl_col: str = '',
                                   custom_date_col: str = '',
                                   custom_mfe_col: str = '',
                                   no_trade_override: Optional[float] = None) -> BootstrappedTradingStrategy:
    """
    Parse a trade log CSV using a predefined template or custom column names.
    
    Args:
        uploaded_file: The uploaded CSV file
        template_name: Name of the template to use (from CSV_TEMPLATES)
        custom_pnl_col: Custom P&L column name (for Custom template)
        custom_date_col: Custom date column name (for Custom template)
        custom_mfe_col: Custom MFE column name (for Custom template)
    
    Returns:
        BootstrappedTradingStrategy instance
    """
    if template_name not in CSV_TEMPLATES:
        raise ValueError(f"Unknown template: {template_name}")
    
    template = CSV_TEMPLATES[template_name]
    
    # Use specialized parser if available
    parser = template["parser"]
    if parser == "ninjatrader":
        return parse_ninjatrader_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "tradingview_strategy":
        return parse_tradingview_strategy_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "tradingview_broker":
        return parse_tradingview_broker_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "rithmic":
        return parse_rithmic_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "tradovate":
        return parse_tradovate_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "metatrader4":
        return parse_metatrader4_csv(uploaded_file, no_trade_override=no_trade_override)
    elif parser == "metatrader5":
        return parse_metatrader5_csv(uploaded_file, no_trade_override=no_trade_override)
    
    # For Custom template, use provided column names
    if template_name == "Custom":
        pnl_col = custom_pnl_col if custom_pnl_col else 'pnl'
        date_col = custom_date_col if custom_date_col else None
        mfe_col = custom_mfe_col if custom_mfe_col else None
    else:
        pnl_col = template["pnl_column"]
        date_col = template["date_column"]
        mfe_col = template["mfe_column"]
    
    df = pd.read_csv(uploaded_file)
    
    # Validate P&L column exists
    if pnl_col not in df.columns:
        raise ValueError(f"CSV must contain a '{pnl_col}' column with P&L values. Found columns: {list(df.columns)}")
    
    # Try to parse P&L as currency if it contains $ or ()
    sample_val = str(df[pnl_col].iloc[0]) if len(df) > 0 else ""
    if '$' in sample_val or '(' in sample_val:
        df['pnl'] = df[pnl_col].apply(parse_currency_value)
        pnl_col = 'pnl'
    
    # Parse date column if it exists
    if date_col and date_col in df.columns:
        df['date'] = pd.to_datetime(df[date_col]).dt.date
        date_col = 'date'
    else:
        date_col = None
    
    # Parse MFE column if it exists
    if mfe_col and mfe_col in df.columns:
        sample_mfe = str(df[mfe_col].iloc[0]) if len(df) > 0 else ""
        if '$' in sample_mfe or '(' in sample_mfe:
            df['mfe'] = df[mfe_col].apply(parse_currency_value)
    
    return BootstrappedTradingStrategy(df, pnl_column=pnl_col, date_column=date_col,
                                        no_trade_override=no_trade_override)
