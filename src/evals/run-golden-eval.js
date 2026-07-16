// Golden-set eval for the AI chart setup reviewer.
//
// Usage:  node src/evals/run-golden-eval.js [--only SYMBOL] [--label VALID|INVALID]
//
// For each chart in golden/manifest.json: loads the TradingView Bar Replay
// screenshot, rebuilds production-shaped metadata as of the entry date,
// calls the real review service, and records verdict + cost + latency.
// Results are written to results/baseline-<timestamp>.json so prompt
// changes can be compared against this baseline run-over-run.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { AISetupReviewService } = require('../services/ai-setup-review.service');
const { buildMetadataAsOf } = require('./buildMetadata');

const GOLDEN_DIR = path.join(__dirname, 'golden');
const IMAGES_DIR = path.join(GOLDEN_DIR, 'images');
const RESULTS_DIR = path.join(__dirname, 'results');

// USD per 1M tokens. Update if the model or OpenAI pricing changes.
const PRICING = {
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 }
};

const estimateCost = (model, usage) => {
  const price = PRICING[model];
  if (!price || !usage) return null;
  const input = (usage.inputTokens ?? 0) * price.input / 1e6;
  const output = (usage.outputTokens ?? 0) * price.output / 1e6;
  return Math.round((input + output) * 10000) / 10000;
};

const pad = (value, width) => String(value ?? '-').padEnd(width);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Each review is ~12k tokens against a 30k tokens-per-minute org limit,
// so calls must be paced ~25s apart and 429s retried using the server's
// suggested wait time.
const INTER_CALL_DELAY_MS = 25000;
const MAX_ATTEMPTS = 4;

const parseRetrySeconds = (message) => {
  const match = /try again in ([\d.]+)s/i.exec(message || '');
  return match ? parseFloat(match[1]) : null;
};

async function reviewWithRetry(service, payload) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await service.reviewSetup(payload);
    } catch (error) {
      const status = error.status ?? error.response?.status;
      if (status !== 429 || attempt >= MAX_ATTEMPTS) throw error;
      const waitMs = Math.ceil((parseRetrySeconds(error.message) ?? 20) * 1000) + 1000;
      process.stdout.write(`rate-limited, retrying in ${Math.round(waitMs / 1000)}s... `);
      await sleep(waitMs);
    }
  }
}

async function main() {
  const onlyIndex = process.argv.indexOf('--only');
  const onlySymbol = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null;
  const labelIndex = process.argv.indexOf('--label');
  const onlyLabel = labelIndex > -1 ? process.argv[labelIndex + 1] : null;

  const manifest = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, 'manifest.json'), 'utf8'));
  let charts = manifest.charts;
  if (onlySymbol) {
    charts = charts.filter((c) => c.symbol === onlySymbol);
  }
  if (onlyLabel) {
    charts = charts.filter((c) => c.processLabel === onlyLabel.toUpperCase());
  }
  if (!charts.length) {
    console.error('No manifest entries match the given filters');
    process.exit(1);
  }

  const service = new AISetupReviewService();
  const results = [];
  let skipped = 0;

  for (const chart of charts) {
    const imagePath = path.join(IMAGES_DIR, chart.imageFile);
    if (!fs.existsSync(imagePath)) {
      console.warn(`SKIP ${chart.symbol}: image not found at golden/images/${chart.imageFile}`);
      skipped++;
      continue;
    }

    process.stdout.write(`Reviewing ${chart.symbol} (as of ${chart.analysisDate})... `);
    try {
      const { metadata } = await buildMetadataAsOf(chart.symbol, chart.analysisDate);
      const imageBase64 = fs.readFileSync(imagePath).toString('base64');

      const started = Date.now();
      // notes intentionally omitted: since v6 the service injects its own
      // fixed REVIEW_CONTEXT_NOTE and ignores caller-supplied notes.
      const review = await reviewWithRetry(service, {
        symbol: chart.symbol,
        timeframe: '1D',
        currentPrice: metadata.ohlcSummary.lastClose,
        imageDataUrl: `data:image/png;base64,${imageBase64}`,
        chartContext: metadata.chartContext,
        technicalSummary: metadata.technicalSummary,
        ohlcSummary: metadata.ohlcSummary,
        visibleOhlc: metadata.visibleOhlc,
        proposedTrigger: metadata.proposedTrigger,
        setupCharacter: metadata.setupCharacter
      });
      const latencyMs = Date.now() - started;
      const estCost = estimateCost(service.model, review._usage);

      results.push({
        symbol: chart.symbol,
        analysisDate: chart.analysisDate,
        processLabel: chart.processLabel,
        outcomePct: chart.outcomePct,
        verdict: review.verdict,
        qualityGrade: review.qualityGrade,
        setupType: review.setupType,
        setupMaturity: review.setupMaturity,
        pivotVisible: review.pivotVisible,
        estimatedPivotPrice: review.estimatedPivotPrice,
        proposedTriggerPrice: metadata.proposedTrigger?.price ?? null,
        passBlockers: review.passBlockers,
        summary: review.summary,
        usage: review._usage ?? null,
        estCostUsd: estCost,
        latencyMs
      });
      console.log(`${review.verdict} (${review.qualityGrade}, ${review.setupType}) in ${(latencyMs / 1000).toFixed(1)}s${estCost != null ? `, $${estCost}` : ''}`);
    } catch (error) {
      console.log(`ERROR: ${error.message}`);
      results.push({ symbol: chart.symbol, analysisDate: chart.analysisDate, error: error.message });
    }

    if (charts.indexOf(chart) < charts.length - 1) {
      await sleep(INTER_CALL_DELAY_MS);
    }
  }

  if (!results.length) {
    console.error('\nNo charts were evaluated. Add screenshots to src/evals/golden/images/ first.');
    process.exit(1);
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const version = service.promptVersion || 'v1-baseline';
  const outFile = path.join(RESULTS_DIR, `${version}-${timestamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ model: service.model, promptVersion: version, ranAt: new Date().toISOString(), results }, null, 2));

  // Summary table
  console.log('\n' + '='.repeat(96));
  console.log(pad('SYMBOL', 16) + pad('OUTCOME', 10) + pad('PROCESS', 10) + pad('VERDICT', 9) + pad('GRADE', 7) + pad('TYPE', 24) + pad('MATURITY', 10) + 'COST');
  console.log('-'.repeat(96));
  for (const r of results) {
    if (r.error) {
      console.log(pad(r.symbol, 16) + `ERROR: ${r.error}`);
      continue;
    }
    const outcome = r.outcomePct == null ? '-' : (r.outcomePct > 0 ? `+${r.outcomePct}%` : `${r.outcomePct}%`);
    console.log(
      pad(r.symbol, 16) + pad(outcome, 10) + pad(r.processLabel, 10) + pad(r.verdict, 9) +
      pad(r.qualityGrade, 7) + pad(r.setupType, 24) + pad(r.setupMaturity, 10) +
      (r.estCostUsd != null ? `$${r.estCostUsd}` : '-')
    );
  }
  console.log('='.repeat(96));

  const ok = results.filter((r) => !r.error);
  const winners = ok.filter((r) => r.outcomePct > 0);
  const losers = ok.filter((r) => r.outcomePct < 0);
  const valid = ok.filter((r) => r.processLabel === 'VALID');
  const invalid = ok.filter((r) => r.processLabel === 'INVALID');
  const passRate = (rows) => rows.length ? `${rows.filter((r) => r.verdict === 'PASS').length}/${rows.length}` : 'n/a';
  const totalCost = ok.reduce((sum, r) => sum + (r.estCostUsd ?? 0), 0);
  const verdictCounts = ok.reduce((acc, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc; }, {});

  console.log(`\nVerdicts: ${JSON.stringify(verdictCounts)}`);
  // Primary metric: the AI should agree with the trader's process —
  // pass what they'd take (VALID), refuse what they'd skip (INVALID).
  console.log(`PROCESS AGREEMENT — PASS on VALID: ${passRate(valid)} (want high)   PASS on INVALID: ${passRate(invalid)} (want 0, false approvals)`);
  console.log(`Outcome (context only) — PASS on winners: ${passRate(winners)}   PASS on losers: ${passRate(losers)}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}   Skipped (missing image): ${skipped}`);
  console.log(`\nResults saved: ${path.relative(process.cwd(), outFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
