import json
import os
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

from trading_bot.alpaca import AlpacaError, AlpacaPaper, PAPER_BASE, load_env_file
from trading_bot.data import Bar
from trading_bot.paper import reset_halt, run_once
from trading_bot.risk import RiskLimits


def uptrend(n=300):
    d, out, prev = date(2023, 1, 2), [], 100.0
    for k in range(n):
        c = 100 + 0.5 * k
        out.append(Bar((d + timedelta(days=k)).isoformat(), prev, c + 0.5, prev - 0.5, c, 1e6))
        prev = c
    return out


def downtrend_after_uptrend():
    bars = uptrend(260)
    prev, d = bars[-1].close, date.fromisoformat(bars[-1].day)
    for k in range(1, 41):
        c = prev - 4
        bars.append(Bar((d + timedelta(days=k)).isoformat(), prev, prev + 0.5, c - 0.5, c, 1e6))
        prev = c
    return bars


class FakeClient:
    """Duck-typed stand-in for AlpacaPaper that records every order."""

    def __init__(self, bars, equity=10_000.0, qty=0, orders=None, is_open=False):
        self.bars, self.equity, self.qty, self.orders = bars, equity, qty, list(orders or [])
        self.is_open, self.calls = is_open, []

    def account(self): return {"equity": str(self.equity), "trading_blocked": False}
    def clock(self): return {"is_open": self.is_open, "timestamp": self.bars[-1].day + "T16:00:00-05:00"}
    def daily_bars(self, symbol, lookback_days=520): return self.bars
    def position_qty(self, symbol): return self.qty
    def open_orders(self, symbol): return list(self.orders)
    def cancel_order(self, oid):
        self.calls.append(("cancel", oid)); self.orders = [o for o in self.orders if o["id"] != oid]
    def market_order(self, symbol, side, qty): self.calls.append(("market", side, qty)); return {"id": "m1"}
    def stop_order(self, symbol, qty, price): self.calls.append(("stop", qty, round(price, 2))); return {"id": "s1"}


class Runner(unittest.TestCase):
    def setUp(self):
        d = Path(tempfile.mkdtemp())
        self.state, self.log = d / "state.json", d / "logs" / "decisions.csv"

    def run_it(self, client, **kw):
        return run_once("SPY", client, limits=RiskLimits(), state_path=self.state, log_path=self.log,
                        say=lambda s: None, sleep=lambda s: None, **kw)

    def test_buys_when_flat_and_trending(self):
        c = FakeClient(uptrend())
        self.assertEqual(self.run_it(c), "BUY")
        self.assertEqual(len(c.calls), 1)
        kind, side, qty = c.calls[0]
        self.assertEqual((kind, side), ("market", "buy"))
        self.assertGreater(qty, 0)
        # never more than 90% of the account, never more than the 2% risk budget
        self.assertLessEqual(qty * uptrend()[-1].close, 10_000 * 0.9)
        self.assertTrue(self.log.exists())

    def test_does_not_stack_a_second_buy(self):
        c = FakeClient(uptrend(), orders=[{"id": "o1", "side": "buy", "type": "market"}])
        self.assertEqual(self.run_it(c), "WAIT")
        self.assertEqual(c.calls, [])

    def test_sets_protective_stop_when_holding(self):
        c = FakeClient(uptrend(), qty=10)
        self.assertEqual(self.run_it(c), "SET_STOP")
        self.assertEqual(c.calls[0][0], "stop")
        self.assertLess(c.calls[0][2], uptrend()[-1].close)  # stop is below price
        # second run with that stop in place: nothing to do
        c.orders = [{"id": "s1", "side": "sell", "type": "stop", "stop_price": str(c.calls[0][2])}]
        c.calls.clear()
        self.assertEqual(self.run_it(c), "HOLD")
        self.assertEqual(c.calls, [])

    def test_sells_after_cancelling_stop_when_trend_breaks(self):
        stop = {"id": "s1", "side": "sell", "type": "stop", "stop_price": "200"}
        c = FakeClient(downtrend_after_uptrend(), qty=10, orders=[stop])
        self.assertEqual(self.run_it(c), "SELL")
        self.assertEqual(c.calls, [("cancel", "s1"), ("market", "sell", 10)])  # cancel first, then sell

    def test_stays_flat_when_below_trend(self):
        c = FakeClient(downtrend_after_uptrend())
        self.assertEqual(self.run_it(c), "STAY_FLAT")
        self.assertEqual(c.calls, [])

    def test_kill_switch_sells_and_latches_until_reset(self):
        self.state.write_text(json.dumps({"peak_equity": 20_000.0, "halted": False, "stop": None}))
        c = FakeClient(uptrend(), equity=10_000.0, qty=7)  # 50% below peak
        self.assertEqual(self.run_it(c), "HALT_SELL")
        self.assertIn(("market", "sell", 7), c.calls)
        c2 = FakeClient(uptrend(), equity=30_000.0)  # even a recovered account stays halted
        self.assertEqual(self.run_it(c2), "HALTED")
        self.assertEqual(c2.calls, [])
        reset_halt(self.state)
        self.assertEqual(self.run_it(FakeClient(uptrend(), equity=30_000.0)), "BUY")

    def test_dry_run_places_nothing_and_writes_nothing(self):
        c = FakeClient(uptrend())
        self.assertEqual(self.run_it(c, dry_run=True), "BUY")
        self.assertEqual(c.calls, [])
        self.assertFalse(self.state.exists())
        self.assertFalse(self.log.exists())

    def test_ignores_forming_bar_while_market_open(self):
        bars = uptrend()
        c = FakeClient(bars, is_open=True)
        c.clock = lambda: {"is_open": True, "timestamp": bars[-1].day + "T11:00:00-05:00"}
        self.run_it(c, dry_run=True)  # must not raise; last (forming) bar is dropped
        self.assertEqual(len(bars), 300)  # source list untouched

    def test_real_run_refused_while_market_open(self):
        c = FakeClient(uptrend(), is_open=True)
        with self.assertRaises(RuntimeError) as ctx:
            self.run_it(c)
        self.assertIn("market is open", str(ctx.exception))
        self.assertEqual(c.calls, [])

    def test_waits_while_a_sell_is_unfilled_instead_of_selling_twice(self):
        c = FakeClient(downtrend_after_uptrend(), qty=10, orders=[{"id": "o9", "side": "sell", "type": "market"}])
        self.assertEqual(self.run_it(c), "WAIT")
        self.assertEqual(c.calls, [])

    def test_refuses_to_run_with_a_short_position(self):
        c = FakeClient(uptrend(), qty=-5)
        with self.assertRaises(RuntimeError):
            self.run_it(c)
        self.assertEqual(c.calls, [])

    def test_corrupt_state_file_blocks_trading_instead_of_unhalting(self):
        self.state.write_text('{"peak_equity": 20000, "hal')  # truncated mid-write
        c = FakeClient(uptrend())
        with self.assertRaises(RuntimeError) as ctx:
            self.run_it(c)
        self.assertIn("unreadable", str(ctx.exception))
        self.assertEqual(c.calls, [])
        reset_halt(self.state)  # the documented way out also repairs the file
        self.assertEqual(self.run_it(FakeClient(uptrend())), "BUY")

    def test_state_file_from_older_version_gets_defaults(self):
        self.state.write_text(json.dumps({"stop": 123.0}))
        self.assertEqual(self.run_it(FakeClient(uptrend())), "BUY")

    def test_state_is_saved_without_leftover_temp_file(self):
        self.run_it(FakeClient(uptrend()))
        self.assertTrue(self.state.exists())
        self.assertEqual([p.name for p in self.state.parent.glob("*.tmp")], [])

    def test_tiny_account_skips_instead_of_crashing(self):
        c = FakeClient(uptrend(), equity=50.0)
        self.assertEqual(self.run_it(c), "SKIP")
        self.assertEqual(c.calls, [])


class AlpacaHttp(unittest.TestCase):
    def make(self, responses):
        sent = []

        def http(method, url, headers, body):
            sent.append((method, url, headers, body))
            return responses.pop(0)
        return AlpacaPaper("KEY", "SECRET", http), sent

    def test_only_paper_host_is_ever_used(self):
        a, sent = self.make([(200, {"equity": "1"}), (200, {"is_open": False}), (200, {"id": "x"}), (200, {"id": "y"})])
        a.account(); a.clock(); a.market_order("SPY", "buy", 3); a.stop_order("SPY", 3, 412.349)
        for _, url, _, _ in sent:
            self.assertTrue(url.startswith(PAPER_BASE), url)

    def test_order_payloads(self):
        a, sent = self.make([(200, {"id": "x"}), (200, {"id": "y"})])
        a.market_order("SPY", "buy", 3); a.stop_order("SPY", 3, 412.349)
        self.assertEqual(sent[0][3], {"symbol": "SPY", "qty": "3", "side": "buy", "type": "market", "time_in_force": "day"})
        self.assertEqual(sent[1][3]["stop_price"], "412.35")
        self.assertEqual((sent[1][3]["type"], sent[1][3]["side"], sent[1][3]["time_in_force"]), ("stop", "sell", "gtc"))
        self.assertEqual(sent[0][2]["APCA-API-KEY-ID"], "KEY")

    def test_no_position_is_zero_and_errors_raise(self):
        a, sent = self.make([(404, {"message": "position does not exist"}), (400, {"message": "bad"})])
        self.assertEqual(a.position_qty("SPY"), 0)
        with self.assertRaises(AlpacaError):
            a.position_qty("SPY")

    def test_reads_retry_temporary_errors(self):
        a, sent = self.make([(503, None), (429, None), (200, {"equity": "5"})])
        slept = []
        a._sleep = slept.append
        self.assertEqual(a.account(), {"equity": "5"})
        self.assertEqual(len(sent), 3)
        self.assertEqual(slept, [1, 2])

    def test_reads_give_up_after_three_tries(self):
        a, sent = self.make([(500, {"message": "boom"})] * 3)
        a._sleep = lambda s: None
        with self.assertRaises(AlpacaError):
            a.account()
        self.assertEqual(len(sent), 3)

    def test_orders_are_never_retried(self):
        a, sent = self.make([(503, {"message": "try later"}), (200, {"id": "would-be-duplicate"})])
        with self.assertRaises(AlpacaError):
            a.market_order("SPY", "buy", 3)
        self.assertEqual(len(sent), 1)

    def test_network_error_on_read_is_retried(self):
        calls = []

        def http(method, url, headers, body):
            calls.append(url)
            if len(calls) < 2:
                raise ConnectionError("wifi dropped")
            return 200, {"is_open": False}
        a = AlpacaPaper("K", "S", http, sleep=lambda s: None)
        self.assertEqual(a.clock(), {"is_open": False})
        self.assertEqual(len(calls), 2)


    def test_bars_pagination(self):
        a, sent = self.make([
            (200, {"bars": [{"t": "2024-01-02T05:00:00Z", "o": 1, "h": 2, "l": 1, "c": 2, "v": 5}], "next_page_token": "abc"}),
            (200, {"bars": [{"t": "2024-01-03T05:00:00Z", "o": 2, "h": 3, "l": 2, "c": 3, "v": 5}], "next_page_token": None}),
        ])
        bars = a.daily_bars("SPY")
        self.assertEqual([b.day for b in bars], ["2024-01-02", "2024-01-03"])
        self.assertIn("page_token=abc", sent[1][1])


class EnvFile(unittest.TestCase):
    def test_reads_values_but_real_environment_wins(self):
        d = Path(tempfile.mkdtemp()) / ".env"
        d.write_text("# comment\nTB_TEST_A='one'\nTB_TEST_B=two\n\n")
        os.environ["TB_TEST_B"] = "from-real-env"
        os.environ.pop("TB_TEST_A", None)
        try:
            load_env_file(d)
            self.assertEqual(os.environ["TB_TEST_A"], "one")
            self.assertEqual(os.environ["TB_TEST_B"], "from-real-env")
        finally:
            os.environ.pop("TB_TEST_A", None); os.environ.pop("TB_TEST_B", None)


if __name__ == "__main__":
    unittest.main()
