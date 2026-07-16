// Computed setup evidence for the AI chart reviewer: the GTT trigger level
// and setup-character metrics the v5 prompt references. Shared by the
// production review service (fallback from visibleOhlc) and the eval
// pipeline so both always send identical fields.
//
// Metrics were validated against the trader's labeled golden set
// (src/evals/analyze-features.js): directional efficiency separates their
// VALID picks from INVALID rejects strongly, pole run-up moderately.

const round = (value, decimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// bars: [{ date, open, high, low, close, volume }], oldest first.
function computeProposedTrigger(bars) {
  if (!Array.isArray(bars) || bars.length < 2) return null;
  const lastTwo = bars.slice(-2);
  const close = bars[bars.length - 1].close;
  const triggerHigh = Math.max(...lastTwo.map((bar) => bar.high));
  return {
    price: round(triggerHigh),
    rule: 'GTT stop-buy fires one tick above the max high of the last two completed daily candles (mother candle trigger).',
    sourceDates: lastTwo.map((bar) => (typeof bar.date === 'string' ? bar.date.substring(0, 10) : bar.date?.toISOString?.().substring(0, 10) ?? null)),
    distanceFromClosePct: close ? round(((triggerHigh - close) / close) * 100) : null
  };
}

function computeSetupCharacter(bars) {
  if (!Array.isArray(bars) || bars.length < 60) return null;

  const last60 = bars.slice(-60);
  let sumAbsMoves = 0;
  for (let i = 1; i < last60.length; i++) sumAbsMoves += Math.abs(last60[i].close - last60[i - 1].close);
  const dirEff60 = sumAbsMoves
    ? Math.abs(last60[last60.length - 1].close - last60[0].close) / sumAbsMoves
    : null;

  const last15 = bars.slice(-15);
  const swingHigh15 = Math.max(...last15.map((bar) => bar.high));
  const prior45 = bars.slice(-60, -15);
  const priorLow45 = prior45.length ? Math.min(...prior45.map((bar) => bar.low)) : null;
  const poleRunupPct = priorLow45 ? ((swingHigh15 - priorLow45) / priorLow45) * 100 : null;

  return {
    directionalEfficiency60d: round(dirEff60, 3),
    poleRunupPct: round(poleRunupPct, 1),
    interpretation: "directionalEfficiency60d: net price move divided by the sum of daily moves over 60 bars. Calibrated on this trader's own history: above ~0.25 trades like their clean movers, below ~0.12 like the choppy charts they reject. poleRunupPct: advance into the recent swing high; their taken setups average ~70%, their rejects ~49%."
  };
}

module.exports = { computeProposedTrigger, computeSetupCharacter };
