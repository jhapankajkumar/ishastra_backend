// Transparency tool: prints the EXACT system + user prompt that
// run-golden-eval.js sends to OpenAI for a given golden chart (the chart
// image is attached separately as an input_image and is not text).
//
// Usage: node src/evals/show-prompt.js BLFS
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const { AISetupReviewService } = require('../services/ai-setup-review.service');
const { buildMetadataAsOf } = require('./buildMetadata');

async function main() {
  const symbol = process.argv[2];
  if (!symbol) {
    console.error('Usage: node src/evals/show-prompt.js <SYMBOL>');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'manifest.json'), 'utf8'));
  const chart = manifest.charts.find((c) => c.symbol === symbol);
  if (!chart) {
    console.error(`No manifest entry for ${symbol}`);
    process.exit(1);
  }

  const { metadata } = await buildMetadataAsOf(chart.symbol, chart.analysisDate);
  const service = new AISetupReviewService();

  // Identical payload to run-golden-eval.js, minus the image.
  const payload = {
    symbol: chart.symbol,
    timeframe: '1D',
    currentPrice: metadata.ohlcSummary.lastClose,
    chartContext: metadata.chartContext,
    technicalSummary: metadata.technicalSummary,
    ohlcSummary: metadata.ohlcSummary,
    visibleOhlc: metadata.visibleOhlc,
    proposedTrigger: metadata.proposedTrigger,
    setupCharacter: metadata.setupCharacter,
    notes: 'Golden-set eval: TradingView Bar Replay daily chart as of the day before entry.'
  };

  const systemPrompt = service.systemPrompt();
  const userPrompt = service.userPrompt(service.buildMetadata(payload));

  const dumpDir = path.join(__dirname, 'prompt-dumps');
  fs.mkdirSync(dumpDir, { recursive: true });
  const outFile = path.join(dumpDir, `${chart.symbol}-${service.promptVersion}.txt`);
  fs.writeFileSync(outFile, [
    `PROMPT VERSION: ${service.promptVersion}`,
    `MODEL: ${service.model}`,
    '',
    '================ SYSTEM PROMPT ================',
    systemPrompt,
    '',
    '================ USER PROMPT ================',
    userPrompt,
    '',
    '================ ATTACHED SEPARATELY ================',
    `input_image: golden/images/${chart.imageFile} (detail: ${service.detail})`
  ].join('\n'));

  // Console copy with the 120-bar OHLC block truncated for readability.
  const consoleUser = userPrompt.replace(
    /"visibleOhlc": \[[\s\S]*?\n  \]/,
    (block) => block.split('\n').slice(0, 10).join('\n') + '\n    ... (truncated for console, full text in dump file) ...\n  ]'
  );

  console.log(`Full dump written to: ${path.relative(process.cwd(), outFile)}\n`);
  console.log('================ SYSTEM PROMPT ================\n');
  console.log(systemPrompt);
  console.log('\n================ USER PROMPT (OHLC truncated) ================\n');
  console.log(consoleUser);
}

main().catch((e) => { console.error(e); process.exit(1); });
