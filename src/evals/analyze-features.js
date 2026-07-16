// Feature-separation check for the golden set: computes candidate
// setup-character metrics from as-of OHLC data and compares VALID vs
// INVALID distributions. Metrics that do not separate the classes here
// must not be wired into the review prompt.
//
// Usage: node src/evals/analyze-features.js   (Yahoo only, no OpenAI cost)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { buildMetadataAsOf } = require('./buildMetadata');

const round = (v, d = 3) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

function computeFeatures(bars) {
  const last60 = bars.slice(-60);
  const last20 = bars.slice(-20);
  const last15 = bars.slice(-15);

  // Directional efficiency: net move / sum of daily moves. 1 = straight line, ~0 = pure chop.
  let sumAbs = 0;
  for (let i = 1; i < last60.length; i++) sumAbs += Math.abs(last60[i].close - last60[i - 1].close);
  const dirEff60 = sumAbs ? Math.abs(last60[last60.length - 1].close - last60[0].close) / sumAbs : null;

  // Wick ratio: how much of each bar's range is wick rather than body. Higher = wickier.
  const wickRatios = last20
    .filter((b) => b.high > b.low)
    .map((b) => ((b.high - b.low) - Math.abs(b.close - b.open)) / (b.high - b.low));
  const wickRatio20 = wickRatios.length ? wickRatios.reduce((s, v) => s + v, 0) / wickRatios.length : null;

  // Bar overlap: how much consecutive daily ranges overlap. Higher = choppier, less directional.
  let overlapSum = 0, rangeSum = 0, pairs = 0;
  for (let i = 1; i < last20.length; i++) {
    const a = last20[i - 1], b = last20[i];
    const overlap = Math.max(0, Math.min(a.high, b.high) - Math.max(a.low, b.low));
    overlapSum += overlap;
    rangeSum += (b.high - b.low);
    pairs++;
  }
  const overlapRatio20 = pairs && rangeSum ? overlapSum / rangeSum : null;

  // Pullback depth: swing high of last 15 bars to the lowest low after it.
  let hiIdx = 0;
  for (let i = 1; i < last15.length; i++) if (last15[i].high > last15[hiIdx].high) hiIdx = i;
  const swingHigh = last15[hiIdx].high;
  const afterHigh = last15.slice(hiIdx);
  const pullbackLow = Math.min(...afterHigh.map((b) => b.low));
  const pullbackDepthPct = swingHigh ? ((swingHigh - pullbackLow) / swingHigh) * 100 : null;

  // Pole proxy: run-up into the swing high from the low of the prior 45 bars.
  const prior45 = bars.slice(-60, -15);
  const priorLow = prior45.length ? Math.min(...prior45.map((b) => b.low)) : null;
  const runupPct = priorLow ? ((swingHigh - priorLow) / priorLow) * 100 : null;

  return {
    dirEff60: round(dirEff60),
    wickRatio20: round(wickRatio20),
    overlapRatio20: round(overlapRatio20),
    pullbackDepthPct: round(pullbackDepthPct, 1),
    runupPct: round(runupPct, 1)
  };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'manifest.json'), 'utf8'));
  const rows = [];

  for (const chart of manifest.charts) {
    try {
      const { bars } = await buildMetadataAsOf(chart.symbol, chart.analysisDate);
      rows.push({ symbol: chart.symbol, label: chart.processLabel, ...computeFeatures(bars) });
    } catch (error) {
      console.warn(`SKIP ${chart.symbol}: ${error.message}`);
    }
  }

  const cols = ['dirEff60', 'wickRatio20', 'overlapRatio20', 'pullbackDepthPct', 'runupPct'];
  const pad = (v, w) => String(v ?? '-').padEnd(w);

  console.log('\n' + pad('SYMBOL', 10) + pad('LABEL', 9) + cols.map((c) => pad(c, 18)).join(''));
  console.log('-'.repeat(10 + 9 + cols.length * 18));
  for (const r of rows) {
    console.log(pad(r.symbol, 10) + pad(r.label, 9) + cols.map((c) => pad(r[c], 18)).join(''));
  }

  const mean = (list, key) => {
    const vals = list.map((r) => r[key]).filter((v) => v != null);
    return vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
  };
  const valid = rows.filter((r) => r.label === 'VALID');
  const invalid = rows.filter((r) => r.label === 'INVALID');

  console.log('-'.repeat(10 + 9 + cols.length * 18));
  console.log(pad('MEAN', 10) + pad('VALID', 9) + cols.map((c) => pad(mean(valid, c), 18)).join(''));
  console.log(pad('MEAN', 10) + pad('INVALID', 9) + cols.map((c) => pad(mean(invalid, c), 18)).join(''));
}

main().catch((e) => { console.error(e); process.exit(1); });
