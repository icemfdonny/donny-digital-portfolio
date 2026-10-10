"""Daily paper-trading runner. Run it once per trading day, after the market closes.

What one run does:
  1. read the account, the market clock, and ~2 years of daily bars from Alpaca (paper)
  2. check the kill switch (account fell too far from its peak -> sell everything and stop)
  3. apply the same TrendStrategy used in the backtest to the latest COMPLETED daily bar
  4. place at most one order (a market order that fills at the next open), and keep a
     broker-side protective stop order on any open position
"""
from __future__ import annotations

import csv
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from .alpaca import AlpacaPaper
from .risk import DrawdownGuard, RiskLimits, position_size
from .strategy import ENTER, EXIT, TrendStrategy

LOG_FIELDS = ["time_utc", "symbol", "last_bar", "close", "sma", "signal", "action", "qty", "stop", "equity", "note"]


DEFAULT_STATE = {"peak_equity": None, "halted": False, "stop": None}


def _load_state(path: Path) -> dict:
    if not path.exists():
        return dict(DEFAULT_STATE)
    try:
        saved = json.loads(path.read_text())
        if not isinstance(saved, dict):
            raise ValueError("not a JSON object")
    except ValueError as e:
        # Fail closed: this file remembers whether the kill switch tripped, so guessing could un-halt the bot.
        raise RuntimeError(
            f"{path} is unreadable ({e}). Not trading, because that file remembers the kill switch. "
            "Fix it, or delete it to start fresh."
        ) from e
    return {**DEFAULT_STATE, **saved}


def _save_state(path: Path, state: dict) -> None:
    tmp = path.with_name(path.name + ".tmp")  # write-then-rename so a crash can't leave half a file
    tmp.write_text(json.dumps(state, indent=2))
    os.replace(tmp, path)


def _log(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    new = not path.exists()
    with open(path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LOG_FIELDS)
        if new:
            w.writeheader()
        w.writerow({k: row.get(k, "") for k in LOG_FIELDS})


def reset_halt(state_path: Path) -> None:
    """Manually re-arm the bot after the kill switch tripped. Resets the peak to the current account value."""
    _save_state(state_path, dict(DEFAULT_STATE))


def run_once(
    symbol: str,
    client: AlpacaPaper,
    strategy: TrendStrategy | None = None,
    limits: RiskLimits | None = None,
    state_path: Path = Path("state.json"),
    log_path: Path = Path("logs/decisions.csv"),
    dry_run: bool = False,
    say: Callable[[str], None] = print,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    """Returns a short description of the action taken (also written to the log)."""
    strategy = strategy or TrendStrategy()
    limits = limits or RiskLimits()
    state = _load_state(state_path)

    acct = client.account()
    if acct.get("trading_blocked") or acct.get("account_blocked"):
        raise RuntimeError("Alpaca says trading is blocked on this account; check the Alpaca dashboard.")
    equity = float(acct["equity"])

    clock = client.clock()
    market_open = bool(clock.get("is_open"))
    if market_open and not dry_run:
        raise RuntimeError(
            "The market is open right now. Run this in the evening, after the close, so decisions "
            "use completed daily bars (that is what the backtest assumes)."
        )
    bars = client.daily_bars(symbol)
    if market_open:  # dry run during the day: today's bar is still forming, only trust completed days
        today = clock["timestamp"][:10]
        bars = [b for b in bars if b.day < today]
    if len(bars) <= strategy.first_ready_index:
        raise RuntimeError(f"Only {len(bars)} bars available; need more than {strategy.first_ready_index}.")

    ind = strategy.prepare(bars)
    i = len(bars) - 1
    last = bars[i]
    row = {
        "time_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"), "symbol": symbol,
        "last_bar": last.day, "close": f"{last.close:.2f}", "sma": f"{ind.sma[i]:.2f}", "equity": f"{equity:.2f}",
    }

    def finish(action: str, note: str = "", qty: int | str = "", stop: float | None = None, signal: str = "") -> str:
        row.update(action=action, note=note, qty=qty, signal=signal, stop="" if stop is None else f"{stop:.2f}")
        if not dry_run:
            _save_state(state_path, state)
            _log(log_path, row)
        say(f"[{'DRY RUN ' if dry_run else ''}{symbol} {last.day}] {action}" + (f" - {note}" if note else ""))
        return action

    def cancel_all_and_wait() -> None:
        orders = client.open_orders(symbol)
        if dry_run:
            return
        for o in orders:
            client.cancel_order(o["id"])
        for _ in range(20):  # shares stay locked until the cancels settle
            if not client.open_orders(symbol):
                return
            sleep(0.5)
        raise RuntimeError("Open orders did not clear after cancelling; stopping so nothing is sold twice.")

    # --- kill switch ----------------------------------------------------------------------
    guard = DrawdownGuard(limits.max_drawdown_halt, state["peak_equity"], state["halted"])
    guard.update(equity)
    state["peak_equity"], state["halted"] = guard.peak, guard.tripped
    qty = client.position_qty(symbol)
    if qty < 0:
        raise RuntimeError(f"You hold a SHORT position in {symbol} ({qty}). This bot only goes long; close it yourself first.")
    if guard.tripped:
        if qty > 0:
            cancel_all_and_wait()
            if not dry_run:
                client.market_order(symbol, "sell", qty)
            return finish("HALT_SELL", f"drawdown limit hit; selling {qty}. Run 'reset-halt' to re-arm.", qty)
        return finish("HALTED", "drawdown limit hit earlier; staying flat. Run 'reset-halt' to re-arm.")

    # --- an order from a previous run is still working: don't stack another on top ----------
    orders = client.open_orders(symbol)
    working = [o for o in orders if o.get("type") != "stop"]
    if working:
        return finish("WAIT", f"a {working[0].get('side', '')} order is still open (it fills at the next market open)")

    sig = strategy.signal(ind, bars, i, qty > 0)

    # --- in a position ---------------------------------------------------------------------
    if qty > 0:
        if sig == EXIT:
            cancel_all_and_wait()
            if not dry_run:
                client.market_order(symbol, "sell", qty)
            state["stop"] = None
            return finish("SELL", "price fell below the trend line", qty, signal=sig)
        new_stop = max(state["stop"] or 0.0, strategy.stop_level(ind, bars, i))
        existing = [o for o in orders if o.get("type") == "stop" and o.get("side") == "sell"]
        current = max((float(o["stop_price"]) for o in existing), default=0.0)
        state["stop"] = new_stop
        if new_stop > current + 0.01:
            cancel_all_and_wait()
            if not dry_run:
                client.stop_order(symbol, qty, new_stop)
            return finish("SET_STOP", f"protective stop moved to {new_stop:.2f}", qty, new_stop, sig)
        return finish("HOLD", "in position, stop already in place", qty, current, sig)

    # --- flat ------------------------------------------------------------------------------
    state["stop"] = None
    if sig == ENTER:
        stop_dist = strategy.p.atr_mult * ind.atr[i]  # type: ignore[operator]
        want = position_size(equity, last.close, stop_dist, limits)
        if want < 1:
            return finish("SKIP", "signal says buy but account is too small for even 1 share at this risk limit", signal=sig)
        if not dry_run:
            client.market_order(symbol, "buy", want)
        return finish("BUY", f"price is above the trend line; buying {want}, protective stop is set on the next run", want, signal=sig)
    return finish("STAY_FLAT", "price is not above the trend line", signal=sig)
