/**
 * CAN SLIM Cup-with-Handle Breakout Trading System
 * 
 * Based on William O'Neil's CAN SLIM methodology for detecting Cup-with-Handle patterns.
 * Implements strict pattern recognition criteria with volume confirmation and breakout triggers.
 * 
 * Pattern Requirements:
 * - Cup: U-shaped base, 12-35% depth, minimum 30 days duration
 * - Handle: <12% pullback from pivot, 5-15 days duration, tight/light volume
 * - Breakout: Volume ≥40% above 50-day average, close in top 25% of range
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2024
 */

const dayjs = require('dayjs');

class CupWithHandle {
    constructor() {
        this.systemId = 'cup_handle';
        this.name = 'CAN SLIM Cup-with-Handle';
        this.description = 'Cup-with-Handle breakout system based on William O\'Neil methodology';
        this.version = '1.0.0';
        
        // Pattern criteria constants
        this.CUP_MIN_DURATION = 30; // Minimum 30 trading days (6 weeks)
        this.CUP_MIN_DEPTH_PCT = 12; // Minimum 12% correction
        this.CUP_MAX_DEPTH_PCT = 35; // Maximum 35% correction
        this.HANDLE_MAX_DEPTH_PCT = 12; // Handle max 12% from pivot
        this.HANDLE_MIN_DURATION = 5; // Minimum 5 days
        this.HANDLE_MAX_DURATION = 15; // Maximum 15 days
        this.BREAKOUT_VOLUME_THRESHOLD = 1.4; // 40% above 50-day average
        this.BREAKOUT_CLOSE_THRESHOLD = 0.75; // Close in top 25% of range
        this.RSI_BREAKOUT_MIN = 60; // Preferred RSI level for breakout
        this.STOP_LOSS_PCT = 0.07; // 7% stop loss below breakout
    }

    /**
     * Main analysis method for Cup-with-Handle pattern detection
     * @param {Object} data - Technical data with OHLCV and indicators
     * @param {Object} options - Analysis options
     * @returns {Object} - Complete Cup-with-Handle analysis result
     */
    analyze(data, options = {}) {
        console.log(`  🏆 CUP-HANDLE: Starting CAN SLIM Cup-with-Handle analysis...`);

        try {
            const { series, indicators } = data;
            
            if (!this.validateData(series, indicators)) {
                return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required OHLCV data or indicators');
            }

            const dailyData = series.daily;
            const latest = dailyData[dailyData.length - 1];
            
            console.log(`  🏆 Analyzing ${dailyData.length} days of data, current price: $${latest.close.toFixed(2)}`);

            // Phase 1: Detect cup structure
            const cupAnalysis = this.detectCup(dailyData);
            
            // Phase 2: Detect handle formation (only if cup is valid)
            let handleAnalysis = null;
            if (cupAnalysis.isValid) {
                handleAnalysis = this.detectHandle(dailyData, cupAnalysis);
            }

            // Phase 3: Check for breakout trigger
            let breakoutAnalysis = null;
            if (cupAnalysis.isValid && handleAnalysis?.isValid) {
                breakoutAnalysis = this.isBreakout(dailyData, indicators, cupAnalysis, handleAnalysis);
            }

            // Phase 4: Generate trading signals
            const signalAnalysis = this.generateSignals(cupAnalysis, handleAnalysis, breakoutAnalysis, latest);

            // Phase 5: Calculate risk/reward
            const riskReward = this.calculateRisk(signalAnalysis, cupAnalysis, handleAnalysis, latest);

            // Phase 6: Final decision
            const finalDecision = this.makeFinalDecision(signalAnalysis, riskReward, cupAnalysis, handleAnalysis, breakoutAnalysis);

            return {
                system: this.systemId,
                systemName: this.name,
                decision: finalDecision.signal,
                confidence: finalDecision.confidence,
                reasoning: [finalDecision.reasoning], // Wrap in array for consistency
                
                // Pattern breakdown
                pattern: {
                    cup: cupAnalysis,
                    handle: handleAnalysis,
                    breakout: breakoutAnalysis
                },
                
                // Risk management
                riskReward: riskReward,
                
                // Execution details
                executionPlan: finalDecision.executionPlan,
                
                // Quality metrics
                signalQuality: this.calculateSignalQuality(finalDecision, cupAnalysis, handleAnalysis),
                
                // System metadata
                timestamp: new Date().toISOString(),
                systemVersion: this.version,
                dataQuality: this.assessDataQuality(dailyData, indicators)
            };

        } catch (error) {
            console.error('Cup-with-Handle analysis error:', error);
            return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
        }
    }

    /**
     * Phase 1: Detect valid cup structure
     */
    detectCup(dailyData) {
        console.log(`  🏆 Phase 1: Detecting cup structure...`);
        
        if (dailyData.length < this.CUP_MIN_DURATION + 20) {
            return { 
                isValid: false, 
                reason: 'Insufficient data for cup detection',
                duration: 0,
                depth: 0
            };
        }

        // Look for potential cup in last 120 days (allow for various cup sizes)
        const lookbackPeriod = Math.min(120, dailyData.length - 20);
        const recentData = dailyData.slice(-lookbackPeriod);
        
        let bestCup = null;
        let maxScore = 0;

        // Scan for cup patterns of different durations
        for (let cupDuration = this.CUP_MIN_DURATION; cupDuration <= Math.min(90, recentData.length - 10); cupDuration += 5) {
            const cupData = recentData.slice(-(cupDuration + 10), -10); // Leave 10 days for handle
            const cupAnalysis = this.analyzeCupStructure(cupData);
            
            if (cupAnalysis.score > maxScore) {
                maxScore = cupAnalysis.score;
                bestCup = {
                    ...cupAnalysis,
                    startIndex: recentData.length - cupDuration - 10,
                    endIndex: recentData.length - 10,
                    duration: cupDuration
                };
            }
        }

        if (!bestCup || maxScore < 0.6) {
            return {
                isValid: false,
                reason: 'No valid cup pattern found',
                score: maxScore,
                duration: 0,
                depth: 0
            };
        }

        console.log(`  🏆 Cup detected: ${bestCup.duration} days, ${(bestCup.depth * 100).toFixed(1)}% depth, score: ${bestCup.score.toFixed(2)}`);
        
        return {
            isValid: true,
            ...bestCup,
            reason: 'Valid U-shaped cup pattern detected'
        };
    }

    /**
     * Analyze cup structure for shape, depth, and volume characteristics
     */
    analyzeCupStructure(cupData) {
        if (cupData.length < this.CUP_MIN_DURATION) {
            return { score: 0, reason: 'Cup too short' };
        }

        const highs = cupData.map(d => d.high);
        const lows = cupData.map(d => d.low);
        const closes = cupData.map(d => d.close);
        const volumes = cupData.map(d => d.volume);
        
        // Find cup peak (left side high)
        const leftSideEnd = Math.floor(cupData.length * 0.3);
        const leftSideHighs = highs.slice(0, leftSideEnd);
        const leftPeakIndex = leftSideHighs.indexOf(Math.max(...leftSideHighs));
        const leftPeak = highs[leftPeakIndex];
        
        // Find cup bottom
        const bottomStartIndex = Math.floor(cupData.length * 0.3);
        const bottomEndIndex = Math.floor(cupData.length * 0.7);
        const bottomSection = lows.slice(bottomStartIndex, bottomEndIndex);
        const bottomIndex = bottomSection.indexOf(Math.min(...bottomSection)) + bottomStartIndex;
        const cupBottom = lows[bottomIndex];
        
        // Find right side recovery
        const rightSideStart = Math.floor(cupData.length * 0.7);
        const rightSideHighs = highs.slice(rightSideStart);
        const rightPeak = Math.max(...rightSideHighs);
        
        // Calculate cup depth
        const cupDepth = (leftPeak - cupBottom) / leftPeak;
        
        // Validate cup depth
        if (cupDepth < this.CUP_MIN_DEPTH_PCT / 100 || cupDepth > this.CUP_MAX_DEPTH_PCT / 100) {
            return { 
                score: 0, 
                reason: `Cup depth ${(cupDepth * 100).toFixed(1)}% outside valid range (${this.CUP_MIN_DEPTH_PCT}-${this.CUP_MAX_DEPTH_PCT}%)`,
                depth: cupDepth
            };
        }

        // Score cup shape (U-shape vs V-shape)
        const shapeScore = this.scoreCupShape(cupData, leftPeakIndex, bottomIndex);
        
        // Score volume pattern (should dry up at bottom, increase on right side)
        const volumeScore = this.scoreCupVolume(volumes, bottomIndex);
        
        // Score right side recovery
        const recoveryScore = rightPeak >= leftPeak * 0.95 ? 1.0 : (rightPeak / leftPeak) * 0.8;
        
        const overallScore = (shapeScore * 0.4 + volumeScore * 0.3 + recoveryScore * 0.3);
        
        return {
            score: overallScore,
            depth: cupDepth,
            leftPeak,
            rightPeak,
            cupBottom,
            leftPeakIndex,
            bottomIndex,
            shapeScore,
            volumeScore,
            recoveryScore,
            pivot: Math.max(leftPeak, rightPeak)
        };
    }

    /**
     * Score cup shape for U-shape characteristics
     */
    scoreCupShape(cupData, leftPeakIndex, bottomIndex) {
        const closes = cupData.map(d => d.close);
        
        // Check if decline is gradual (not V-shaped)
        const leftSide = closes.slice(leftPeakIndex, bottomIndex);
        const rightSide = closes.slice(bottomIndex);
        
        // Calculate slope consistency on left side
        let leftSlopeChanges = 0;
        for (let i = 1; i < leftSide.length - 1; i++) {
            const slope1 = leftSide[i] - leftSide[i - 1];
            const slope2 = leftSide[i + 1] - leftSide[i];
            if ((slope1 > 0 && slope2 < 0) || (slope1 < 0 && slope2 > 0)) {
                leftSlopeChanges++;
            }
        }
        
        // Calculate slope consistency on right side
        let rightSlopeChanges = 0;
        for (let i = 1; i < rightSide.length - 1; i++) {
            const slope1 = rightSide[i] - rightSide[i - 1];
            const slope2 = rightSide[i + 1] - rightSide[i];
            if ((slope1 > 0 && slope2 < 0) || (slope1 < 0 && slope2 > 0)) {
                rightSlopeChanges++;
            }
        }
        
        // Lower slope changes = more U-shaped
        const totalChanges = leftSlopeChanges + rightSlopeChanges;
        const maxExpectedChanges = cupData.length * 0.3; // Allow some volatility
        
        return Math.max(0, 1 - (totalChanges / maxExpectedChanges));
    }

    /**
     * Score cup volume pattern
     */
    scoreCupVolume(volumes, bottomIndex) {
        if (volumes.length < 10) return 0.5; // Neutral if insufficient data
        
        const leftVolumes = volumes.slice(0, bottomIndex);
        const rightVolumes = volumes.slice(bottomIndex);
        
        const leftAvgVolume = leftVolumes.reduce((sum, v) => sum + v, 0) / leftVolumes.length;
        const rightAvgVolume = rightVolumes.reduce((sum, v) => sum + v, 0) / rightVolumes.length;
        const bottomVolumes = volumes.slice(Math.max(0, bottomIndex - 5), bottomIndex + 5);
        const bottomAvgVolume = bottomVolumes.reduce((sum, v) => sum + v, 0) / bottomVolumes.length;
        
        // Ideal: volume dries up at bottom, picks up on right side
        const volumeContraction = bottomAvgVolume < leftAvgVolume ? 1.0 : 0.5;
        const volumeExpansion = rightAvgVolume > bottomAvgVolume ? 1.0 : 0.5;
        
        return (volumeContraction + volumeExpansion) / 2;
    }

    /**
     * Phase 2: Detect handle formation
     */
    detectHandle(dailyData, cupAnalysis) {
        console.log(`  🏆 Phase 2: Detecting handle formation...`);
        
        if (!cupAnalysis.isValid) {
            return { isValid: false, reason: 'No valid cup found' };
        }

        // Look for handle in last 5-15 days (excluding today for resistance calculation)
        const handleData = dailyData.slice(-(this.HANDLE_MAX_DURATION + 1), -1); // Exclude the current day
        
        if (handleData.length < this.HANDLE_MIN_DURATION) {
            return { 
                isValid: false, 
                reason: 'Insufficient recent data for handle detection',
                duration: handleData.length
            };
        }

        const pivot = cupAnalysis.pivot;
        const handleHighs = handleData.map(d => d.high);
        const handleLows = handleData.map(d => d.low);
        const handleVolumes = handleData.map(d => d.volume);
        
        // Find highest point in handle period (should be near pivot)
        const handleHigh = Math.max(...handleHighs);
        const handleLow = Math.min(...handleLows);
        
        // Calculate handle depth
        const handleDepth = (handleHigh - handleLow) / handleHigh;
        
        // Validate handle depth
        if (handleDepth > this.HANDLE_MAX_DEPTH_PCT / 100) {
            return {
                isValid: false,
                reason: `Handle too deep: ${(handleDepth * 100).toFixed(1)}% (max ${this.HANDLE_MAX_DEPTH_PCT}%)`,
                depth: handleDepth,
                duration: handleData.length
            };
        }

        // Check if handle is near pivot level
        const pivotProximity = handleHigh / pivot;
        if (pivotProximity < 0.95) {
            return {
                isValid: false,
                reason: `Handle too far from pivot: ${(pivotProximity * 100).toFixed(1)}% of pivot`,
                pivotProximity,
                duration: handleData.length
            };
        }

        // Score handle tightness (should have small daily ranges)
        const tightnessScore = this.scoreHandleTightness(handleData);
        
        // Score handle volume (should be light)
        const volumeScore = this.scoreHandleVolume(handleVolumes);
        
        // Score handle trend (should drift down slightly)
        const trendScore = this.scoreHandleTrend(handleData);
        
        const overallScore = (tightnessScore * 0.4 + volumeScore * 0.3 + trendScore * 0.3);
        
        console.log(`  🏆 Handle detected: ${handleData.length} days, ${(handleDepth * 100).toFixed(1)}% depth, score: ${overallScore.toFixed(2)}`);
        
        return {
            isValid: overallScore >= 0.6,
            score: overallScore,
            depth: handleDepth,
            duration: handleData.length,
            handleHigh,
            handleLow,
            pivotProximity,
            tightnessScore,
            volumeScore,
            trendScore,
            resistance: handleHigh,
            reason: overallScore >= 0.6 ? 'Valid handle formation detected' : 'Handle quality insufficient'
        };
    }

    /**
     * Score handle tightness
     */
    scoreHandleTightness(handleData) {
        const dailyRanges = handleData.map(d => (d.high - d.low) / d.close);
        const avgRange = dailyRanges.reduce((sum, r) => sum + r, 0) / dailyRanges.length;
        
        // Prefer tight ranges (less than 3% daily range on average)
        return avgRange < 0.03 ? 1.0 : Math.max(0, 1 - ((avgRange - 0.03) / 0.02));
    }

    /**
     * Score handle volume
     */
    scoreHandleVolume(handleVolumes) {
        if (handleVolumes.length < 3) return 0.5;
        
        const avgVolume = handleVolumes.reduce((sum, v) => sum + v, 0) / handleVolumes.length;
        const recentAvg = handleVolumes.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
        
        // Prefer declining or stable volume
        return recentAvg <= avgVolume ? 1.0 : 0.5;
    }

    /**
     * Score handle trend
     */
    scoreHandleTrend(handleData) {
        const closes = handleData.map(d => d.close);
        const firstClose = closes[0];
        const lastClose = closes[closes.length - 1];
        
        // Prefer slight downward drift or sideways
        const trendChange = (lastClose - firstClose) / firstClose;
        
        if (trendChange >= -0.05 && trendChange <= 0.02) {
            return 1.0; // Ideal range: -5% to +2%
        } else if (trendChange > 0.02) {
            return 0.3; // Too much upward drift
        } else {
            return Math.max(0, 1 + trendChange / 0.05); // Gradual penalty for deeper decline
        }
    }

    /**
     * Phase 3: Check for breakout trigger
     */
    isBreakout(dailyData, indicators, cupAnalysis, handleAnalysis) {
        console.log(`  🏆 Phase 3: Checking breakout trigger...`);
        
        const latest = dailyData[dailyData.length - 1];
        const previous = dailyData[dailyData.length - 2];
        
        const resistance = handleAnalysis.resistance || cupAnalysis.pivot;
        
        // 1. Price breakout above resistance
        const priceBreakout = latest.close > resistance;
        
        // 2. Volume confirmation
        const recent50DayVolumes = dailyData.slice(-50).map(d => d.volume);
        const avg50DayVolume = recent50DayVolumes.reduce((sum, v) => sum + v, 0) / recent50DayVolumes.length;
        const volumeBreakout = latest.volume >= avg50DayVolume * this.BREAKOUT_VOLUME_THRESHOLD;
        
        // 3. Close in top 25% of daily range
        const dailyRange = latest.high - latest.low;
        const closePosition = dailyRange > 0 ? (latest.close - latest.low) / dailyRange : 0;
        const strongClose = closePosition >= this.BREAKOUT_CLOSE_THRESHOLD;
        
        // 4. RSI confirmation (preferred but not required)
        const rsi14 = indicators?.base?.rsi14;
        const rsiStrong = rsi14 ? rsi14 >= this.RSI_BREAKOUT_MIN : false;
        
        // 5. No heavy selling in previous days
        const noPriorSelling = this.checkNoPriorSelling(dailyData.slice(-5));
        
        const breakoutScore = [priceBreakout, volumeBreakout, strongClose, rsiStrong, noPriorSelling]
            .map(condition => condition ? 1 : 0)
            .reduce((sum, score) => sum + score, 0) / 5;
        
        console.log(`  🏆 Breakout analysis: Price=${priceBreakout}, Volume=${volumeBreakout}, Close=${strongClose}, RSI=${rsiStrong}, Score=${breakoutScore.toFixed(2)}`);
        
        return {
            isBreakout: priceBreakout && volumeBreakout && strongClose && breakoutScore >= 0.6,
            score: breakoutScore,
            resistance,
            priceBreakout,
            volumeBreakout,
            strongClose,
            rsiStrong,
            noPriorSelling,
            breakoutPrice: latest.close,
            breakoutVolume: latest.volume,
            avg50DayVolume,
            volumeRatio: latest.volume / avg50DayVolume,
            closePosition,
            rsi: rsi14
        };
    }

    /**
     * Check for absence of heavy selling in recent days
     */
    checkNoPriorSelling(recentData) {
        return !recentData.some(day => {
            const range = day.high - day.low;
            const closePosition = range > 0 ? (day.close - day.low) / range : 0.5;
            return closePosition < 0.3; // No days closing in bottom 30%
        });
    }

    /**
     * Phase 4: Generate trading signals
     */
    generateSignals(cupAnalysis, handleAnalysis, breakoutAnalysis, latest) {
        console.log(`  🏆 Phase 4: Generating trading signals...`);
        
        let signal = 'HOLD';
        let signalStrength = 0;
        let reasoning = [];
        
        // Only generate BUY signal if all pattern components are valid and breakout confirmed
        if (cupAnalysis.isValid && 
            handleAnalysis?.isValid && 
            breakoutAnalysis?.isBreakout) {
            
            signal = 'BUY';
            signalStrength = (cupAnalysis.score + handleAnalysis.score + breakoutAnalysis.score) / 3;
            
            reasoning.push(
                `Valid cup pattern (${cupAnalysis.duration} days, ${(cupAnalysis.depth * 100).toFixed(1)}% depth)`,
                `Handle formation confirmed (${handleAnalysis.duration} days)`,
                `Volume breakout (${breakoutAnalysis.volumeRatio.toFixed(1)}x average)`,
                `Strong close (${(breakoutAnalysis.closePosition * 100).toFixed(0)}% of range)`
            );
            
        } else if (cupAnalysis.isValid && handleAnalysis?.isValid) {
            signal = 'WATCH';
            signalStrength = (cupAnalysis.score + handleAnalysis.score) / 2;
            reasoning.push(
                'Cup-with-handle pattern formed',
                'Waiting for volume breakout above resistance'
            );
            
        } else if (cupAnalysis.isValid) {
            signal = 'WATCH';
            signalStrength = cupAnalysis.score * 0.5;
            reasoning.push(
                'Cup pattern detected',
                'Waiting for handle formation'
            );
            
        } else {
            signal = 'AVOID';
            signalStrength = 0;
            reasoning.push('No valid cup-with-handle pattern detected');
        }
        
        return {
            signal,
            signalStrength,
            reasoning: reasoning.join('; '),
            entryPrice: latest.close,
            factors: {
                cupValid: cupAnalysis.isValid,
                handleValid: handleAnalysis?.isValid || false,
                breakoutConfirmed: breakoutAnalysis?.isBreakout || false
            }
        };
    }

    /**
     * Phase 5: Calculate risk/reward metrics
     */
    calculateRisk(signalAnalysis, cupAnalysis, handleAnalysis, latest) {
        console.log(`  🏆 Phase 5: Calculating risk/reward...`);
        
        const entryPrice = signalAnalysis.entryPrice;
        let stopLoss = 0;
        let targets = [];
        let riskReward = 0;
        
        if (signalAnalysis.signal === 'BUY') {
            // Stop loss: 7% below breakout or below handle low
            const handleStopLoss = handleAnalysis?.handleLow || entryPrice * 0.93;
            const percentageStopLoss = entryPrice * (1 - this.STOP_LOSS_PCT);
            stopLoss = Math.max(handleStopLoss, percentageStopLoss);
            
            // Targets based on cup depth (measured move)
            const cupDepth = cupAnalysis.depth || 0.20;
            const measuredMove = entryPrice * (1 + cupDepth);
            
            targets = [
                entryPrice * 1.15, // 15% target
                entryPrice * 1.25, // 25% target  
                measuredMove       // Measured move target
            ];
            
            const risk = entryPrice - stopLoss;
            const reward = targets[0] - entryPrice;
            riskReward = risk > 0 ? reward / risk : 0;
            
        } else if (signalAnalysis.signal === 'WATCH') {
            // Projected risk/reward for watch scenarios
            const projectedEntry = latest.close * 1.02; // Assume 2% breakout
            const projectedStop = projectedEntry * 0.93;
            const projectedTarget = projectedEntry * 1.15;
            
            stopLoss = projectedStop;
            targets = [projectedTarget];
            riskReward = (projectedTarget - projectedEntry) / (projectedEntry - projectedStop);
        }
        
        return {
            stopLoss: Math.round(stopLoss * 100) / 100,
            targets: targets.map(t => Math.round(t * 100) / 100),
            riskReward: Math.round(riskReward * 100) / 100,
            entryPrice: Math.round(entryPrice * 100) / 100
        };
    }

    /**
     * Phase 6: Make final trading decision (with volume dry-up, earnings, and enhanced logs)
     */
    makeFinalDecision(signalAnalysis, riskReward, cupAnalysis, handleAnalysis, breakoutAnalysis, options = {}) {
        console.log(`  🏆 Phase 6: Making final decision...`);
        // --- Begin Insert: Volume Dry-Up and Earnings Checks ---
        // volume array and latest daily data
        const volume = options?.volume || (options?.series?.daily ? options.series.daily.map(d => d.volume) : []);
        const dailyData = options?.series?.daily || [];
        const latest = dailyData.length ? dailyData[dailyData.length - 1] : {};
        const earnings = options?.earnings;
        const log = options?.log || { info: () => {} };
        // Cup base indices
        let cupStartIndex = 0, cupEndIndex = 0;
        if (cupAnalysis && typeof cupAnalysis.startIndex === 'number' && typeof cupAnalysis.endIndex === 'number') {
            cupStartIndex = cupAnalysis.startIndex;
            cupEndIndex = cupAnalysis.endIndex;
        }
        // Defensive: check indices and volume array
        let baseVolumes = [];
        if (
            Array.isArray(volume) &&
            cupStartIndex >= 0 && cupEndIndex > cupStartIndex &&
            cupEndIndex <= volume.length
        ) {
            baseVolumes = volume.slice(cupStartIndex, cupEndIndex);
        }
        let baseVolAvg = 0, baseVolMin = 0, hasVolumeDryUp = false;
        if (baseVolumes.length >= 5) {
            baseVolAvg = baseVolumes.reduce((a, b) => a + b, 0) / baseVolumes.length;
            baseVolMin = Math.min(...baseVolumes.slice(-5));
            hasVolumeDryUp = baseVolMin < baseVolAvg * 0.75;
        }
        log.info("Volume Dry-Up Check", { baseVolAvg, baseVolMin, hasVolumeDryUp });
        // Earnings proximity check
        let isNearEarnings = false;
        if (earnings && earnings.date && latest && latest.date) {
            try {
                isNearEarnings = Math.abs(dayjs(earnings.date).diff(dayjs(latest.date), 'day')) <= 3;
            } catch (e) {
                isNearEarnings = false;
            }
        }
        log.info("Earnings Check", { isNearEarnings });
        // --- End Insert ---
        let finalSignal = signalAnalysis.signal;
        let confidence = 0.5;
        let reasoning = [signalAnalysis.reasoning];
        // Use dynamic confidence for ALL signal types
        confidence = this.calculateCupHandleConfidence(cupAnalysis, handleAnalysis, breakoutAnalysis, signalAnalysis, finalSignal);
        // --- Begin Insert: Gate final BUY signal with new conditions ---
        // Compose gate conditions
        const isValidCupDepth = cupAnalysis?.isValid;
        const isValidCupDuration = !!(cupAnalysis?.duration && cupAnalysis.duration >= this.CUP_MIN_DURATION);
        const isValidHandleDepth = handleAnalysis?.isValid;
        const isHandleDownward = (handleAnalysis?.trendScore ?? 0) > 0.5;
        const isValidHandleDuration = !!(handleAnalysis?.duration && handleAnalysis.duration >= this.HANDLE_MIN_DURATION);
        const breakoutValid = breakoutAnalysis?.isBreakout;
        // Trend aligned: right side recovery, handle not upward
        const trendAligned = (cupAnalysis?.recoveryScore ?? 0) > 0.5;
        // Use hasVolumeDryUp and !isNearEarnings
        if (
            finalSignal === 'BUY' &&
            (
                !(
                    isValidCupDepth && isValidCupDuration &&
                    isValidHandleDepth && isHandleDownward &&
                    isValidHandleDuration && breakoutValid &&
                    trendAligned && hasVolumeDryUp &&
                    !isNearEarnings
                )
            )
        ) {
            finalSignal = 'WATCH';
            reasoning.push('Pattern failed additional quality checks (volume dry-up, earnings proximity, or structure)');
        }
        // If all enhanced conditions pass, override with enhanced BUY signal
        if (
            isValidCupDepth && isValidCupDuration &&
            isValidHandleDepth && isHandleDownward &&
            isValidHandleDuration && breakoutValid &&
            trendAligned && hasVolumeDryUp &&
            !isNearEarnings
        ) {
            // Return enhanced BUY signal
            return {
                signal: "BUY",
                strategy: "cup_handle",
                confidence: 0.89,
                reason: "Confirmed Cup-with-Handle breakout on strong volume and clean structure",
                stopLoss: riskReward.stopLoss,
                targets: [cupAnalysis.pivot * 1.06, cupAnalysis.pivot * 1.1, cupAnalysis.pivot * 1.15],
                riskReward: 2.7,
                setupQuality: "A"
            };
        }
        // --- End Insert ---
        // Build execution plan
        const executionPlan = this.buildExecutionPlan(finalSignal, riskReward, cupAnalysis, handleAnalysis);
        return {
            signal: finalSignal,
            confidence: Math.round(confidence * 100) / 100,
            reasoning: reasoning.join('; '),
            executionPlan
        };
    }

    /**
     * Build execution plan based on signal
     */
    buildExecutionPlan(signal, riskReward, cupAnalysis, handleAnalysis) {
        const plan = {
            action: signal,
            entryStrategy: null,
            exitStrategy: null,
            positionSizing: null
        };
        
        if (signal === 'BUY') {
            plan.entryStrategy = {
                type: 'BREAKOUT',
                method: 'Market order on breakout confirmation',
                conditions: ['Volume ≥40% above 50-day average', 'Close in top 25% of range']
            };
            
            plan.exitStrategy = {
                stopLoss: riskReward.stopLoss,
                targets: riskReward.targets,
                trailingStop: 'Consider trailing stop after 15% gain',
                timeStop: 'Review if no progress after 4-6 weeks'
            };
            
            plan.positionSizing = {
                risk: '1-2% of portfolio at stop loss',
                recommendation: riskReward.riskReward >= 2.5 ? 'FULL' : 'HALF'
            };
            
        } else if (signal === 'WATCH') {
            plan.entryStrategy = {
                type: 'BREAKOUT_PENDING',
                method: 'Set alert above handle resistance',
                conditions: ['Wait for volume breakout', 'Confirm strong close']
            };
        }
        
        return plan;
    }

    /**
     * Calculate signal quality grade
     */
    calculateSignalQuality(finalDecision, cupAnalysis, handleAnalysis) {
        let score = 50; // Base score
        
        if (finalDecision.signal === 'BUY') {
            // Pattern quality scoring
            score += cupAnalysis.score * 25;
            if (handleAnalysis?.isValid) {
                score += handleAnalysis.score * 25;
            }
            
            // Confidence bonus
            score += (finalDecision.confidence - 0.5) * 40;
            
        } else if (finalDecision.signal === 'WATCH') {
            score = 60 + (finalDecision.confidence * 20);
        } else {
            score = 30;
        }
        
        const percentage = Math.max(0, Math.min(100, Math.round(score)));
        
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
        
        return { grade, percentage };
    }

    /**
     * Validate required data
     */
    validateData(series, indicators) {
        if (!series?.daily || series.daily.length < this.CUP_MIN_DURATION + 20) {
            return false;
        }
        
        // Check for required OHLCV data
        const latest = series.daily[series.daily.length - 1];
        if (!latest.high || !latest.low || !latest.close || !latest.volume) {
            return false;
        }
        
        return true;
    }

    /**
     * Assess data quality
     */
    assessDataQuality(dailyData, indicators) {
        if (dailyData.length >= 120) return 'EXCELLENT';
        if (dailyData.length >= 90) return 'GOOD';
        if (dailyData.length >= 60) return 'FAIR';
        return 'POOR';
    }

    /**
     * Create AVOID signal with dynamic confidence
     */
    createAvoidSignal(code, message, analysisData = null) {
        // Use dynamic confidence even for AVOID signals
        let confidence = 0.25; // Base for AVOID
        
        // If we have analysis data, use dynamic confidence
        if (analysisData) {
            confidence = this.calculateCupHandleConfidence(
                analysisData.cup,
                analysisData.handle,
                analysisData.breakout,
                analysisData.signal,
                'AVOID'
            );
        }
        
        return {
            system: this.systemId,
            systemName: this.name,
            decision: 'AVOID',
            confidence: confidence,
            reasoning: [message],
            
            pattern: null,
            riskReward: null,
            executionPlan: null,
            signalQuality: { grade: 'F', percentage: Math.round(confidence * 100) },
            
            timestamp: new Date().toISOString(),
            systemVersion: this.version,
            errorCode: code
        };
    }

    /**
     * Calculate dynamic confidence for Cup-with-Handle system based on setup strength
     */
    calculateCupHandleConfidence(cupAnalysis, handleAnalysis, breakoutAnalysis, signalAnalysis, signal) {
        let confidence = 0.3; // Base confidence
        
        // Adjust base confidence by signal type
        if (signal === 'BUY') {
            confidence = 0.65; // Higher base for BUY
        } else if (signal === 'WATCH') {
            confidence = 0.45; // Medium base for WATCH
        } else if (signal === 'SELL') {
            confidence = 0.55; // Higher base for SELL
        } else {
            confidence = 0.25; // Lower base for HOLD/AVOID
        }
        
        // Cup structure quality
        if (cupAnalysis?.isValid) {
            confidence += 0.15;
            
            // Cup depth bonus (12-35% is ideal)
            const cupDepth = cupAnalysis.depthPercent || cupAnalysis.depth * 100 || 0;
            if (cupDepth >= 12 && cupDepth <= 35) {
                confidence += 0.10;
            } else if (cupDepth >= 8 && cupDepth <= 45) {
                confidence += 0.05;
            }
            
            // Cup duration bonus
            const cupDuration = cupAnalysis.duration || 0;
            if (cupDuration >= 7 && cupDuration <= 65) {
                confidence += 0.08;
            }
            
            // Cup score quality
            if (cupAnalysis.score >= 0.8) {
                confidence += 0.08;
            } else if (cupAnalysis.score >= 0.6) {
                confidence += 0.05;
            }
        }
        
        // Handle quality
        if (handleAnalysis?.isValid) {
            confidence += 0.10;
            
            // Handle depth (should be shallow, 8-12% is ideal)
            const handleDepth = handleAnalysis.depthPercent || handleAnalysis.depth * 100 || 0;
            if (handleDepth >= 8 && handleDepth <= 12) {
                confidence += 0.08;
            } else if (handleDepth <= 20) {
                confidence += 0.04;
            }
            
            // Handle score quality
            if (handleAnalysis.score >= 0.8) {
                confidence += 0.06;
            } else if (handleAnalysis.score >= 0.6) {
                confidence += 0.03;
            }
        }
        
        // Breakout confirmation
        if (breakoutAnalysis?.isBreakout) {
            confidence += 0.12;
            
            // Volume breakout strength
            if (breakoutAnalysis.volumeRatio >= 1.5) {
                confidence += 0.08;
            } else if (breakoutAnalysis.volumeRatio >= 1.2) {
                confidence += 0.05;
            }
        }
        
        // Signal strength factor
        if (signalAnalysis?.signalStrength >= 0.8) {
            confidence += 0.06;
        } else if (signalAnalysis?.signalStrength >= 0.6) {
            confidence += 0.03;
        }
        
        return Math.min(Math.max(confidence, 0.15), 0.85);
    }
}

module.exports = CupWithHandle;
