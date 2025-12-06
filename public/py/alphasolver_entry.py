"""
AlphaSolver Entry Point for Pyodide

This module provides the main entry function run_simulation() that is called
from the TypeScript/Pyodide client.
"""

import json
import numpy as np
from typing import Optional, Dict, List, Any
from account_models import TopstepAccount
from trader import Trader
from trading_strategies import TradingStrategy, BootstrappedTradingStrategy
from simulation import Simulation


def get_default_account_rules() -> Dict[str, float]:
    """
    Returns default TopStep account rules.
    These can be customized per simulation if needed.
    """
    return {
        'Initial Balance (Eval)': 50000.0,
        'Max Loss (Eval)': 2000.0,
        'Maximum Daily Loss': 1000.0,
        'Maximum Daily Win': 5000.0,
        'Funding Target Balance': 52500.0,  # 5% profit target
        'Initial Balance (Funded)': 50000.0,
        'Max Loss (Funded)': 2000.0,
        'Unshared Winning Balance (Funded)': 50000.0,
        'Profit Share Fraction': 0.9,  # 90% profit share
        'Winning Day PnL Minimum': 0.0,  # Any positive day counts
        'Minimum Winning Days for Payout': 5,
        'Minimum Winning Balance': 50000.0,
    }


def get_default_account_fees() -> Dict[str, float]:
    """
    Returns default account fees.
    These can be customized per simulation if needed.
    """
    return {
        'Eval Acct Cost': 50.0,  # Initial evaluation cost
        'Monthly Eval Cost': 50.0,  # Monthly rebill during eval
        'Funded Acct Setup Cost': 0.0,  # Setup cost when passing eval
        'Per Side Trade Cost': 0.0,  # Commission per trade side
        'Trade Entry Slippage': 0.0,  # Slippage on entry
        'Trade Stop Slippage': 0.0,  # Slippage on stop loss
    }


def run_simulation(mode: str, params_json: str, trades_json: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point for running Monte Carlo simulations.
    
    Args:
        mode: "parametric" or "bootstrapped"
        params_json: JSON string with simulation parameters
        trades_json: Optional JSON string with trade records (for bootstrapped mode)
    
    Returns:
        Dictionary with simulation results matching SimulationResult interface:
        - expectedPayout: float
        - passProbability: float (0-100)
        - maxDrawdown: float
        - equityCurves: list[list[float]]
        - finalValues: list[float]
        - averageFinalValue: float (optional)
        - medianFinalValue: float (optional)
        - winRate: float (optional)
        - totalTrades: int (optional)
    """
    try:
        # Parse input parameters
        params = json.loads(params_json)
        
        # Get account rules and fees (using defaults for now)
        acct_rules = get_default_account_rules()
        acct_fees = get_default_account_fees()
        
        # Extract common parameters
        num_paths = params.get('numPaths', 1000)
        num_days = params.get('numDays', 30)
        
        # Create strategy based on mode
        if mode == "parametric":
            strategy = _create_parametric_strategy(params)
        elif mode == "bootstrapped":
            if not trades_json or trades_json == "null":
                raise ValueError("Bootstrapped mode requires trades_json")
            trades_data = json.loads(trades_json)
            strategy = _create_bootstrapped_strategy(params, trades_data)
        else:
            raise ValueError(f"Unknown simulation mode: {mode}")
        
        # Create and run simulation
        sim = Simulation(
            trading_strat=strategy,
            num_traders=num_paths,
            acct_rules=acct_rules,
            acct_fees=acct_fees
        )
        
        # Run the Monte Carlo simulation
        sim.run()
        
        # Extract results
        return _extract_results(sim, num_paths)
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in parameters: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Simulation error: {str(e)}")


def _create_parametric_strategy(params: Dict[str, Any]) -> TradingStrategy:
    """Create a parametric trading strategy from parameters."""
    stop_size = params.get('stopSize', 100.0)
    take_profit_size = params.get('takeProfitSize', 200.0)
    win_rate = params.get('winRate', 50.0) / 100.0  # Convert percentage to decimal
    average_mfe = params.get('averageMFE', 150.0)
    trades_per_day = params.get('tradesPerDay', 5)
    
    return TradingStrategy(
        odds=win_rate,
        mfe=average_mfe,
        trades_per_day=trades_per_day,
        stop_width=stop_size,
        tp_width=take_profit_size
    )


def _create_bootstrapped_strategy(params: Dict[str, Any], trades_data: List[Dict[str, Any]]) -> BootstrappedTradingStrategy:
    """
    Create a bootstrapped trading strategy from trade data.
    
    trades_data is already parsed by TypeScript csvUtils, so it comes in as:
    [{"date": "...", "pnl": 100.0, "mfe": 150.0}, ...]
    """
    try:
        import pandas as pd
    except ImportError:
        raise RuntimeError("pandas is required for bootstrapped mode but not available in Pyodide")
    
    if not trades_data:
        raise ValueError("No trade data provided for bootstrapped mode")
    
    # Convert trades to DataFrame
    # trades_data is already in the correct format from csvUtils
    df = pd.DataFrame(trades_data)
    
    # Ensure required columns exist
    if 'pnl' not in df.columns:
        raise ValueError("Trade data must contain 'pnl' column")
    
    # Handle date column
    if 'date' not in df.columns:
        # Create sequential dates if no date column
        df['date'] = pd.date_range(start='2024-01-01', periods=len(df), freq='D').date
    else:
        # Convert date strings to date objects
        df['date'] = pd.to_datetime(df['date']).dt.date
    
    # Handle MFE column
    if 'mfe' not in df.columns:
        df['mfe'] = 0.0
    
    return BootstrappedTradingStrategy(
        trade_log_df=df,
        pnl_column='pnl',
        date_column='date',
        no_trade_override=None
    )


def _extract_results(sim: Simulation, num_paths: int) -> Dict[str, Any]:
    """Extract results from simulation into the expected format."""
    # Collect equity curves and final values
    equity_curves = []
    final_values = []
    max_drawdowns = []
    
    # Track detailed metrics for enhanced results
    winning_paths = []
    losing_paths = []
    days_to_pass = []
    days_in_funded = []
    days_before_fail = []
    fail_in_eval = 0
    fail_in_funded = 0
    trades_per_day_list = []
    trade_pnl_list = []
    
    for trader_num in range(len(sim.traders)):
        trader = sim.traders[trader_num]
        
        # Get equity curve (running balance)
        if trader.running_balance:
            equity_curves.append(trader.running_balance.copy())
        else:
            # If no running balance, create from account balance history
            equity_curves.append([trader.account.balance])
        
        # Calculate final value (PnL)
        final_values.append(trader.PnL)
        
        # Calculate max drawdown for this path
        if len(trader.running_balance) > 1:
            running_balance = np.array(trader.running_balance)
            running_max = np.maximum.accumulate(running_balance)
            drawdowns = running_max - running_balance
            max_dd = float(np.max(drawdowns))
        else:
            # Estimate from account balance
            initial_balance = sim.acct_rules.get('Initial Balance (Eval)', 50000.0)
            current_balance = trader.account.balance
            max_dd = max(0, initial_balance - current_balance)
        
        max_drawdowns.append(max_dd)
        
        # Track winning/losing paths for enhanced metrics
        if trader.account.won:
            winning_paths.append(trader_num)
            days_to_pass.append(trader.account.total_days)
            # Estimate days in funded (simplified - assume passed eval halfway through)
            if trader.passed_eval:
                days_in_funded.append(max(0, trader.account.total_days - trader.account.total_days // 2))
            else:
                days_in_funded.append(0)
        elif trader.account.failed:
            losing_paths.append(trader_num)
            days_before_fail.append(trader.account.total_days)
            if trader.account.in_eval:
                fail_in_eval += 1
            else:
                fail_in_funded += 1
        
        # Track trade distributions (simplified - estimate from strategy)
        if hasattr(sim.strategy, 'trades_per_day'):
            trades_per_day_list.extend([sim.strategy.trades_per_day] * trader.account.total_days)
    
    # Calculate aggregate statistics
    final_values_array = np.array(final_values)
    avg_final_value = float(np.mean(final_values_array))
    median_final_value = float(np.median(final_values_array))
    
    # Expected payout is the average final value
    expected_payout = avg_final_value
    
    # Pass/fail probabilities
    pass_probability = float(np.mean(final_values_array > 0) * 100)
    fail_probability = float(np.mean(final_values_array <= 0) * 100)
    
    # Average max drawdown
    avg_max_drawdown = float(np.mean(max_drawdowns))
    
    # Calculate win rate from strategy if available
    win_rate = None
    if hasattr(sim.strategy, 'win_rate'):
        win_rate = float(sim.strategy.win_rate * 100)
    elif hasattr(sim.strategy, 'odds'):
        win_rate = float(sim.strategy.odds * 100)
    
    # Total trades estimate
    total_trades = None
    if hasattr(sim.strategy, 'trades_per_day'):
        avg_trades_per_day = sim.strategy.trades_per_day
        avg_days = sim.avg_days
        total_trades = int(avg_trades_per_day * avg_days * num_paths)
    
    # Enhanced metrics
    net_pnl_per_attempt = avg_final_value
    expected_attempts_to_pass = 1.0 / (pass_probability / 100.0) if pass_probability > 0 else float('inf')
    
    # Timeline metrics
    avg_days_to_pass = float(np.mean(days_to_pass)) if days_to_pass else 0
    avg_days_in_funded = float(np.mean(days_in_funded)) if days_in_funded else 0
    total_days_to_payout = avg_days_to_pass + avg_days_in_funded
    
    # Cost analysis
    initial_purchase = sim.acct_fees.get('Eval Acct Cost', 149.0)
    monthly_rebill = sim.acct_fees.get('Monthly Eval Cost', 149.0)
    funded_setup = sim.acct_fees.get('Funded Acct Setup Cost', 149.0)
    
    # Calculate costs for winners
    if winning_paths:
        avg_months_eval = avg_days_to_pass / 30.0
        avg_total_costs_if_pass = initial_purchase + (avg_months_eval * monthly_rebill) + funded_setup
        avg_gross_payout_if_pass = float(np.mean([final_values[i] for i in winning_paths]))
        avg_net_profit_if_pass = avg_gross_payout_if_pass - avg_total_costs_if_pass
    else:
        avg_total_costs_if_pass = initial_purchase + monthly_rebill + funded_setup
        avg_gross_payout_if_pass = 0
        avg_net_profit_if_pass = 0
    
    # Calculate costs for losers
    if losing_paths:
        avg_days_before_fail = float(np.mean(days_before_fail))
        avg_months_before_fail = avg_days_before_fail / 30.0
        avg_cost_lost_if_fail = initial_purchase + (avg_months_before_fail * monthly_rebill)
        fail_in_eval_pct = (fail_in_eval / len(losing_paths)) * 100 if losing_paths else 0
        fail_in_funded_pct = (fail_in_funded / len(losing_paths)) * 100 if losing_paths else 0
    else:
        avg_days_before_fail = 0
        avg_cost_lost_if_fail = initial_purchase
        fail_in_eval_pct = 0
        fail_in_funded_pct = 0
    
    # Investment summary
    expected_cost_to_payout = initial_purchase + (expected_attempts_to_pass * monthly_rebill) + funded_setup
    expected_gross_payout = expected_payout
    expected_roi = ((expected_gross_payout - expected_cost_to_payout) / expected_cost_to_payout * 100) if expected_cost_to_payout > 0 else 0
    
    # Trade distributions (simplified)
    avg_trades_per_day = float(np.mean(trades_per_day_list)) if trades_per_day_list else 0
    # Create histogram data for trades per day
    if trades_per_day_list:
        trades_per_day_distribution = _create_histogram(trades_per_day_list, bins=10)
    else:
        trades_per_day_distribution = []
    
    # Trade P&L distribution (estimate from strategy if available)
    trade_pnl_distribution = []
    avg_trade_pnl = 0
    if hasattr(sim.strategy, 'odds') and hasattr(sim.strategy, 'stop_width') and hasattr(sim.strategy, 'tp_width'):
        win_pnl = sim.strategy.tp_width
        loss_pnl = -sim.strategy.stop_width
        # Create a simple distribution
        num_samples = 1000
        trade_pnl_samples = []
        for _ in range(num_samples):
            if np.random.random() < sim.strategy.odds:
                trade_pnl_samples.append(win_pnl)
            else:
                trade_pnl_samples.append(loss_pnl)
        trade_pnl_distribution = _create_histogram(trade_pnl_samples, bins=20)
        avg_trade_pnl = float(np.mean(trade_pnl_samples))
    
    # Most probable outcomes (simplified - top 3 scenarios)
    most_probable_outcomes = []
    if len(winning_paths) > 0 and len(losing_paths) > 0:
        # Create simple scenarios
        winning_pnls = [final_values[i] for i in winning_paths]
        losing_pnls = [final_values[i] for i in losing_paths]
        
        if winning_pnls:
            avg_win_pnl = float(np.mean(winning_pnls))
            avg_win_days = avg_days_to_pass
            most_probable_outcomes.append({
                'scenario': f'Long pass ({int(avg_win_days)} days), high drawdown, ${int(avg_win_pnl)} net',
                'probability': pass_probability / 3,  # Simplified
                'days': int(avg_win_days),
                'maxDD': float(avg_max_drawdown),
                'netPnl': avg_win_pnl
            })
        
        if losing_pnls:
            avg_lose_days = float(np.mean(days_before_fail))
            most_probable_outcomes.append({
                'scenario': f'Moderate failure ({int(avg_lose_days)} days), high drawdown',
                'probability': fail_probability / 2,  # Simplified
                'days': int(avg_lose_days),
                'maxDD': float(avg_max_drawdown),
                'netPnl': float(np.mean(losing_pnls))
            })
    
    return {
        'expectedPayout': expected_payout,
        'passProbability': pass_probability,
        'failProbability': fail_probability,
        'maxDrawdown': avg_max_drawdown,
        'equityCurves': equity_curves,
        'finalValues': final_values,
        'averageFinalValue': avg_final_value,
        'medianFinalValue': median_final_value,
        'winRate': win_rate,
        'totalTrades': total_trades,
        # Enhanced metrics
        'netPnlPerAttempt': net_pnl_per_attempt,
        'expectedAttemptsToPass': expected_attempts_to_pass,
        'avgDaysToPass': avg_days_to_pass,
        'avgDaysInFunded': avg_days_in_funded,
        'totalDaysToPayout': total_days_to_payout,
        # Cost analysis
        'initialPurchase': initial_purchase,
        'monthlyRebill': monthly_rebill,
        'fundedSetup': funded_setup,
        'avgTotalCostsIfPass': avg_total_costs_if_pass,
        'avgGrossPayoutIfPass': avg_gross_payout_if_pass,
        'avgNetProfitIfPass': avg_net_profit_if_pass,
        'avgDaysBeforeFail': avg_days_before_fail,
        'avgCostLostIfFail': avg_cost_lost_if_fail,
        'failInEvalPercent': fail_in_eval_pct,
        'failInFundedPercent': fail_in_funded_pct,
        'expectedCostToPayout': expected_cost_to_payout,
        'expectedGrossPayout': expected_gross_payout,
        'expectedROI': expected_roi,
        # Trade distributions
        'tradesPerDayDistribution': trades_per_day_distribution,
        'tradePnlDistribution': trade_pnl_distribution,
        'avgTradesPerDay': avg_trades_per_day,
        'avgTradePnl': avg_trade_pnl,
        # Most probable outcomes
        'mostProbableOutcomes': most_probable_outcomes,
    }


def _create_histogram(data: List[float], bins: int = 10) -> List[int]:
    """Create a simple histogram from data."""
    if not data:
        return []
    
    data_array = np.array(data)
    min_val = float(np.min(data_array))
    max_val = float(np.max(data_array))
    
    if min_val == max_val:
        return [len(data)]
    
    bin_width = (max_val - min_val) / bins
    histogram = [0] * bins
    
    for value in data:
        bin_idx = min(int((value - min_val) / bin_width), bins - 1)
        histogram[bin_idx] += 1
    
    return histogram

