/**
 * MultiSystemDataGenerator.js
 * Realistic, seedable market data + indicator pack for 10 proven systems.
 * - Generates Daily → Weekly (ISO week) and Intraday (market-aware) series
 * - Computes per-system indicator bundles
 * - Can shape scenarios per system (bullish_breakout, bearish_breakdown, neutral)
 *
 * Systems covered (indicators included):
 * 1) Elder Triple Screen (weekly MACD/EMA, daily RSI/Stoch/ATR)
 * 2) Elder Impulse (EMA slope + MACD histogram)
 * 3) Minervini SEPA (RS, EMA alignment, volatility contraction proxy)
 * 4) CAN SLIM Cup & Handle (base depth/length proxies, volume pct change)
 * 5) Bollinger Squeeze (BB width, Keltner width, squeeze flag)
 * 6) Keltner/Volatility Channel Breakout (KC, ATR)
 * 7) Darvas Box (swing high/low box, breakout levels)
 * 8) Donchian/Turtle (20/55 channel)
 * 9) RSI Mean Reversion (RSI(2/14), BB touches)
 * 10) Bullish/Bearish Divergence (RSI & MACD vs price)
 *
 * NOTE: This is a realistic test-data generator, not a data vendor.
 */


const { DateTime } = require('luxon');
const { SYSTEM_IDS, getSystemRequirements } = require('../../utils/systemConstants');

// Helper: declare per-system data needs
function requirementsFor(system) {
    return getSystemRequirements(system);
}

// ---------------------------
// Math/Indicator helpers
// ---------------------------
function sma(arr, n) {
    if (!arr || arr.length < n) return null;
    let s = 0;
    for (let i = arr.length - n; i < arr.length; i++) s += arr[i];
    return s / n;
}
function emaSeries(arr, n) {
    if (!arr || arr.length < n) return [];
    const k = 2 / (n + 1);
    const out = [];
    let prev = sma(arr, n);
    if (prev == null) return [];
    out.push(prev);
    for (let i = arr.length - n + 1; i < arr.length; i++) {
        prev = arr[i] * k + prev * (1 - k);
        out.push(prev);
    }
    return out;
}
function emaLast(arr, n) {
    const s = emaSeries(arr, n);
    return s.length ? s[s.length - 1] : arr[arr.length - 1] ?? 0;
}
function stddev(arr, n) {
    if (!arr || arr.length < n) return null;
    const mean = sma(arr, n);
    let ss = 0;
    for (let i = arr.length - n; i < arr.length; i++) {
        const d = arr[i] - mean;
        ss += d * d;
    }
    return Math.sqrt(ss / n);
}
function macdLast(prices, fast = 12, slow = 26, signal = 9) {
    if (!prices || prices.length < slow + signal) return { macd: 0, signal: 0, hist: 0 };
    const fastE = emaSeries(prices, fast);
    const slowE = emaSeries(prices, slow);
    if (!fastE.length || !slowE.length) return { macd: 0, signal: 0, hist: 0 };
    const offset = Math.max(0, fastE.length - slowE.length);
    const alignedFast = fastE.slice(offset);
    const macdLine = [];
    const m = Math.min(alignedFast.length, slowE.length);
    for (let i = 0; i < m; i++) macdLine.push(alignedFast[i] - slowE[i]);
    const sig = emaSeries(macdLine, signal);
    const macd = macdLine[macdLine.length - 1] ?? 0;
    const sigLast = sig[sig.length - 1] ?? 0;
    return { macd, signal: sigLast, hist: macd - sigLast };
}
function rsiLast(prices, period = 14) {
    if (!prices || prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const ch = prices[prices.length - period - 1 + i] - prices[prices.length - period - 1 + i - 1];
        if (ch >= 0) gains += ch; else losses -= ch;
    }
    let avgG = gains / period, avgL = losses / period;
    for (let i = prices.length - period; i < prices.length; i++) {
        const ch = prices[i] - prices[i - 1];
        avgG = (avgG * (period - 1) + Math.max(0, ch)) / period;
        avgL = (avgL * (period - 1) + Math.max(0, -ch)) / period;
    }
    const rs = avgL === 0 ? 999 : avgG / avgL;
    return 100 - (100 / (1 + rs));
}
function stochasticK(ohlc, period = 14) {
    if (!ohlc || ohlc.length < period) return 50;
    const cut = ohlc.slice(-period);
    const low = Math.min(...cut.map(d => d.low));
    const high = Math.max(...cut.map(d => d.high));
    if (high <= low) return 50;
    const close = cut[cut.length - 1].close;
    return ((close - low) / (high - low)) * 100;
}
function atrLast(ohlc, period = 14) {
    if (!ohlc || ohlc.length < 2) return 0;
    const trs = [];
    for (let i = ohlc.length - period; i < ohlc.length; i++) {
        if (i <= 0) continue;
        const c = ohlc[i], p = ohlc[i - 1];
        const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
        trs.push(tr);
    }
    return trs.length ? trs.reduce((a, b) => a + b, 0) / trs.length : 0;
}
function bollinger(prices, period = 20, mult = 2) {
    const m = sma(prices, period);
    const sd = stddev(prices, period);
    if (m == null || sd == null) return { mid: null, upper: null, lower: null, width: null };
    return { mid: m, upper: m + mult * sd, lower: m - mult * sd, width: (mult * sd) / Math.max(1e-9, m) };
}
function keltner(ohlc, period = 20, mult = 1.5) {
    const closes = ohlc.map(d => d.close);
    const mid = emaLast(closes, period);
    const atr = atrLast(ohlc, period);
    return { mid, upper: mid + mult * atr, lower: mid - mult * atr, atr };
}
function donchian(ohlc, period = 20) {
    if (!ohlc || ohlc.length < period) return { upper: null, lower: null, mid: null };
    const cut = ohlc.slice(-period);
    const upper = Math.max(...cut.map(d => d.high));
    const lower = Math.min(...cut.map(d => d.low));
    return { upper, lower, mid: (upper + lower) / 2 };
}
function adxApprox(ohlc, period = 14) {
    // Light ADX approximation for testing
    if (!ohlc || ohlc.length < period + 1) return 20;
    let up = 0, dn = 0;
    for (let i = ohlc.length - period; i < ohlc.length; i++) {
        const ch = ohlc[i].close - ohlc[i - 1].close;
        if (ch > 0) up += ch; else dn -= ch;
    }
    const sum = up + dn || 1;
    const dx = Math.abs(up - dn) / sum * 100;
    return dx;
}
function obv(ohlc) {
    if (!ohlc || ohlc.length < 2) return 0;
    let val = 0;
    for (let i = 1; i < ohlc.length; i++) {
        const dir = ohlc[i].close > ohlc[i - 1].close ? 1 : (ohlc[i].close < ohlc[i - 1].close ? -1 : 0);
        val += dir * (ohlc[i].volume || 0);
    }
    return val;
}

// === Enhanced math packs (BB, VCP, Divergence) ===

// Bollinger pack with bandwidth and %B
function bollingerPack(prices, period=20, mult=2) {
  const mid = sma(prices, period);
  const sd  = stddev(prices, period);
  if (mid == null || sd == null) return null;
  const upper = mid + mult*sd, lower = mid - mult*sd;
  const bandwidth = (upper - lower) / Math.max(1e-9, mid);
  const last = prices[prices.length-1];
  const pctB = (last - lower) / Math.max(1e-9, (upper - lower)); // 0..1
  return { mid, upper, lower, bandwidth, pctB };
}

// Rolling percentile utility (robust squeeze detection)
function rollingPercentile(arr, lookback=120, pct=0.10) {
  const cut = arr.slice(-lookback).filter(x => Number.isFinite(x));
  if (!cut.length) return null;
  const sorted = [...cut].sort((a,b)=>a-b);
  const idx = Math.max(0, Math.min(sorted.length-1, Math.floor(sorted.length*pct)));
  return sorted[idx];
}

// Bollinger squeeze signal using rolling percentile of bandwidth
function bollingerSqueezeSignal(prices) {
  if (!prices || prices.length < 40) return { squeezeOn: false, bb: null, bwNow: null, p10: null };
  const bwHist = [];
  for (let i = 20; i < prices.length; i++) {
    const pack = bollingerPack(prices.slice(0, i));
    bwHist.push(pack ? pack.bandwidth : null);
  }
  const bwNow = bwHist[bwHist.length - 1] ?? null;
  const p10   = rollingPercentile(bwHist, 120, 0.10);
  const squeezeOn = bwNow != null && p10 != null && bwNow <= p10;
  const bbNow = bollingerPack(prices);
  return { squeezeOn, bb: bbNow, bwNow, p10 };
}

// --- SEPA / CAN SLIM proxies ---

// Simple RS vs "index" proxy; if no index provided, falls back to 1.0 baseline
function rsAgainstIndex(stockCloses, indexCloses) {
  if (!stockCloses || !stockCloses.length) return 1.0;
  if (!indexCloses || !indexCloses.length) {
    const rs = stockCloses[stockCloses.length-1] / Math.max(1e-9, sma(stockCloses, 50) || stockCloses[stockCloses.length-1]);
    return +rs.toFixed(3);
  }
  const s = stockCloses[stockCloses.length-1];
  const i = indexCloses[indexCloses.length-1] || 1;
  const rs    = s / i;
  const rsS50 = (sma(stockCloses, 50) || 1) / (sma(indexCloses, 50) || 1);
  return +(rs / Math.max(1e-9, rsS50)).toFixed(3);
}

// Volatility Contraction Pattern (VCP) detector (proxy, segmentation based)
function detectVCP(daily) {
  const closes = daily?.map(d => d.close) || [];
  if (closes.length < 40) return { hasVCP:false, contractions:[], vcpScore:0, depthPct:null, pivot:null, breakoutOnVol:false };
  const highs = daily.map(d => d.high), lows = daily.map(d => d.low), vols = daily.map(d => d.volume || 0);

  // Base window ~ 60 bars (~3 months)
  const base = daily.slice(-60);
  const baseHigh = Math.max(...base.map(d => d.high));
  const baseLow  = Math.min(...base.map(d => d.low));
  const depthPct = ((baseHigh - baseLow) / Math.max(1e-9, baseHigh)) * 100;

  // Split base into 4 segments and measure range% and avg volume
  const blocks = 4, seg = [];
  for (let i=0;i<blocks;i++){
    const a = Math.floor(i*base.length/blocks);
    const b = Math.floor((i+1)*base.length/blocks);
    const segment = base.slice(a,b);
    const h = Math.max(...segment.map(d => d.high));
    const l = Math.min(...segment.map(d => d.low));
    const r = ((h - l) / Math.max(1e-9, h)) * 100;
    const v = sma(segment.map(d => d.volume || 0), Math.max(5, Math.floor(segment.length/2))) || 0;
    seg.push({ rangePct:+r.toFixed(2), avgVol: Math.round(v) });
  }
  let tightens = true;
  for (let i=1;i<seg.length;i++){ if (seg[i].rangePct >= seg[i-1].rangePct) { tightens = false; break; } }

  const pivot = baseHigh;
  const vol50dma = sma(daily.slice(-50).map(d => d.volume || 0), 50) || 1;
  const last = daily[daily.length-1];
  const breakoutOnVol = last.close > pivot && (last.volume || 0) >= 1.5 * vol50dma;

  const vcpScore = (tightens ? 1 : 0) + (depthPct <= 33 ? 1 : 0);
  return { hasVCP: (tightens && depthPct <= 33), contractions: seg, vcpScore, depthPct:+depthPct.toFixed(2), pivot:+pivot.toFixed(2), breakoutOnVol };
}

// --- Divergence using pivots (fractals) ---

function pivotsFractal(series, left=2, right=2){
  const highs=[], lows=[];
  for(let i=left;i<series.length-right;i++){
    const seg = series.slice(i-left, i+right+1);
    const c = series[i];
    if (c === Math.max(...seg)) highs.push(i);
    if (c === Math.min(...seg)) lows.push(i);
  }
  return { highs, lows };
}

function divergenceAtPivots(closes, indicator, kind='bullish', minBarsBetween=5, minDelta=0.5){
  const { lows, highs } = pivotsFractal(closes, 2, 2);
  const piv = (kind === 'bullish') ? lows : highs;
  if (piv.length < 2) return { found:false };
  const i2 = piv[piv.length-1], i1 = piv[piv.length-2];
  if (i2 - i1 < minBarsBetween) return { found:false };
  const price1 = closes[i1], price2 = closes[i2];
  const ind1   = indicator[i1], ind2 = indicator[i2];
  if (!Number.isFinite(ind1) || !Number.isFinite(ind2)) return { found:false };

  if (kind === 'bullish'){
    const priceLowerLow   = price2 < price1;
    const indicatorHigher = ind2 > ind1 + minDelta;
    return { found: priceLowerLow && indicatorHigher, p1:i1, p2:i2 };
  } else {
    const priceHigherHigh = price2 > price1;
    const indicatorLower  = ind2 < ind1 - minDelta;
    return { found: priceHigherHigh && indicatorLower, p1:i1, p2:i2 };
  }
}

function divergencePack(daily){
  const closes = daily.map(d => d.close);
  // build indicator series
  const rsiSeries  = closes.map((_,i) => rsiLast(closes.slice(0,i+1), 14));
  const macdSeries = closes.map((_,i) => macdLast(closes.slice(0,i+1)).macd);
  const bullRSI = divergenceAtPivots(closes, rsiSeries, 'bullish', 5, 0.5);
  const bearRSI = divergenceAtPivots(closes, rsiSeries, 'bearish', 5, 0.5);
  const bullMACD= divergenceAtPivots(closes, macdSeries, 'bullish', 5, 0.0);
  const bearMACD= divergenceAtPivots(closes, macdSeries, 'bearish', 5, 0.0);
  return {
    bullish: (bullRSI.found || bullMACD.found),
    bearish: (bearRSI.found || bearMACD.found),
    pivots: { bullRSI, bearRSI, bullMACD, bearMACD }
  };
}

// ---------------------------
// Market-aware intraday slicing
// ---------------------------
const SESSIONS = {
    US: { start: '09:30', end: '16:00', tz: 'America/New_York', periodsPerDay: 6 },
    IN: { start: '09:15', end: '15:30', tz: 'Asia/Kolkata', periodsPerDay: 6 },
};

function minutesBetween(hhmmStart, hhmmEnd) {
    let [sh, sm] = hhmmStart.split(':').map(Number);
    let [eh, em] = hhmmEnd.split(':').map(Number);
    let start = sh * 60 + sm, end = eh * 60 + em;
    if (end < start) end += 24 * 60;
    return end - start;
}

function makeIntradayTimes(isoDate, market = 'US') {
    const sess = SESSIONS[market] || SESSIONS.US;
    const total = minutesBetween(sess.start, sess.end);
    const base = Math.floor(total / sess.periodsPerDay);
    const rem = total % sess.periodsPerDay;
    const dt = DateTime.fromISO(isoDate, { zone: sess.tz });
    const [sh, sm] = sess.start.split(':').map(Number);

    const out = [];
    let cur = sh * 60 + sm;
    for (let i = 0; i < sess.periodsPerDay; i++) {
        const len = base + (i < rem ? 1 : 0);
        const startLocal = dt.plus({ minutes: cur });
        const endLocal = dt.plus({ minutes: cur + len });
        out.push({
            startUTC: startLocal.toUTC().toJSDate(),
            endUTC: endLocal.toUTC().toJSDate(),
            startLocal: startLocal.toFormat("HH:mm ZZZZ"),
            endLocal: endLocal.toFormat("HH:mm ZZZZ"),
            durationMinutes: len,
            tradingDate: isoDate,
        });
        cur += len;
    }
    return out;
}

// ---------------------------
// Core generator (realistic & seedable)
// ---------------------------
class RNG {
    constructor(seed = null) {
        this.state = seed ?? null;
    }
    rand() {
        if (this.state === null) return Math.random();
        let t = (this.state += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

class MultiSystemDataGenerator {
    constructor({ market = 'US', randomSeed = 42 } = {}) {
        this.market = market;
        this.rng = new RNG(randomSeed);
        this.tradingDaysPerWeek = 5;
    }

    generateDaily({ weeks = 52, startDate = '2024-01-02', basePrice = 100, trendSlope = 0.05, volatility = 0.02 }) {
        const daysNeeded = weeks * this.tradingDaysPerWeek;
        const out = [];
        let cur = DateTime.fromISO(startDate).set({ hour: 0, minute: 0, second: 0 });
        let px = basePrice;
        while (out.length < daysNeeded) {
            if ([6, 7].includes(cur.weekday)) { cur = cur.plus({ days: 1 }); continue; }
            const noise = (this.rng.rand() - 0.5) * volatility * basePrice * 2;
            const close = basePrice + (out.length * trendSlope) + noise;
            const open = px;
            const high = Math.max(open, close) + this.rng.rand() * volatility * basePrice;
            const low = Math.min(open, close) - this.rng.rand() * volatility * basePrice;
            const vol = 8e6 + this.rng.rand() * 4e6 + Math.abs(close - open) / Math.max(1, open) * 1.2e7;
            out.push({
                date: cur.toISODate(),
                open: +open.toFixed(2),
                high: +high.toFixed(2),
                low: +low.toFixed(2),
                close: +close.toFixed(2),
                volume: Math.round(vol)
            });
            px = close;
            cur = cur.plus({ days: 1 });
        }
        return out;
    }

    aggregateWeekly(daily) {
        const weeks = [];
        let bucket = [];
        let curKey = null;
        for (const d of daily) {
            const ts = DateTime.fromISO(d.date);
            const key = `${ts.weekYear}-W${ts.weekNumber}`;
            if (curKey && key !== curKey) {
                weeks.push(this._closeWeek(bucket, curKey));
                bucket = [];
            }
            curKey = key;
            bucket.push(d);
        }
        if (bucket.length) weeks.push(this._closeWeek(bucket, curKey));
        return weeks;
    }
    _closeWeek(bars, isoWeek) {
        return {
            date: bars[bars.length - 1].date,
            weekStart: bars[0].date,
            weekEnd: bars[bars.length - 1].date,
            isoWeek,
            open: bars[0].open,
            high: Math.max(...bars.map(b => b.high)),
            low: Math.min(...bars.map(b => b.low)),
            close: bars[bars.length - 1].close,
            volume: bars.reduce((s, b) => s + b.volume, 0)
        };
    }

    generateIntraday(daily, { lookbackDays = 10 }) {
        const out = [];
        const days = daily.slice(-lookbackDays);
        for (const d of days) {
            const times = makeIntradayTimes(d.date, this.market);
            const dr = d.high - d.low;
            const w = this._uWeights(times.length);
            for (let i = 0; i < times.length; i++) {
                const st = i / times.length, en = (i + 1) / times.length;
                let o = d.low + dr * st + (this.rng.rand() - 0.5) * dr * 0.1;
                let c = d.low + dr * en + (this.rng.rand() - 0.5) * dr * 0.1;
                const hi = Math.min(d.high, Math.max(o, c) + this.rng.rand() * dr * 0.08);
                const lo = Math.max(d.low, Math.min(o, c) - this.rng.rand() * dr * 0.08);
                const vol = Math.max(1, d.volume * w[i] + (this.rng.rand() - 0.5) * d.volume * w[i] * 0.3);
                out.push({
                    date: times[i].startUTC.toISOString(),
                    dateLocal: times[i].startLocal,
                    endLocal: times[i].endLocal,
                    open: +o.toFixed(2),
                    high: +hi.toFixed(2),
                    low: +lo.toFixed(2),
                    close: +c.toFixed(2),
                    volume: Math.round(vol),
                    sessionInfo: { period: i + 1, totalPeriods: times.length, tradingDate: d.date }
                });
            }
        }
        return out;
    }
    _uWeights(n) {
        const mid = (n - 1) / 2;
        const arr = [];
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const dist = Math.abs(i - mid) / Math.max(1e-9, mid);
            const w = 0.6 + 0.4 * dist;
            arr.push(w); sum += w;
        }
        return arr.map(x => x / sum);
    }

    // ---------------------------
    // Per-system indicator packs
    // ---------------------------
    indicatorsForAll(weekly, daily, intraday, { includeTriple = true } = {}) {
        const closesD = daily.map(d => d.close);
        // Remove closesW at top; handled conditionally below

        const pack = {
            base: {
                last: closesD[closesD.length - 1],
                rsi14: +rsiLast(closesD, 14).toFixed(1),
                stoch14: +stochasticK(daily, 14).toFixed(1),
                atr14: +atrLast(daily, 14).toFixed(2),
                ema20: +emaLast(closesD, 20).toFixed(2),
                ema50: +emaLast(closesD, 50).toFixed(2),
                ema200: +emaLast(closesD, 200).toFixed(2),
                adx14: +adxApprox(daily, 14).toFixed(1),
                obv: obv(daily)
            },

            // 1) Elder Triple Screen (only if requested and weekly available)
            ...(includeTriple && Array.isArray(weekly) && weekly.length ? {
                triple_screen: {
                    weeklyMACD: (() => {
                        const closesW = weekly.map(d => d.close);
                        const m = macdLast(closesW, 12, 26, 9);
                        return { macd: +m.macd.toFixed(3), signal: +m.signal.toFixed(3), hist: +m.hist.toFixed(3) };
                    })(),
                    weeklyEMA10: +emaLast(weekly.map(d => d.close), 10).toFixed(2),
                    weeklyEMA40: +emaLast(weekly.map(d => d.close), 40).toFixed(2),
                    dailyRSI: +rsiLast(closesD, 14).toFixed(1),
                    dailyStoch: +stochasticK(daily, 14).toFixed(1),
                    dailyATR: +atrLast(daily, 14).toFixed(2)
                }
            } : {}),

            // 2) Elder Impulse
            impulse: {
                ema13: +emaLast(closesD, 13).toFixed(2),
                macdHist: +macdLast(closesD).hist.toFixed(3) // green if ema slope up & hist rising
            },

            // 3) Minervini SEPA (proxy signals)
            sepa: {
              emaAlignment: {
                ema10: +emaLast(closesD, 10).toFixed(2),
                ema20: +emaLast(closesD, 20).toFixed(2),
                ema50: +emaLast(closesD, 50).toFixed(2),
                ema200: +emaLast(closesD, 200).toFixed(2)
              },
              rsProxy: +(closesD[closesD.length - 1] / Math.max(1, sma(closesD, 50))).toFixed(3),
              contraction: +((stddev(closesD, 20) ?? 0) / Math.max(1e-9, sma(closesD, 20))).toFixed(4),
              vcp: detectVCP(daily),                 // NEW: VCP segmentation + pivot
              rsIndexProxy: rsAgainstIndex(closesD)  // NEW: RS vs index (falls back if none)
            },

            // 4) CAN SLIM Cup & Handle (pattern proxies)
            cup_handle: {
                baseDepthPct: this._baseDepthPct(closesD, 35),
                baseLengthBars: 35,
                handleDepthPct: this._handleDepthPct(closesD, 10),
                volUpPct: this._volPctChange(daily, 20)
            },

            // 5) Bollinger Squeeze (percentile-based)
            bb_squeeze_breakout: (() => {
              const sig = bollingerSqueezeSignal(closesD);
              return {
                squeezeOn: !!sig.squeezeOn,
                bbMid: sig.bb?.mid ?? null,
                bbUpper: sig.bb?.upper ?? null,
                bbLower: sig.bb?.lower ?? null,
                bandwidth: sig.bb?.bandwidth ?? null,
                pctB: sig.bb?.pctB ?? null,
                bwNow: sig.bwNow ?? null,
                p10Bandwidth: sig.p10 ?? null
              };
            })(),

            // 6) Keltner Breakout
            keltner_breakout: keltner(daily, 20, 1.5),

            // 7) Darvas Box (renamed)
            darvas_breakout: this._darvasBox(daily, 20),

            // 8) Donchian/Turtle (renamed)
            donchian_breakout20: donchian(daily, 20),
            donchian_breakout55: donchian(daily, 55),

            // 9) RSI Mean Reversion
            rsi_mean: {
                rsi2: +rsiLast(closesD, 2).toFixed(1),
                rsi14: +rsiLast(closesD, 14).toFixed(1),
                bb: bollinger(closesD, 20, 2)
            },

            // 10) Divergence (pivot-aware)
            divergence: divergencePack(daily)
        };

        return pack;
    }

    // ---------------------------
    // Scenario shapers (per system)
    // ---------------------------
    shapeScenario(system, scenario, daily, weekly, intraday) {
        // Minimal adjustments to create recognizable contexts
        switch (system) {
            case SYSTEM_IDS.TRIPLE_SCREEN:
            case SYSTEM_IDS.ELDER_IMPULSE:
            case 'macd_crossover_trend':
                return this._shapeTrendScenario(scenario, daily, intraday);
            case SYSTEM_IDS.MINERVINI_SEPA:
            case 'can_slim':
            case SYSTEM_IDS.CAN_SLIM_CUP_HANDLE:
            case 'high_tight_flag':
                return this._shapeBaseBreakoutScenario(scenario, daily, intraday);
            case SYSTEM_IDS.BB_SQUEEZE_BREAKOUT:
            case SYSTEM_IDS.KELTNER_BREAKOUT:
                return this._shapeVolScenario(scenario, daily);
            case SYSTEM_IDS.DARVAS_BREAKOUT:
            case SYSTEM_IDS.DONCHIAN_BREAKOUT:
                return this._shapeRangeBreakScenario(scenario, daily);
            case SYSTEM_IDS.RSI_MEAN_REVERSION:
            case SYSTEM_IDS.DIVERGENCE:
                return this._shapeMRScenario(scenario, daily);
            default:
                return { daily, weekly, intraday };
        }
    }

    // ===== scenario helpers =====
    _shapeTrendScenario(scenario, daily, intraday) {
        if (scenario === 'bullish_breakout') {
            // Last bar breakout with volume pop
            const last = daily[daily.length - 1];
            const prevH = Math.max(...daily.slice(-20).map(d => d.high));
            last.close = +(prevH * 1.01).toFixed(2);
            last.high = +(prevH * 1.015).toFixed(2);
            last.volume = Math.round(last.volume * 1.8);
        }
        if (scenario === 'bearish_breakdown') {
            const last = daily[daily.length - 1];
            const prevL = Math.min(...daily.slice(-20).map(d => d.low));
            last.close = +(prevL * 0.99).toFixed(2);
            last.low = +(prevL * 0.985).toFixed(2);
            last.volume = Math.round(last.volume * 1.6);
        }
        return { daily, intraday };
    }
    _shapeBaseBreakoutScenario(scenario, daily) {
        if (scenario === 'bullish_breakout') {
            // Compress then break
            for (let i = 10; i > 0; i--) {
                const idx = daily.length - i;
                daily[idx].high = +(daily[idx].high * 0.995).toFixed(2);
                daily[idx].low = +(daily[idx].low * 1.005).toFixed(2); // narrow
                daily[idx].volume = Math.max(1, Math.round(daily[idx].volume * 0.8));
            }
            const last = daily[daily.length - 1];
            const baseHigh = Math.max(...daily.slice(-30).map(d => d.high));
            last.close = +(baseHigh * 1.012).toFixed(2);
            last.high = +(baseHigh * 1.018).toFixed(2);
            last.volume = Math.round(last.volume * 2.2);
        }
        return { daily };
    }
    _shapeVolScenario(scenario, daily) {
        if (scenario === 'bullish_breakout') {
            // super narrow bands then expansion up
            for (let i = 20; i > 2; i--) {
                const idx = daily.length - i;
                const mid = (daily[idx].high + daily[idx].low) / 2;
                daily[idx].high = +(mid * 1.005).toFixed(2);
                daily[idx].low = +(mid * 0.995).toFixed(2);
            }
            const last = daily[daily.length - 1];
            last.close = +(last.high * 1.01).toFixed(2);
            last.volume = Math.round(last.volume * 1.7);
        }
        return { daily };
    }
    _shapeRangeBreakScenario(scenario, daily) {
        if (scenario === 'bullish_breakout') {
            const rng = daily.slice(-25);
            const top = Math.max(...rng.map(d => d.high));
            const last = daily[daily.length - 1];
            last.close = +(top * 1.01).toFixed(2);
            last.high = +(top * 1.015).toFixed(2);
            last.volume = Math.round(last.volume * 1.6);
        }
        if (scenario === 'bearish_breakdown') {
            const rng = daily.slice(-25);
            const bot = Math.min(...rng.map(d => d.low));
            const last = daily[daily.length - 1];
            last.close = +(bot * 0.99).toFixed(2);
            last.low = +(bot * 0.985).toFixed(2);
            last.volume = Math.round(last.volume * 1.5);
        }
        return { daily };
    }
    _shapeMRScenario(scenario, daily) {
        if (scenario === 'bullish_breakout') {
            // create oversold then bounce
            for (let i = 5; i > 0; i--) {
                const idx = daily.length - i;
                daily[idx].close = +(daily[idx].close * 0.985).toFixed(2);
            }
            const last = daily[daily.length - 1];
            last.close = +(last.close * 1.03).toFixed(2);
            last.high = +(last.close * 1.01).toFixed(2);
        }
        return { daily };
    }

    // ---------------------------
    // Pattern proxy utilities
    // ---------------------------
    _baseDepthPct(closes, lookback = 35) {
        if (!closes || closes.length < lookback) return null;
        const cut = closes.slice(-lookback);
        const maxH = Math.max(...cut);
        const minL = Math.min(...cut);
        return +(((maxH - minL) / Math.max(1e-9, maxH)) * 100).toFixed(2);
    }
    _handleDepthPct(closes, lookback = 10) {
        if (!closes || closes.length < lookback) return null;
        const cut = closes.slice(-lookback);
        const maxH = Math.max(...cut);
        const last = cut[cut.length - 1];
        return +(((maxH - last) / Math.max(1e-9, maxH)) * 100).toFixed(2);
    }
    _volPctChange(daily, n = 20) {
        if (!daily || daily.length < n + 1) return null;
        const cur = daily[daily.length - 1].volume || 0;
        const avg = sma(daily.slice(-n).map(d => d.volume || 0), n) || 1;
        return +((cur / avg) * 100).toFixed(1);
    }
    _darvasBox(daily, lookback = 20) {
        if (!daily || daily.length < lookback) return { top: null, bottom: null, isValid: false };
        const chunk = daily.slice(-lookback);
        const top = Math.max(...chunk.map(d => d.high));
        const bottom = Math.min(...chunk.map(d => d.low));
        return { top, bottom, isValid: top > bottom };
    }
    _divergenceProxy(daily, closes) {
        if (!daily || daily.length < 40) return { bullish: false, bearish: false };
        // last two swing points (price vs RSI & MACD)
        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 10];
        const rsiNow = rsiLast(closes, 14);
        const rsiPrev = rsiLast(closes.slice(0, closes.length - 10), 14);
        const macdNow = macdLast(closes).macd;
        const macdPrev = macdLast(closes.slice(0, closes.length - 10)).macd;

        const bullish = last < prev && rsiNow > rsiPrev && macdNow > macdPrev;
        const bearish = last > prev && rsiNow < rsiPrev && macdNow < macdPrev;
        return { bullish, bearish };
    }

    // ---------------------------
    // Public API
    // ---------------------------
    generate({ system = 'triple_screen', scenario = 'neutral', weeks = 52, basePrice = 100, trendSlope = 0.05 } = {}) {
        // 1) series
        const daily = this.generateDaily({ weeks, basePrice, trendSlope });
        const req = requirementsFor(system);
        const weekly = req.needsWeekly ? this.aggregateWeekly(daily) : null;
        const intraday = req.needsIntraday ? this.generateIntraday(daily, { lookbackDays: 10 }) : null;

        // 2) scenario shaping
        this.shapeScenario(system, scenario, daily, weekly, intraday);

        // 3) indicators
        const indicators = this.indicatorsForAll(weekly, daily, intraday, { includeTriple: req.needsWeekly });

        return {
            series: { weekly, daily, intraday },
            indicators,
            meta: {
                market: this.market,
                system,
                scenario,
                weeks,
                dateRange: { start: daily[0]?.date, end: daily[daily.length - 1]?.date }
            }
        };
    }
}

module.exports = { MultiSystemDataGenerator, SYSTEM_IDS };