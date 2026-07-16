// Detector-level eval against the golden set (no AI calls, no images, $0).
//
// Usage:  node src/evals/analyze-detectors.js
//
// The scanner's BUY decision — for a TradingView-prefiltered universe where
// the 4 trend rules and performance gate always pass — reduces to the unified
// pattern score: max(VCP, Flag+dryUpBonus, BigBase+dryUpBonus) >= 0.5.
//
// This script replicates that exact computation on each golden chart's
// as-of OHLCV (same bars the scanner would see on that date) and reports,
// per detector, who fired on the trader's INVALID rejects (false approvals)
// and who missed their VALID picks. Run before AND after detector changes.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const { buildMetadataAsOf } = require('./buildMetadata');
const { FlagPatternDetector } = require('../utils/flag-pattern-detector');
const { VcpDetector } = require('../utils/vcp-detector');
const { BigBaseDetector } = require('../utils/big-base-detector');
const { computeSetupCharacter } = require('../utils/setupCompute');

const GOLDEN_DIR = path.join(__dirname, 'golden');

const pad = (value, width) => String(value ?? '-').padEnd(width);

// Mirrors the scanner's dry-up: last-5-day avg vs clean 6–25-day baseline, <= 0.75.
function computeDryUp(bars) {
  if (bars.length < 25) return { passed: false, ratio: null };
  const avg = (rows) => rows.reduce((s, b) => s + (b.volume || 0), 0) / rows.length;
  const baseline = avg(bars.slice(-25, -5));
  const recent = avg(bars.slice(-5));
  const ratio = baseline > 0 ? recent / baseline : 1;
  return { passed: ratio <= 0.75, ratio: Math.round(ratio * 100) / 100 };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'manifest.json'), 'utf8'));
  const flagDetector = new FlagPatternDetector();
  const vcpDetector = new VcpDetector();
  const bigBaseDetector = new BigBaseDetector();

  const rows = [];
  for (const chart of manifest.charts) {
    process.stdout.write(`Analyzing ${chart.symbol} (as of ${chart.analysisDate})... `);
    try {
      const { bars } = await buildMetadataAsOf(chart.symbol, chart.analysisDate);
      const lastClose = bars[bars.length - 1].close;

      const character = computeSetupCharacter(bars);
      const dryUp = computeDryUp(bars);
      const vcp = vcpDetector.detect(bars.slice(-80));
      const flag = flagDetector.classify(bars, lastClose);
      const bigBase = bigBaseDetector.detect(bars, lastClose);

      // Exact scanner fold (minervini-template-advanced.js), including the
      // setup-character gate — keep in sync with the scanner by hand.
      const flagScore = flag.detected ? Math.min(1, flag.score + (dryUp.passed ? 0.15 : 0)) : 0;
      const bigBaseScore = bigBase.detected ? Math.min(1, bigBase.score + (dryUp.passed ? 0.10 : 0)) : 0;
      let unified = Math.max(vcp.score, flagScore, bigBaseScore);
      const dirEff = character?.directionalEfficiency60d ?? null;
      if (dirEff !== null) {
        if (dirEff < 0.12) unified = 0;
        else if (dirEff < 0.20) unified = Math.max(0, unified - 0.10);
      }
      const patternPass = unified >= 0.5;

      const contributions = [
        { name: 'VCP', value: vcp.score },
        { name: flag.type, value: flagScore },
        { name: `BB:${bigBase.entryZone}`, value: bigBaseScore }
      ].filter((c) => c.value >= 0.5).map((c) => c.name);

      rows.push({
        symbol: chart.symbol,
        processLabel: chart.processLabel,
        vcpScore: vcp.score,
        vcpSwings: vcp.numContractions,
        flagType: flag.type,
        flagScore,
        bigBaseZone: bigBase.entryZone,
        bigBaseScore,
        unified: Math.round(unified * 100) / 100,
        patternPass,
        firedBy: contributions.join(',') || '-',
        dirEff: character?.directionalEfficiency60d ?? null,
        dryUpRatio: dryUp.ratio
      });
      console.log(`${patternPass ? 'PASS' : 'fail'} (unified ${unified.toFixed(2)}, fired: ${contributions.join(',') || 'none'})`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      rows.push({ symbol: chart.symbol, processLabel: chart.processLabel, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(118));
  console.log(
    pad('SYMBOL', 16) + pad('LABEL', 9) + pad('VCP', 6) + pad('SWNG', 6) + pad('FLAG TYPE', 17) +
    pad('FLAG', 6) + pad('BB ZONE', 9) + pad('BB', 6) + pad('UNIFIED', 9) + pad('BUY?', 6) + pad('FIRED BY', 20) + 'DIREFF'
  );
  console.log('-'.repeat(118));
  for (const r of rows) {
    if (r.error) { console.log(pad(r.symbol, 16) + `ERROR: ${r.error}`); continue; }
    console.log(
      pad(r.symbol, 16) + pad(r.processLabel, 9) + pad(r.vcpScore, 6) + pad(r.vcpSwings, 6) +
      pad(r.flagType, 17) + pad(r.flagScore.toFixed(2), 6) + pad(r.bigBaseZone, 9) + pad(r.bigBaseScore.toFixed(2), 6) +
      pad(r.unified, 9) + pad(r.patternPass ? 'BUY' : '-', 6) + pad(r.firedBy, 20) + (r.dirEff ?? '-')
    );
  }
  console.log('='.repeat(118));

  const ok = rows.filter((r) => !r.error);
  const byLabel = (label) => ok.filter((r) => r.processLabel === label);
  const passRate = (set) => set.length ? `${set.filter((r) => r.patternPass).length}/${set.length}` : 'n/a';

  console.log(`\nPATTERN-PASS (== scanner BUY on prefiltered universe)`);
  console.log(`  on VALID:   ${passRate(byLabel('VALID'))}   (want high — these are setups you took)`);
  console.log(`  on INVALID: ${passRate(byLabel('INVALID'))}   (want 0 — these are scanner BUYs you rejected)`);

  // Per-detector false-approval attribution on INVALID charts
  const invalidPassed = byLabel('INVALID').filter((r) => r.patternPass);
  if (invalidPassed.length) {
    console.log(`\nFALSE APPROVALS — which detector fired on charts you rejected:`);
    for (const r of invalidPassed) {
      console.log(`  ${pad(r.symbol, 16)} fired by: ${r.firedBy}   (dirEff ${r.dirEff})`);
    }
  }
  const validMissed = byLabel('VALID').filter((r) => !r.patternPass);
  if (validMissed.length) {
    console.log(`\nMISSES — VALID setups no detector caught:`);
    for (const r of validMissed) {
      console.log(`  ${pad(r.symbol, 16)} unified ${r.unified}   (dirEff ${r.dirEff})`);
    }
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
