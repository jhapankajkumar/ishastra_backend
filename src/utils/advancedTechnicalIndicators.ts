import {
    SMA,
    EMA,
    RSI,
    MACD,
    BollingerBands,
    ATR,
    Stochastic,
    ADX
} from 'technicalindicators';
import * as _ from 'lodash';

import {
    TechnicalIndicators,
    IndicatorCalculationConfig,
    EMAIndicators,
    SMAIndicators,
    MACDResult,
    BollingerBandsResult,
    StochasticResult,
    SuperTrendResult,
    DirectionalMovement,
    VolumeIndicators,
    LatestIndicatorValues,
    AISignals,
    TrendSignal,
    MomentumSignal,
    VolumeSignal,
    VolatilitySignal,
    RiskSignal,
    StructureSignal,
    RegimeSignal,
    LiquiditySignal,
    BiasSignal,
    ConvictionSignal,
    SignalAge
} from '../types/technical-analysis';

/**
 * Advanced Technical Indicators for AI Trading System
 * Supports dynamic calculation based on configuration
 */
export class AdvancedTechnicalIndicators {
    /**
     * Calculate technical indicators dynamically based on configuration
     * @param closes - Closing prices
     * @param highs - High prices  
     * @param lows - Low prices
     * @param volumes - Volume data
     * @param config - Configuration object for dynamic calculation
     * @returns Calculated indicators based on configuration
     */
    static calculateAllIndicators(
        closes: number[], 
        highs: number[], 
        lows: number[], 
        volumes: number[], 
        config: IndicatorCalculationConfig = {}
    ): TechnicalIndicators {
        // Default configuration with backward compatibility
        const {
            categories = ['all'],
            include = [],
            exclude = [],
            includeLatest = true,
            includeAiSignals = true
        } = config;

        // Define indicator categories and dependencies
        const indicatorCategories = {
            trend: ['ema', 'sma', 'superTrend', 'adx'],
            momentum: ['rsi', 'macd', 'stochastic'],
            volume: ['volume'],
            volatility: ['bollinger', 'atr'],
            ai: ['aiSignals'],
            latest: ['latest']
        };

        // Define indicator dependencies (what each indicator needs)
        const dependencies: Record<string, string[]> = {
            superTrend: ['atr'],
            adx: ['atr'], // ADX calculation uses ATR as fallback
            aiSignals: ['ema', 'sma', 'rsi', 'macd', 'bollinger', 'atr', 'stochastic', 'superTrend', 'adx', 'volume'],
            latest: ['ema', 'sma', 'rsi', 'macd', 'bollinger', 'atr', 'stochastic', 'superTrend', 'adx', 'volume']
        };

        // Determine which indicators to calculate
        let indicatorsToCalculate = new Set<string>();

        // Add indicators by category
        if (categories.includes('all')) {
            indicatorsToCalculate = new Set(['ema', 'sma', 'rsi', 'macd', 'bollinger', 'atr', 'stochastic', 'superTrend', 'adx', 'volume']);
            if (includeLatest) indicatorsToCalculate.add('latest');
            if (includeAiSignals) indicatorsToCalculate.add('aiSignals');
        } else {
            categories.forEach(category => {
                if (indicatorCategories[category]) {
                    indicatorCategories[category].forEach(indicator => {
                        indicatorsToCalculate.add(indicator);
                    });
                }
            });
        }

        // Add specific includes
        include.forEach(indicator => indicatorsToCalculate.add(indicator));

        // Handle AI signals and latest configuration
        if (!includeAiSignals && indicatorsToCalculate.has('aiSignals')) {
            indicatorsToCalculate.delete('aiSignals');
        }
        if (!includeLatest && indicatorsToCalculate.has('latest')) {
            indicatorsToCalculate.delete('latest');
        }
        if (includeAiSignals && !indicatorsToCalculate.has('aiSignals')) {
            indicatorsToCalculate.add('aiSignals');
        }
        if (includeLatest && !indicatorsToCalculate.has('latest')) {
            indicatorsToCalculate.add('latest');
        }

        // Remove specific excludes
        exclude.forEach(indicator => indicatorsToCalculate.delete(indicator));

        // Resolve dependencies
        const resolvedIndicators = this._resolveDependencies(indicatorsToCalculate, dependencies);

        // Now calculate only the required indicators
        const result: TechnicalIndicators = {};
        const calculatedData: Record<string, any> = {}; // Store intermediate calculations

        // Calculate base indicators first
        if (resolvedIndicators.has('ema')) {
            calculatedData.ema12 = EMA.calculate({ period: 12, values: closes });
            calculatedData.ema20 = EMA.calculate({ period: 20, values: closes });
            calculatedData.ema26 = EMA.calculate({ period: 26, values: closes });
            calculatedData.ema50 = EMA.calculate({ period: 50, values: closes });
            calculatedData.ema200 = EMA.calculate({ period: 200, values: closes });
            calculatedData.ema13 = EMA.calculate({ period: 13, values: closes });
            
            result.ema = { 
                ema12: calculatedData.ema12, 
                ema13: calculatedData.ema13, 
                ema20: calculatedData.ema20, 
                ema26: calculatedData.ema26, 
                ema50: calculatedData.ema50, 
                ema200: calculatedData.ema200 
            };
        }

        if (resolvedIndicators.has('sma')) {
            calculatedData.sma20 = SMA.calculate({ period: 20, values: closes });
            calculatedData.sma50 = SMA.calculate({ period: 50, values: closes });
            result.sma = { sma20: calculatedData.sma20, sma50: calculatedData.sma50 };
        }

        if (resolvedIndicators.has('rsi')) {
            calculatedData.rsi = RSI.calculate({ period: 14, values: closes });
            result.rsi = calculatedData.rsi;
        }

        if (resolvedIndicators.has('macd')) {
            calculatedData.macd = MACD.calculate({
                values: closes,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            });
            result.macd = calculatedData.macd;
        }

        if (resolvedIndicators.has('bollinger')) {
            calculatedData.bollinger = BollingerBands.calculate({
                period: 20,
                values: closes,
                stdDev: 2
            });
            result.bollinger = calculatedData.bollinger;
        }

        if (resolvedIndicators.has('atr')) {
            calculatedData.atr = ATR.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: 14
            });
            result.atr = calculatedData.atr;
        }

        if (resolvedIndicators.has('stochastic')) {
            calculatedData.stochastic = Stochastic.calculate({
                high: highs,
                low: lows,
                close: closes,
                period: 14,
                signalPeriod: 3
            });
            result.stochastic = calculatedData.stochastic;
        }

        if (resolvedIndicators.has('volume')) {
            calculatedData.avgVolume20 = SMA.calculate({ period: 20, values: volumes });
            calculatedData.volumeRatio = volumes.map((vol, idx) => {
                const avgVol = calculatedData.avgVolume20[idx - 19] || calculatedData.avgVolume20[0] || 1;
                return vol / avgVol;
            });
            result.volume = { avgVolume20: calculatedData.avgVolume20, volumeRatio: calculatedData.volumeRatio };
        }

        if (resolvedIndicators.has('superTrend')) {
            calculatedData.superTrend = this.calculateSuperTrend(highs, lows, closes, 10, 3);
            result.superTrend = calculatedData.superTrend;
        }

        if (resolvedIndicators.has('adx')) {
            const adxResult = this._calculateADXWithFallback(highs, lows, closes, calculatedData.atr);
            calculatedData.adxData = adxResult.adxData;
            calculatedData.plusDI = adxResult.plusDI;
            calculatedData.minusDI = adxResult.minusDI;
            
            result.adx = calculatedData.adxData;
            result.directionalMovement = { plusDI: calculatedData.plusDI, minusDI: calculatedData.minusDI };
        }

        if (resolvedIndicators.has('latest')) {
            result.latest = this._buildLatestObject(closes, highs, lows, volumes, calculatedData);
        }

        if (resolvedIndicators.has('aiSignals')) {
            result.aiSignals = this._buildAiSignals(closes, highs, lows, volumes, calculatedData);
        }

        return result;
    }

    /**
     * Helper method to resolve indicator dependencies
     * @private
     */
    private static _resolveDependencies(indicators: Set<string>, dependencies: Record<string, string[]>): Set<string> {
        const resolved = new Set(indicators);
        let changed = true;
        
        while (changed) {
            changed = false;
            for (const indicator of Array.from(resolved)) {
                if (dependencies[indicator]) {
                    for (const dep of dependencies[indicator]) {
                        if (!resolved.has(dep)) {
                            resolved.add(dep);
                            changed = true;
                        }
                    }
                }
            }
        }
        
        return resolved;
    }

    /**
     * Helper method to calculate ADX with fallback
     * @private
     */
    private static _calculateADXWithFallback(
        highs: number[], 
        lows: number[], 
        closes: number[], 
        atr?: number[]
    ): { adxData: number[]; plusDI: number[]; minusDI: number[] } {
        const result = this.getADX(highs, lows, closes);
        return {
            adxData: result.adx,
            plusDI: result.plusDI,
            minusDI: result.minusDI
        };
    }

    /**
     * Helper method to build latest object
     * @private
     */
    private static _buildLatestObject(
        closes: number[], 
        highs: number[], 
        lows: number[], 
        volumes: number[], 
        calculatedData: Record<string, any>
    ): LatestIndicatorValues {
        const latestMacd = calculatedData.macd ? _.last(calculatedData.macd) : undefined;
        const macdValue = latestMacd ? (typeof latestMacd === 'object' && 'MACD' in latestMacd ? Number(latestMacd.MACD) : Number(latestMacd)) : undefined;
        const macdSignal = latestMacd && typeof latestMacd === 'object' && 'signal' in latestMacd ? Number(latestMacd.signal) : 0;

        return {
            price: _.last(closes) || 0,
            ema12: calculatedData.ema12 ? _.last(calculatedData.ema12) : undefined,
            ema13: calculatedData.ema13 ? _.last(calculatedData.ema13) : undefined,
            ema20: calculatedData.ema20 ? _.last(calculatedData.ema20) : undefined,
            ema26: calculatedData.ema26 ? _.last(calculatedData.ema26) : undefined,
            ema50: calculatedData.ema50 ? _.last(calculatedData.ema50) : undefined,
            ema200: calculatedData.ema200 ? _.last(calculatedData.ema200) : undefined,
            rsi: calculatedData.rsi ? _.last(calculatedData.rsi) : undefined,
            macd: macdValue,
            macdSignal,
            bollinger: calculatedData.bollinger ? _.last(calculatedData.bollinger) : undefined,
            atr: calculatedData.atr ? _.last(calculatedData.atr) : undefined,
            stochastic: calculatedData.stochastic ? _.last(calculatedData.stochastic) : undefined,
            adx: calculatedData.adxData ? (_.last(calculatedData.adxData) || 25) : undefined,
            plusDI: calculatedData.plusDI ? (_.last(calculatedData.plusDI) || 25) : undefined,
            minusDI: calculatedData.minusDI ? (_.last(calculatedData.minusDI) || 25) : undefined,
            superTrend: calculatedData.superTrend ? (_.last(calculatedData.superTrend) || { value: _.last(closes) || 0, trend: 'UP' as const }) : undefined,
            volume: _.last(volumes) || 0,
            volumeRatio: calculatedData.volumeRatio ? _.last(calculatedData.volumeRatio) : undefined,
            avgVolume: calculatedData.avgVolume20 ? (_.last(calculatedData.avgVolume20) || 0) : undefined,
            avgVolume20DMA: calculatedData.avgVolume20 ? (_.last(calculatedData.avgVolume20) || 0) : undefined,
            vol20dma: calculatedData.avgVolume20 ? (_.last(calculatedData.avgVolume20) || 0) : undefined,
            resistance: null,
            support: null
        };
    }

    /**
     * Helper method to build AI signals
     * @private
     */
    private static _buildAiSignals(
        closes: number[], 
        highs: number[], 
        lows: number[], 
        volumes: number[], 
        calculatedData: Record<string, any>
    ): AISignals {
        return {
            timestamp: new Date().toISOString(),
            trend: this.calculateTrendSignal(closes, calculatedData.ema12, calculatedData.ema20, calculatedData.ema50, calculatedData.ema200, calculatedData.adxData, calculatedData.superTrend),
            momentum: this.calculateMomentumSignal(calculatedData.rsi, calculatedData.macd, calculatedData.stochastic),
            volume: this.calculateVolumeSignal(volumes, calculatedData.volumeRatio, calculatedData.avgVolume20),
            volatility: this.calculateVolatilitySignal(calculatedData.atr, calculatedData.bollinger, closes),
            risk: this.calculateRiskSignal(closes, calculatedData.ema200, calculatedData.atr, calculatedData.rsi),
            structure: this.calculateStructureSignal(closes, highs, lows, calculatedData.bollinger, calculatedData.superTrend),
            regime: this.calculateRegimeSignal(closes, calculatedData.ema50, calculatedData.ema200, calculatedData.adxData, calculatedData.volumeRatio),
            liquidity: this.calculateLiquiditySignal(volumes, calculatedData.volumeRatio, calculatedData.avgVolume20, calculatedData.atr),
            bias: this.calculateBiasSignal(closes, calculatedData.ema12, calculatedData.ema20, calculatedData.ema50, calculatedData.superTrend, calculatedData.plusDI, calculatedData.minusDI),
            conviction: this.calculateConvictionSignal(calculatedData.adxData, calculatedData.volumeRatio, calculatedData.rsi, calculatedData.macd, calculatedData.superTrend),
            lastUpdated: new Date().toISOString(),
            signalAge: this.calculateSignalAge(),
            conflicts: this.detectSignalConflicts(_.last(calculatedData.rsi), _.last(calculatedData.macd), _.last(closes), _.last(calculatedData.ema20))
        };
    }

    // Signal calculation methods implementation

    /**
     * Calculate trend signal: Supertrend + EMA consensus
     */
    static calculateTrendSignal(closes: number[], ema12: number[], ema20: number[], ema50: number[], ema200: number[], adx: number[], superTrend: SuperTrendResult[]): TrendSignal {
        const last = (arr: any[], n = 1) => arr.slice(-n);
        const currentPrice = _.last(closes) || 0;
        const [e12, e20, e50, e200] = [_.last(ema12), _.last(ema20), _.last(ema50), _.last(ema200)];
        const stNow = _.last(superTrend) || { value: currentPrice, trend: 'UP' as const };

        if (!e12 || !e20 || !e50 || !e200) return 'SIDEWAYS';

        // Tiny hysteresis buffers to avoid flip-flops
        const bufTight = 0.002; // 0.2%
        const priceAbove = (p: number, ref: number, buf = bufTight) => p > ref * (1 + buf);
        const priceBelow = (p: number, ref: number, buf = bufTight) => p < ref * (1 - buf);

        // Alignment (with buffer on boundaries)
        const bullishAlignment = e12 > e20 && e20 > e50 && e50 > e200;
        const bearishAlignment = e12 < e20 && e20 < e50 && e50 < e200;

        const aboveShorts = priceAbove(currentPrice, e12) && priceAbove(currentPrice, e20) && priceAbove(currentPrice, e50);
        const belowShorts = priceBelow(currentPrice, e12) && priceBelow(currentPrice, e20) && priceBelow(currentPrice, e50);

        // Slopes over last 3 bars to ensure trend is current, not stale
        const slopeUp = (arr: number[]) => arr.length >= 4 && _.last(arr)! > arr[arr.length - 2] && arr[arr.length - 2] > arr[arr.length - 3];
        const slopeDn = (arr: number[]) => arr.length >= 4 && _.last(arr)! < arr[arr.length - 2] && arr[arr.length - 2] < arr[arr.length - 3];

        const e12Up = slopeUp(ema12), e20Up = slopeUp(ema20), e50Up = slopeUp(ema50), e200Up = slopeUp(ema200);
        const e12Dn = slopeDn(ema12), e20Dn = slopeDn(ema20), e50Dn = slopeDn(ema50), e200Dn = slopeDn(ema200);

        // ADX smoothing (median of last 3)
        const adx3 = last(adx || [], 3);
        const adxMed = adx3.length ? adx3.sort((a, b) => a - b)[Math.floor(adx3.length / 2)] : 25;
        const strongTrend = adxMed > 25;
        const veryStrongTrend = adxMed > 35;

        // Supertrend persistence: require same side for ≥2 bars
        const st3 = last(superTrend || [], 3);
        const stUpPersist = st3.length >= 2 && st3.slice(-2).every(s => s.trend === 'UP') && priceAbove(currentPrice, stNow.value, 0);
        const stDnPersist = st3.length >= 2 && st3.slice(-2).every(s => s.trend === 'DOWN') && priceBelow(currentPrice, stNow.value, 0);

        // Regime guard vs EMA200
        const above200 = priceAbove(currentPrice, e200, 0);
        const below200 = priceBelow(currentPrice, e200, 0);

        // Decision matrix
        // Strong UP
        if (bullishAlignment && aboveShorts && above200 && stUpPersist && veryStrongTrend && (e20Up || e50Up)) {
            return 'STRONG_UP';
        }
        // Moderate UP
        if (bullishAlignment && aboveShorts && stUpPersist && strongTrend && (e12Up || e20Up)) {
            return above200 ? 'MODERATE_UP' : 'WEAK_UP';
        }
        // Strong DOWN
        if (bearishAlignment && belowShorts && below200 && stDnPersist && veryStrongTrend && (e20Dn || e50Dn)) {
            return 'STRONG_DOWN';
        }
        // Moderate DOWN
        if (bearishAlignment && belowShorts && stDnPersist && strongTrend && (e12Dn || e20Dn)) {
            return below200 ? 'MODERATE_DOWN' : 'WEAK_DOWN';
        }

        // Weak confirmations
        if (priceAbove(currentPrice, e20) && e20 > e50 && stUpPersist && (e12Up || e20Up)) return 'WEAK_UP';
        if (priceBelow(currentPrice, e20) && e20 < e50 && stDnPersist && (e12Dn || e20Dn)) return 'WEAK_DOWN';

        return 'SIDEWAYS';
    }

    static calculateMomentumSignal(rsi: number[], macd: MACDResult[], stochastic: StochasticResult[]): MomentumSignal {
        // Guard rails
        if (!Array.isArray(rsi) || rsi.length < 3 ||
            !Array.isArray(macd) || macd.length < 3 ||
            !Array.isArray(stochastic) || stochastic.length < 3) {
            return 'NEUTRAL';
        }

        const last = (arr: any[], n = 1) => arr.slice(-n);
        const [r0, r1] = last(rsi, 2); // r0 = current, r1 = prev
        const [m0, m1] = last(macd, 2);
        const [s0, s1] = last(stochastic, 2);

        const macdVal0 = (m0 as any)?.MACD ?? m0 ?? 0;
        const macdSig0 = (m0 as any)?.signal ?? 0;
        const macdHist0 = (m0 as any)?.histogram ?? (macdVal0 - macdSig0);

        const macdVal1 = (m1 as any)?.MACD ?? m1 ?? 0;
        const macdSig1 = (m1 as any)?.signal ?? 0;
        const macdHist1 = (m1 as any)?.histogram ?? (macdVal1 - macdSig1);

        const k0 = (s0 as any)?.k ?? 50, d0 = (s0 as any)?.d ?? 50;
        const k1 = (s1 as any)?.k ?? 50, d1 = (s1 as any)?.d ?? 50;

        // Cross detection
        const macdCrossUp = (macdVal1 <= macdSig1) && (macdVal0 > macdSig0);
        const macdCrossDown = (macdVal1 >= macdSig1) && (macdVal0 < macdSig0);

        const stochCrossUp = (k1 <= d1) && (k0 > d0);
        const stochCrossDown = (k1 >= d1) && (k0 < d0);

        // Momentum slope / persistence
        const histRising = macdHist0 > macdHist1;
        const histFalling = macdHist0 < macdHist1;
        const rsiRising = r0 > r1 + 0.5;
        const rsiFalling = r0 < r1 - 0.5;

        // Zones & buffers
        const rsiOversold = r0 < 30;
        const rsiOverbought = r0 > 70;
        const rsiBullish = r0 > 50 && r0 < 70;
        const rsiBearish = r0 < 50 && r0 > 30;
        const rsiNeutral = r0 >= 45 && r0 <= 55;

        const stochOversold = k0 < 20 && d0 < 25;
        const stochOverbought = k0 > 80 && d0 > 75;

        // Adaptive histogram threshold
        const recentH = last(macd.map(x => ((x as any)?.histogram ?? (((x as any)?.MACD ?? x ?? 0) - ((x as any)?.signal ?? 0)))), 12);
        const absH = recentH.map(h => Math.abs(h));
        const medAbs = absH.sort((a, b) => a - b)[Math.floor(absH.length / 2)] || 0.08;
        const hThresh = Math.max(0.08, medAbs * 0.6);

        const macdBullish = (macdVal0 > macdSig0) && (macdHist0 > hThresh);
        const macdBearish = (macdVal0 < macdSig0) && (macdHist0 < -hThresh);

        // Combined logic
        if (macdCrossUp && histRising && (rsiOversold || rsiRising) && (stochOversold || stochCrossUp)) {
            return 'BULLISH_CROSS';
        }
        if (macdCrossDown && histFalling && (rsiOverbought || rsiFalling) && (stochOverbought || stochCrossDown)) {
            return 'BEARISH_CROSS';
        }

        if (macdBullish && histRising && rsiBullish && k0 > d0 && k0 > 50) {
            return 'BUILDING_BULL';
        }
        if (macdBearish && histFalling && rsiBearish && k0 < d0 && k0 < 50) {
            return 'BUILDING_BEAR';
        }

        if (rsiOverbought && stochOverbought && !histRising) {
            return 'EXHAUSTED_BULL';
        }
        if (rsiOversold && stochOversold && !histFalling) {
            return 'EXHAUSTED_BEAR';
        }

        if (rsiNeutral && Math.abs(macdHist0) < hThresh * 0.6) {
            return 'MOMENTUM_PAUSE';
        }

        return 'NEUTRAL';
    }

    static calculateVolumeSignal(volumes: number[], volumeRatio: number[], avgVolume20: number[]): VolumeSignal {
        if (!Array.isArray(volumes) || volumes.length < 5 ||
            !Array.isArray(volumeRatio) || volumeRatio.length < 5 ||
            !Array.isArray(avgVolume20) || avgVolume20.length < 5) {
            return 'NORMAL';
        }

        const rNow = _.last(volumeRatio) || 1;

        const lastN = (arr: number[], n: number) => arr.slice(-n);
        const rec5 = lastN(volumeRatio, 5).filter(x => Number.isFinite(x));
        const rec3 = lastN(volumeRatio, 3).filter(x => Number.isFinite(x));

        const median = (arr: number[]) => {
            const a = [...arr].sort((x, y) => x - y);
            const i = Math.floor(a.length / 2);
            return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
        };

        const rMed5 = rec5.length ? median(rec5) : rNow;
        const rAvg3 = rec3.length ? rec3.reduce((s, x) => s + x, 0) / rec3.length : rNow;

        const veryDry = rNow < 0.35 && rMed5 < 0.5;
        const dry = rNow < 0.6 && rMed5 < 0.8;

        // Decision ladder
        if (rNow >= 3.0 && rAvg3 >= 2.0) return 'BREAKOUT_VOLUME';
        if (rNow >= 2.5 && rAvg3 >= 1.6) return 'HIGH_CONVICTION';
        if (rNow >= 1.8 && rAvg3 >= 1.5) return 'ACCUMULATION';
        if (rNow >= 1.2 && rNow < 1.8) return 'MODERATE_INTEREST';
        if (veryDry) return 'VOLUME_DRY_UP';
        if (dry && rAvg3 < 0.8) return 'LOW_INTEREST';
        if (rNow <= 0.45 && rAvg3 <= 0.7) return 'DISTRIBUTION';

        return 'NORMAL';
    }

    static calculateVolatilitySignal(atr: number[], bollinger: BollingerBandsResult[], closes: number[]): VolatilitySignal {
        if (!Array.isArray(atr) || !atr.length ||
            !Array.isArray(bollinger) || !bollinger.length ||
            !Array.isArray(closes) || closes.length < 15) {
            return 'MODERATE';
        }

        const safe = (x: any, d = 0) => (Number.isFinite(x) ? x : d);
        const currentAtr = safe(_.last(atr), 0);
        const currentPrice = safe(_.last(closes), 1);
        const currentBB = _.last(bollinger);

        const atrPercent = safe((currentAtr / currentPrice) * 100, 0);

        let bbWidth = 0;
        if (currentBB && Number.isFinite((currentBB as any).upper) && Number.isFinite((currentBB as any).lower) && Number.isFinite((currentBB as any).middle) && (currentBB as any).middle !== 0) {
            bbWidth = safe((((currentBB as any).upper - (currentBB as any).lower) / (currentBB as any).middle) * 100, 0);
        }

        const atrSMA10 = safe(atr.slice(-10).reduce((s, x) => s + safe(x, 0), 0) / Math.max(1, Math.min(10, atr.length)), 0);
        const atrExpanding = currentAtr > atrSMA10 * 1.18;
        const atrContract = currentAtr < atrSMA10 * 0.85;

        // Decision ladder
        if (atrPercent > 4.0 && atrExpanding) return 'EXPLOSIVE';
        if (atrPercent > 3.0 || bbWidth > 8) return 'EXPANDING';
        if (atrPercent > 2.0) return 'HIGH';
        if (atrPercent < 1.0 && bbWidth <= 4 && atrContract) return 'COMPRESSING';
        if (atrPercent < 1.5 && bbWidth < 4) return 'LOW';

        return 'MODERATE';
    }

    static calculateRiskSignal(closes: number[], ema200: number[], atr: number[], rsi: number[]): RiskSignal {
        if (!Array.isArray(closes) || closes.length < 30 ||
            !Array.isArray(ema200) || ema200.length < 1 ||
            !Array.isArray(atr) || atr.length < 15 ||
            !Array.isArray(rsi) || rsi.length < 1) {
            return 'BALANCED';
        }

        const px = _.last(closes) || 0;
        const e200 = _.last(ema200) || px;
        const aNow = _.last(atr) || 0;
        const rNow = _.last(rsi) || 50;

        if (!Number.isFinite(px) || px <= 0) return 'BALANCED';

        const ema200Distance = Number.isFinite(e200) && e200 !== 0 ? ((px - e200) / e200) * 100 : 0;
        const atrRisk = (aNow / px) * 100;

        const rsiExtreme = rNow >= 80 || rNow <= 20;
        const rsiModerate = rNow >= 70 || rNow <= 30;

        const buf = 0.2;
        const wellAbove200 = ema200Distance > 10 + buf;
        const wellBelow200 = ema200Distance < -10 - buf;
        const near200 = Math.abs(ema200Distance) < 3 - buf;

        // Decision ladder
        if (rsiExtreme && atrRisk > 4) {
            if (wellBelow200) return 'HIGH_BREAKDOWN_RISK';
            if (wellAbove200) return 'HIGH_MOMENTUM_RISK';
            return 'EXTREME_LEVELS';
        }

        if (atrRisk > 5) return 'HIGH_VOLATILITY';
        if (rsiExtreme && atrRisk > 3) return 'EXTREME_LEVELS';
        if (near200 && atrRisk < 2.0 && !rsiModerate) return 'LOW_EARNINGS_SAFE';
        if (wellAbove200 && atrRisk < 2.5) return 'MODERATE_UPTREND';
        if (wellBelow200 && atrRisk < 2.5) return 'MODERATE_DOWNTREND';
        if (rsiModerate) return 'OVERBOUGHT_OVERSOLD';

        return 'BALANCED';
    }

    static calculateStructureSignal(closes: number[], highs: number[], lows: number[], bollinger: BollingerBandsResult[], superTrend: SuperTrendResult[]): StructureSignal {
        const n = closes.length;
        if (n < 15) return 'NEUTRAL';

        const currentPrice = _.last(closes) || 0;
        const currentBB = _.last(bollinger);
        const currentST = _.last(superTrend) || { value: currentPrice, trend: 'UP' as const };

        const recentHighs = highs.slice(-10);
        const recentLows = lows.slice(-10);
        const priceRangePct = ((Math.max(...recentHighs) - Math.min(...recentLows)) / Math.max(1, Math.min(...recentLows))) * 100;

        let bbPosition = 'MIDDLE';
        if (currentBB) {
            const bb = currentBB as any;
            if (currentPrice > bb.upper) bbPosition = 'UPPER_BREAKOUT';
            else if (currentPrice < bb.lower) bbPosition = 'LOWER_BREAKDOWN';
            else if (currentPrice > bb.middle + (bb.upper - bb.middle) * 0.7) bbPosition = 'UPPER_BAND';
            else if (currentPrice < bb.middle - (bb.middle - bb.lower) * 0.7) bbPosition = 'LOWER_BAND';
        }

        const stBullConfirm = currentST.trend === 'UP' && currentPrice > currentST.value;
        const stBearConfirm = currentST.trend === 'DOWN' && currentPrice < currentST.value;

        const last2 = closes.slice(-2);
        const aboveUpper = currentBB && last2.every(p => p > (currentBB as any).upper);
        const belowLower = currentBB && last2.every(p => p < (currentBB as any).lower);

        // Decision ladder
        if (aboveUpper && stBullConfirm) return 'BREAKOUT';
        if (belowLower && stBearConfirm) return 'BREAKDOWN';
        if (priceRangePct < 2 && bbPosition === 'MIDDLE') return 'CONSOLIDATION';
        if (bbPosition === 'UPPER_BAND') return stBullConfirm ? 'RESISTANCE_TEST' : 'FAKE_BREAKOUT';
        if (bbPosition === 'LOWER_BAND') return stBearConfirm ? 'SUPPORT_TEST' : 'FAKE_BREAKDOWN';
        if (priceRangePct > 5) return 'VOLATILE_RANGE';

        return 'NEUTRAL';
    }

    static calculateRegimeSignal(closes: number[], ema50: number[], ema200: number[], adx: number[], volumeRatio: number[]): RegimeSignal {
        const n = closes?.length || 0;
        if (n < 90 || ema50.length < 5 || ema200.length < 5) return 'TRANSITION';

        const px = _.last(closes) || 0;
        const e50 = _.last(ema50) || 0;
        const e200 = _.last(ema200) || 0;

        const last = (arr: any[], k: number) => arr.slice(-k);
        const median = (arr: number[]) => {
            const a = [...arr].filter(Number.isFinite).sort((x, y) => x - y);
            if (!a.length) return 0;
            const i = Math.floor(a.length / 2);
            return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
        };

        const ema50Above200 = last(ema50, 3).every((v: number, i: number) => v > ema200[ema200.length - 3 + i]);
        const ema50Below200 = last(ema50, 3).every((v: number, i: number) => v < ema200[ema200.length - 3 + i]);
        const priceAbove50 = last(closes, 3).every((p: number) => p > e50);
        const priceBelow50 = last(closes, 3).every((p: number) => p < e50);

        const bullishRegime = ema50Above200 && priceAbove50;
        const bearishRegime = ema50Below200 && priceBelow50;

        const adxMed3 = median(last(adx || [25], Math.min(3, (adx || []).length)));
        const volMed5 = median(last(volumeRatio || [1], Math.min(5, (volumeRatio || []).length)));

        const trending = adxMed3 > 22;
        const strongTrend = adxMed3 > 32;
        const strongVolume = volMed5 > 1.2;

        const closes90 = closes.slice(-90);
        const ret90 = closes90.length > 1 ? (px / closes90[0] - 1) * 100 : 0;

        if (bullishRegime && strongTrend && strongVolume && ret90 > 8) return 'BULL';
        if (bearishRegime && strongTrend && strongVolume && ret90 < -8) return 'BEAR';
        if (bullishRegime && trending) return 'BULL_WEAK';
        if (bearishRegime && trending) return 'BEAR_WEAK';
        if (!trending || adxMed3 < 18) return 'SIDEWAYS';

        return 'TRANSITION';
    }

    static calculateLiquiditySignal(volumes: number[], volumeRatio: number[], avgVolume20: number[], atr: number[]): LiquiditySignal {
        if (!Array.isArray(volumes) || volumes.length < 5 ||
            !Array.isArray(volumeRatio) || volumeRatio.length < 5 ||
            !Array.isArray(avgVolume20) || avgVolume20.length < 5) {
            return 'NORMAL';
        }

        const lastN = (arr: number[], n: number) => arr.slice(-n).filter(Number.isFinite);
        const median = (arr: number[]) => {
            const a = [...arr].sort((x, y) => x - y);
            const i = Math.floor(a.length / 2);
            return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
        };

        const rNow = _.last(volumeRatio) || 1;
        const rMed5 = median(lastN(volumeRatio, 5));
        const rMed10 = median(lastN(volumeRatio, 10));
        const rAvg3 = lastN(volumeRatio, 3).reduce((s, x) => s + x, 0) / Math.max(1, lastN(volumeRatio, 3).length);

        const recent = lastN(volumeRatio, 5);
        const consistency = recent.length ? recent.filter(r => r >= 0.8).length / recent.length : 0;

        const veryDry = rNow < 0.35 && rMed5 < 0.5;
        const dry = rNow < 0.6 && rMed5 < 0.8;

        // Decision ladder
        if ((rNow >= 3.0 && rAvg3 >= 2.0) || (rMed5 >= 2.2 && rMed10 >= 1.8)) return 'HIGH';
        if ((rNow >= 2.0 && rAvg3 >= 1.6 && consistency >= 0.6) || (rMed5 >= 1.6 && rMed10 >= 1.3)) return 'GOOD';
        if ((rNow >= 1.2 && rNow < 2.0) || (rMed5 >= 1.1 && rMed10 >= 1.0)) return 'MODERATE';
        if (veryDry) return 'POOR';
        if (dry || consistency < 0.2) return 'LOW';

        return 'NORMAL';
    }

    static calculateBiasSignal(closes: number[], ema12: number[], ema20: number[], ema50: number[], superTrend: SuperTrendResult[], plusDI: number[], minusDI: number[]): BiasSignal {
        const currentPrice = _.last(closes) || 0;
        const currentEma12 = _.last(ema12) || 0;
        const currentEma20 = _.last(ema20) || 0;
        const currentEma50 = _.last(ema50) || 0;
        const currentST = _.last(superTrend) || { value: currentPrice, trend: 'UP' as const };
        const currentPlusDI = _.last(plusDI) || 25;
        const currentMinusDI = _.last(minusDI) || 25;

        const diSignal = currentPlusDI > currentMinusDI ? 'BULLISH' : 'BEARISH';
        const emaUptrend = currentEma12 > currentEma20 && currentEma20 > currentEma50;
        const emaDowntrend = currentEma12 < currentEma20 && currentEma20 < currentEma50;
        const stBias = currentST.trend === 'UP' && currentPrice > currentST.value ? 'BULLISH' : 'BEARISH';
        const priceAboveEMAs = currentPrice > currentEma12 && currentPrice > currentEma20;
        const priceBelowEMAs = currentPrice < currentEma12 && currentPrice < currentEma20;

        const bullishSignals = [
            emaUptrend,
            diSignal === 'BULLISH',
            stBias === 'BULLISH',
            priceAboveEMAs
        ].filter(Boolean).length;

        const bearishSignals = [
            emaDowntrend,
            diSignal === 'BEARISH',
            stBias === 'BEARISH',
            priceBelowEMAs
        ].filter(Boolean).length;

        if (bullishSignals >= 3) return 'LONG';
        if (bearishSignals >= 3) return 'SHORT';
        if (bullishSignals > bearishSignals) return 'LONG_LEAN';
        if (bearishSignals > bullishSignals) return 'SHORT_LEAN';

        return 'NEUTRAL';
    }

    static calculateConvictionSignal(adx: number[], volumeRatio: number[], rsi: number[], macd: MACDResult[], superTrend: SuperTrendResult[]): ConvictionSignal {
        const last = (arr: any[], n = 1) => (Array.isArray(arr) ? arr.slice(-n) : []);
        const safeNum = (x: any, d = 0) => (Number.isFinite(x) ? x : d);
        const med = (arr: number[]) => {
            const a = (arr || []).filter(Number.isFinite).slice().sort((x, y) => x - y);
            if (!a.length) return 0;
            const i = Math.floor(a.length / 2);
            return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
        };

        const adxNow = safeNum(_.last(adx), 25);
        const vrNow = safeNum(_.last(volumeRatio), 1);
        const rsiNow = safeNum(_.last(rsi), 50);
        const macdNow = _.last(macd) || {};
        const histNow = safeNum((macdNow as any).histogram ?? (((macdNow as any).MACD ?? 0) - ((macdNow as any).signal ?? 0)), 0);

        const st3 = last(superTrend || [], 3);
        const stPersistUp = st3.length >= 2 && st3.slice(-2).every((s: any) => s?.trend === 'UP');
        const stPersistDown = st3.length >= 2 && st3.slice(-2).every((s: any) => s?.trend === 'DOWN');
        const stConsistent = stPersistUp || stPersistDown;

        const adxHist = last(adx, 20).filter(Number.isFinite);
        const vrHist = last(volumeRatio, 20).filter(Number.isFinite);
        const histHist = last((macd || []).map(m => safeNum((m as any)?.histogram ?? (((m as any)?.MACD ?? 0) - ((m as any)?.signal ?? 0)), 0)), 20);

        const adxMed = med(adxHist) || 20;
        const vrMed = med(vrHist) || 1;
        const absHistMed = med(histHist.map(Math.abs)) || 0.08;

        const adxStrong = adxNow >= Math.max(28, adxMed + 5);
        const adxModerate = adxNow >= Math.max(22, adxMed);
        const vrStrong = vrNow >= Math.max(1.6, vrMed * 1.3);
        const vrModerate = vrNow >= Math.max(1.2, vrMed * 1.1);
        const histStrong = Math.abs(histNow) >= Math.max(0.45, absHistMed * 1.25);
        const histModerate = Math.abs(histNow) >= Math.max(0.20, absHistMed * 0.75);

        const rsiHealthy = rsiNow > 35 && rsiNow < 75;
        const rsiModerate = rsiNow > 30 && rsiNow < 80;
        const rsiExtreme = rsiNow >= 80 || rsiNow <= 20;

        let score = 0;
        if (adxStrong) score += 0.25;
        else if (adxModerate) score += 0.15;
        if (vrStrong) score += 0.20;
        else if (vrModerate) score += 0.12;
        if (histStrong) score += 0.20;
        else if (histModerate) score += 0.12;
        if (rsiHealthy) score += 0.15;
        else if (rsiModerate) score += 0.08;
        if (rsiExtreme) score -= 0.10;
        if (stConsistent) score += 0.15;
        else score += 0.05;

        score = Math.max(0, Math.min(1, score));

        if (score >= 0.75) return 'STRONG';
        if (score >= 0.55) return 'MODERATE';
        if (score >= 0.38) return 'WEAK';
        if (score >= 0.22) return 'LOW';
        return 'NONE';
    }

    static calculateSignalAge(): SignalAge {
        return 'FRESH';
    }

    static detectSignalConflicts(rsi: number, macd: MACDResult, price: number, ema20: number): string[] {
        const conflicts: string[] = [];

        const safeNum = (x: any, d = 0) => (Number.isFinite(x) ? x : d);
        const r = safeNum(rsi, 50);
        const macdVal = safeNum((macd as any)?.MACD, 0);
        const macdSig = safeNum((macd as any)?.signal, 0);
        const px = safeNum(price, 0);
        const e20 = safeNum(ema20, px);

        let rsiSignal = 'NEUTRAL';
        if (r >= 70) rsiSignal = 'BEARISH';
        else if (r <= 30) rsiSignal = 'BULLISH';
        else if (r >= 55) rsiSignal = 'WEAK_BEAR';
        else if (r <= 45) rsiSignal = 'WEAK_BULL';

        const macdSignal = macdVal > macdSig ? 'BULLISH' : 'BEARISH';
        const priceVsEma = px > e20 ? 'BULLISH' : 'BEARISH';

        if (
            (rsiSignal.startsWith('BULL') && macdSignal === 'BEARISH') ||
            (rsiSignal.startsWith('BEAR') && macdSignal === 'BULLISH')
        ) {
            conflicts.push('RSI_MACD_DIVERGENCE');
        }

        if (rsiSignal !== 'NEUTRAL' && !rsiSignal.includes(priceVsEma)) {
            conflicts.push('PRICE_MOMENTUM_DIVERGENCE');
        }

        if (macdSignal !== priceVsEma) {
            conflicts.push('MACD_PRICE_DIVERGENCE');
        }

        if (conflicts.length >= 2) {
            conflicts.push('HIGH_CONFLICT_ENVIRONMENT');
        }

        return conflicts;
    }

    static calculateSuperTrend(highs: number[], lows: number[], closes: number[], period: number = 10, multiplier: number = 3): SuperTrendResult[] {
        if (!Array.isArray(highs) || !Array.isArray(lows) || !Array.isArray(closes)) return [];
        const n = Math.min(highs.length, lows.length, closes.length);
        if (n === 0) return [];

        const atrArr = ATR.calculate({ high: highs.slice(0, n), low: lows.slice(0, n), close: closes.slice(0, n), period });

        const result = new Array(n);
        const buf = 0.001;

        let trend: 'UP' | 'DOWN' | null = null;
        let prevFinalUpper: number | null = null;
        let prevFinalLower: number | null = null;

        for (let i = 0; i < n; i++) {
            if (i < period - 1) {
                result[i] = { value: closes[i], trend: 'UP' as const };
                continue;
            }

            const atrIdx = i - (period - 1);
            const atrVal = atrArr[atrIdx] ?? atrArr[atrArr.length - 1] ?? 0;

            const hl2 = (highs[i] + lows[i]) / 2;
            const basicUpper = hl2 + multiplier * atrVal;
            const basicLower = hl2 - multiplier * atrVal;

            const prev = result[i - 1];
            const prevClose = closes[i - 1];
            const curClose = closes[i];

            const finalUpper =
                (prevFinalUpper === null || prevClose > prevFinalUpper)
                    ? basicUpper
                    : Math.min(basicUpper, prevFinalUpper);

            const finalLower =
                (prevFinalLower === null || prevClose < prevFinalLower)
                    ? basicLower
                    : Math.max(basicLower, prevFinalLower);

            if (trend === null) {
                trend = (curClose >= finalLower) ? 'UP' : 'DOWN';
            }

            if (trend === 'UP') {
                if (curClose < finalLower * (1 - buf)) {
                    trend = 'DOWN';
                    result[i] = { value: finalUpper, trend };
                } else {
                    result[i] = { value: finalLower, trend };
                }
            } else {
                if (curClose > finalUpper * (1 + buf)) {
                    trend = 'UP';
                    result[i] = { value: finalLower, trend };
                } else {
                    result[i] = { value: finalUpper, trend };
                }
            }

            prevFinalUpper = finalUpper;
            prevFinalLower = finalLower;
        }

        return result;
    }

    /**
     * Enhanced ADX calculation with robust error handling and fallbacks
     * @param highs - High prices
     * @param lows - Low prices  
     * @param closes - Closing prices
     * @returns ADX data with directional indicators
     */
    static getADX(highs: number[], lows: number[], closes: number[]): { adx: number[]; plusDI: number[]; minusDI: number[] } {
        let adxData: number[] = [], plusDI: number[] = [], minusDI: number[] = [];
        
        try {
            if (!Array.isArray(highs) || !Array.isArray(lows) || !Array.isArray(closes)) {
                throw new Error('Inputs not arrays');
            }
            if (highs.length !== lows.length || lows.length !== closes.length) {
                throw new Error(`Length mismatch H:${highs.length} L:${lows.length} C:${closes.length}`);
            }
            if (closes.length < Math.max(28, 2 * 14)) {
                throw new Error(`Insufficient data: ${closes.length} (<28)`);
            }

            // Sanitize inputs (strip non-finite)
            const isNum = (v: any) => Number.isFinite(v);
            const H: number[] = [], L: number[] = [], C: number[] = [];
            for (let i = 0; i < closes.length; i++) {
                const h = Number(highs[i]), l = Number(lows[i]), c = Number(closes[i]);
                if (isNum(h) && isNum(l) && isNum(c)) { H.push(h); L.push(l); C.push(c); }
            }

            if (H.length < 28) throw new Error(`After sanitize, length=${H.length}`);

            // Verify library export
            if (!ADX || (typeof ADX.calculate !== 'function' && typeof ADX !== 'function')) {
                throw new Error('ADX export missing or incompatible');
            }

            // Calculate
            const adxResults = typeof ADX.calculate === 'function'
                ? ADX.calculate({ high: H, low: L, close: C, period: 14 })
                : (ADX as any)({ high: H, low: L, close: C, period: 14 });

            if (!Array.isArray(adxResults) || adxResults.length === 0) {
                throw new Error('ADX returned empty array');
            }

            // Map results; ignore warm-up NaNs without throwing
            const a: number[] = [], p: number[] = [], m: number[] = [];
            for (const r of adxResults) {
                const adxVal = Number((r as any)?.adx);
                const pdi = Number((r as any)?.pdi ?? (r as any)?.PDI);
                const mdi = Number((r as any)?.mdi ?? (r as any)?.MDI);
                a.push(Number.isFinite(adxVal) ? adxVal : NaN);
                p.push(Number.isFinite(pdi) ? pdi : NaN);
                m.push(Number.isFinite(mdi) ? mdi : NaN);
            }

            // If last values are NaN (warm-up), backfill from recent finite
            const lastFinite = (arr: number[]) => {
                for (let i = arr.length - 1; i >= 0; i--) if (Number.isFinite(arr[i])) return arr[i];
                return NaN;
            };
            if (!Number.isFinite(lastFinite(a))) throw new Error('All ADX values NaN after calc');

            adxData = a;
            plusDI = p;
            minusDI = m;

        } catch (e: any) {
            console.error(`ADX calc failed → ${e.message}. Using proxy.`);
            // Proxy fallback
            const atrVals = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 }) || [];
            if (atrVals.length) {
                adxData = atrVals.map((atr, i) => {
                    const px = closes[Math.min(i + 13, closes.length - 1)];
                    const atrPct = Number.isFinite(px) && px > 0 ? (atr / px) * 100 : 0;
                    return Math.max(10, Math.min(60, atrPct * 6));
                });

                plusDI = [];
                minusDI = [];
                for (let i = 14; i < closes.length; i++) {
                    let up = 0, dn = 0;
                    for (let k = i - 13; k <= i; k++) {
                        if (closes[k] > closes[k - 1]) up++;
                        else if (closes[k] < closes[k - 1]) dn++;
                    }
                    plusDI.push((up / 13) * 100);
                    minusDI.push((dn / 13) * 100);
                }

                // Pad to same length as closes to avoid downstream index errors
                const padN = closes.length - adxData.length;
                if (padN > 0) {
                    const lastA = adxData[adxData.length - 1] ?? 25;
                    adxData = Array(padN).fill(lastA).concat(adxData);
                }
                const padDM = closes.length - plusDI.length;
                if (padDM > 0) {
                    const lastP = plusDI[plusDI.length - 1] ?? 30;
                    const lastM = minusDI[minusDI.length - 1] ?? 20;
                    plusDI = Array(padDM).fill(lastP).concat(plusDI);
                    minusDI = Array(padDM).fill(lastM).concat(minusDI);
                }
            } else {
                // Last-ditch stable fallback
                const pxN = closes.length;
                const change = pxN > 21 && Number.isFinite(closes[pxN - 22]) && Number.isFinite(closes[pxN - 1])
                    ? Math.abs(closes[pxN - 1] - closes[pxN - 22]) / Math.max(1e-9, closes[pxN - 22])
                    : 0.05;
                const dyn = Math.min(60, Math.max(15, change * 180));
                adxData = Array(pxN).fill(dyn);
                plusDI = Array(pxN).fill(dyn * 0.6);
                minusDI = Array(pxN).fill(dyn * 0.4);
            }
        }

        return { adx: adxData, plusDI, minusDI };
    }
    /**
     * Detect pivot highs and lows from OHLC series.
     * A pivot low (or high) is defined as the lowest (or highest) point within a symmetric window
     * of `lookback` bars on each side.
     *
     * This is timeframe-agnostic and intended for daily SEPA-style structure analysis.
     */
    static getPivots(
        highs: number[],
        lows: number[],
        lookback: number = 10
    ): { pivotLows: { index: number; price: number }[]; pivotHighs: { index: number; price: number }[] } {
        const n = Math.min(highs.length, lows.length);
        const pivotLows: { index: number; price: number }[] = [];
        const pivotHighs: { index: number; price: number }[] = [];

        if (!Number.isFinite(lookback) || lookback < 1 || n === 0) {
            return { pivotLows, pivotHighs };
        }

        const lb = Math.floor(lookback);

        for (let i = lb; i < n - lb; i++) {
            const low = lows[i];
            const high = highs[i];
            if (!Number.isFinite(low) || !Number.isFinite(high)) continue;

            let isPivotLow = true;
            let isPivotHigh = true;

            for (let j = i - lb; j <= i + lb; j++) {
                if (j === i) continue;
                if (lows[j] <= low) isPivotLow = false;
                if (highs[j] >= high) isPivotHigh = false;
                if (!isPivotLow && !isPivotHigh) break;
            }

            if (isPivotLow) {
                pivotLows.push({ index: i, price: low });
            }
            if (isPivotHigh) {
                pivotHighs.push({ index: i, price: high });
            }
        }

        return { pivotLows, pivotHighs };
    }

    /**
     * Convenience helper to get the last N pivot lows and highs.
     * Results are returned in chronological order (oldest → newest).
     */
    static getLastNPivots(
        highs: number[],
        lows: number[],
        lookback: number = 10,
        count: number = 3
    ): { pivotLows: { index: number; price: number }[]; pivotHighs: { index: number; price: number }[] } {
        const { pivotLows, pivotHighs } = this.getPivots(highs, lows, lookback);

        const lastLows = pivotLows.slice(-count);
        const lastHighs = pivotHighs.slice(-count);

        return {
            pivotLows: lastLows,
            pivotHighs: lastHighs
        };
    }
}

// Default export for compatibility  
export default AdvancedTechnicalIndicators;

// CommonJS compatibility
module.exports = AdvancedTechnicalIndicators;
module.exports.default = AdvancedTechnicalIndicators;
