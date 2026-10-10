"""Command line: python -m trading_bot <command> ..."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .alpaca import AlpacaError, AlpacaPaper, load_env_file
from .backtest import format_report, format_trades, run_backtest
from .data import fetch_yahoo, load_csv, save_csv, synthetic
from .paper import reset_halt, run_once
from .research import evaluate, format_result, scoreboard
from .risk import RiskLimits
from .strategy import TrendParams, TrendStrategy


def _add_risk_args(p: argparse.ArgumentParser) -> None:
    d = RiskLimits()
    p.add_argument("--risk", type=float, default=d.risk_per_trade, help="fraction of the account risked per trade; 0.02 means 2%% (default %(default)s)")
    p.add_argument("--max-position", type=float, default=d.max_position_pct, help="max fraction of the account in one position (default %(default)s)")
    p.add_argument("--halt-drawdown", type=float, default=d.max_drawdown_halt, help="kill-switch drawdown; 0.25 means 25%% (default %(default)s)")


def _limits(a: argparse.Namespace) -> RiskLimits:
    return RiskLimits(a.risk, a.max_position, a.halt_drawdown)


def _build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="trading_bot", description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    f = sub.add_parser("fetch", help="download daily history from Yahoo into data/SYMBOL.csv")
    f.add_argument("symbol")
    f.add_argument("--years", type=int, default=15)

    b = sub.add_parser("backtest", help="replay the strategy on CSV history")
    b.add_argument("csv", nargs="+")
    b.add_argument("--capital", type=float, default=10_000)
    b.add_argument("--slippage-bps", type=float, default=5.0, help="cost per fill in basis points; 5 = 0.05%% (default %(default)s)")
    b.add_argument("--trades", action="store_true", help="also list every individual trade")
    _add_risk_args(b)

    r = sub.add_parser("research", help="compare fixed, pre-declared candidate rules with buy-and-hold on several markets")
    r.add_argument("csv", nargs="+", help="one CSV per market (e.g. SPY, QQQ, EFA, TLT, GLD)")
    r.add_argument("--cost-bps", type=float, default=5.0, help="cost per unit traded in basis points (default %(default)s)")
    r.add_argument("--cash-rate", type=float, default=0.0, help="yearly interest on idle cash; 0.02 means 2%% (default %(default)s)")
    r.add_argument("--from", dest="eval_from", help="only evaluate from this date (YYYY-MM-DD); earlier data still feeds the averages")
    r.add_argument("--to", dest="eval_to", help="only evaluate up to this date (YYYY-MM-DD)")

    sub.add_parser("demo", help="backtest on FAKE data just to prove the machinery runs")

    p = sub.add_parser("paper", help="run one daily decision against your Alpaca PAPER account")
    p.add_argument("symbol")
    p.add_argument("--dry-run", action="store_true", help="show what would happen without placing orders")
    _add_risk_args(p)

    sub.add_parser("reset-halt", help="re-arm the bot after the kill switch tripped")
    return ap


def _run(a: argparse.Namespace) -> None:
    if a.cmd == "fetch":
        out = Path("data") / f"{a.symbol.upper()}.csv"
        bars = fetch_yahoo(a.symbol.upper(), a.years)
        save_csv(bars, out)
        print(f"Saved {len(bars)} bars ({bars[0].day} -> {bars[-1].day}) to {out}")
    elif a.cmd == "backtest":
        limits = _limits(a)
        for path in a.csv:
            r = run_backtest(load_csv(path), TrendStrategy(TrendParams()), limits, a.capital, a.slippage_bps, Path(path).stem)
            print(format_report(r))
            if a.trades:
                print("\n" + format_trades(r))
            print()
    elif a.cmd == "research":
        if not 0 <= a.cash_rate < 0.25:
            raise ValueError(f"cash rate must be a fraction like 0.02 for 2%, got {a.cash_rate}")
        results = []
        for path in a.csv:
            res = evaluate(Path(path).stem, load_csv(path), a.cost_bps, a.cash_rate, a.eval_from, a.eval_to)
            results.append(res)
            print(format_result(res, a.cost_bps, a.cash_rate), end="\n\n")
        print(scoreboard(results))
    elif a.cmd == "demo":
        print("*** FAKE DATA: these numbers say nothing about real markets. This only proves the code runs. ***\n")
        print(format_report(run_backtest(synthetic(), symbol="FAKE")))
    elif a.cmd == "paper":
        limits = _limits(a)  # validate before touching the network
        load_env_file()
        run_once(a.symbol.upper(), AlpacaPaper.from_env(), limits=limits, dry_run=a.dry_run)
    elif a.cmd == "reset-halt":
        reset_halt(Path("state.json"))
        print("Kill switch re-armed. The next run starts tracking drawdown from your current account value.")


def main(argv: list[str] | None = None) -> int:
    a = _build_parser().parse_args(argv)
    try:
        _run(a)
    except (AlpacaError, RuntimeError, ValueError, OSError) as e:  # friendly message instead of a traceback
        print(f"Error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
