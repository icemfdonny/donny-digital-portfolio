"""Research harness: compare a few simple, PRE-DECLARED rules with buy-and-hold on many markets.

Why this exists: picking whichever rule looks best on past data is how beginners fool themselves.
So the candidate list below is FIXED in advance (simple, widely published ideas), the command line
cannot change any rule's numbers, and every candidate is shown on every market and in both halves
of every history, so cherry-picking is visible instead of hidden.

Timing convention (same as the live bot): a rule decides at a bar's CLOSE, the trade happens at the
NEXT open, and the position is held until the open after that. Equity is marked at opens.
Fully invested means 100% of the account; there is no leverage and no shorting.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from .backtest import TRADING_DAYS, _stats, run_backtest
from .data import Bar
from .strategy import sma

WARMUP = 210  # bars needed by the slowest rule (monthly 210-day average); every rule shares one window

Rule = Callable[[list[Bar]], list[float]]  # bars -> target weight (0..1) decided at each bar's close


def w_hold(bars: list[Bar]) -> list[float]:
    return [1.0] * len(bars)


def w_sma_filter(bars: list[Bar], n: int = 200, band: float = 0.0) -> list[float]:
    """Fully invested while the close is above its n-day average (optionally with a +/-band to flip)."""
    closes = [b.close for b in bars]
    avg = sma(closes, n)
    out, cur = [], 0.0
    for c, a in zip(closes, avg):
        if a is not None:
            if cur == 0.0 and c > a * (1 + band):
                cur = 1.0
            elif cur == 1.0 and c < a * (1 - band):
                cur = 0.0
        out.append(cur)
    return out


def w_monthly_sma(bars: list[Bar], n: int = 210) -> list[float]:
    """Decide only on the last trading day of each month: invested if the close is above its n-day average
    (about 10 months). Looks at the NEXT bar's calendar date only to know the month ended (a published calendar),
    never at its prices."""
    closes = [b.close for b in bars]
    avg = sma(closes, n)
    out, cur = [], 0.0
    for i, b in enumerate(bars):
        month_end = i == len(bars) - 1 or bars[i + 1].day[:7] != b.day[:7]
        if month_end and avg[i] is not None:
            cur = 1.0 if closes[i] > avg[i] else 0.0
        out.append(cur)
    return out


def w_ensemble(bars: list[Bar], lookbacks: tuple[int, ...] = (50, 100, 200)) -> list[float]:
    """Partial position: the share of the 50/100/200-day averages that the close is above."""
    closes = [b.close for b in bars]
    avgs = [sma(closes, n) for n in lookbacks]
    return [
        sum(1 for a in avgs if a[i] is not None and closes[i] > a[i]) / len(lookbacks)  # type: ignore[operator]
        for i in range(len(bars))
    ]


# FIXED candidate list. Do not add knobs to the command line; change this list only on purpose,
# and treat anything you add after seeing results as a NEW hypothesis needing fresh data.
RULES: dict[str, Rule] = {
    "hold": w_hold,
    "sma200": lambda b: w_sma_filter(b, 200, 0.0),
    "sma200_band": lambda b: w_sma_filter(b, 200, 0.01),
    "monthly_sma210": w_monthly_sma,
    "ensemble": w_ensemble,
}
BOT = "current_bot"  # the existing risk-sized, stop-loss bot, for reference


@dataclass
class Run:
    curve: list[tuple[str, float]]
    exposure: float  # average fraction of the account invested
    round_trips: float  # total in-and-out cycles (sum of |weight change| / 2)


def simulate(bars: list[Bar], weights: list[float], start: int, end: int,
             cost_bps: float = 5.0, cash_rate: float = 0.0) -> Run:
    """Weights decided at the close of bar k-1 are traded at the open of bar k and held to the open of bar k+1."""
    if not 0 <= start < end <= len(bars) - 1 or end - start - 1 < 30:
        raise ValueError("window too short or outside the data")
    cost = cost_bps / 10_000
    cash_d = (1 + cash_rate) ** (1 / TRADING_DAYS) - 1
    eq, prev_w, turnover, w_sum = 1.0, 0.0, 0.0, 0.0
    curve = [(bars[start + 1].day, eq)]
    for k in range(start + 1, end):
        w = weights[k - 1]
        eq *= 1 - cost * abs(w - prev_w)  # pay costs on whatever is traded at this open
        turnover += abs(w - prev_w)
        prev_w = w
        w_sum += w
        eq *= 1 + w * (bars[k + 1].open / bars[k].open - 1) + (1 - w) * cash_d
        curve.append((bars[k + 1].day, eq))
    return Run(curve, w_sum / (end - start - 1), turnover / 2)


def _slice_stats(values: list[float]) -> dict[str, float]:
    s = _stats(values)
    return {k: s[k] for k in ("cagr", "max_drawdown", "sharpe", "total_return")}


def evaluate(symbol: str, bars: list[Bar], cost_bps: float = 5.0, cash_rate: float = 0.0,
             eval_from: str | None = None, eval_to: str | None = None) -> dict:
    """Run every rule (plus the current bot) over one common window; stats for the whole window and both halves."""
    start = WARMUP - 1
    if eval_from:
        start = max(start, next((i for i, b in enumerate(bars) if b.day >= eval_from), len(bars)))
    end = len(bars) - 1
    if eval_to:
        end = max((i for i, b in enumerate(bars) if b.day <= eval_to), default=0)
    if len(bars) <= WARMUP + 31:
        raise ValueError(f"{symbol}: need more than {WARMUP + 31} bars")

    out: dict = {"symbol": symbol, "rows": {}}
    for name, rule in RULES.items():
        run = simulate(bars, rule(bars), start, end, cost_bps, cash_rate)
        out["rows"][name] = _row([v for _, v in run.curve], run.exposure, run.round_trips)
    out["first"], out["last"] = bars[start + 1].day, bars[end].day

    # reference: the existing bot on the same window (its own engine: 2% risk sizing, 3-ATR trailing stop)
    bot = run_backtest(bars[start - 199:end + 1], symbol=symbol, slippage_bps=cost_bps)
    out["rows"][BOT] = _row([v for _, v in bot.curve], bot.metrics["exposure"], float(len(bot.trades)))
    out["years"] = (end - start - 1) / TRADING_DAYS
    return out


def _row(values: list[float], exposure: float, round_trips: float) -> dict:
    mid = len(values) // 2
    return {
        "full": _slice_stats(values),
        "h1": _slice_stats(values[: mid + 1]),
        "h2": _slice_stats(values[mid:]),
        "exposure": exposure,
        "round_trips": round_trips,
        "curve_len": len(values),
    }


def _cells(res: dict, name: str):
    """(period, candidate stats, hold stats) for the whole window and each half."""
    for p in ("full", "h1", "h2"):
        yield p, res["rows"][name][p], res["rows"]["hold"][p]


def scoreboard(results: list[dict]) -> str:
    """Count, across every market and period, how often each rule met two PRE-DECLARED tests vs buy-and-hold:
       MORE MONEY: CAGR at least hold's AND a shallower worst drawdown.
       LESS PAIN : worst drawdown no deeper than 60% of hold's (CAGR may be lower)."""
    names = [n for n in list(RULES) + [BOT] if n != "hold"]
    lines = ["SCOREBOARD across all markets and periods (whole window + each half of every history)",
             f"{'rule':<16}{'MORE MONEY':>12}{'LESS PAIN':>11}{'avg CAGR vs hold':>19}"]
    for n in names:
        cells = [c for r in results for c in _cells(r, n)]
        more = sum(1 for _, s, h in cells if s["cagr"] >= h["cagr"] and abs(s["max_drawdown"]) < abs(h["max_drawdown"]))
        pain = sum(1 for _, s, h in cells if abs(s["max_drawdown"]) <= 0.6 * abs(h["max_drawdown"]))
        diff = sum(s["cagr"] - h["cagr"] for _, s, h in cells) / len(cells)
        lines.append(f"{n:<16}{f'{more}/{len(cells)}':>12}{f'{pain}/{len(cells)}':>11}{diff * 100:>18.1f}%")
    lines.append("MORE MONEY needs to win in most cells, not a few, before it means anything. "
                 "Beating hold on return AND drawdown in every period would be unusual; treat a clean sweep with suspicion too.")
    return "\n".join(lines)


def format_result(res: dict, cost_bps: float, cash_rate: float) -> str:
    pct = lambda x: f"{x * 100:6.1f}%"  # noqa: E731
    lines = [
        f"=== {res['symbol']}: {res['first']} -> {res['last']} ({res['years']:.1f} yrs; cost {cost_bps:g} bps per trade; "
        f"cash earns {cash_rate * 100:g}%/yr) ===",
        f"{'rule':<16}{'CAGR':>8}{'worstDD':>9}{'Sharpe':>8}{'invested':>10}{'in/out':>8}   {'1st half CAGR / DD':<20}{'2nd half CAGR / DD'}",
    ]
    for name, row in res["rows"].items():
        f, a, b = row["full"], row["h1"], row["h2"]
        lines.append(
            f"{name:<16}{pct(f['cagr']):>8}{pct(f['max_drawdown']):>9}{f['sharpe']:>8.2f}{row['exposure'] * 100:>9.0f}%"
            f"{row['round_trips'] / res['years']:>8.1f}   {pct(a['cagr'])} /{pct(a['max_drawdown']):<9}{pct(b['cagr'])} /{pct(b['max_drawdown'])}"
        )
    lines.append("invested = average share of the account in the market (for current_bot: share of DAYS in the market); "
                 "in/out = round trips per year.")
    return "\n".join(lines)
