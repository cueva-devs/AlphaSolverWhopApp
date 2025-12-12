from account_models import TopstepAccount
from trading_strategies import BootstrappedTradingStrategy


class Trader:
    def __init__(self, strat, acct_rules, acct_fees):
        self.strategy = strat
        self.fees = acct_fees
        self.PnL = -acct_fees['Eval Acct Cost']
        self.account = TopstepAccount(acct_rules)
        self.per_side_cost = acct_fees['Per Side Trade Cost']
        self.entry_slippage = acct_fees['Trade Entry Slippage']
        self.stop_slippage = acct_fees['Trade Stop Slippage']
        self.months_traded = 0
        self.running_balance = []
        self.passed_eval = False
        
        # Check if using bootstrapped strategy
        self.is_bootstrapped = isinstance(strat, BootstrappedTradingStrategy)

    def trade_for_day(self):
        finished_day_without_stop_condition = True
        if ((self.account.total_days // 30) > self.months_traded) and self.account.in_eval:
            self.months_traded += 1
            self.PnL -= self.fees['Monthly Eval Cost']
        
        # Determine number of trades for this day
        if self.is_bootstrapped:
            num_trades = self.strategy.sample_trades_for_day()
        else:
            num_trades = self.strategy.trades_per_day
        
        # Ensure num_trades is a native Python int (not numpy scalar)
        if hasattr(num_trades, 'item'):
            num_trades = int(num_trades.item())
        else:
            num_trades = int(num_trades)
            
        for i in range(num_trades):
            trade_return = self.strategy.simulate_return(self.per_side_cost, self.entry_slippage, self.stop_slippage)
            sim_mfe = 0
            if self.account.in_eval and trade_return < 0:
                sim_mfe = self.strategy.simulate_favorable_excursion()
            result = self.account.trade(trade_return, sim_mfe)
            if result == 'PASS EVAL':
                self.PnL -= self.fees['Funded Acct Setup Cost']
                finished_day_without_stop_condition = False
                self.passed_eval = True
                break
            elif result == 'FAIL':
                finished_day_without_stop_condition = False
                break
            elif result == 'DAILY LOSS LIMIT STOP':
                finished_day_without_stop_condition = False
                break
            elif result == 'DAILY WIN STOP':
                finished_day_without_stop_condition = False
                break
            elif result == 'SUCCEED':
                self.PnL += self.account.funded_full_payout()
                finished_day_without_stop_condition = False
                break
        if finished_day_without_stop_condition:
            self.account.end_of_day_update()
        if not self.account.in_eval:
            self.running_balance.append(self.account.balance)
