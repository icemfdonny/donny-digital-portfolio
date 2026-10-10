# Trading bot (paper-trading first)

A small, transparent trend-following bot, plus the tools to test it honestly before any
money is involved. Python 3.10+, **no third-party packages**.

New to code? Read **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** first - it explains everything in plain English.

## Read this first: what to expect

- **It cannot promise profit, and neither can anyone else.** Most people who run trading
  bots lose money, and a bot that looks great on past data often fails on new data.
- The honest benchmark is *buying one broad index fund and doing nothing*. Beating that is
  hard even for professionals. This bot's rule is built to **limit big drawdowns**, not to
  beat the market: expect it to **lag buy-and-hold in strong bull markets** and to lose
  less in crashes. The backtest report prints this year by year so you can see it.
- **Tested on real history, this bot (as built) earned LESS than buy-and-hold, and none of the simple rules compared
  against holding passed a pre-declared bar on seven markets.** See "What the research found" below. It is a
  learning and research tool, not a proven way to make money.
- **Live (real-money) trading is intentionally not wired up.** `alpaca.py` can only talk to
  Alpaca's *paper* (fake-money) server.

## The strategy (all of it)

1. Look at the daily close of one ETF/stock (e.g. `SPY`).
2. **Buy** when the close is 1% above its 200-day average. **Sell** when it is 1% below.
3. Size each buy so that hitting the protective stop loses about **2% of the account**
   (stop = 3 x average daily range below price, trailing upward only), never more than 90% in one position.
4. **Kill switch:** if the account falls 25% from its peak, sell everything and stop until
   *you* run `reset-halt`.

Signals are made at the close and filled at the next open. The backtester charges slippage
(5 bps per fill by default), uses whole shares, no leverage, no shorting. There is
deliberately **no parameter optimizer**: tuning numbers to fit the past is how beginners fool themselves.

## Try it (2 minutes, no account needed)

```bash
cd trading-bot
python3 -m unittest discover -s tests -t .   # 80 tests
python3 -m trading_bot demo                  # runs on FAKE data - proves the code runs, nothing more
```

## Test on real history

```bash
python3 -m trading_bot fetch SPY --years 15     # saves data/SPY.csv (Yahoo, unofficial API)
python3 -m trading_bot backtest data/SPY.csv            # add --trades to list every trade
```

If `fetch` fails, download a CSV by hand from Yahoo Finance -> Historical Data and pass its path to `backtest`.
Try several symbols and several periods; if it only works on one, that's a warning, not a win.
(Include 2008-09 and 2022 if you can.)

## What the research found

`python3 -m trading_bot research data/SPY.csv data/QQQ.csv ...` compares a FIXED list of rules (hold, 200-day filter,
200-day with a 1% band, monthly 10-month filter, 50/100/200 ensemble) plus the original bot on every market you give it,
on the whole history and on each half. The rules cannot be tuned from the command line, on purpose.

Pre-declared pass bar: a rule is only worth running if it earns at least as much as holding AND has a shallower worst
drop in at least two-thirds of all market/period cells, with a non-negative average return vs holding.

Result on SPY, QQQ, IWM, EFA, EEM, TLT, GLD (history of 21-33 years each, dividend-adjusted, 5 bps cost, cash earning 0%):

| Rule | Cells won (needed 14 of 21) | Average vs holding, per year |
|---|---|---|
| monthly 10-month filter (best) | 6 / 21 | -1.5 points |
| 200-day filter | 3 / 21 | -2.4 points |
| original bot | 2 / 21 | -5.6 points |

**Nothing passed.** Trend rules did roughly halve the worst drop (SPY -55% -> -27%) but cost about 1 to 1.5 points a year
(SPY: 9.7% vs 10.9%), and on 6 of 7 markets they earned less than just holding. Why the original bot lagged: risk-based
position sizing kept only about a third of the account invested on average; the stop-loss churn was a minor cost.

Caveats: cash earned 0% (use `--cash-rate 0.03` to see the effect; it narrows gaps by roughly half a point, not to zero),
no taxes, only daily/monthly long-only rules on seven liquid ETFs. The scoreboard cells overlap and markets move
together, so "X of 21" is weaker evidence than it looks. Independent audits (a from-scratch reimplementation and
adversarial review) found no look-ahead and matched the numbers to floating-point precision.

## Paper trade (fake money, real market data)

1. Make a free account at <https://alpaca.markets>, switch to the **Paper** environment,
   and generate API keys.
2. Create `trading-bot/.env` (it is git-ignored - never commit keys, never paste them in chat):
   ```
   ALPACA_KEY_ID=your-paper-key
   ALPACA_SECRET_KEY=your-paper-secret
   ```
3. Look before you leap: `python3 -m trading_bot paper SPY --dry-run`
4. Run for real (paper): `python3 -m trading_bot paper SPY` - **once per trading day, in the evening
   after the market closes** (e.g. 6pm US Eastern). It refuses to place orders while the market is open,
   because the strategy assumes decisions are made on completed daily bars. Use the same `--risk` etc.
   you used in the backtest. Every decision and its reason is appended to `logs/decisions.csv`.
   To automate it on a Mac/Linux machine that is on at that time, `crontab -e` and add (adjust paths and time zone):
   ```
   0 18 * * 1-5  cd /path/to/trading-bot && python3 -m trading_bot paper SPY >> logs/cron.log 2>&1
   ```

What a run can do: `BUY` (fills at next open) / `SET_STOP` (places or raises a broker-side
stop-loss) / `SELL` / `HOLD` / `STAY_FLAT` / `WAIT` / `HALT_SELL` / `HALTED`. A new position
gets its protective stop on the *next* day's run, because a stop can only be placed on shares you own.

Limits: one symbol per Alpaca account; whole shares only; daily bars only; free IEX data feed.
A freshly bought position has no stop-loss until the next evening's run (a stop can only be placed on shares you own).

Good to know:
- `state.json` remembers your peak balance and whether the kill switch tripped. Keep it with the bot and run the bot from
  one computer. If it ever becomes unreadable the bot refuses to trade rather than guess; `reset-halt` repairs it.
- If you reset or withdraw from your Alpaca paper account, the balance drops and the kill switch will trip. That is
  expected: run `reset-halt` afterwards.
- Reads from Alpaca are retried on temporary errors. Orders are never retried (a retry after a lost reply could buy twice);
  if a run crashes mid-order, the next run sees the open order or position and carries on safely.

## What has and hasn't been verified

- Verified by automated tests: indicator math, no look-ahead, next-open fills, gap-through-stop
  fills, position sizing, kill switch (backtest *and* live runner), no duplicate orders,
  dry-run places nothing, refusal to trade while the market is open, corrupt-state handling,
  rejection of mistyped percentages (`--risk 2`), and the exact order payloads sent to Alpaca.
  Each safety test was also checked by deliberately breaking the code and confirming the test fails.
- **Not verified against the real services:** the Yahoo download and the live Alpaca paper API
  were not reachable from the environment this was built in, so those calls are tested
  only against fakes. Your first `--dry-run` is the real integration test; read its output
  and the Alpaca paper dashboard before trusting it.

## Before you ever consider real money

- Paper trade for at least 3 months, and compare the results to just holding the index.
- You can explain every line of the strategy above and every row in `logs/decisions.csv`.
- It would be money you can afford to lose entirely, and you understand the tax implications where you live.
- Moving to live trading means a deliberate code change plus a human decision - not a flag.
