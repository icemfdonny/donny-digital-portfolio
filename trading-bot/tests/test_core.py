import csv
import tempfile
import unittest
from pathlib import Path

from trading_bot.backtest import format_report, format_trades, max_drawdown, run_backtest
from trading_bot.data import Bar, load_csv, synthetic
from trading_bot.risk import DrawdownGuard, RiskLimits, position_size
from trading_bot.strategy import ENTER, EXIT, HOLD, TrendParams, TrendStrategy, atr, sma


def bars_from_closes(closes, start_open=None, gap=0.0, wiggle=0.5):
    """Deterministic bars: open = previous close (+gap), high/low = +/- wiggle around the open/close range."""
    out, prev = [], start_open or closes[0]
    for n, c in enumerate(closes):
        o = prev * (1 + gap)
        out.append(Bar(f"2020-01-{1 + n:02d}" if n < 28 else f"2020-{1 + n // 28:02d}-{1 + n % 28:02d}", o,
                       max(o, c) + wiggle, min(o, c) - wiggle, c, 1e6))
        prev = c
    return out


def dated(closes, **kw):
    """bars_from_closes with unique business-ish dates far enough apart for any length."""
    from datetime import date, timedelta
    bars = bars_from_closes(closes, **kw)
    d = date(2015, 1, 1)
    return [Bar((d + timedelta(days=n)).isoformat(), b.open, b.high, b.low, b.close, b.volume) for n, b in enumerate(bars)]


class IndicatorMath(unittest.TestCase):
    def test_sma(self):
        self.assertEqual(sma([1, 2, 3, 4, 5], 3), [None, None, 2.0, 3.0, 4.0])

    def test_atr_constant_range(self):
        bars = [Bar(f"2020-01-{d:02d}", 10, 11, 9, 10) for d in range(1, 21)]
        self.assertAlmostEqual(atr(bars, 14)[-1], 2.0)
        self.assertIsNone(atr(bars, 14)[12])


class NoLookahead(unittest.TestCase):
    def test_signal_at_i_ignores_future_bars(self):
        bars = synthetic(600, seed=3)
        s = TrendStrategy()
        full = s.prepare(bars)
        for i in range(s.first_ready_index, 450, 7):
            for pos in (False, True):
                head = bars[: i + 1]
                trunc = s.prepare(head)
                self.assertEqual(s.signal(full, bars, i, pos), s.signal(trunc, head, i, pos))
                self.assertEqual(s.stop_level(full, bars, i), s.stop_level(trunc, head, i))


class Risk(unittest.TestCase):
    def test_size_by_risk(self):
        # $10k, 2% risk = $200, stop 5 away -> 40 shares ($4000 < 90% cap)
        self.assertEqual(position_size(10_000, 100, 5, RiskLimits()), 40)

    def test_size_capped_by_position_limit(self):
        # risk would allow 400 shares but the 90% cap is 90 shares
        self.assertEqual(position_size(10_000, 100, 0.5, RiskLimits()), 90)

    def test_size_zero_cases(self):
        for args in ((0, 100, 5), (10_000, 0, 5), (10_000, 100, 0), (10_000, 10_000, 5)):
            self.assertEqual(position_size(*args, RiskLimits()), 0)

    def test_guard_trips_and_latches(self):
        g = DrawdownGuard(0.25)
        self.assertFalse(g.update(100)); self.assertFalse(g.update(80))
        self.assertTrue(g.update(74))
        self.assertTrue(g.update(200))  # stays tripped even if equity recovers

    def test_max_drawdown(self):
        self.assertAlmostEqual(max_drawdown([100, 120, 60, 90]), -0.5)


class Backtest(unittest.TestCase):
    def setUp(self):
        self.strat = TrendStrategy()
        self.warm = self.strat.first_ready_index

    def test_flat_market_never_trades(self):
        r = run_backtest(dated([100.0] * 300), self.strat)
        self.assertEqual(r.trades, [])
        self.assertAlmostEqual(r.curve[-1][1], 10_000)

    def test_entry_fills_at_next_open_with_slippage(self):
        closes = [100 + 0.5 * n for n in range(320)]
        bars = dated(closes, gap=0.01)  # opens differ from prior closes, so the two fill rules are distinguishable
        r = run_backtest(bars, self.strat, slippage_bps=10)
        t = r.trades[0]
        sig_idx = self.warm  # first bar with an indicator: close >> sma in a steady uptrend
        self.assertEqual(t.entry_day, bars[sig_idx + 1].day)
        self.assertAlmostEqual(t.entry_price, bars[sig_idx + 1].open * 1.001)
        self.assertNotAlmostEqual(t.entry_price, bars[sig_idx].close * 1.001)

    def test_gap_down_through_stop_fills_at_open_not_stop(self):
        bars = dated([100 + 0.5 * n for n in range(260)])
        last = bars[-1]
        gap_open = last.close * 0.7  # -30% overnight gap, far below any stop
        crash_day = len(bars)
        bars.append(Bar("2030-01-01", gap_open, gap_open + 1, gap_open - 1, gap_open, 1e6))
        bars += [Bar(f"2030-02-{d:02d}", gap_open, gap_open + 1, gap_open - 1, gap_open, 1e6) for d in range(1, 6)]
        stop_level = last.close - 3 * atr(bars, 14)[crash_day - 1]
        r = run_backtest(bars, self.strat, slippage_bps=0)
        t = r.trades[0]
        self.assertEqual(t.reason, "stop")
        self.assertEqual(t.exit_day, "2030-01-01")
        self.assertAlmostEqual(t.exit_price, gap_open)  # the open, NOT the (much higher) stop price
        self.assertLess(t.exit_price, stop_level * 0.9)

    def test_ordinary_stop_fills_at_stop_price(self):
        closes = [100 + 0.5 * n for n in range(260)]
        bars = dated(closes)
        i = len(bars) - 1
        stop_floor = bars[i].close - 3 * atr(bars, 14)[i]
        # next day opens flat, trades down through the stop intraday, closes above the trend line
        o = bars[i].close
        bars.append(Bar("2030-01-01", o, o + 1, stop_floor - 1, o - 1, 1e6))
        r = run_backtest(bars, self.strat, slippage_bps=0)
        t = r.trades[0]
        self.assertEqual(t.reason, "stop")
        self.assertGreaterEqual(t.exit_price, stop_floor - 1e-9)
        self.assertLessEqual(t.exit_price, o)

    def test_signal_exit_when_trend_breaks(self):
        closes = [100 + 0.5 * n for n in range(260)] + [230 - 4 * n for n in range(40)]
        r = run_backtest(dated(closes), self.strat)
        self.assertIn(r.trades[0].reason, ("signal", "stop"))
        self.assertIsNotNone(r.trades[0].exit_price)

    def test_kill_switch_stops_trading(self):
        closes = [100 + 0.5 * n for n in range(260)] + [230 * 0.97 ** n for n in range(60)] + [150 + 2 * n for n in range(200)]
        r = run_backtest(dated(closes), self.strat, RiskLimits(risk_per_trade=0.02, max_position_pct=1.0, max_drawdown_halt=0.001))
        self.assertIsNotNone(r.halted_on)
        # after the halt day there must be no new entries
        self.assertTrue(all(t.entry_day <= r.halted_on for t in r.trades))

    def test_synthetic_run_reports_sane_numbers(self):
        r = run_backtest(synthetic(), symbol="FAKE")
        self.assertGreater(len(r.trades), 0)
        self.assertLessEqual(r.metrics["max_drawdown"], 0)
        self.assertTrue(0 <= r.metrics["exposure"] <= 1)
        for _, eq in r.curve:
            self.assertGreater(eq, 0)

    def test_too_little_data_is_an_error(self):
        with self.assertRaises(ValueError):
            run_backtest(dated([100.0] * 50))


class Reports(unittest.TestCase):
    def test_short_history_gets_a_warning_and_long_history_does_not(self):
        short = format_report(run_backtest(synthetic(500, seed=2)))
        long_ = format_report(run_backtest(synthetic(2500, seed=2)))
        self.assertIn("too short", short)
        self.assertNotIn("too short", long_)

    def test_trade_list_has_one_row_per_trade(self):
        r = run_backtest(synthetic(1500, seed=4))
        lines = format_trades(r).splitlines()
        self.assertEqual(len(lines) - 1, len(r.trades))  # minus the header
        self.assertEqual(format_trades(run_backtest(dated([100.0] * 300))), "No trades.")


class RiskInputChecks(unittest.TestCase):
    def test_percent_typed_as_whole_number_is_rejected(self):
        for kwargs in ({"risk_per_trade": 2}, {"max_position_pct": 90}, {"max_drawdown_halt": 25}, {"risk_per_trade": 0}):
            with self.assertRaises(ValueError, msg=str(kwargs)):
                RiskLimits(**kwargs)
        RiskLimits(risk_per_trade=0.02, max_position_pct=0.9, max_drawdown_halt=0.25)  # sane values still fine


class CommandLine(unittest.TestCase):
    def run_cli(self, *argv):
        import contextlib
        import io
        from trading_bot.__main__ import main
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_bad_risk_value_gives_friendly_error(self):
        code, _, err = self.run_cli("backtest", "whatever.csv", "--risk", "2")
        self.assertEqual(code, 1)
        self.assertIn("write 0.02 for 2%", err)

    def test_missing_file_gives_friendly_error(self):
        code, _, err = self.run_cli("backtest", "/nope/missing.csv")
        self.assertEqual(code, 1)
        self.assertTrue(err.startswith("Error:"))

    def test_backtest_on_a_csv_with_trade_list(self):
        from trading_bot.data import save_csv
        path = Path(tempfile.mkdtemp()) / "FAKE.csv"
        save_csv(synthetic(1500, seed=5), path)
        code, out, _ = self.run_cli("backtest", str(path), "--trades", "--capital", "5000")
        self.assertEqual(code, 0)
        self.assertIn("BUY&HOLD", out)
        self.assertIn("Bought", out)

    def test_demo_runs_and_is_labelled_fake(self):
        code, out, _ = self.run_cli("demo")
        self.assertEqual(code, 0)
        self.assertIn("FAKE DATA", out)


class CsvLoading(unittest.TestCase):
    def write(self, rows):
        d = tempfile.mkdtemp()
        p = Path(d) / "x.csv"
        with open(p, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume"])
            w.writerows(rows)
        return p

    def test_adj_close_scales_ohlc_and_null_rows_skipped(self):
        p = self.write([
            ["2020-01-03", "20", "22", "18", "20", "10", "100"],
            ["2020-01-02", "10", "11", "9", "10", "5", "100"],
            ["2020-01-06", "null", "null", "null", "null", "null", "null"],
        ])
        bars = load_csv(p)
        self.assertEqual([b.day for b in bars], ["2020-01-02", "2020-01-03"])  # sorted, null row dropped
        self.assertAlmostEqual(bars[1].close, 10.0)
        self.assertAlmostEqual(bars[1].high, 11.0)

    def test_duplicate_dates_rejected(self):
        p = self.write([["2020-01-02", "1", "2", "1", "1", "1", "1"], ["2020-01-02", "1", "2", "1", "1", "1", "1"]])
        with self.assertRaises(ValueError):
            load_csv(p)


if __name__ == "__main__":
    unittest.main()
