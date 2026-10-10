"""Minimal Alpaca client - PAPER TRADING ONLY.

The paper URL is a constant on purpose. There is no setting that points this client at a
real-money account; moving to live trading would mean editing this file deliberately.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable

from .data import Bar

PAPER_BASE = "https://paper-api.alpaca.markets"
DATA_BASE = "https://data.alpaca.markets"
RETRY_STATUS = (429, 500, 502, 503, 504)  # temporary problems worth retrying (reads only)

# (method, url, headers, json_body) -> (status_code, parsed_json_or_None)
Http = Callable[[str, str, dict[str, str], dict | None], tuple[int, Any]]


def urllib_http(method: str, url: str, headers: dict[str, str], body: dict | None) -> tuple[int, Any]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={**headers, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw) if raw else None
        except ValueError:
            return e.code, {"message": raw.decode(errors="replace")}


def load_env_file(path: str | Path | None = None) -> None:
    """Tiny .env reader (KEY=VALUE lines). Real environment variables win over the file.

    Without a path it looks in the current folder, then in the trading-bot folder itself,
    so it works no matter where you launch the command from.
    """
    candidates = [Path(path)] if path else [Path(".env"), Path(__file__).resolve().parent.parent / ".env"]
    for p in candidates:
        if not p.exists():
            continue
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))
        return


class AlpacaError(RuntimeError):
    pass


class AlpacaPaper:
    def __init__(self, key_id: str, secret: str, http: Http = urllib_http, sleep: Callable[[float], None] = time.sleep):
        self._headers = {"APCA-API-KEY-ID": key_id, "APCA-API-SECRET-KEY": secret}
        self._http = http
        self._sleep = sleep

    @classmethod
    def from_env(cls) -> "AlpacaPaper":
        key, secret = os.environ.get("ALPACA_KEY_ID"), os.environ.get("ALPACA_SECRET_KEY")
        if not key or not secret:
            raise AlpacaError(
                "Missing ALPACA_KEY_ID / ALPACA_SECRET_KEY. Put your PAPER keys in trading-bot/.env (see README)."
            )
        return cls(key, secret)

    def _request(self, method: str, url: str, body: dict | None = None) -> tuple[int, Any]:
        """One HTTP call. Reads (GET) are retried on temporary failures; orders are NEVER retried,
        because a retry after a lost reply could place the same order twice."""
        attempts = 3 if method == "GET" else 1
        for n in range(attempts):
            last = n == attempts - 1
            try:
                status, payload = self._http(method, url, self._headers, body)
            except OSError:  # network down, timeout, DNS...
                if last:
                    raise
                self._sleep(2**n)
                continue
            if status in RETRY_STATUS and not last:
                self._sleep(2**n)
                continue
            return status, payload
        raise AssertionError("unreachable")

    def _call(self, method: str, url: str, body: dict | None = None, ok: tuple[int, ...] = (200,)) -> Any:
        status, payload = self._request(method, url, body)
        if status not in ok:
            msg = payload.get("message") if isinstance(payload, dict) else payload
            raise AlpacaError(f"{method} {url} -> HTTP {status}: {msg}")
        return payload

    def account(self) -> dict:
        return self._call("GET", f"{PAPER_BASE}/v2/account")

    def clock(self) -> dict:
        return self._call("GET", f"{PAPER_BASE}/v2/clock")

    def position_qty(self, symbol: str) -> int:
        status, payload = self._request("GET", f"{PAPER_BASE}/v2/positions/{symbol}")
        if status == 404:
            return 0
        if status != 200:
            raise AlpacaError(f"position lookup failed: HTTP {status}: {payload}")
        return int(float(payload["qty"]))

    def open_orders(self, symbol: str) -> list[dict]:
        q = urllib.parse.urlencode({"status": "open", "symbols": symbol})
        return self._call("GET", f"{PAPER_BASE}/v2/orders?{q}") or []

    def cancel_order(self, order_id: str) -> None:
        self._call("DELETE", f"{PAPER_BASE}/v2/orders/{order_id}", ok=(200, 204, 404, 422))

    def market_order(self, symbol: str, side: str, qty: int) -> dict:
        body = {"symbol": symbol, "qty": str(qty), "side": side, "type": "market", "time_in_force": "day"}
        return self._call("POST", f"{PAPER_BASE}/v2/orders", body)

    def stop_order(self, symbol: str, qty: int, stop_price: float) -> dict:
        body = {
            "symbol": symbol, "qty": str(qty), "side": "sell", "type": "stop",
            "stop_price": f"{stop_price:.2f}", "time_in_force": "gtc",
        }
        return self._call("POST", f"{PAPER_BASE}/v2/orders", body)

    def daily_bars(self, symbol: str, lookback_days: int = 520) -> list[Bar]:
        start = (date.today() - timedelta(days=lookback_days)).isoformat()
        bars: list[Bar] = []
        token = None
        while True:
            params = {
                "timeframe": "1Day", "start": start, "limit": 1000,
                "adjustment": "all", "feed": "iex",
            }
            if token:
                params["page_token"] = token
            payload = self._call("GET", f"{DATA_BASE}/v2/stocks/{symbol}/bars?{urllib.parse.urlencode(params)}")
            for b in payload.get("bars") or []:
                bars.append(Bar(b["t"][:10], b["o"], b["h"], b["l"], b["c"], b.get("v", 0)))
            token = payload.get("next_page_token")
            if not token:
                return bars
