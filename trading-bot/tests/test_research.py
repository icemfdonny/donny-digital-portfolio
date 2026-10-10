import contextlib
import io
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

from trading_bot.__main__ import main
from trading_bot.data import Bar, save_csv, synthetic
from trading_bot.research import (BOT, RULES, WARMUP, evaluate, scoreboard, simulate,
                                  w_ensemble, w_hold, w_monthly_sma, w_sma_filter)


def bars_from_opens(opens, start="2020-01-01"):
    d = date.fromisoformat(start)
    return [Bar((d + timedelta(days=i)).isoformat(), o, o * 1.001, o * 0.999, o, 1e6) for i, o in enumerate(opens)]


class Simulation(unittest.TestCase):
    def test_hold_earns_open_to_open_return_minus_one_entry_cost(self):
        opens = [100 * 1.001 ** i for i in range(120)]
        bars = bars_from_opens(opens)
        run = simulate(bars, w_hold(bars), start=10, end=119, cost_bps=5)
        expected = (opens[119] / opens[11]) * (1 - 0.0005)
        self.assertAlmostEqual(run.curve[-1][1], expected, places=9)
        self.assertAlmostEqual(run.exposure, 1.0)

    def test_signal_is_traded_at_next_open_so_the_jump_into_it_is_not_captured(self):
        # decision to go long is made at the close of bar 49. Price jumps between open 49 and open 50:
        # a position that only starts at open 50 must NOT earn that jump.
        opens = [100.0] * 50 + [110.0] * 50
        bars = bars_from_opens(opens)
        w = [0.0] * 49 + [1.0] * 51
        run = simulate(bars, w, start=10, end=99, cost_bps=0)
        self.assertAlmostEqual(run.curve[-1][1], 1.0, places=9)

    def test_jump_after_entry_is_captured(self):
        opens = [100.0] * 51 + [110.0] * 49  # jump between open 50 and open 51, after the open-50 entry
        bars = bars_from_opens(opens)
        w = [0.0] * 49 + [1.0] * 51
        run = simulate(bars, w, start=10, end=99, cost_bps=0)
        self.assertAlmostEqual(run.curve[-1][1], 1.10, places=9)

    def test_costs_are_charged_on_every_weight_change(self):
        bars = bars_from_opens([100.0] * 80)
        w = [float(i % 2) for i in range(80)]  # flips every day
        run = simulate(bars, w, start=10, end=79, cost_bps=10)
        prev, switches = 0.0, 0
        for k in range(11, 79):
            switches += abs(w[k - 1] - prev) > 0
            prev = w[k - 1]
        self.assertAlmostEqual(run.curve[-1][1], (1 - 0.001) ** switches, places=9)
        self.assertGreater(switches, 30)

    def test_cash_earns_interest_when_not_invested(self):
        bars = bars_from_opens([100.0] * 300)
        run = simulate(bars, [0.0] * 300, start=10, end=299, cost_bps=0, cash_rate=0.05)
        periods = 299 - 10 - 1
        self.assertAlmostEqual(run.curve[-1][1], 1.05 ** (periods / 252), places=9)

    def test_bad_windows_are_rejected(self):
        bars = bars_from_opens([100.0] * 60)
        for start, end in ((10, 20), (0, 60), (-1, 40)):
            with self.assertRaises(ValueError):
                simulate(bars, w_hold(bars), start, end)


class NoLookahead(unittest.TestCase):
    def setUp(self):
        self.bars = synthetic(1500, seed=21)

    def test_daily_and_ensemble_rules_ignore_the_future(self):
        for rule in (lambda b: w_sma_filter(b, 200, 0.0), lambda b: w_sma_filter(b, 200, 0.01), w_ensemble):
            full = rule(self.bars)
            for cut in (400, 777, 1200):
                self.assertEqual(rule(self.bars[:cut])[:cut], full[:cut])

    def test_monthly_rule_ignores_future_prices(self):
        full = w_monthly_sma(self.bars)
        m = next(i for i in range(800, 1400) if self.bars[i + 1].day[:7] != self.bars[i].day[:7])
        self.assertEqual(w_monthly_sma(self.bars[:m + 1])[:m + 1], full[:m + 1])
        # and changing every price AFTER the cut cannot change earlier weights
        future = [Bar(b.day, b.open * 5, b.high * 5, b.low * 5, b.close * 5, b.volume) for b in self.bars[m + 1:]]
        self.assertEqual(w_monthly_sma(self.bars[:m + 1] + future)[:m + 1], full[:m + 1])

    def test_monthly_rule_only_changes_on_the_last_day_of_a_month(self):
        w = w_monthly_sma(self.bars)
        for i in range(1, len(w)):
            if w[i] != w[i - 1]:
                nxt = self.bars[i + 1].day[:7] if i + 1 < len(self.bars) else None
                self.assertNotEqual(nxt, self.bars[i].day[:7])


class Harness(unittest.TestCase):
    def setUp(self):
        self.a = synthetic(2600, seed=1)
        self.b = synthetic(2600, seed=2)

    def test_every_candidate_is_reported_on_every_market(self):
        res = evaluate("A", self.a)
        self.assertEqual(list(res["rows"]), list(RULES) + [BOT])
        for row in res["rows"].values():
            for period in ("full", "h1", "h2"):
                self.assertEqual(set(row[period]), {"cagr", "max_drawdown", "sharpe", "total_return"})
        self.assertGreater(res["years"], 5)

    def test_hold_row_is_the_benchmark_with_full_exposure(self):
        row = evaluate("A", self.a)["rows"]["hold"]
        self.assertAlmostEqual(row["exposure"], 1.0)
        self.assertLessEqual(row["full"]["max_drawdown"], 0)

    def test_eval_window_can_be_restricted(self):
        res = evaluate("A", self.a, eval_from="2014-01-01", eval_to="2018-12-31")
        self.assertGreaterEqual(res["first"], "2014-01-01")
        self.assertLessEqual(res["last"], "2018-12-31")

    def test_too_little_history_is_an_error(self):
        with self.assertRaises(ValueError):
            evaluate("A", synthetic(150))

    def test_scoreboard_lists_every_rule_with_counts(self):
        text = scoreboard([evaluate("A", self.a), evaluate("B", self.b)])
        for name in list(RULES)[1:] + [BOT]:
            self.assertIn(name, text)
        self.assertIn("/6", text)  # 2 markets x (whole window + 2 halves)

    def test_warmup_is_enough_for_the_slowest_rule(self):
        self.assertGreaterEqual(WARMUP, 210)


class Cli(unittest.TestCase):
    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(list(argv))
        return code, out.getvalue(), err.getvalue()

    def test_research_command_prints_tables_and_scoreboard(self):
        d = Path(tempfile.mkdtemp())
        save_csv(synthetic(2600, seed=3), d / "AAA.csv")
        save_csv(synthetic(2600, seed=4), d / "BBB.csv")
        code, out, err = self.run_cli("research", str(d / "AAA.csv"), str(d / "BBB.csv"), "--cash-rate", "0.02")
        self.assertEqual((code, err), (0, ""))
        for needle in ("=== AAA", "=== BBB", "monthly_sma210", "SCOREBOARD", "cash earns 2%"):
            self.assertIn(needle, out)

    def test_cash_rate_typed_as_percent_is_rejected(self):
        code, _, err = self.run_cli("research", "x.csv", "--cash-rate", "2")
        self.assertEqual(code, 1)
        self.assertIn("0.02 for 2%", err)


if __name__ == "__main__":
    unittest.main()
