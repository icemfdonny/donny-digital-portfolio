"""Daily price bars: load from CSV, download from Yahoo, or generate fake ones for tests."""
from __future__ import annotations

import csv
import json
import random
import time
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


@dataclass(frozen=True)
class Bar:
    day: str  # ISO date, e.g. "2024-03-15"
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


def _validate(bars: list[Bar], source: str) -> list[Bar]:
    bars = sorted(bars, key=lambda b: b.day)
    for prev, cur in zip(bars, bars[1:]):
        if prev.day == cur.day:
            raise ValueError(f"{source}: duplicate date {cur.day}")
    for b in bars:
        date.fromisoformat(b.day)
        if min(b.open, b.high, b.low, b.close) <= 0:
            raise ValueError(f"{source}: non-positive price on {b.day}")
        if b.low > b.high * 1.0001:
            raise ValueError(f"{source}: low > high on {b.day}")
    return bars


def load_csv(path: str | Path) -> list[Bar]:
    """Read daily bars from a CSV with Yahoo/Stooq-style headers.

    If an 'Adj Close' column exists, open/high/low/close are scaled by adj/close so
    dividends and splits are reflected consistently.
    """
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        raise ValueError(f"{path}: file is empty")
    cols = {k.strip().lower(): k for k in rows[0] if k}

    def pick(*names: str) -> str | None:
        return next((cols[n] for n in names if n in cols), None)

    c_date = pick("date", "timestamp", "time")
    c_open, c_high, c_low, c_close = (pick(n) for n in ("open", "high", "low", "close"))
    c_adj = pick("adj close", "adj_close", "adjclose")
    c_vol = pick("volume")
    if not all([c_date, c_open, c_high, c_low, c_close]):
        raise ValueError(f"{path}: need Date/Open/High/Low/Close columns, found {list(cols)}")

    bars = []
    for r in rows:
        try:
            o, h, l, c = (float(r[k]) for k in (c_open, c_high, c_low, c_close))
            factor = float(r[c_adj]) / c if c_adj else 1.0
            vol = float(r[c_vol]) if c_vol and r[c_vol] else 0.0
        except (ValueError, TypeError, ZeroDivisionError):
            continue  # blank / "null" rows are common in downloaded files
        bars.append(Bar(r[c_date][:10], o * factor, h * factor, l * factor, c * factor, vol))
    if not bars:
        raise ValueError(f"{path}: no usable rows")
    return _validate(bars, str(path))


def save_csv(bars: list[Bar], path: str | Path) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Date", "Open", "High", "Low", "Close", "Volume"])
        for b in bars:
            w.writerow([b.day, f"{b.open:.4f}", f"{b.high:.4f}", f"{b.low:.4f}", f"{b.close:.4f}", int(b.volume)])


def fetch_yahoo(symbol: str, years: int = 15) -> list[Bar]:
    """Download adjusted daily bars from Yahoo's unofficial chart API.

    Unofficial means it can change or rate-limit without notice; if it breaks, download a
    CSV by hand from finance.yahoo.com (Historical Data) and use load_csv instead.
    """
    end = int(time.time())
    start = end - years * 366 * 86400
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?period1={start}&period2={end}&interval=1d&includeAdjustedClose=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.load(resp)
    result = payload["chart"]["result"]
    if not result:
        raise ValueError(f"Yahoo returned no data for {symbol}: {payload['chart'].get('error')}")
    result = result[0]
    q = result["indicators"]["quote"][0]
    adj = result["indicators"].get("adjclose", [{}])[0].get("adjclose")
    bars = []
    for i, ts in enumerate(result["timestamp"]):
        try:
            o, h, l, c = q["open"][i], q["high"][i], q["low"][i], q["close"][i]
            if None in (o, h, l, c):
                continue
            f = (adj[i] / c) if adj and adj[i] else 1.0
            day = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
            bars.append(Bar(day, o * f, h * f, l * f, c * f, q["volume"][i] or 0))
        except (IndexError, TypeError):
            continue
    return _validate(bars, f"yahoo:{symbol}")


def synthetic(n_days: int = 2500, seed: int = 7, start: str = "2010-01-04", price: float = 100.0) -> list[Bar]:
    """Fake market with bull/bear/choppy regimes. For tests and demos ONLY - proves nothing about real markets."""
    rng = random.Random(seed)
    regimes = [(0.0006, 0.009), (-0.0008, 0.020), (0.0000, 0.012)]  # (daily drift, daily vol)
    bars: list[Bar] = []
    day = date.fromisoformat(start)
    close = price
    drift, vol = regimes[0]
    left = 0
    while len(bars) < n_days:
        if day.weekday() < 5:
            if left <= 0:
                drift, vol = rng.choices(regimes, weights=[5, 2, 3])[0]
                left = rng.randint(60, 300)
            left -= 1
            o = close * (1 + rng.gauss(0, vol * 0.3))
            c = o * (1 + rng.gauss(drift, vol))
            rng_hi = abs(rng.gauss(0, vol * 0.5))
            rng_lo = abs(rng.gauss(0, vol * 0.5))
            bars.append(Bar(day.isoformat(), o, max(o, c) * (1 + rng_hi), min(o, c) * (1 - rng_lo), c, 1e6))
            close = c
        day += timedelta(days=1)
    return bars
