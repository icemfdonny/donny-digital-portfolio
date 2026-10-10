"""Backtester. Replays history bar by bar and reports what the rules WOULD have done.

Realism rules (the ones that make beginner backtests lie, handled here):
  * Signals are computed at the close and filled at the NEXT open - never at the price that triggered them.
  * Every fill pays slippage (default 5 bps ~ $0.05 on a $100 share, a fair stand-in for spread + fees).
  * Stops fill at the stop price, or at the open if the market gaps through it.
  * No leverage, no shorting, whole shares only.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from .data import Bar
from .risk import DrawdownGuard, RiskLimits, position_size
from .strategy import ENTER, EXIT, TrendStrategy

TRADING_DAYS = 252


@dataclass
class Trade:
    entry_day: str
    entry_price: float
    shares: int
    exit_day: str | None = None
    exit_price: float | None = None
    reason: str = ""

    @property
    def pnl(self) -> float | None:
        if self.exit_price is None:
            return None
        return (self.exit_price - self.entry_price) * self.shares


@dataclass
class Result:
    symbol: str
    curve: list[tuple[str, float]]  # (day, strategy equity)
    benchmark: list[tuple[str, float]]  # (day, buy-and-hold equity)
    trades: list[Trade]
    days_in_market: int
    halted_on: str | None = None
    metrics: dict[str, float] = field(default_factory=dict)


def max_drawdown(values: list[float]) -> float:
    peak, worst = values[0], 0.0
    for v in values:
        peak = max(peak, v)
        worst = min(worst, v / peak - 1)
    return worst


def _stats(values: list[float]) -> dict[str, float]:
    rets = [b / a - 1 for a, b in zip(values, values[1:])]
    years = len(rets) / TRADING_DAYS
    mean = sum(rets) / len(rets)
    var = sum((r - mean) ** 2 for r in rets) / max(1, len(rets) - 1)
    sd = math.sqrt(var)
    return {
        "total_return": values[-1] / values[0] - 1,
        "cagr": (values[-1] / values[0]) ** (1 / years) - 1 if years > 0 else 0.0,
        "max_drawdown": max_drawdown(values),
        "sharpe": mean / sd * math.sqrt(TRADING_DAYS) if sd > 0 else 0.0,
    }


def run_backtest(
    bars: list[Bar],
    strategy: TrendStrategy | None = None,
    limits: RiskLimits | None = None,
    capital: float = 10_000.0,
    slippage_bps: float = 5.0,
    symbol: str = "?",
) -> Result:
    strategy = strategy or TrendStrategy()
    limits = limits or RiskLimits()
    slip = slippage_bps / 10_000
    start = strategy.first_ready_index
    if len(bars) < start + 30:
        raise ValueError(f"{symbol}: need at least {start + 30} bars, got {len(bars)}")
    ind = strategy.prepare(bars)

    cash, shares, stop = capital, 0, 0.0
    pending: tuple[str, str] | None = None  # (action, reason) to execute at next open
    guard = DrawdownGuard(limits.max_drawdown_halt)
    halted_on = None
    trades: list[Trade] = []
    curve: list[tuple[str, float]] = []
    in_market = 0

    def close_out(day: str, price: float, reason: str) -> None:
        nonlocal cash, shares
        cash += shares * price
        t = trades[-1]
        t.exit_day, t.exit_price, t.reason = day, price, reason
        shares = 0

    for i in range(start, len(bars)):
        bar = bars[i]

        # 1) fill yesterday's decision at today's open
        if pending:
            action, reason = pending
            pending = None
            if action == ENTER and shares == 0 and halted_on is None:
                fill = bar.open * (1 + slip)
                stop_dist = strategy.p.atr_mult * ind.atr[i - 1]  # type: ignore[operator]
                qty = min(position_size(cash, fill, stop_dist, limits), math.floor(cash / fill))
                if qty > 0:
                    cash -= qty * fill
                    shares = qty
                    stop = bars[i - 1].close - stop_dist
                    trades.append(Trade(bar.day, fill, qty))
            elif action == EXIT and shares > 0:
                close_out(bar.day, bar.open * (1 - slip), reason)

        # 2) did the protective stop trigger during today's session?
        if shares > 0 and bar.low <= stop:
            close_out(bar.day, min(bar.open, stop) * (1 - slip), "stop")

        # 3) mark to market at the close
        equity = cash + shares * bar.close
        curve.append((bar.day, equity))
        in_market += shares > 0

        # 4) kill switch
        if guard.update(equity) and halted_on is None:
            halted_on = bar.day
            if shares > 0:
                pending = (EXIT, "halt")

        # 5) decide tomorrow's action from today's close
        if halted_on is None and i < len(bars) - 1:
            if shares > 0:
                stop = max(stop, strategy.stop_level(ind, bars, i))
            sig = strategy.signal(ind, bars, i, shares > 0)
            if sig in (ENTER, EXIT):
                pending = (sig, "signal")

    base = bars[start].close
    benchmark = [(b.day, capital * b.close / base) for b in bars[start:]]
    result = Result(symbol, curve, benchmark, trades, in_market, halted_on)

    closed = [t for t in trades if t.pnl is not None]
    wins = [t for t in closed if t.pnl > 0]  # type: ignore[operator]
    s = _stats([v for _, v in curve])
    b = _stats([v for _, v in benchmark])
    result.metrics = {
        **{k: v for k, v in s.items()},
        **{f"bh_{k}": v for k, v in b.items()},
        "trades": len(trades),
        "win_rate": len(wins) / len(closed) if closed else 0.0,
        "exposure": in_market / len(curve),
    }
    return result


def yearly_returns(curve: list[tuple[str, float]]) -> dict[str, float]:
    out: dict[str, float] = {}
    prev = curve[0][1]
    last_year, last_val = curve[0][0][:4], curve[0][1]
    for day, val in curve:
        year = day[:4]
        if year != last_year:
            out[last_year] = last_val / prev - 1
            prev, last_year = last_val, year
        last_val = val
    out[last_year] = last_val / prev - 1
    return out


def format_report(r: Result) -> str:
    m = r.metrics
    pct = lambda x: f"{x * 100:7.1f}%"  # noqa: E731
    lines = [
        f"=== {r.symbol}: {r.curve[0][0]} -> {r.curve[-1][0]} ===",
        f"{'':22}{'BOT':>10}{'BUY&HOLD':>12}",
        f"{'Total return':22}{pct(m['total_return']):>10}{pct(m['bh_total_return']):>12}",
        f"{'Return per year (CAGR)':22}{pct(m['cagr']):>10}{pct(m['bh_cagr']):>12}",
        f"{'Worst drawdown':22}{pct(m['max_drawdown']):>10}{pct(m['bh_max_drawdown']):>12}",
        f"{'Sharpe (rf=0)':22}{m['sharpe']:>10.2f}{m['bh_sharpe']:>12.2f}",
        f"Trades: {int(m['trades'])}   win rate: {m['win_rate'] * 100:.0f}%   time in market: {m['exposure'] * 100:.0f}%",
    ]
    if r.halted_on:
        lines.append(f"!! Kill switch tripped on {r.halted_on}: the bot stopped trading for the rest of the test.")
    bot_y, bh_y = yearly_returns(r.curve), yearly_returns(r.benchmark)
    lines.append("\nYear-by-year (bot vs buy&hold):")
    for y in bot_y:
        flag = "  <- bot lagged" if bot_y[y] < bh_y[y] - 0.02 else ""
        lines.append(f"  {y}: {pct(bot_y[y])} vs {pct(bh_y[y])}{flag}")
    years = len(r.curve) / TRADING_DAYS
    if years < 5:
        lines.append(f"\nWARNING: only {years:.1f} years of data. That is too short to judge anything; "
                     "use 10+ years that include at least one crash (2008, 2020, 2022).")
    lines.append("\nDrawdown = worst drop from a high point to a later low. "
                 "Sharpe = return per unit of bumpiness (higher = smoother ride).")
    return "\n".join(lines)


def format_trades(r: Result) -> str:
    if not r.trades:
        return "No trades."
    lines = [f"{'Bought':<11}{'at':>9}  {'Sold':<11}{'at':>9}{'shares':>7}{'profit':>10}  why it ended"]
    for t in r.trades:
        if t.exit_price is None:
            lines.append(f"{t.entry_day:<11}{t.entry_price:>9.2f}  {'(still open)':<11}")
        else:
            lines.append(f"{t.entry_day:<11}{t.entry_price:>9.2f}  {t.exit_day:<11}{t.exit_price:>9.2f}"
                         f"{t.shares:>7}{t.pnl:>+10.2f}  {t.reason}")
    return "\n".join(lines)
