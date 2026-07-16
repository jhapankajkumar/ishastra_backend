# Golden-Set Eval for the AI Chart Reviewer

Measures the AI setup reviewer against 10 real closed trades with known outcomes,
so prompt changes can be compared with numbers instead of vibes.

## Why this exists

The reviewer currently has a ~0% PASS rate — it rejects everything, including
hand-picked setups that went on to gain 18-30%. A classifier that always says
REJECT carries zero information. Before touching the prompt, this eval captures
a baseline; after every prompt change, re-run it and compare.

## One-time setup (manual, ~30-45 min)

For each row in `golden/manifest.json`:

1. Open the symbol in TradingView, daily timeframe, your usual layout.
2. Enter **Bar Replay** and rewind so the LAST VISIBLE BAR is `analysisDate`.
   `analysisDate` = the last completed candle on the screenshot; the metadata
   builder includes data up to and including that bar, nothing after.
   (The AI must only see what was knowable at decision time — no lookahead.)
3. Screenshot the chart and save it as `golden/images/<imageFile>`
   (exact filename from the manifest, e.g. `ARCB_2026-05-26.png`).
4. **Before running the eval**, fill in `processLabel` for that row:
   was this a valid setup *by your rules*, ignoring how the trade ended?
   - `VALID` — textbook setup, you'd take it again
   - `MARGINAL` — acceptable but not clean
   - `INVALID` — you broke your own rules taking this

   Labeling before seeing AI verdicts (and independent of outcome) avoids
   outcome bias — a winner can be a bad setup that got lucky, and vice versa.

`outcomePct` is the realized gain/loss percent, (exit − entry) / entry × 100,
taken from the trade journal.

## Run

```bash
cd ishastra_backend
node src/evals/run-golden-eval.js            # full run (~$0.20)
node src/evals/run-golden-eval.js --only ARCB  # single chart while iterating
```

Missing images are skipped with a warning, so you can start with a partial set.

## Reading the results

- `results/baseline-<timestamp>.json` — full verdicts, blockers, tokens, cost.
- The console summary shows **PASS rate on winners vs losers** — the single
  number that matters. A useful reviewer passes winners and rejects losers;
  the broken baseline passes neither.

## Growing the dataset (INVALID charts)

The AI's production job is filtering ~150 scanner BUYs down to the ~15 worth
taking — which means its core skill is saying NO. The eval needs charts where
NO is the right answer, and the only negatives that matter are **scanner BUYs
you would reject on manual review** (not random junk — the scanner never
forwards random junk).

Harvest them from your daily workflow: when you skip a chart during scan
review, screenshot it, add a manifest entry with `processLabel: "INVALID"`,
a one-line reason in `notes`, and `outcomePct: null` (no trade needed — the
label is the ground truth). A few per week accumulates a real test set fast.

The primary summary metric is PROCESS AGREEMENT: PASS rate on VALID charts
(want high) vs PASS rate on INVALID charts (want zero — false approvals).

## Rules of the game

- Never edit the manifest labels after seeing AI verdicts.
- One prompt change at a time between runs, or you can't attribute the effect.
- Keep every results file — they are the history of what each change did.
