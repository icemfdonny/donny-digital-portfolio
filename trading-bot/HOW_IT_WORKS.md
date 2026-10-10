# How the bot works - in plain English

You don't need to know Python. Think of the bot as a **tiny company with seven employees**, each
with one job. The code is just their instructions, written down very precisely.

## The idea in one paragraph

Markets go through long up-trends and long crashes. The bot watches **one fund** (for example `SPY`, which
holds the 500 biggest US companies). If the fund's price is healthy compared with its recent average, the bot
owns it. If the price drops clearly below that average, the bot sells and waits in cash. It also never bets
too much, always has an emergency exit price, and shuts itself down if the account drops too far.
It is **not** trying to predict anything clever. It follows a boring rule and refuses to take big risks.

## One example, step by step

Say the account has **$10,000** and `SPY` closed today at **$520**.

1. **The 200-day average** of SPY's price is $500. The rule says: *buy only if the price is at least 1% above
   the average*, i.e. above $505. $520 is, so the bot decides **BUY**.
2. **How much?** SPY typically moves about $6 a day (the code calls this the "ATR"). The bot places its emergency
   exit ("stop-loss") 3 days' worth of movement below the price: 3 x $6 = $18, so at **$502**. It then asks: *how many
   shares can I buy so that, if I get stopped out at $502, I lose only about 2% of the account ($200)?*
   $200 / $18 per share = **11 shares** (about $5,720 - never more than 90% of the account).
3. **Tomorrow morning** the order fills at the opening price. (The bot decides at the close and trades at the next
   open - exactly how the test replays history, so the test isn't cheating.)
4. **Each evening after that** the bot re-checks. The stop-loss only ever moves **up** as the price rises
   (so profits get locked in) and never down.
5. **The exit.** If the price falls to $495 or lower (1% below the average) the bot sells everything.
   If the price crashes through the stop first, the stop sells automatically.
6. **The emergency brake.** If the whole account is ever 25% below its highest-ever value, the bot sells
   everything and **refuses to trade until you personally re-arm it** with `reset-halt`.

The same rules are used for the history test (backtest) and for the daily paper-trading run, so what you test
is what runs.

## The seven employees (the files)

All code lives in the `trading_bot` folder.

| File | Job, as a person | What it really does |
|---|---|---|
| `data.py` | **The librarian** | Reads price history (a spreadsheet-like CSV file, or downloads it from Yahoo). Fixes dividends/splits, throws away broken rows, refuses duplicate dates. Can also invent *fake* prices for testing. |
| `strategy.py` | **The analyst** | Calculates the 200-day average and the typical daily movement, then answers one question: *buy, sell, or do nothing?* It only ever looks at today and the past - never the future. |
| `risk.py` | **The safety officer** | Decides **how many shares** (so a loss stays around 2%) and runs the **emergency brake** (the 25% rule). Also rejects silly settings: typing `--risk 2` is refused, because the bot would read it as 200%. |
| `backtest.py` | **The time machine** | Replays years of old prices day by day as if the bot had been running, including trading costs and stop-losses, and compares the result with simply buying and holding. |
| `alpaca.py` | **The phone line to the broker** | Talks to Alpaca (a broker) - **fake-money "paper" account only**. Reads prices and your balance, places orders. Retries a dropped phone call when *reading*, but never when *ordering* (so it can't accidentally buy twice). |
| `paper.py` | **The daily manager** | Once per evening: checks the account, checks the emergency brake, asks the analyst, then places **at most one order** and keeps the stop-loss up to date. Writes every decision and its reason to a log. |
| `__main__.py` | **The control panel** | The buttons you press: `demo`, `fetch`, `backtest`, `paper`, `reset-halt`. Turns mistakes into a clear message instead of scary error text. |

The `tests` folder holds 80 automatic checks - like a safety inspector who tries to break the bot every time the
code changes. For example: *"does a crash overnight sell at the gapped-down price, not the nicer stop price?"*, *"can
it ever buy twice?"*, *"does it refuse to trade while the market is open?"*

## Reading Python, just enough to follow along

Here is a real piece of the analyst's code:

```python
if not in_position and close > avg * (1 + self.p.band):
    return ENTER
```

Word by word:

- `if ... :` - "only do the next line when this is true"
- `not in_position` - "we don't own any yet"
- `and` - "...and also"
- `close > avg * (1 + self.p.band)` - "today's closing price is above the average plus 1%" (`band` is 0.01)
- `return ENTER` - "answer: BUY"

So the whole line says: *"If we own nothing and the price is more than 1% above its average, say BUY."* That's
really all there is to it. A few other words you'll see:

- `def name(...)` - "here is a named instruction" (a recipe)
- `for x in list` - "repeat for each item" (for each day of history)
- `class` - "a blueprint for a thing" (like the blueprint for 'the strategy')
- `#` - a note to humans; the computer ignores the rest of the line
- Lines like `risk_per_trade: float = 0.02` are just **settings with default values** - the only place you'd ever
  change a number.

## Words you'll see in the reports

- **Backtest** - replaying the past to see what the rules would have done. Useful, but the past can't promise the future.
- **Paper trading** - trading with pretend money at real prices.
- **Stop-loss** - a pre-set price at which the broker sells for you, to cap a loss.
- **Drawdown** - the worst drop from a high point to a later low (-30% means you were at one point 30% below your best).
- **Slippage** - the small price you lose on every trade because you can't buy exactly at the quoted price.
- **Sharpe** - return per unit of bumpiness; higher means a smoother ride.
- **Buy-and-hold** - the comparison to beat: buy the fund once and never touch it.
- **Kill switch** - the emergency brake described above.

## What it can *not* do

- **It does not beat simply holding the fund.** Tested on 33 years of SPY and six other markets, the bot earned less than
  buy-and-hold (SPY: 3.8% a year vs 10.9%), mostly because it only kept about a third of the account invested. Better
  rules (see `research.py`) cut crashes roughly in half but still earned a bit less than holding. The `research`
  command is how any idea should be judged: fixed rules, many markets, a bar set in advance.

- It can't see the future, and it will **lose money in some stretches**. It will often earn less than buy-and-hold in
  strong bull markets - the trade-off is meant to be smaller crashes.
- It has been tested on code correctness, **not** proven profitable. Your own real-history backtest and a few months of
  paper trading are the real evidence.
- It does not go live with real money. That would need a deliberate code change and a human decision.
