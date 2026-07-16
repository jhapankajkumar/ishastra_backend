// Backend port of buildAIChartMetadata from ishastra_web/src/pages/Chart.js.
// Keep the two in sync: the eval must send the same payload shape the
// frontend sends in production, otherwise eval results don't transfer.
const { getHistorical } = require('../yahoo');
const { computeProposedTrigger, computeSetupCharacter } = require('../utils/setupCompute');

const round = (value, decimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const average = (values) => {
  const nums = (values || []).filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return null;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
};

const calculateEMAValue = (data, period) => {
  const closes = data.map((bar) => bar.close).filter((v) => typeof v === 'number');
  if (closes.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = average(closes.slice(0, period));
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] * multiplier) + (ema * (1 - multiplier));
  }
  return ema;
};

const calculateATRValue = (data, period = 14) => {
  if (!Array.isArray(data) || data.length < period + 1) return null;

  const trueRanges = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    trueRanges.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    ));
  }
  return average(trueRanges.slice(-period));
};

const toDateString = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return date.substring(0, 10);
  return date.toISOString().substring(0, 10);
};

function buildChartMetadata(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { chartContext: null, technicalSummary: null, ohlcSummary: null, visibleOhlc: null };
  }

  const lastBar = data[data.length - 1];
  const close = lastBar?.close;
  const highs = data.map((bar) => bar.high).filter((v) => typeof v === 'number');
  const lows = data.map((bar) => bar.low).filter((v) => typeof v === 'number');
  const volumes = data.map((bar) => bar.volume).filter((v) => typeof v === 'number');
  const last252 = data.slice(-252);
  const last50 = data.slice(-50);
  const last20 = data.slice(-20);
  const last10 = data.slice(-10);
  const high52w = Math.max(...last252.map((bar) => bar.high));
  const low52w = Math.min(...last252.map((bar) => bar.low));
  const high2y = Math.max(...highs);
  const low2y = Math.min(...lows);
  const ema10 = calculateEMAValue(data, 10);
  const ema20 = calculateEMAValue(data, 20);
  const ema50 = calculateEMAValue(data, 50);
  const ema200 = calculateEMAValue(data, 200);
  const atr14 = calculateATRValue(data, 14);
  const avgVolume10 = average(volumes.slice(-10));
  const avgVolume20 = average(volumes.slice(-20));
  const avgVolume50 = average(volumes.slice(-50));
  const recentRangeHigh = Math.max(...last10.map((bar) => bar.high));
  const recentRangeLow = Math.min(...last10.map((bar) => bar.low));
  const visibleOhlc = data.slice(-120).map((bar) => ({
    date: toDateString(bar.date),
    open: round(bar.open),
    high: round(bar.high),
    low: round(bar.low),
    close: round(bar.close),
    volume: bar.volume ?? null
  }));

  const pctFrom = (base) => {
    if (!close || !base) return null;
    return round(((close - base) / base) * 100);
  };

  // Shared with the production service (src/utils/setupCompute.js) so eval
  // and production always send identical computed evidence. Verified against
  // actual fills: ARCB 125.35→126.08, TPB 119.23→119.33.
  const proposedTrigger = computeProposedTrigger(data);
  const setupCharacter = computeSetupCharacter(data);

  return {
    proposedTrigger,
    setupCharacter,
    chartContext: {
      renderedTimeframe: '2Y daily',
      // Eval charts come from TradingView Bar Replay, not the app's chart page,
      // so indicator colors/overlays depend on the user's TradingView layout.
      capturedImageScope: 'TRADINGVIEW_BAR_REPLAY_DAILY',
      visibleRange: null,
      visibleIndicators: [],
      intendedUse: 'Swing setup visual quality review'
    },
    technicalSummary: {
      high52w: round(high52w),
      low52w: round(low52w),
      high2y: round(high2y),
      low2y: round(low2y),
      distanceFrom52wHighPct: high52w ? round(((close - high52w) / high52w) * 100) : null,
      distanceFrom52wLowPct: low52w ? round(((close - low52w) / low52w) * 100) : null,
      ema10: round(ema10),
      ema20: round(ema20),
      ema50: round(ema50),
      ema200: round(ema200),
      priceVsEma10Pct: pctFrom(ema10),
      priceVsEma20Pct: pctFrom(ema20),
      priceVsEma50Pct: pctFrom(ema50),
      priceVsEma200Pct: pctFrom(ema200),
      atr14: round(atr14),
      atrPct: close && atr14 ? round((atr14 / close) * 100) : null,
      avgVolume10: round(avgVolume10, 0),
      avgVolume20: round(avgVolume20, 0),
      avgVolume50: round(avgVolume50, 0),
      volumeVs20dAvg: avgVolume20 ? round(lastBar.volume / avgVolume20) : null,
      volumeVs50dAvg: avgVolume50 ? round(lastBar.volume / avgVolume50) : null,
      recent10dRangePct: close ? round(((recentRangeHigh - recentRangeLow) / close) * 100) : null,
      recent20dHigh: round(Math.max(...last20.map((bar) => bar.high))),
      recent50dHigh: round(Math.max(...last50.map((bar) => bar.high))),
      visibleWindowBars: data.length,
      visibleWindowHigh: round(Math.max(...highs)),
      visibleWindowLow: round(Math.min(...lows)),
      visibleWindowRangePct: close ? round(((Math.max(...highs) - Math.min(...lows)) / close) * 100) : null,
      visibleWindowAvgVolume: round(average(volumes), 0)
    },
    ohlcSummary: {
      bars: data.length,
      firstDate: toDateString(data[0]?.date),
      lastDate: toDateString(lastBar?.date),
      lastOpen: round(lastBar?.open),
      lastHigh: round(lastBar?.high),
      lastLow: round(lastBar?.low),
      lastClose: round(lastBar?.close),
      lastVolume: lastBar?.volume ?? null
    },
    visibleOhlc
  };
}

// Fetches 2 years of daily OHLCV up to and INCLUDING analysisDate.
// analysisDate = the last completed bar visible on the chart image — the
// metadata must describe exactly what the image shows, no more (lookahead)
// and no less (off-by-one). Bars after analysisDate are dropped.
async function buildMetadataAsOf(symbol, analysisDate) {
  const end = new Date(analysisDate);
  const start = new Date(end);
  start.setDate(start.getDate() - 730);

  // Fetch a couple of days past analysisDate so timezone quirks in yahoo's
  // period2 can never exclude the analysisDate bar itself.
  const fetchEnd = new Date(end);
  fetchEnd.setDate(fetchEnd.getDate() + 2);

  const startStr = start.toISOString().substring(0, 10);
  const bars = await getHistorical(symbol, startStr, fetchEnd.toISOString().substring(0, 10));

  const clean = bars.filter((bar) => {
    const d = toDateString(bar.date);
    return d && d <= analysisDate && typeof bar.close === 'number';
  });

  if (!clean.length) {
    throw new Error(`No historical data for ${symbol} on or before ${analysisDate}`);
  }

  return {
    bars: clean,
    metadata: buildChartMetadata(clean)
  };
}

module.exports = { buildMetadataAsOf, buildChartMetadata };
