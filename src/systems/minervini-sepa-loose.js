/**
 * Minervini SEPA (Stage Analysis) Trading System
 * 
 * Based on Mark Minervini's Stage Analysis methodology from "Trade Like a Stock Market Wizard"
 * Implements the Stage Analysis approach for identifying stocks in different market stages
 * 
 * Four Market Stages:
 * - Stage 1: Accumulation (Base building)
 * - Stage 2: Markup (Trending up)
 * - Stage 3: Distribution (Topping)  
 * - Stage 4: Decline (Trending down)
 * 
 * Author: AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2024
 */

class MinerviniSEPALoose {
    constructor() {
        this.name = 'Minervini SEPA (Loose)';
        this.version = '1.0.1-loose';
        this.description = 'Stage Analysis methodology for identifying market cycles';
        this.timeframes = ['daily', 'weekly'];
        this.signals = ['BUY', 'SELL', 'HOLD'];
    }

    /**
     * Main analysis method for SEPA methodology
     * @param {Object} data - Technical data in SEPA format
     * @param {Object} options - Analysis options
     * @returns {Object} - Complete SEPA analysis result
     */
    analyze(data, options = {}) {
        console.log(`  🎯 SEPA: Starting Minervini Stage Analysis...`);

        try {
            const { series, indicators, meta } = data;

            if (!series?.daily || series.daily.length === 0) {
                throw new Error('Insufficient daily data for SEPA analysis');
            }

            // Phase 1: Stage Identification
            console.log(`  🎯 SEPA Phase 1: Identifying market stage...`);
            const stageAnalysis = this.identifyMarketStage(series, indicators);

            // Phase 2: Trend Analysis
            console.log(`  🎯 SEPA Phase 2: Analyzing trends alignment...`);
            const trendAnalysis = this.analyzeTrends(series, indicators);

            // Phase 3: Entry/Exit Signals
            console.log(`  🎯 SEPA Phase 3: Generating entry/exit signals...`);
            const signalAnalysis = this.generateSignals(stageAnalysis, trendAnalysis, series);

            // Phase 4: Risk Assessment
            console.log(`  🎯 SEPA Phase 4: Assessing risk/reward...`);
            const riskAssessment = this.assessRisk(stageAnalysis, signalAnalysis, series);

            // Phase 5: Final Decision
            console.log(`  🎯 SEPA Phase 5: Making final decision...`);
            const finalDecision = this.makeFinalDecision(stageAnalysis, trendAnalysis, signalAnalysis, riskAssessment);

            const result = {
                decision: finalDecision.action,
                confidence: finalDecision.confidence,
                stage: stageAnalysis.currentStage,
                methodology: 'SEPA_STAGE_ANALYSIS',
                stages: {
                    stage1: {
                        status: stageAnalysis.currentStage === 1 ? 'ACTIVE' : 'INACTIVE',
                        reasoning: stageAnalysis.currentStage === 1 ? stageAnalysis.reasoning : 'Not in accumulation phase',
                        indicators: stageAnalysis.stageIndicators.stage1
                    },
                    stage2: {
                        status: stageAnalysis.currentStage === 2 ? 'ACTIVE' : 'INACTIVE',
                        reasoning: stageAnalysis.currentStage === 2 ? stageAnalysis.reasoning : 'Not in markup phase',
                        indicators: stageAnalysis.stageIndicators.stage2
                    },
                    stage3: {
                        status: stageAnalysis.currentStage === 3 ? 'ACTIVE' : 'INACTIVE',
                        reasoning: stageAnalysis.currentStage === 3 ? stageAnalysis.reasoning : 'Not in distribution phase',
                        indicators: stageAnalysis.stageIndicators.stage3
                    },
                    stage4: {
                        status: stageAnalysis.currentStage === 4 ? 'ACTIVE' : 'INACTIVE',
                        reasoning: stageAnalysis.currentStage === 4 ? stageAnalysis.reasoning : 'Not in decline phase',
                        indicators: stageAnalysis.stageIndicators.stage4
                    }
                },
                setupDetails: {
                    entryPrice: signalAnalysis.entryPrice,
                    stopLoss: riskAssessment.stopLoss,
                    targets: riskAssessment.targets,
                    trendsAlignment: trendAnalysis.alignment,
                    stageTransition: stageAnalysis.stageTransition,
                    setupQuality: this.calculateSetupQuality(stageAnalysis, trendAnalysis, signalAnalysis)
                },
                signalQuality: {
                    grade: this.calculateSignalGrade(finalDecision.confidence, stageAnalysis, trendAnalysis),
                    factors: finalDecision.factors
                },
                riskReward: riskAssessment.riskReward,
                meta: {
                    ...meta,
                    analysisTimestamp: new Date().toISOString(),
                    systemVersion: this.version
                }
            };

            console.log(`  🎯 SEPA Result: ${result.decision} (Stage ${result.stage}, ${(result.confidence * 100).toFixed(1)}% confidence)`);

            return result;

        } catch (error) {
            console.error(`  ❌ SEPA Analysis Error:`, error.message);
            return {
                decision: 'HOLD',
                confidence: 0,
                stage: 0,
                error: error.message,
                methodology: 'SEPA_ERROR'
            };
        }
    }

    /**
     * Identify the current market stage based on price and volume analysis
     */
    identifyMarketStage(series, indicators) {
        const daily = series.daily;
        const latest = daily[daily.length - 1];
        const priceData = daily.slice(-100); // Last 100 days for stage analysis

        // Get key moving averages
        const ema10 = indicators.sepa_specific?.priceVsEma10 || [];
        const ema21 = indicators.sepa_specific?.priceVsEma21 || [];
        const sma150 = indicators.base?.sma150 || [];
        const sma200 = indicators.base?.sma200 || [];

        // Stage identification logic
        let currentStage = 4; // Default to Stage 4 (decline)
        let reasoning = '';
        let confidence = 0;
        let stageTransition = 'STABLE';

        // Current price vs moving averages
        const currentPrice = latest.close;
        const sma150Current = sma150[sma150.length - 1];
        const sma200Current = sma200[sma200.length - 1];

        // Volume analysis
        const avgVolume = this.calculateAverageVolume(daily.slice(-20));
        const recentVolume = daily.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
        const volumeIncrease = recentVolume > avgVolume * 1.1;

        // Additional checks for Stage 1
        const baseDuration = priceData.length;
        const low52Week = Math.min(...daily.slice(-252).map(d => d.low));
        const pctFromLow = (latest.close - low52Week) / low52Week;

        // Pre-calculate VCP and base structure for Stage 1
        let vcpPattern = false;
        let baseStructureScore = null;
        if (
            this.isInBaseBuildingPattern(priceData) &&
            currentPrice > sma200Current * 0.95 &&
            pctFromLow < 0.30 &&
            baseDuration > 30
        ) {
            vcpPattern = this.detectVCPPattern(priceData);
            baseStructureScore = this.scoreBaseStructure(priceData);
        }

        // Stage 2 (Markup) - Most bullish
        if (currentPrice > sma150Current &&
            currentPrice > sma200Current &&
            sma150.length >= 6 &&
            sma200.length >= 6 &&
            sma150Current > sma200Current &&
            sma150Current > Math.min(...sma150.slice(-5)) &&
            sma200Current > Math.min(...sma200.slice(-5)) &&
            this.isPriceAboveEMAs(currentPrice, ema10, ema21)) {

            currentStage = 2;
            reasoning = 'Price above all key MAs with upward sloping trend, volume supporting';
            confidence = 0.8;

            if (volumeIncrease) {
                confidence = 0.9;
                reasoning += ', strong volume confirmation';
            }
        }
        // Stage 1 (Accumulation) - Base building with additional checks
        else if (
            this.isInBaseBuildingPattern(priceData) &&
            currentPrice > sma200Current * 0.95 &&
            pctFromLow < 0.30 &&
            baseDuration > 30
        ) {
            currentStage = 1;
            reasoning = 'Price building base near support levels, accumulation pattern';
            confidence = 0.6;

            if (volumeIncrease) {
                confidence = 0.75;
                reasoning += ', volume suggests institutional accumulation';
            }
            if (vcpPattern) {
                reasoning += ', VCP pattern detected';
            }
            if (baseStructureScore) {
                reasoning += `, base structure score: ${JSON.stringify(baseStructureScore)}`;
            }
        }
        // Stage 3 (Distribution) - Topping
        else if (currentPrice > sma150Current &&
            this.showsDistributionSigns(priceData, daily.slice(-10))) {

            currentStage = 3;
            reasoning = 'Price showing distribution characteristics, potential topping';
            confidence = 0.7;
        }
        // Stage 4 (Decline) - Default
        else {
            currentStage = 4;
            reasoning = 'Price below key support levels, in decline phase';
            confidence = 0.8;
        }

        // Check for stage transition
        const previousStage = this.calculatePreviousStage(priceData.slice(-20));
        if (previousStage !== currentStage) {
            stageTransition = currentStage > previousStage ? 'ADVANCING' : 'DECLINING';
        }

        return {
            currentStage,
            reasoning,
            confidence,
            stageTransition,
            stageIndicators: {
                stage1: {
                    baseBuilding: this.isInBaseBuildingPattern(priceData),
                    volumeAccumulation: volumeIncrease,
                    vcpPattern,
                    baseStructureScore
                },
                stage2: { priceAboveMAs: currentPrice > sma150Current, trendStrength: confidence },
                stage3: { distributionSigns: this.showsDistributionSigns(priceData, daily.slice(-10)) },
                stage4: { belowSupport: currentPrice < sma200Current, downtrend: true }
            }
        };
    }

    /**
     * Analyze trends alignment across different timeframes
     */
    analyzeTrends(series, indicators) {
        const daily = series.daily;
        const weekly = series.weekly || [];

        // Moving average stack (bullish: ema10 > ema20 > ema50 > sma150)
        const ema10 = indicators.sepa_specific?.ema10 || [];
        const ema20 = indicators.sepa_specific?.ema20 || [];
        const ema50 = indicators.sepa_specific?.ema50 || [];
        const sma150 = indicators.base?.sma150 || [];
        const stackedMA = (
            ema10[ema10.length - 1] > ema20[ema20.length - 1] &&
            ema20[ema20.length - 1] > ema50[ema50.length - 1] &&
            ema50[ema50.length - 1] > sma150[sma150.length - 1]
        );
        // Multi-Timeframe Confirmation: Weekly stacked
        const weeklyStacked = weekly.length >= 10 &&
            weekly[weekly.length - 1].close > weekly[weekly.length - 2].close &&
            weekly[weekly.length - 1].close > weekly[weekly.length - 5].close;

        let alignment = stackedMA && weeklyStacked ? 'BULLISH' : 'MIXED';
        let strength = alignment === 'BULLISH' ? 0.9 : 0.5;

        return {
            alignment,
            strength,
            trends: {
                stackedMA: stackedMA
            },
            score: strength
        };
    }

    /**
     * Generate entry and exit signals based on stage and trend analysis
     */
    generateSignals(stageAnalysis, trendAnalysis, series) {
        const { currentStage, confidence: stageConfidence } = stageAnalysis;
        const { alignment, strength } = trendAnalysis;
        const latest = series.daily[series.daily.length - 1];

        let signal = 'HOLD';
        let entryPrice = latest.close;
        let signalStrength = 0;
        let reasoning = [];

        // Breakout confirmation: volume and close in top 25% of candle
        const recentVolume = series.daily.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
        const avgVolume = this.calculateAverageVolume(series.daily.slice(-20));
        const isVolumeBreakout = recentVolume > avgVolume * 1.3;
        const closesStrong = (latest.high - latest.low) > 0 ?
            (latest.close - latest.low) / (latest.high - latest.low) > 0.65 : false;

        // --- Anchor Conditions Before Breakout ---
        const breakoutPivot = Math.max(...series.daily.slice(-30).map(d => d.high));
        const isAbovePivot = latest.close > breakoutPivot;
        const indicators = series.indicators || {}; // fallback
        // Try to get indicators from argument if available
        let rsi14 = null;
        if (series.indicators?.base?.rsi14) {
            rsi14 = series.indicators.base.rsi14.slice(-1)[0];
        } else if (series.rsi14) {
            rsi14 = series.rsi14.slice(-1)[0];
        } else if (series.base?.rsi14) {
            rsi14 = series.base.rsi14.slice(-1)[0];
        }
        // fallback: try stageAnalysis.indicators if passed in
        if (!rsi14 && stageAnalysis?.stageIndicators?.stage2?.rsi14) {
            rsi14 = stageAnalysis.stageIndicators.stage2.rsi14;
        }
        // fallback: try indicators argument if passed in
        if (!rsi14 && typeof arguments[1] === 'object' && arguments[1]?.base?.rsi14) {
            rsi14 = arguments[1].base.rsi14.slice(-1)[0];
        }
        const rsiStrong = rsi14 !== null && rsi14 > 55;

        // --- Tight Candle Strength Filter ---
        const candleBody = Math.abs(latest.close - latest.open);
        const candleRange = latest.high - latest.low;
        const candleStrength = candleRange > 0 ? (candleBody / candleRange) > 0.6 : false;

        // Stage 2 with bullish alignment and breakout confirmation = BUY signal
        if (
            currentStage === 2 &&
            alignment === 'BULLISH' &&
            isVolumeBreakout &&
            closesStrong &&
            isAbovePivot &&
            rsiStrong &&
            candleStrength
        ) {
            signal = 'BUY';
            signalStrength = stageConfidence * strength;
            reasoning.push('Stage 2 markup phase with bullish trend alignment and breakout confirmation');
            entryPrice = latest.close * 1.01; // Slight premium for entry

            // --- Breakout Failure Watch (Early Exit Flag) ---
            const nextCandles = series.daily.slice(-3);
            const breakoutWeak = nextCandles.some(c => c.close < breakoutPivot || c.volume < avgVolume * 0.8);
            if (breakoutWeak) {
                reasoning.push('⚠️ Weak post-breakout behavior');
                signalStrength *= 0.85;
            }
        }
        // Stage 1 transitioning to Stage 2 = Early BUY (tighter conditions)
        else if (stageAnalysis.stageTransition === 'ADVANCING' && alignment === 'BULLISH' && trendAnalysis.strength >= 0.75) {
            signal = 'BUY';
            signalStrength = stageConfidence * 0.8;
            reasoning.push('Stage 1 to 2 transition, early markup opportunity');
            entryPrice = latest.close;
        }
        // Stage 3 or 4 with bearish alignment = SELL signal
        else if ((currentStage === 3 || currentStage === 4) && alignment === 'BEARISH') {
            signal = 'SELL';
            signalStrength = stageConfidence * strength;
            reasoning.push(`Stage ${currentStage} with bearish alignment, exit recommended`);
            entryPrice = latest.close * 0.99; // Slight discount for exit
        }
        // All other cases = HOLD
        else {
            signal = 'HOLD';
            signalStrength = 0.3;
            reasoning.push('Mixed signals or unclear stage, maintain current position');
        }

        return {
            signal,
            entryPrice,
            signalStrength,
            reasoning: reasoning.join('; '),
            factors: {
                stage: currentStage,
                stageConfidence: stageConfidence,
                trendAlignment: alignment,
                trendStrength: strength
            }
        };
    }

    /**
     * Assess risk and calculate stop losses and targets
     */
    assessRisk(stageAnalysis, signalAnalysis, series) {
        const latest = series.daily[series.daily.length - 1];
        const entryPrice = signalAnalysis.entryPrice;
        const atr = this.calculateATR(series.daily.slice(-14));

        let stopLoss = 0;
        let targets = [];
        let riskReward = 1;

        if (signalAnalysis.signal === 'BUY') {
            // Calculate stop loss based on stage and ATR
            if (stageAnalysis.currentStage === 2) {
                stopLoss = entryPrice - (atr * 1.5); // Tighter stop in markup
            } else {
                stopLoss = entryPrice - (atr * 2.5); // Wider stop in accumulation
            }
            // Enhance: use recent swing low as minimum stop loss
            const lastSwingLow = Math.min(...series.daily.slice(-10).map(d => d.low));
            stopLoss = Math.max(stopLoss, lastSwingLow);

            // Calculate targets
            targets = [
                entryPrice * 1.08, // 8% target
                entryPrice * 1.15, // 15% target
                entryPrice * 1.25  // 25% target
            ];

            riskReward = (targets[0] - entryPrice) / (entryPrice - stopLoss);
        }
        else if (signalAnalysis.signal === 'SELL') {
            stopLoss = entryPrice + (atr * 1.5); // Stop above for short
            targets = [
                entryPrice * 0.95, // 5% target
                entryPrice * 0.90, // 10% target
                entryPrice * 0.85  // 15% target
            ];

            riskReward = (entryPrice - targets[0]) / (stopLoss - entryPrice);
        }

        return {
            stopLoss,
            targets,
            riskReward,
            atr,
            riskPercentage: stopLoss > 0 ? Math.abs((entryPrice - stopLoss) / entryPrice) : 0
        };
    }

    /**
     * Make final trading decision
     */
    makeFinalDecision(stageAnalysis, trendAnalysis, signalAnalysis, riskAssessment) {
        const { signal, signalStrength, factors } = signalAnalysis;
        const { riskReward } = riskAssessment;

        let action = signal;
        let confidence = signalStrength;
        let reasoning = signalAnalysis.reasoning;

        // Adjust confidence based on risk/reward
        if (riskReward < 1.5 && signal !== 'HOLD') {
            confidence *= 0.7; // Reduce confidence for poor risk/reward
            reasoning += '; Poor risk/reward ratio reduces confidence';
        } else if (riskReward > 2.5) {
            confidence = Math.min(confidence * 1.2, 1.0); // Boost confidence for excellent risk/reward
            reasoning += '; Excellent risk/reward ratio';
        }

        // Stage-specific adjustments
        if (stageAnalysis.currentStage === 2 && action === 'BUY') {
            confidence = Math.min(confidence * 1.1, 1.0); // Boost Stage 2 buys
        } else if (stageAnalysis.currentStage === 4 && action === 'SELL') {
            confidence = Math.min(confidence * 1.1, 1.0); // Boost Stage 4 sells
        }

        return {
            action,
            confidence: Math.max(0, Math.min(confidence, 1.0)),
            reasoning,
            factors
        };
    }

    // Helper methods for calculations
    calculateAverageVolume(data) {
        return data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    }

    isPriceAboveEMAs(price, ema10, ema21) {
        if (!Array.isArray(ema10) || !Array.isArray(ema21) || ema10.length === 0 || ema21.length === 0) return false;
        const ema10Latest = ema10[ema10.length - 1]?.priceAboveMA;
        const ema21Latest = ema21[ema21.length - 1]?.priceAboveMA;
        return ema10Latest && ema21Latest;
    }

    isInBaseBuildingPattern(priceData) {
        if (priceData.length < 20) return false;

        const highs = priceData.map(d => d.high);
        const lows = priceData.map(d => d.low);
        const highestHigh = Math.max(...highs);
        const lowestLow = Math.min(...lows);

        // Base building if trading in narrow range
        const range = (highestHigh - lowestLow) / lowestLow;
        return range < 0.20; // Less than 15% range
    }

    showsDistributionSigns(priceData, recentData) {
        // Look for declining volume on up days
        let distributionDays = 0;
        if (recentData.length < 5) return false;

        recentData.forEach((day, i) => {
            if (i > 0) {
                const prevDay = recentData[i - 1];
                if (
                    day && prevDay &&
                    day.close > prevDay.close &&
                    day.volume > 0 &&
                    prevDay.volume > 0 &&
                    day.volume < prevDay.volume
                ) {
                    distributionDays++;
                }
            }
        });

        return distributionDays >= 3; // 3+ distribution days
    }

    calculatePreviousStage(data) {
        const lastClose = data[data.length - 1]?.close;
        const earlierClose = data[0]?.close;
        if (!lastClose || !earlierClose) return 2;
        const change = (lastClose - earlierClose) / earlierClose;
        if (change > 0.05) return 2; // Uptrend = Stage 2
        if (change < -0.05) return 4; // Downtrend = Stage 4
        return 1; // Otherwise base
    }

    calculateTrendDirection(data) {
        if (data.length < 2) return 'NEUTRAL';

        const avgFirst = data.slice(0, 3).reduce((sum, d) => sum + d.close, 0) / 3;
        const avgLast = data.slice(-3).reduce((sum, d) => sum + d.close, 0) / 3;
        const change = (avgLast - avgFirst) / avgFirst;

        if (change > 0.02) return 'UP';
        if (change < -0.02) return 'DOWN';
        return 'NEUTRAL';
    }

    calculateATR(data) {
        if (!data || data.length < 2) return 0;

        let atrSum = 0;
        for (let i = 1; i < data.length; i++) {
            if (!data[i] || !data[i-1]) continue;
            if ([data[i].high, data[i].low, data[i-1].close].some(v => v === undefined)) continue;

            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            );
            atrSum += tr;
        }

        return atrSum / (data.length - 1);
    }

    calculateSetupQuality(stageAnalysis, trendAnalysis, signalAnalysis) {
        const stageScore = stageAnalysis.confidence;
        const trendScore = trendAnalysis.strength;
        const signalScore = signalAnalysis.signalStrength;

        const overallScore = (stageScore + trendScore + signalScore) / 3;

        if (overallScore >= 0.8) return 'A';
        if (overallScore >= 0.6) return 'B';
        if (overallScore >= 0.4) return 'C';
        return 'D';
    }

    calculateSignalGrade(confidence, stageAnalysis, trendAnalysis) {
        if (confidence >= 0.8 && stageAnalysis.currentStage === 2) return 'A';
        if (confidence >= 0.7) return 'B';
        if (confidence >= 0.5) return 'C';
        return 'D';
    }

    /**
     * Detect Volatility Contraction Pattern (VCP)
     */
    detectVCPPattern(priceData) {
        if (priceData.length < 20) return false;

        let contractions = 0;
        let prevRange = null;
        for (let i = priceData.length - 1; i >= 5; i -= 5) {
            const slice = priceData.slice(i - 5, i);
            const highs = slice.map(d => d.high);
            const lows = slice.map(d => d.low);
            const range = Math.max(...highs) - Math.min(...lows);

            if (prevRange && range < prevRange * 0.9) {
                contractions++;
            }
            prevRange = range;
        }
        return contractions >= 1;
    }

    /**
     * Score the quality of the base structure
     */
    scoreBaseStructure(priceData) {
        const duration = priceData.length;
        const highs = priceData.map(d => d.high);
        const lows = priceData.map(d => d.low);
        const rangePct = (Math.max(...highs) - Math.min(...lows)) / Math.min(...lows);
        const atr = this.calculateATR(priceData);

        return {
            durationScore: duration >= 40 ? 1 : 0,
            tightnessScore: rangePct < 0.15 ? 1 : 0,
            stabilityScore: atr / Math.min(...lows) < 0.03 ? 1 : 0
        };
    }
}

module.exports = MinerviniSEPALoose;
