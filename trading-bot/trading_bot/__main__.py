"""Command line: python -m trading_bot <command> ..."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .alpaca import AlpacaError, AlpacaPaper, load_env_file
from .backtest import format_report, run_backtest
from .data import fetch_yahoo, load_csv, save_csv, synthetic
from .paper import reset_halt, run_once
from .risk import RiskLimits
from .strategy import TrendParams, TrendStrategy


def _add_risk_args(p: argparse.ArgumentParser) -> None:
    d = RiskLimits()
    p.add_argument("--risk", type=float, default=d.risk_per_trade, help="fraction of equity risked per trade (default %(default)s)")
    p.add_argument("--max-position", type=float, default=d.max_position_pct, help="max fraction of equity in one position (default %(default)s)")
    p.add_argument("--halt-drawdown", type=float, default=d.max_drawdown_halt, help="kill-switch drawdown (default %(default)s)")


def _limits(a: argparse.Namespace) -> RiskLimits:
    return RiskLimits(a.risk, a.max_position, a.halt_drawdown)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="trading_bot", description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    f = sub.add_parser("fetch", help="download daily history from Yahoo into data/SYMBOL.csv")
    f.add_argument("symbol")
    f.add_argument("--years", type=int, default=15)

    b = sub.add_parser("backtest", help="replay the strategy on CSV history")
    b.add_argument("csv", nargs="+")
    b.add_argument("--capital", type=float, default=10_000)
    b.add_argument("--slippage-bps", type=float, default=5.0)
    _add_risk_args(b)

    sub.add_parser("demo", help="backtest on FAKE data just to prove the machinery runs")

    p = sub.add_parser("paper", help="run one daily decision against your Alpaca PAPER account")
    p.add_argument("symbol")
    p.add_argument("--dry-run", action="store_true", help="show what would happen without placing orders")
    _add_risk_args(p)

    sub.add_parser("reset-halt", help="re-arm the bot after the kill switch tripped")

    a = ap.parse_args(argv)

    if a.cmd == "fetch":
        out = Path("data") / f"{a.symbol.upper()}.csv"
        bars = fetch_yahoo(a.symbol.upper(), a.years)
        save_csv(bars, out)
        print(f"Saved {len(bars)} bars ({bars[0].day} -> {bars[-1].day}) to {out}")
    elif a.cmd == "backtest":
        for path in a.csv:
            r = run_backtest(load_csv(path), TrendStrategy(TrendParams()), _limits(a), a.capital, a.slippage_bps, Path(path).stem)
            print(format_report(r), end="\n\n")
    elif a.cmd == "demo":
        print("*** FAKE DATA: these numbers say nothing about real markets. This only proves the code runs. ***\n")
        print(format_report(run_backtest(synthetic(), symbol="FAKE")))
    elif a.cmd == "paper":
        load_env_file()
        try:
            run_once(a.symbol.upper(), AlpacaPaper.from_env(), limits=_limits(a), dry_run=a.dry_run)
        except (AlpacaError, RuntimeError, OSError) as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
    elif a.cmd == "reset-halt":
        reset_halt(Path("state.json"))
        print("Kill switch re-armed. The next run starts tracking drawdown from your current account value.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
