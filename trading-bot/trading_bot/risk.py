"""Risk rules. These matter more than the entry signal: they decide how badly a bad stretch hurts."""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class RiskLimits:
    risk_per_trade: float = 0.02  # lose at most ~2% of equity if the stop is hit
    max_position_pct: float = 0.90  # never put more than 90% of equity in one position
    max_drawdown_halt: float = 0.25  # kill switch: flatten and stop if equity falls 25% from its peak

    def __post_init__(self) -> None:
        # Fractions, not percents: a beginner typing "--risk 2" for "2%" must not get 200% risk.
        if not 0 < self.risk_per_trade <= 0.10:
            raise ValueError(f"risk per trade must be between 0 and 0.10 (write 0.02 for 2%), got {self.risk_per_trade}")
        if not 0 < self.max_position_pct <= 1.0:
            raise ValueError(f"max position must be between 0 and 1 (write 0.9 for 90%), got {self.max_position_pct}")
        if not 0 < self.max_drawdown_halt < 1.0:
            raise ValueError(f"kill-switch drawdown must be between 0 and 1 (write 0.25 for 25%), got {self.max_drawdown_halt}")


def position_size(equity: float, price: float, stop_distance: float, limits: RiskLimits) -> int:
    """Whole shares such that hitting the stop loses ~risk_per_trade of equity, capped by max_position_pct."""
    if equity <= 0 or price <= 0 or stop_distance <= 0:
        return 0
    by_risk = equity * limits.risk_per_trade / stop_distance
    by_cap = equity * limits.max_position_pct / price
    return max(0, math.floor(min(by_risk, by_cap)))


class DrawdownGuard:
    """Tracks peak equity and trips once equity falls too far below it. Once tripped it stays tripped."""

    def __init__(self, max_drawdown: float, peak: float | None = None, tripped: bool = False):
        self.max_drawdown = max_drawdown
        self.peak = peak
        self.tripped = tripped

    def update(self, equity: float) -> bool:
        if self.peak is None or equity > self.peak:
            self.peak = equity
        if not self.tripped and equity < self.peak * (1 - self.max_drawdown):
            self.tripped = True
        return self.tripped
