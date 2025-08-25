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

class MinerviniSEPA {
    constructor() {
        this.name = 'Minervini SEPA';
        this.systemId = 'sepa_method';
        this.description = 'Stage Analysis methodology for identifying market cycles';
        this.timeframes = ['daily', 'weekly'];
        this.signals = ['BUY', 'SELL', 'HOLD'];
        this.version = '1.0.0';
    }

    /**
     * Main analysis method for SEPA methodology
     * @param {Object} data - Technical data in SEPA format
     * @param {Object} options - Analysis options including capital, symbol, currentPrice
     * @returns {Object} - Complete SEPA analysis result
     */
    /**
     * Main analysis method for SEPA methodology
     * @param {Object} data - Technical data in SEPA format
     * @param {Object} options - Analysis options including capital, symbol, currentPrice
     * @returns {Object} - Complete SEPA analysis result
     */
    analyze(data, options = {}) {
        //console.log(`  🎯 SEPA: Starting Minervini Stage Analysis...`);

        try {
            const { series, indicators, meta } = data;
            const { capital, symbol, currentPrice } = options;

            if (!series?.daily || series.daily.length === 0) {
                return this.createAvoidSignal('INSUFFICIENT_DATA', 'Insufficient daily data for SEPA analysis');
            }

            // Extract capital and pricing information from options
            const entryPrice = currentPrice || series.daily[series.daily.length - 1]?.close || 0;

            // Phase 1: Stage Identification
            //console.log(`  🎯 SEPA Phase 1: Identifying market stage...`);
            const stageAnalysis = this.identifyMarketStage(series, indicators);

            // Phase 2: Trend Analysis
            //console.log(`  🎯 SEPA Phase 2: Analyzing trends alignment...`);
            const trendAnalysis = this.analyzeTrends(series, indicators);

            // Phase 3: Entry/Exit Signals
            //console.log(`  🎯 SEPA Phase 3: Generating entry/exit signals...`);
            const signalAnalysis = this.generateSignals(stageAnalysis, trendAnalysis, series);

            // Phase 4: Risk Assessment
            //console.log(`  🎯 SEPA Phase 4: Assessing risk/reward...`);
            const riskAssessment = this.assessRisk(stageAnalysis, signalAnalysis, series);

            // Phase 5: Final Decision (using risk/reward data)
            //console.log(`  🎯 SEPA Phase 5: Making final decision...`);
            const finalDecision = this.makeFinalDecision(stageAnalysis, trendAnalysis, signalAnalysis, riskAssessment);

            // Calculate enhanced risk/reward with conditional calculations for WATCH signals
            const enhancedRiskReward = this.calculateRiskReward(riskAssessment, signalAnalysis, finalDecision.action, series, currentPrice);

            // Create execution plan with capital-aware position sizing
            let executionPlan = null;
            if (finalDecision.action !== 'AVOID') {
                executionPlan = this.createExecutionPlan(finalDecision, stageAnalysis, trendAnalysis, riskAssessment, signalAnalysis, series, options);
            }

            // Calculate signal quality grade  
            const signalQuality = this.calculateSignalQuality(finalDecision.confidence, stageAnalysis, trendAnalysis);

            // Build reasoning array from final decision
            const reasoning = Array.isArray(finalDecision.reasoning) ? finalDecision.reasoning : [finalDecision.reasoning];

            // Return standardized response structure matching Elder Triple Screen
            return {
                system: this.systemId,
                systemName: this.name,
                decision: finalDecision.action,
                confidence: finalDecision.confidence,
                reasoning: reasoning,
                // Risk management (standardized with Elder)
                riskReward: enhancedRiskReward,
                // Quality metrics for gate engine (standardized with Elder)
                signalQuality: signalQuality,
                // Execution details (standardized with Elder as 'execution')
                execution: executionPlan
            };

        } catch (error) {
            console.error('SEPA analysis error:', error);
            return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
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

        // Stage 2 (Markup) - Most bullish - SIMPLIFIED LOGIC
        if (currentPrice > sma150Current &&
            currentPrice > sma200Current &&
            sma150Current > sma200Current) {

            currentStage = 2;
            reasoning = 'Price above key MAs with upward sloping trend';
            confidence = 0.7;

            if (volumeIncrease) {
                confidence = 0.8;
                reasoning += ', volume supporting';
            }
            
            // Additional Stage 2 confirmation
            if (sma150.length >= 3 && sma150Current > sma150[sma150.length - 3]) {
                confidence = Math.min(confidence + 0.1, 0.9);
                reasoning += ', MA trending up';
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
     * Analyze trends alignment across different timeframes - SIMPLIFIED
     */
    analyzeTrends(series, indicators) {
        const daily = series.daily;
        const weekly = series.weekly || [];
        const latest = daily[daily.length - 1];

        // Simplified trend analysis - price vs key MAs
        const sma150 = indicators.base?.sma150 || [];
        const sma200 = indicators.base?.sma200 || [];
        
        let alignment = 'MIXED';
        let strength = 0.5;

        if (sma150.length > 0 && sma200.length > 0) {
            const sma150Current = sma150[sma150.length - 1];
            const sma200Current = sma200[sma200.length - 1];
            
            // Bullish: Price above both key MAs and MAs trending up
            if (latest.close > sma150Current && latest.close > sma200Current && sma150Current > sma200Current) {
                alignment = 'BULLISH';
                strength = 0.8;
                
                // Extra strength if weekly also trending up
                if (weekly.length >= 10) {
                    const weeklyUptrend = weekly[weekly.length - 1].close > weekly[weekly.length - 5].close;
                    if (weeklyUptrend) {
                        strength = 0.9;
                    }
                }
            }
            // Bearish: Price below key MAs
            else if (latest.close < sma200Current) {
                alignment = 'BEARISH';
                strength = 0.3;
            }
        }

        return {
            alignment,
            strength,
            trends: {
                priceAboveMA150: latest.close > (sma150[sma150.length - 1] || 0),
                priceAboveMA200: latest.close > (sma200[sma200.length - 1] || 0)
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

        let signal = 'AVOID';
        let entryPrice = latest.close;
        let signalStrength = 0;
        let reasoning = [];

        // Breakout confirmation: volume and close in top 25% of candle
        const recentVolume = series.daily.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
        const avgVolume = this.calculateAverageVolume(series.daily.slice(-20));
        const isVolumeBreakout = recentVolume > avgVolume * 1.2; // Less strict volume requirement
        const closesStrong = (latest.high - latest.low) > 0 ?
            (latest.close - latest.low) / (latest.high - latest.low) > 0.5 : false; // Less strict

        // --- Anchor Conditions Before Breakout ---
        const breakoutPivot = Math.max(...series.daily.slice(-20).map(d => d.high));
        const isAbovePivot = latest.close > breakoutPivot * 0.99; // Less strict pivot requirement
        
        // Simplified RSI lookup
        let rsi14 = null;
        if (series.indicators?.base?.rsi14) {
            rsi14 = series.indicators.base.rsi14.slice(-1)[0];
        }
        const rsiStrong = rsi14 !== null && rsi14 > 55; // Less strict RSI

        // --- Less Strict Candle Strength Filter ---
        const candleBody = Math.abs(latest.close - latest.open);
        const candleRange = latest.high - latest.low;
        const candleStrength = candleRange > 0 ? (candleBody / candleRange) > 0.4 : true; // Less strict

        // Stage 2 with bullish alignment and some breakout confirmation = BUY signal
        if (
            currentStage === 2 &&
            alignment === 'BULLISH' &&
            (isVolumeBreakout || closesStrong || isAbovePivot) // Any one of these conditions
        ) {
            signal = 'BUY';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push('Stage 2 markup phase with bullish trend alignment and breakout confirmation');
            entryPrice = latest.close;
        }
        // Stage 1 transitioning to Stage 2 = Early BUY (tighter conditions)
        else if (stageAnalysis.stageTransition === 'ADVANCING' && alignment === 'BULLISH' && trendAnalysis.strength >= 0.5) {
            signal = 'BUY';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push('Stage 1 to 2 transition, early markup opportunity');
            entryPrice = latest.close;
        }
        // Stage 2 setup forming → WATCH
        else if (
            currentStage === 2 &&
            alignment === 'BULLISH' &&
            trendAnalysis.strength >= 0.5
        ) {
            signal = 'WATCH';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push('Stage 2 bullish setup forming – watching for optimal entry');
            entryPrice = latest.close;
        }
        // Stage 1 with volume + base building → early accumulation = WATCH
        else if (
            currentStage === 1 &&
            stageAnalysis.stageIndicators.stage1.volumeAccumulation &&
            trendAnalysis.strength >= 0.4
        ) {
            signal = 'WATCH';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push('Stage 1 accumulation with rising volume – potential early setup');
            entryPrice = latest.close;
        }
        // Stage 3 or 4 with bearish alignment = SELL signal
        else if ((currentStage === 3 || currentStage === 4) && alignment === 'BEARISH') {
            signal = 'SELL';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push(`Stage ${currentStage} with bearish alignment, exit recommended`);
            entryPrice = latest.close * 0.99; // Slight discount for exit
        }
        // Default case with reasonable signal
        else if (currentStage === 1 || currentStage === 2) {
            signal = 'WATCH';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
            reasoning.push('Setup developing - monitoring for entry conditions');
            entryPrice = latest.close;
        }
        // All other cases = AVOID with dynamic confidence
        else {
            signal = 'AVOID';
            signalStrength = this.calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal);
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

        if (signalAnalysis.signal === 'BUY' || signalAnalysis.signal === 'WATCH') {
            // Calculate stop loss based on stage and ATR
            if (stageAnalysis.currentStage === 2) {
                stopLoss = entryPrice - (atr * 2); // Tighter stop in markup
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
        return range < 0.15; // Less than 15% range
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
        return contractions >= 2;
    }

    /**
     * Calculate dynamic confidence for SEPA system based on setup strength
     */
    calculateSEPAConfidence(stageAnalysis, trendAnalysis, series, signal = 'HOLD') {
        let confidence = 0.3; // Base confidence
        
        // Adjust base confidence by signal type
        if (signal === 'BUY') {
            confidence = 0.65; // Higher base for BUY
        } else if (signal === 'WATCH') {
            confidence = 0.45; // Medium base for WATCH
        } else if (signal === 'SELL') {
            confidence = 0.60; // Higher base for SELL
        } else {
            confidence = 0.35; // Medium base for HOLD
        }
        
        const { currentStage, confidence: stageConfidence } = stageAnalysis;
        const { alignment, strength } = trendAnalysis;
        const latest = series.daily[series.daily.length - 1];
        
        // Volume analysis
        const recentVolume = series.daily.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
        const avgVolume = this.calculateAverageVolume(series.daily.slice(-20));
        const volumeStrength = recentVolume / avgVolume;
        
        // MA alignment check
        const dailyData = series.daily;
        const closes = dailyData.slice(-50).map(d => d.close);
        const sma20 = closes.slice(-20).reduce((sum, p) => sum + p, 0) / 20;
        const sma50 = closes.slice(-50).reduce((sum, p) => sum + p, 0) / 50;
        const maAligned = latest.close > sma20 && sma20 > sma50;
        
        // Stage-specific confidence adjustments
        if (currentStage === 2) {
            confidence += 0.25; // Stage 2 is most bullish
            if (volumeStrength > 1.5) confidence += 0.15;
            if (maAligned) confidence += 0.15;
        } else if (currentStage === 1) {
            confidence += 0.15; // Stage 1 accumulation
            if (volumeStrength > 1.2) confidence += 0.10;
            if (maAligned) confidence += 0.10;
        } else if (currentStage === 3) {
            confidence += 0.05; // Stage 3 distribution - lower confidence
        }
        
        // Trend alignment bonus
        if (alignment === 'BULLISH' && strength > 0.7) {
            confidence += 0.20;
        } else if (alignment === 'BULLISH' && strength > 0.5) {
            confidence += 0.10;
        }
        
        // Base structure quality (if available)
        if (stageAnalysis.baseStructureScore) {
            const { durationScore, tightnessScore, stabilityScore } = stageAnalysis.baseStructureScore;
            confidence += (durationScore + tightnessScore + stabilityScore) * 0.05;
        }
        
        return Math.min(Math.max(confidence, 0.15), 0.90);
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

    /**
     * Calculate enhanced risk/reward with conditional calculations for WATCH signals
     */
    calculateRiskReward(riskAssessment, signalAnalysis, signal, series, currentPrice) {
        const latest = series.daily[series.daily.length - 1];
        const latestClose = currentPrice || latest.close;
        
        let entryPrice = signalAnalysis.entryPrice;
        let stopLoss = riskAssessment.stopLoss;
        let targets = riskAssessment.targets;
        let riskReward = riskAssessment.riskReward;

        // For WATCH signals, use conditional calculations with anticipated breakout entry
        if (signal === 'WATCH') {
            // Calculate anticipated breakout entry (resistance level + 1%)
            const recentHighs = series.daily.slice(-30).map(d => d.high);
            const resistanceLevel = Math.max(...recentHighs);
            entryPrice = resistanceLevel * 1.01; // Anticipated breakout entry
            
            // Recalculate stop-loss and targets based on anticipated entry
            const atr = riskAssessment.atr;
            stopLoss = entryPrice - (atr * 2.0); // Stage-aware stop
            targets = [
                entryPrice * 1.08, // 8% target
                entryPrice * 1.15, // 15% target
                entryPrice * 1.25  // 25% target
            ];
            
            if (stopLoss > 0) {
                riskReward = (targets[0] - entryPrice) / (entryPrice - stopLoss);
            }
        }

        return {
            latestClose,
            entryPrice: signal === 'WATCH' ? null : entryPrice, // Null for conditional entry
            anticipatedEntry: signal === 'WATCH' ? entryPrice : null,
            stopLoss,
            targets,
            riskReward: Math.round(riskReward * 100) / 100,
            riskAmount: entryPrice > stopLoss ? entryPrice - stopLoss : 0,
            potentialGain: targets.length > 0 ? targets[0] - entryPrice : 0
        };
    }

    /**
     * Create comprehensive execution plan with capital-aware position sizing
     */
    createExecutionPlan(finalDecision, stageAnalysis, trendAnalysis, riskAssessment, signalAnalysis, series, options) {
        const { capital, symbol, currentPrice } = options;
        const signal = finalDecision.action;
        
        // Calculate position sizing
        const positionSizing = this.calculateSepaPositionSizing(
            finalDecision.confidence,
            stageAnalysis,
            riskAssessment,
            capital,
            currentPrice,
            signal
        );

        // Build dynamic entry strategy
        const entryStrategy = this.buildPreciseSepaEntryStrategy(stageAnalysis, trendAnalysis, signalAnalysis, signal);

        // Build dynamic exit strategy  
        const exitStrategy = this.buildPreciseSepaExitStrategy(riskAssessment, stageAnalysis, signal, series);

        return {
            entry: entryStrategy,
            exit: exitStrategy,
            position: positionSizing,
            executionNotes: this.generateSepaExecutionNotes(stageAnalysis, trendAnalysis, signal)
        };
    }

    /**
     * Calculate stage-aware position sizing with confidence tiers
     */
    calculateSepaPositionSizing(confidence, stageAnalysis, riskAssessment, capital, currentPrice, signal) {
        if (!capital || !currentPrice || !riskAssessment.stopLoss) {
            return { recommendation: 'INSUFFICIENT_DATA', shares: 0, positionValue: 0 };
        }

        const { currentStage } = stageAnalysis;
        const stopLoss = riskAssessment.stopLoss;
        
        // Determine effective entry price (conditional vs immediate)
        const isConditional = signal === 'WATCH';
        let effectiveEntryPrice = currentPrice;
        
        if (isConditional) {
            // For WATCH signals, use anticipated breakout entry (resistance + 1%)
            effectiveEntryPrice = currentPrice * 1.02; // Conservative anticipated entry
        }

        // Stage and confidence-based position sizing tiers
        let recommendation, maxPosition, riskPercent;

        if (confidence >= 0.85 && currentStage === 2) {
            recommendation = 'FULL';
            maxPosition = 0.10; // 10% of portfolio max for Stage 2 breakouts
            riskPercent = 2.0;  // 2% risk for highest confidence Stage 2
        } else if (confidence >= 0.75 && currentStage === 2) {
            recommendation = 'STRONG';
            maxPosition = 0.08; // 8% of portfolio for strong Stage 2
            riskPercent = 1.8;
        } else if (confidence >= 0.65) {
            recommendation = 'REDUCED';
            maxPosition = 0.06; // 6% of portfolio
            riskPercent = 1.5;
        } else if (confidence >= 0.55) {
            recommendation = 'CONSERVATIVE';
            maxPosition = 0.05; // 5% of portfolio
            riskPercent = 1.2;
        } else if (confidence >= 0.45) {
            recommendation = 'HALF';
            maxPosition = 0.04; // 4% of portfolio
            riskPercent = 1.0;
        } else if (confidence >= 0.35) {
            recommendation = 'QUARTER';
            maxPosition = 0.03; // 3% of portfolio
            riskPercent = 0.8;
        } else {
            recommendation = 'AVOID';
            maxPosition = 0;
            riskPercent = 0;
        }

        // Calculate actual position sizing
        let shares = 0;
        let positionValue = 0;
        let riskAmount = 0;
        
        if (recommendation !== 'AVOID' && effectiveEntryPrice > 0 && stopLoss > 0) {
            // Calculate risk-based position size (Minervini's method)
            const riskPerShare = Math.abs(effectiveEntryPrice - stopLoss);
            if (riskPerShare > 0) {
                riskAmount = capital * (riskPercent / 100);
                shares = Math.floor(riskAmount / riskPerShare);
                positionValue = shares * effectiveEntryPrice;
                
                // Apply maximum position limit
                const maxPositionValue = capital * maxPosition;
                if (positionValue > maxPositionValue) {
                    positionValue = maxPositionValue;
                    shares = Math.floor(maxPositionValue / effectiveEntryPrice);
                    riskAmount = shares * riskPerShare;
                }
            }
        }

        return {
            recommendation,
            riskPercent,
            maxPosition,
            shares: Math.max(0, shares),
            positionValue: Math.round(positionValue),
            riskAmount: Math.round(riskAmount * 100) / 100,
            riskPerShare: Math.round((Math.abs(effectiveEntryPrice - stopLoss)) * 100) / 100,
            stopDistance: stopLoss > 0 ? Math.round(((effectiveEntryPrice - stopLoss) / effectiveEntryPrice) * 10000) / 100 : 0,
            entryType: isConditional ? 'CONDITIONAL' : 'IMMEDIATE',
            effectiveEntry: Math.round(effectiveEntryPrice * 100) / 100,
            capitalUsed: positionValue > 0 ? Math.round((positionValue / capital) * 100) : 0
        };
    }

    /**
     * Build precise entry strategy based on stage analysis
     */
    buildPreciseSepaEntryStrategy(stageAnalysis, trendAnalysis, signalAnalysis, signal) {
        const { currentStage, stageTransition, reasoning } = stageAnalysis;
        const { alignment, strength } = trendAnalysis;
        
        const strategy = {
            conditions: [],
            timing: 'Immediate on confirmation',
            readiness: signal
        };

        // Build precise conditions based on stage analysis
        strategy.conditions.push(`Stage ${currentStage}: ${this.getStageDescription(currentStage)}`);
        strategy.conditions.push(`Trend alignment: ${alignment} (strength: ${(strength * 100).toFixed(0)}%)`);
        
        if (stageTransition === 'ADVANCING') {
            strategy.conditions.push('Stage transition detected - advancing to next phase');
        }

        // Set precise timing and entry details based on signal type
        if (signal === 'BUY') {
            if (currentStage === 1) {
                strategy.timing = 'Execute on base breakout with volume confirmation';
                strategy.method = 'Base breakout accumulation entry';
                strategy.keyLevels = 'Base resistance and volume confirmation required';
            } else if (currentStage === 2) {
                strategy.timing = 'Execute immediately on strong volume breakout';
                strategy.method = 'Stage 2 markup momentum entry';
                strategy.keyLevels = 'Key pivot breakout with institutional volume';
            } else {
                strategy.timing = 'Execute with caution - non-optimal stage';
                strategy.method = `Stage ${currentStage} entry`;
                strategy.keyLevels = 'Key technical levels';
            }
            strategy.urgency = 'HIGH';
            strategy.entryType = 'IMMEDIATE';
            if (signalAnalysis.entryPrice) {
                strategy.entryPrice = signalAnalysis.entryPrice;
            }
        } else if (signal === 'WATCH') {
            if (currentStage === 1) {
                strategy.timing = 'Await base breakout confirmation';
                strategy.nextTrigger = 'Base breakout with volume confirmation';
            } else if (currentStage === 2) {
                strategy.timing = 'Prime setup - await pivot level breakout';
                strategy.nextTrigger = 'Key pivot breakout with institutional volume';
            } else {
                strategy.timing = 'Setup developing - await optimal entry conditions';
                strategy.nextTrigger = 'Stage-appropriate breakout confirmation';
            }
            
            strategy.urgency = currentStage === 2 ? 'MEDIUM' : 'LOW';
            strategy.entryType = 'CONDITIONAL';
            if (signalAnalysis.entryPrice) {
                strategy.anticipatedEntry = signalAnalysis.entryPrice * 1.02; // Anticipated breakout level
                strategy.currentPrice = signalAnalysis.entryPrice;
                strategy.triggerLevel = `Stage ${currentStage} breakout at $${(signalAnalysis.entryPrice * 1.02).toFixed(2)}`;
            }
        } else {
            strategy.timing = 'Hold - insufficient stage/trend alignment';
            strategy.urgency = 'NONE';
            strategy.entryType = 'NONE';
        }

        return strategy;
    }

    /**
     * Build precise exit strategy based on stage and risk assessment
     */
    buildPreciseSepaExitStrategy(riskAssessment, stageAnalysis, signal, series) {
        const { stopLoss, targets, atr } = riskAssessment;
        const { currentStage } = stageAnalysis;
        
        const strategy = {
            stopLoss,
            targets,
            timeStop: null,
            systemExit: null,
            trailingStop: false
        };

        // Stage-specific exit methodology
        if (currentStage === 1) {
            strategy.timeStop = 'Monitor base development for 3-6 weeks maximum';
            strategy.systemExit = 'Exit if base structure fails or Stage 2 breakout occurs';
            if (signal === 'BUY' || signal === 'SELL') {
                strategy.trailingStop = 'Consider 2.5x ATR trailing stop after Stage 2 confirmation';
            } else if (signal === 'WATCH') {
                strategy.trailingStop = 'Plan 2.5x ATR trailing stop after base breakout entry';
                strategy.triggerRequired = 'Base breakout with volume confirmation required';
            }
        } else if (currentStage === 2) {
            strategy.timeStop = 'Ride Stage 2 momentum - no time limit with proper stops';
            strategy.systemExit = 'Exit when weekly trend deteriorates or distribution signs appear';
            if (signal === 'BUY' || signal === 'SELL') {
                strategy.trailingStop = 'Implement 2x ATR trailing stop after first target hit';
            } else if (signal === 'WATCH') {
                strategy.trailingStop = 'Plan 2x ATR trailing stop after pivot breakout entry';
                strategy.triggerRequired = 'Key pivot breakout with institutional volume required';
            }
        } else if (currentStage === 3) {
            strategy.timeStop = 'Exit quickly - Stage 3 has limited duration (2-4 weeks max)';
            strategy.systemExit = 'Exit on first sign of distribution or volume climax';
            if (signal === 'BUY' || signal === 'SELL') {
                strategy.trailingStop = 'Tight 1.5x ATR trailing stop - limited upside expected';
            } else if (signal === 'WATCH') {
                strategy.trailingStop = 'Plan tight 1.5x ATR stop after any entry';
                strategy.triggerRequired = 'Quick profit taking strategy required';
            }
        } else {
            strategy.timeStop = 'Stage 4 decline - trend continuation expected';
            strategy.systemExit = 'Exit immediately - any bounce likely to fail';
            if (signal === 'BUY' || signal === 'SELL') {
                strategy.trailingStop = 'No trailing stop - immediate exit recommended';
            } else if (signal === 'WATCH') {
                strategy.trailingStop = 'Avoid new positions - Stage 4 decline active';
                strategy.triggerRequired = 'Not recommended - Stage 4 avoidance advised';
            }
        }

        // Add conditional logic for WATCH signals
        if (signal === 'WATCH') {
            strategy.timeStop = `${strategy.timeStop} - Monitor for setup development`;
            strategy.systemExit = `Cancel setup if stage deteriorates: ${strategy.systemExit}`;
        }

        return strategy;
    }

    /**
     * Generate execution notes specific to SEPA methodology
     */
    generateSepaExecutionNotes(stageAnalysis, trendAnalysis, signal) {
        const { currentStage, stageTransition } = stageAnalysis;
        const { alignment, strength } = trendAnalysis;
        
        const notes = [];
        
        if (currentStage === 1) {
            notes.push('Base building stage - patience required for proper breakout');
            notes.push('Volume confirmation essential for base breakout validity');
        } else if (currentStage === 2) {
            notes.push('Stage 2 markup - strongest trending phase for long positions');
            notes.push('Use trailing stops to capture maximum momentum moves');
        } else if (currentStage === 3) {
            notes.push('Distribution stage - take profits and reduce position sizes');
            notes.push('Watch for volume climax and selling pressure increases');
        } else {
            notes.push('Stage 4 decline - avoid new long positions');
            notes.push('Consider short opportunities on any weak bounces');
        }

        if (stageTransition === 'ADVANCING') {
            notes.push('Stage transition detected - position for next phase');
        }

        if (signal === 'WATCH') {
            notes.push('Setup developing - await proper trigger before entry');
        }

        return notes;
    }

    /**
     * Get stage description for strategy building
     */
    getStageDescription(stage) {
        const descriptions = {
            1: 'Accumulation - Base building and institutional buying',
            2: 'Markup - Strong uptrend with momentum continuation', 
            3: 'Distribution - Topping action with selling pressure',
            4: 'Decline - Downtrend with continued selling'
        };
        return descriptions[stage] || 'Unknown stage';
    }

    /**
     * Calculate signal quality grade for gate engine integration (standardized with Elder)
     */
    calculateSignalQuality(confidence, stageAnalysis, trendAnalysis) {
        let score = 50; // Base score

        // Stage scoring - Stage 2 is most favorable
        if (stageAnalysis.currentStage === 2) {
            score += 25;
        } else if (stageAnalysis.currentStage === 1) {
            score += 15;
        } else if (stageAnalysis.currentStage === 3) {
            score -= 10;
        } else if (stageAnalysis.currentStage === 4) {
            score -= 20;
        }

        // Stage confidence scoring
        score += (stageAnalysis.confidence * 20);

        // Trend alignment scoring
        if (trendAnalysis.alignment === 'BULLISH') {
            score += 20;
        } else if (trendAnalysis.alignment === 'BEARISH') {
            score += 10; // Still some clarity
        } else {
            score -= 5; // Mixed signals
        }

        // Trend strength scoring
        score += (trendAnalysis.strength * 15);

        // Overall confidence scoring
        score += (confidence * 15);

        // Convert to grade (standardized with Elder)
        const percentage = Math.max(0, Math.min(100, score));
        let grade = 'F';

        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 85) grade = 'A';
        else if (percentage >= 80) grade = 'A-';
        else if (percentage >= 75) grade = 'B+';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 65) grade = 'B-';
        else if (percentage >= 60) grade = 'C+';
        else if (percentage >= 55) grade = 'C';
        else if (percentage >= 50) grade = 'C-';
        else if (percentage >= 45) grade = 'D+';
        else if (percentage >= 40) grade = 'D';
        else grade = 'F';

        return { grade, percentage: Math.round(percentage) };
    }

    /**
     * Assess data quality for diagnostic purposes (standardized with Elder)
     */
    assessDataQuality(indicators, series) {
        const quality = {
            overall: 'GOOD',
            weekly: series?.weekly?.length >= 52 ? 'EXCELLENT' : series?.weekly?.length >= 26 ? 'GOOD' : 'POOR',
            daily: series?.daily?.length >= 200 ? 'EXCELLENT' : series?.daily?.length >= 50 ? 'GOOD' : 'POOR',
            indicators: indicators?.sepa_specific && indicators?.base ? 'COMPLETE' : 'MISSING'
        };

        // Determine overall quality
        const scores = [quality.weekly, quality.daily].map(q =>
            q === 'EXCELLENT' ? 3 : q === 'GOOD' ? 2 : q === 'POOR' ? 1 : 0
        );
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avgScore >= 2.5) quality.overall = 'EXCELLENT';
        else if (avgScore >= 2.0) quality.overall = 'GOOD';
        else if (avgScore >= 1.5) quality.overall = 'FAIR';
        else quality.overall = 'POOR';

        return quality;
    }

    /**
     * Create avoid signal for error conditions (standardized with Elder)
     */
    createAvoidSignal(reasonCode, message) {
        return {
            system: this.systemId,
            systemName: this.name,
            decision: 'AVOID',
            confidence: 0.2,
            reasoning: [message],
            riskReward: { riskReward: 0 },
            signalQuality: { grade: 'F', percentage: 0 },
            execution: null,
            error: reasonCode,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MinerviniSEPA;

    