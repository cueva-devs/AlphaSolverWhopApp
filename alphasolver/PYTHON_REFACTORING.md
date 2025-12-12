# Python Code Refactoring Plan & Implementation

## Overview

This document describes the refactoring of the propalphaevalsolver Python codebase into a minimal Pyodide-compatible structure for AlphaSolver.

## Original Repository Analysis

**Repository**: https://github.com/wizzo-gmb/propalphaevalsolver

### Core Files Identified (to keep):

1. **account_models.py** - `TopstepAccount` class
   - Handles prop firm account rules (eval phase, funded phase)
   - Tracks balance, drawdown, winning days
   - Already refactored and in place ✓

2. **trader.py** - `Trader` class
   - Wraps account and strategy
   - Executes daily trading logic
   - Already refactored and in place ✓

3. **trading_strategies.py** - Strategy classes
   - `TradingStrategy` - Parametric strategy (win rate, MFE, stop/TP)
   - `BootstrappedTradingStrategy` - Bootstrap from historical trades
   - Already refactored and in place ✓
   - Uses numpy and pandas (both available in Pyodide)

4. **simulation.py** - `Simulation` class
   - Core Monte Carlo simulation logic
   - Runs multiple trader paths
   - **Refactored**: Removed matplotlib/scipy/sklearn dependencies

### Files/Features Removed (Streamlit UI):

- `streamlit_app.py` - Streamlit UI (not needed for Pyodide)
- Plotting methods (`plot_outcomes`, `plot_equity_curves`, etc.) - Uses matplotlib
- Advanced analysis (`get_outcome_scenarios`) - Uses sklearn DBSCAN
- Statistical analysis (`calculate_edge_confidence`) - Uses scipy.stats

## Final File Structure

```
/public/py/
├── account_models.py      # TopstepAccount class (unchanged)
├── trader.py              # Trader class (unchanged)
├── trading_strategies.py   # TradingStrategy & BootstrappedTradingStrategy (unchanged)
├── simulation.py           # Minimal Simulation class (refactored - core logic only)
├── alphasolver_entry.py    # NEW: Entry point function run_simulation()
└── simulation_original.py  # Backup of original (with plotting/analysis methods)
```

## Entry Point: `alphasolver_entry.py`

### Function Signature

```python
def run_simulation(
    mode: str,                    # "parametric" or "bootstrapped"
    params_json: str,             # JSON string with simulation parameters
    trades_json: str | None       # Optional JSON string of trade records
) -> dict:
```

### Parameters

**Parametric Mode** (`params_json` contains):
- `stopSize`: float
- `takeProfitSize`: float
- `winRate`: float (0-100)
- `averageMFE`: float
- `tradesPerDay`: int
- `numPaths`: int
- `numDays`: int (currently not used as simulation runs until completion)

**Bootstrapped Mode** (`params_json` contains):
- `numPaths`: int
- `numDays`: int (currently not used)
- `template`: "NinjaTrader" | "Generic" | "Custom"
- `pnlColumn`, `dateColumn`, `mfeColumn`: string (for Custom template)

**trades_json** (for bootstrapped mode):
- List of `{"date": string, "pnl": float, "mfe": float}` objects
- Already parsed by TypeScript `csvUtils.ts`

### Return Value

Returns a dictionary matching `SimulationResult` interface:

```python
{
    "expectedPayout": float,           # Average final PnL
    "passProbability": float,          # Percentage (0-100) of paths that passed
    "maxDrawdown": float,              # Average maximum drawdown
    "equityCurves": list[list[float]], # Equity curves for each path
    "finalValues": list[float],        # Final PnL for each path
    "averageFinalValue": float,        # Optional: Average final value
    "medianFinalValue": float,         # Optional: Median final value
    "winRate": float,                  # Optional: Strategy win rate %
    "totalTrades": int,                # Optional: Total trades across all paths
}
```

## Refactoring Changes

### 1. simulation.py

**Removed:**
- `import matplotlib.pyplot as plt`
- `from scipy import stats`
- `from sklearn.cluster import DBSCAN`
- `from sklearn.preprocessing import StandardScaler`
- All plotting methods (`plot_outcomes`, `plot_equity_curves`, etc.)
- Advanced analysis methods (`get_outcome_scenarios`, `get_monte_carlo_trading_plan` with scipy dependencies)

**Kept:**
- Core `run()` method - Monte Carlo simulation logic
- `_calculate_confidence_interval()` - Reimplemented without scipy (hardcoded z-scores)
- Basic result aggregation

**Note:** The original `simulation.py` with all methods is preserved as `simulation_original.py` for reference.

### 2. alphasolver_entry.py (NEW)

**Purpose:** Clean entry point that Pyodide can call

**Key Functions:**
- `run_simulation()` - Main entry point
- `get_default_account_rules()` - Default TopStep account rules
- `get_default_account_fees()` - Default account fees
- `_create_parametric_strategy()` - Creates TradingStrategy from params
- `_create_bootstrapped_strategy()` - Creates BootstrappedTradingStrategy from trades
- `_extract_results()` - Converts Simulation results to expected format

**Dependencies:**
- numpy (available in Pyodide)
- pandas (available in Pyodide)
- json (built-in)
- All other imports are relative (account_models, trader, trading_strategies, simulation)

### 3. pyodideClient.ts Updates

**Changes:**
- Added `alphasolver_entry.py` to PYTHON_FILES list
- Changed import from `simulation` to `alphasolver_entry`
- Added `pandas` to required packages (for bootstrapped mode)

## Features Intentionally Left Out (MVP)

These features from the original repo are **not included** in the MVP but can be added later:

1. **Plotting/Visualization**
   - All matplotlib-based plotting
   - Charts are now handled by Chart.js in React

2. **Advanced Statistical Analysis**
   - `get_outcome_scenarios()` - DBSCAN clustering (requires sklearn)
   - `calculate_edge_confidence()` - t-tests, Wilson intervals (requires scipy)
   - These can be re-added if scipy/sklearn packages are loaded in Pyodide

3. **Trading Plan Generation**
   - `get_monte_carlo_trading_plan()` - Complex analysis of winners vs losers
   - Can be re-added if needed, but requires scipy for some calculations

4. **Cost Breakdown Analysis**
   - `get_cost_breakdown()` - Detailed cost analysis
   - Uses only numpy, can be re-added if needed

## Dependencies

### Required (Available in Pyodide):
- ✅ `numpy` - Numerical operations
- ✅ `pandas` - Data manipulation (for bootstrapped mode)
- ✅ `json` - JSON parsing (built-in)

### Not Used (Removed for MVP):
- ❌ `matplotlib` - Plotting (handled by Chart.js in React)
- ❌ `scipy` - Advanced statistics (can be added later if needed)
- ❌ `sklearn` - Machine learning (can be added later if needed)

## Testing the Entry Point

To test the entry point function locally (outside Pyodide):

```python
import json
from alphasolver_entry import run_simulation

# Parametric mode
params = {
    "stopSize": 100,
    "takeProfitSize": 200,
    "winRate": 50,
    "averageMFE": 150,
    "tradesPerDay": 5,
    "numPaths": 100,
    "numDays": 30
}
result = run_simulation("parametric", json.dumps(params), None)
print(result)

# Bootstrapped mode
trades = [
    {"date": "2024-01-01", "pnl": 100.0, "mfe": 150.0},
    {"date": "2024-01-01", "pnl": -50.0, "mfe": 25.0},
    # ... more trades
]
result = run_simulation("bootstrapped", json.dumps(params), json.dumps(trades))
print(result)
```

## Notes

1. **numDays Parameter**: Currently not enforced as a hard limit. Simulations run until accounts win or fail. This can be changed later if needed.

2. **Account Rules**: Using default TopStep rules. Can be customized per simulation if needed by modifying `get_default_account_rules()`.

3. **Performance**: Large simulations (10,000+ paths) may be slow in the browser. Consider adding progress callbacks or Web Workers in the future.

4. **Error Handling**: All errors are caught and re-raised with descriptive messages for the TypeScript layer.

5. **Type Safety**: The entry point validates inputs and ensures return values match the expected TypeScript interface.

