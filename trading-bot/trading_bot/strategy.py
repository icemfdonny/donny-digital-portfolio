"""Trend-following rule: be long while price is above its 200-day average, otherwise sit in cash.

This is a deliberately boring, widely-known rule. It will not beat the market in every
period (it usually lags in strong bull runs) - its job is to cut deep drawdowns.

The SAME code runs in the backtest and in live paper trading, and every value at bar i
is computed from bars 0..i only, so a backtest cannot "peek" at the future.
"""
from __future__ import annotations

from dataclasses import dataclass

from .data import Bar

ENTER, EXIT, HOLD = "enter", "exit", "hold"


def sma(values: list[float], n: int) -> list[float | None]:
    if n <= 0:
        raise ValueError("window must be positive")
    out: list[float | None] = [None] * len(values)
    total = 0.0
    for i, v in enumerate(values):
        total += v
        if i >= n:
            total -= values[i - n]
        if i >= n - 1:
            out[i] = total / n
    return out


def atr(bars: list[Bar], n: int) -> list[float | None]:
    """Average True Range (Wilder smoothing): typical daily price range, used to size stops."""
    out: list[float | None] = [None] * len(bars)
    trs: list[float] = []
    prev_atr = 0.0
    for i, b in enumerate(bars):
        if i == 0:
            tr = b.high - b.low
        else:
            pc = bars[i - 1].close
            tr = max(b.high - b.low, abs(b.high - pc), abs(b.low - pc))
        trs.append(tr)
        if i == n - 1:
            prev_atr = sum(trs) / n
            out[i] = prev_atr
        elif i >= n:
            prev_atr = (prev_atr * (n - 1) + tr) / n
            out[i] = prev_atr
    return out


@dataclass(frozen=True)
class TrendParams:
    slow: int = 200  # moving-average length in trading days
    band: float = 0.01  # must be 1% above/below the average to flip; reduces whipsaw
    atr_n: int = 14
    atr_mult: float = 3.0  # protective stop sits this many ATRs below price


@dataclass
class Indicators:
    sma: list[float | None]
    atr: list[float | None]


class TrendStrategy:
    def __init__(self, params: TrendParams | None = None):
        self.p = params or TrendParams()

    @property
    def first_ready_index(self) -> int:
        """Earliest bar index where every indicator has a value."""
        return max(self.p.slow, self.p.atr_n) - 1

    def prepare(self, bars: list[Bar]) -> Indicators:
        return Indicators(sma(self.closes(bars), self.p.slow), atr(bars, self.p.atr_n))

    @staticmethod
    def closes(bars: list[Bar]) -> list[float]:
        return [b.close for b in bars]

    def signal(self, ind: Indicators, bars: list[Bar], i: int, in_position: bool) -> str:
        """Decision made at the CLOSE of bar i, to be executed at the open of bar i+1."""
        avg = ind.sma[i]
        if avg is None:
            return HOLD
        close = bars[i].close
        if not in_position and close > avg * (1 + self.p.band):
            return ENTER
        if in_position and close < avg * (1 - self.p.band):
            return EXIT
        return HOLD

    def stop_level(self, ind: Indicators, bars: list[Bar], i: int) -> float:
        """Protective stop price implied by the close of bar i (callers only ever ratchet it upward)."""
        a = ind.atr[i]
        if a is None:
            raise ValueError("ATR not ready")
        return bars[i].close - self.p.atr_mult * a
