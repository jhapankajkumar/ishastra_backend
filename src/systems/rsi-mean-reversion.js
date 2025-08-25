/**
 * RSI Mean Reversion Trading System
 * 
 * Based on mean reversion theory using RSI oversold conditions with support confirmation.
 * Detects high-probability bounce opportunities when price hits oversold levels near support.
 * 
 * Signal Requirements:
 * - RSI(14) < oversold threshold (default: 30)
 * - Price within 2% of support (EMA20, EMA50, or swing low)
 * - Bullish candle closing in top 50% of range
 * - RSI rising from previous period
 * - RSI not already mean-reverted (< 60)
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2024
 */

class RSIMeanReversion {
    constructor() {
        this.systemId = 'rsi_mean';
        this.name = 'RSI Mean Reversion';
        this.description = 'Mean reversion system detecting oversold bounce opportunities with support confirmation';
        this.version = '1.0.0';

        // Configuration constants
        this.RSI_PERIOD = 14;
        this.RSI_OVERSOLD_THRESHOLD = 30;
        this.RSI_OVERBOUGHT_THRESHOLD = 70;
        this.RSI_MAX_THRESHOLD = 60; // Avoid if RSI already above this
        this.SUPPORT_PROXIMITY_PCT = 2.0; // Within 2% of support
        this.CANDLE_CLOSE_POSITION_MIN = 0.5; // Close in top 50% of range
        this.SWING_LOW_LOOKBACK = 20; // Days to look back for swing lows
        this.STOP_LOSS_PCT = 0.04; // 4% stop loss below entry
        this.TARGET_MULTIPLE = 2.0; // 2:1 risk/reward minimum
    }

    /**
     * Main analysis method for RSI mean reversion detection
     * @param {Object} data - Technical data with OHLCV and indicators
     * @param {Object} options - Analysis options including capital, symbol, currentPrice
     * @returns {Object} - Complete RSI mean reversion analysis result
     */
    analyze(data, options = {}) {
        //console.log(`  📈 RSI-MEAN: Starting RSI Mean Reversion analysis...`);

        try {
            const { series, indicators } = data;

            if (!this.validateData(series, indicators)) {
                return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required OHLCV data or RSI indicator');
            }

            // Extract capital and pricing information from options
            const { capital, symbol, currentPrice } = options;
            const entryPrice = currentPrice || series.daily[series.daily.length - 1]?.close || 0;

            const dailyData = series.daily;
            const latest = dailyData[dailyData.length - 1];
            const previous = dailyData[dailyData.length - 2];

            //console.log(`  📈 Analyzing ${dailyData.length} days of data, current price: $${latest.close.toFixed(2)}`);

            // Phase 1: RSI analysis
            const rsiAnalysis = this.analyzeRSI(dailyData, indicators);

            // Phase 2: Support level identification
            const supportAnalysis = this.identifySupport(dailyData, indicators, latest);

            // Phase 3: Candle structure validation
            const candleAnalysis = this.analyzeCandleStructure(latest, previous);

            // Phase 4: Generate trading signals
            const signalAnalysis = this.generateSignals(rsiAnalysis, supportAnalysis, candleAnalysis, latest);

            // Phase 5: Calculate risk/reward
            const riskAssessment = this.calculateRisk(signalAnalysis, supportAnalysis, latest);

            // Phase 6: Final decision
            const finalDecision = this.makeFinalDecision(signalAnalysis, riskAssessment, rsiAnalysis, supportAnalysis, candleAnalysis);

            // Calculate enhanced risk/reward with conditional calculations for WATCH signals
            const enhancedRiskReward = this.calculateRiskReward(riskAssessment, signalAnalysis, finalDecision.signal, series, currentPrice);

            // Create execution plan with capital-aware position sizing
            let execution = null;
            if (finalDecision.signal !== 'AVOID') {
                execution = this.createExecutionPlan(finalDecision, rsiAnalysis, supportAnalysis, candleAnalysis, riskAssessment, signalAnalysis, series, options);
            }

            // Calculate signal quality grade
            const signalQuality = this.calculateSignalQuality(finalDecision, rsiAnalysis, supportAnalysis);

            // Build reasoning array from final decision
            const reasoning = Array.isArray(finalDecision.reasoning) ? finalDecision.reasoning : [finalDecision.reasoning];

            // Return standardized response structure matching Elder Triple Screen
            return {
                system: this.systemId,
                systemName: this.name,
                decision: finalDecision.signal,
                confidence: finalDecision.confidence,
                reasoning: reasoning,
                // Risk management (standardized with Elder)
                riskReward: enhancedRiskReward,
                // Quality metrics for gate engine (standardized with Elder)
                signalQuality: signalQuality,
                // Execution details (standardized with Elder)
                execution: execution
            };

        } catch (error) {
            console.error('RSI Mean Reversion analysis error:', error);
            return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
        }
    }

    /**
     * Phase 1: Analyze RSI conditions for mean reversion setup
     */
    analyzeRSI(dailyData, indicators) {
        //console.log(`  📈 Phase 1: Analyzing RSI conditions...`);

        const rsi14 = indicators?.base?.rsi14;
        const rsiHistory = indicators?.base?.rsi14_history || [];

        if (typeof rsi14 !== 'number') {
            return {
                isValid: false,
                reason: 'RSI data unavailable',
                currentRSI: null
            };
        }

        // Ensure rsiHistory has enough length to compute a valid previousRSI
        let previousRSI = null;
        if (rsiHistory.length >= 2) {
            previousRSI = rsiHistory[rsiHistory.length - 2];
        } else if (rsiHistory.length === 1) {
            previousRSI = rsiHistory[0];
        }
        // If not enough history, treat as not available
        // RSI conditions
        const isOversold = rsi14 < this.RSI_OVERSOLD_THRESHOLD;
        const isNotAlreadyReverted = rsi14 < this.RSI_MAX_THRESHOLD;
        const isRising = previousRSI !== null ? rsi14 > previousRSI : true; // Default true if no previous data
        const isNotOverbought = rsi14 < this.RSI_OVERBOUGHT_THRESHOLD;

        // Calculate RSI momentum score
        const rsiMomentum = previousRSI !== null ? rsi14 - previousRSI : 0;
        const momentumScore = Math.max(0, Math.min(1, (rsiMomentum + 5) / 10)); // Normalize -5 to +5 range

        const isValid = isOversold && isNotAlreadyReverted && isRising && isNotOverbought;

        //console.log(`  📈 RSI Analysis: Current=${rsi14.toFixed(1)}, Previous=${(previousRSI || 0).toFixed(1)}, Oversold=${isOversold}, Rising=${isRising}`);

        return {
            isValid,
            currentRSI: rsi14,
            previousRSI,
            isOversold,
            isNotAlreadyReverted,
            isRising,
            isNotOverbought,
            rsiMomentum,
            momentumScore,
            reason: isValid ? 'RSI shows oversold bounce setup' : this.getRSIFailureReason(isOversold, isNotAlreadyReverted, isRising, isNotOverbought)
        };
    }

    /**
     * Get reason for RSI validation failure
     */
    getRSIFailureReason(isOversold, isNotAlreadyReverted, isRising, isNotOverbought) {
        if (!isOversold) return 'RSI not oversold (≥30)';
        if (!isNotAlreadyReverted) return 'RSI already mean-reverted (≥60)';
        if (!isRising) return 'RSI not rising from previous period';
        if (!isNotOverbought) return 'RSI in overbought territory (≥70)';
        return 'RSI conditions not met';
    }

    /**
     * Phase 2: Identify support levels and proximity
     */
    identifySupport(dailyData, indicators, latest) {
        //console.log(`  📈 Phase 2: Identifying support levels...`);

        const currentPrice = latest.close;
        const supportLevels = [];

        // Support 1: EMA20
        const ema20 = indicators?.base?.ema20;
        if (typeof ema20 === 'number') {
            const distance = Math.abs(currentPrice - ema20) / currentPrice;
            supportLevels.push({
                type: 'EMA20',
                level: ema20,
                distance: distance,
                withinRange: distance <= this.SUPPORT_PROXIMITY_PCT / 100,
                strength: 0.8 // EMA20 is strong short-term support
            });
        }

        // Support 2: EMA50
        const ema50 = indicators?.base?.ema50;
        if (typeof ema50 === 'number') {
            const distance = Math.abs(currentPrice - ema50) / currentPrice;
            supportLevels.push({
                type: 'EMA50',
                level: ema50,
                distance: distance,
                withinRange: distance <= this.SUPPORT_PROXIMITY_PCT / 100,
                strength: 0.9 // EMA50 is stronger medium-term support
            });
        }

        // Support 3: Recent swing low
        const swingLow = this.findRecentSwingLow(dailyData);
        if (swingLow) {
            const distance = Math.abs(currentPrice - swingLow.low) / currentPrice;
            supportLevels.push({
                type: 'SWING_LOW',
                level: swingLow.low,
                distance: distance,
                withinRange: distance <= this.SUPPORT_PROXIMITY_PCT / 100,
                strength: swingLow.strength,
                daysAgo: swingLow.daysAgo
            });
        }

        // Find the strongest support within range
        const validSupports = supportLevels.filter(s => s.withinRange);
        const bestSupport = validSupports.length > 0 ?
            validSupports.reduce((best, current) => current.strength > best.strength ? current : best) : null;

        const hasNearbySupport = validSupports.length > 0;

        //console.log(`  📈 Support Analysis: Found ${supportLevels.length} levels, ${validSupports.length} within range`);
        if (bestSupport) {
            //console.log(`  📈 Best Support: ${bestSupport.type} at $${bestSupport.level.toFixed(2)} (${(bestSupport.distance * 100).toFixed(1)}% away)`);
        }

        return {
            isValid: hasNearbySupport,
            supportLevels,
            validSupports,
            bestSupport,
            hasNearbySupport,
            reason: hasNearbySupport ? `Price near ${bestSupport.type} support` : 'No support levels within 2% range'
        };
    }

    /**
     * Find recent swing low for support analysis
     */
    findRecentSwingLow(dailyData) {
        if (dailyData.length < this.SWING_LOW_LOOKBACK) {
            // Not enough data, return placeholder swing low with strength 0
            return { low: null, daysAgo: null, strength: 0, index: null };
        }

        const recentData = dailyData.slice(-this.SWING_LOW_LOOKBACK);
        let lowestIndex = -1;
        let lowestPrice = Infinity;

        // Find the lowest low in the lookback period
        for (let i = 2; i < recentData.length - 2; i++) { // Avoid edges for swing validation
            const current = recentData[i];
            const prev2 = recentData[i - 2];
            const prev1 = recentData[i - 1];
            const next1 = recentData[i + 1];
            const next2 = recentData[i + 2];

            // Check if this is a swing low (lower than surrounding candles)
            if (current.low < prev2.low && current.low < prev1.low &&
                current.low < next1.low && current.low < next2.low &&
                current.low < lowestPrice) {
                lowestPrice = current.low;
                lowestIndex = i;
            }
        }

        if (lowestIndex === -1) {
            // No swing low found, return placeholder with strength 0
            return { low: null, daysAgo: null, strength: 0, index: null };
        }

        const daysAgo = recentData.length - lowestIndex - 1;
        const strength = Math.max(0.6, Math.min(0.95, 1 - (daysAgo / this.SWING_LOW_LOOKBACK))); // More recent = stronger

        return {
            low: lowestPrice,
            daysAgo,
            strength,
            index: lowestIndex
        };
    }

    /**
     * Phase 3: Analyze candle structure for bullish confirmation
     */
    analyzeCandleStructure(latest, previous) {
        //console.log(`  📈 Phase 3: Analyzing candle structure...`);

        const candleRange = latest.high - latest.low;
        const isBullish = latest.close > latest.open;

        // Close position in candle range (0 = at low, 1 = at high)
        const closePosition = candleRange > 0 ? (latest.close - latest.low) / candleRange : 0.5;
        const isStrongClose = closePosition >= this.CANDLE_CLOSE_POSITION_MIN;

        // Volume analysis (if available)
        const hasVolumeIncrease = previous && latest.volume > previous.volume;

        // Body size relative to range
        const bodySize = Math.abs(latest.close - latest.open);
        const bodyToRangeRatio = candleRange > 0 ? bodySize / candleRange : 0;
        const hasGoodBody = bodyToRangeRatio >= 0.3; // At least 30% body

        const isValid = isBullish && isStrongClose;

        //console.log(`  📈 Candle Analysis: Bullish=${isBullish}, ClosePos=${(closePosition * 100).toFixed(0)}%, Body=${(bodyToRangeRatio * 100).toFixed(0)}%`);

        return {
            isValid,
            isBullish,
            isStrongClose,
            closePosition,
            hasVolumeIncrease,
            bodyToRangeRatio,
            hasGoodBody,
            candleRange,
            reason: isValid ? 'Bullish candle with strong close' : this.getCandleFailureReason(isBullish, isStrongClose)
        };
    }

    /**
     * Get reason for candle validation failure
     */
    getCandleFailureReason(isBullish, isStrongClose) {
        if (!isBullish) return 'Candle is not bullish (close < open)';
        if (!isStrongClose) return 'Candle close not in top 50% of range';
        return 'Candle structure not suitable';
    }

    /**
     * Phase 4: Generate trading signals
     */
    generateSignals(rsiAnalysis, supportAnalysis, candleAnalysis, latest) {
        //console.log(`  📈 Phase 4: Generating trading signals...`);

        let signal = 'AVOID';
        let signalStrength = 0;
        let reasoning = [];

        // All conditions must be met for BUY signal
        if (rsiAnalysis.isValid && supportAnalysis.isValid && candleAnalysis.isValid) {
            signal = 'BUY';

            // Calculate signal strength based on component scores
            const rsiScore = rsiAnalysis.momentumScore || 0.5;
            const supportScore = supportAnalysis.bestSupport?.strength || 0.5;
            const candleScore = candleAnalysis.closePosition || 0.5;

            signalStrength = (rsiScore * 0.4 + supportScore * 0.4 + candleScore * 0.2);
            // Enforce a minimum signalStrength floor (for marginal but valid conditions)
            if (signalStrength < 0.1) {
                signalStrength = 0.1;
            }

            reasoning.push(
                `RSI oversold bounce (${rsiAnalysis.currentRSI.toFixed(1)})`,
                `Price near ${supportAnalysis.bestSupport.type} support`,
                `Bullish candle structure confirmed`
            );

        } else if (rsiAnalysis.isValid && supportAnalysis.isValid) {
            signal = 'WATCH';
            signalStrength = 0.6;
            if (signalStrength < 0.1) signalStrength = 0.1;
            reasoning.push(
                'RSI oversold near support',
                'Waiting for bullish candle confirmation'
            );

        } else if (rsiAnalysis.isValid) {
            signal = 'WATCH';
            signalStrength = 0.4;
            if (signalStrength < 0.1) signalStrength = 0.1;
            reasoning.push(
                'RSI oversold condition detected',
                'Waiting for support proximity and candle confirmation'
            );

        } else {
            signal = 'AVOID';
            signalStrength = 0;
            reasoning.push('RSI mean reversion conditions not met');
        }

        return {
            signal,
            signalStrength,
            reasoning: reasoning.join('; '),
            entryPrice: latest.close,
            factors: {
                rsiValid: rsiAnalysis.isValid,
                supportValid: supportAnalysis.isValid,
                candleValid: candleAnalysis.isValid,
                rsiLevel: rsiAnalysis.currentRSI,
                supportType: supportAnalysis.bestSupport?.type
            }
        };
    }

    /**
     * Phase 5: Calculate risk/reward metrics
     */
    calculateRisk(signalAnalysis, supportAnalysis, latest) {
        //console.log(`  📈 Phase 5: Calculating risk/reward...`);

        const entryPrice = signalAnalysis.entryPrice;
        let stopLoss = 0;
        let targets = [];
        let riskReward = 0;

        if (signalAnalysis.signal === 'BUY') {
            // Stop loss: Below support level or percentage-based
            const supportLevel = supportAnalysis.bestSupport?.level || entryPrice;
            const supportBasedStop = Math.min(supportLevel * 0.98, entryPrice * (1 - this.STOP_LOSS_PCT)); // 2% buffer below support
            const percentageBasedStop = entryPrice * (1 - this.STOP_LOSS_PCT);

            stopLoss = Math.max(supportBasedStop, percentageBasedStop); // Use the higher (less risky) stop

            // Targets: Multiple levels based on risk
            const risk = entryPrice - stopLoss;
            const target1 = entryPrice + (risk * this.TARGET_MULTIPLE); // 2:1 R/R
            const target2 = entryPrice + (risk * (this.TARGET_MULTIPLE * 1.5)); // 3:1 R/R

            targets = [target1, target2];
            riskReward = risk > 0 ? (target1 - entryPrice) / risk : 0;

        } else if (signalAnalysis.signal === 'WATCH') {
            // Projected risk/reward for watch scenarios
            const projectedEntry = latest.close;
            const projectedStop = projectedEntry * 0.96;
            const projectedTarget = projectedEntry * 1.08;

            stopLoss = projectedStop;
            targets = [projectedTarget];
            riskReward = (projectedTarget - projectedEntry) / (projectedEntry - projectedStop);
        } 

        return {
            stopLoss: Math.round(stopLoss * 100) / 100,
            targets: targets.map(t => Math.round(t * 100) / 100),
            riskReward: Math.round(riskReward * 100) / 100,
            entryPrice: Math.round(entryPrice * 100) / 100,
            supportLevel: supportAnalysis.bestSupport?.level || 0
        };
    }

    /**
     * Phase 6: Make final trading decision
     */
    makeFinalDecision(signalAnalysis, riskAssessment, rsiAnalysis, supportAnalysis, candleAnalysis) {
        //console.log(`  📈 Phase 6: Making final decision...`);

        let finalSignal = signalAnalysis.signal;
        let confidence = 0.5;
        let reasoning = [signalAnalysis.reasoning];
        const { riskReward } = riskAssessment;

        // Use dynamic confidence for ALL signal types
        confidence = this.calculateRSIMeanConfidence(rsiAnalysis, supportAnalysis, candleAnalysis, signalAnalysis, finalSignal);

        // Adjust confidence based on risk/reward (consistent with other systems)
        if (riskReward < 1.5 && finalSignal !== 'AVOID') {
            confidence *= 0.7; // Reduce confidence for poor risk/reward
            reasoning.push('Poor risk/reward ratio reduces confidence');
        } else if (riskReward > 2.5) {
            confidence = Math.min(confidence * 1.2, 1.0); // Boost confidence for excellent risk/reward
            reasoning.push('Excellent risk/reward ratio');
        }

        if (finalSignal === 'AVOID') {
            confidence = 0.2;
            reasoning.push('Avoiding trade due to unfavorable conditions');
        }

        return {
            signal: finalSignal,
            confidence: Math.round(confidence * 10000) / 10000, // 4 decimal precision
            reasoning: reasoning.join('; ')
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

        // For WATCH signals, use conditional calculations with anticipated entry
        if (signal === 'WATCH') {
            // Anticipated entry when RSI reversal conditions are met
            const anticipatedEntry = latestClose * 1.005; // Slight premium for entry confirmation
            
            return {
                latestClose,
                entryPrice: null, // No immediate entry for WATCH
                anticipatedEntry: anticipatedEntry,
                stopLoss,
                targets,
                riskReward: Math.round(riskReward * 100) / 100,
                riskAmount: anticipatedEntry > stopLoss ? anticipatedEntry - stopLoss : 0,
                potentialGain: targets.length > 0 ? targets[0] - anticipatedEntry : 0,
                watchType: 'OVERSOLD_BOUNCE_WATCH'
            };
        }

        // For immediate BUY/SELL signals
        return {
            latestClose,
            entryPrice,
            anticipatedEntry: null,
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
    createExecutionPlan(finalDecision, rsiAnalysis, supportAnalysis, candleAnalysis, riskAssessment, signalAnalysis, series, options) {
        const { capital, symbol, currentPrice } = options;
        const signal = finalDecision.signal;
        
        // Calculate position sizing
        const positionSizing = this.calculateRSIMeanPositionSizing(
            finalDecision.confidence,
            rsiAnalysis,
            supportAnalysis,
            riskAssessment,
            capital,
            currentPrice,
            signal
        );

        // Build dynamic entry strategy
        const entryStrategy = this.buildPreciseRSIEntryStrategy(rsiAnalysis, supportAnalysis, candleAnalysis, signalAnalysis, signal);

        // Build dynamic exit strategy  
        const exitStrategy = this.buildPreciseRSIExitStrategy(riskAssessment, rsiAnalysis, supportAnalysis, signal, series);

        return {
            entry: entryStrategy,
            exit: exitStrategy,
            position: positionSizing,
            riskManagement: {
                maxRisk: positionSizing.riskAmount,
                stopLossLevel: riskAssessment.stopLoss,
                targetLevels: riskAssessment.targets,
                riskRewardRatio: riskAssessment.riskReward
            },
            executionNotes: this.generateRSIExecutionNotes(rsiAnalysis, supportAnalysis, signal)
        };
    }

    /**
     * Calculate RSI Mean confidence-based position sizing with available capital
     */
    calculateRSIMeanPositionSizing(confidence, rsiAnalysis, supportAnalysis, riskAssessment, capital, currentPrice, signal) {
        if (!capital || !currentPrice || !riskAssessment.stopLoss) {
            return {
                recommendation: 'AVOID',
                riskPercent: 0,
                maxPosition: 0,
                shares: 0,
                positionValue: 0,
                riskAmount: 0,
                riskPerShare: 0,
                stopDistance: 0,
                entryType: 'NONE',
                effectiveEntry: 0
            };
        }

        const rsi14 = rsiAnalysis.currentRSI || 50;
        const stopLoss = riskAssessment.stopLoss;
        
        // Determine effective entry price (conditional vs immediate)
        const isConditional = signal === 'WATCH';
        let effectiveEntryPrice = currentPrice;
        
        if (isConditional) {
            // Use anticipated entry for WATCH signals
            effectiveEntryPrice = currentPrice * 1.005; // Slight premium for confirmation
        }

        // RSI Mean 6-tier confidence-based position sizing
        let recommendation, maxPosition, riskPercent;

        if (confidence >= 0.85 && rsi14 <= 20) {
            // Extremely oversold with high confidence
            recommendation = 'FULL';
            maxPosition = 0.08; // 8% of portfolio max
            riskPercent = 2.0;  // 2% risk for highest confidence
        } else if (confidence >= 0.75 && rsi14 <= 25) {
            // Very oversold with high confidence
            recommendation = 'LARGE';
            maxPosition = 0.06;
            riskPercent = 1.5;
        } else if (confidence >= 0.65 && rsi14 <= 30) {
            // Oversold with good confidence
            recommendation = 'MODERATE';
            maxPosition = 0.04;
            riskPercent = 1.2;
        } else if (confidence >= 0.55) {
            // Moderate setup
            recommendation = 'SMALL';
            maxPosition = 0.03;
            riskPercent = 1.0;
        } else if (confidence >= 0.45) {
            // Weak setup
            recommendation = 'MINIMAL';
            maxPosition = 0.02;
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
            // Calculate risk-based position size
            const riskPerShare = Math.abs(effectiveEntryPrice - stopLoss);
            if (riskPerShare > 0) {
                const targetRiskAmount = capital * (riskPercent / 100);
                shares = Math.floor(targetRiskAmount / riskPerShare);
                
                // Apply max position limit
                const maxShares = Math.floor((capital * maxPosition) / effectiveEntryPrice);
                shares = Math.min(shares, maxShares);
                
                positionValue = shares * effectiveEntryPrice;
                riskAmount = shares * riskPerShare;
            }
        }

        return {
            recommendation,
            riskPercent,
            maxPosition,
            shares: Math.max(0, shares),
            positionValue: Math.round(positionValue * 100) / 100,
            riskAmount: Math.round(riskAmount * 100) / 100,
            riskPerShare: Math.round((Math.abs(effectiveEntryPrice - stopLoss)) * 100) / 100,
            stopDistance: stopLoss > 0 ? Math.round(((effectiveEntryPrice - stopLoss) / effectiveEntryPrice) * 10000) / 100 : 0,
            entryType: isConditional ? 'CONDITIONAL' : 'IMMEDIATE',
            effectiveEntry: Math.round(effectiveEntryPrice * 100) / 100
        };
    }

    /**
     * Build precise entry strategy based on RSI mean reversion analysis
     */
    buildPreciseRSIEntryStrategy(rsiAnalysis, supportAnalysis, candleAnalysis, signalAnalysis, signal) {
        const strategy = {
            conditions: [],
            timing: 'Immediate on confirmation',
            readiness: signal
        };

        // Build precise conditions based on actual analysis results
        if (rsiAnalysis.isValid) {
            strategy.conditions.push(`RSI oversold (${rsiAnalysis.currentRSI.toFixed(1)}) and rising from previous period`);
        }
        
        if (supportAnalysis.hasNearbySupport && supportAnalysis.bestSupport) {
            strategy.conditions.push(`Price near ${supportAnalysis.bestSupport.type} support at $${supportAnalysis.bestSupport.level.toFixed(2)}`);
        }
        
        if (candleAnalysis.isValid) {
            strategy.conditions.push(`Bullish candle with strong close (${(candleAnalysis.closePosition * 100).toFixed(0)}% of range)`);
        }

        // Add volume confirmation if available
        if (candleAnalysis.hasVolumeIncrease) {
            strategy.conditions.push('Volume increase supporting bounce setup');
        }

        // Set precise timing and entry details based on signal type
        if (signal === 'BUY') {
            strategy.timing = 'Execute immediately - all oversold bounce conditions confirmed';
            strategy.urgency = 'HIGH';
            strategy.entryType = 'IMMEDIATE';
            if (signalAnalysis.entryPrice) {
                strategy.entryPrice = signalAnalysis.entryPrice;
            }
        } else if (signal === 'WATCH') {
            strategy.timing = 'Setup developing - await final bounce confirmation';
            strategy.urgency = 'MEDIUM';
            strategy.entryType = 'CONDITIONAL';
            strategy.nextTrigger = 'Bullish candle confirmation with RSI rising from oversold';
            
            if (signalAnalysis.entryPrice) {
                strategy.anticipatedEntry = signalAnalysis.entryPrice * 1.005; // Small premium for confirmation
                strategy.currentPrice = signalAnalysis.entryPrice;
                strategy.triggerLevel = `Oversold bounce confirmation at $${(signalAnalysis.entryPrice * 1.005).toFixed(2)}`;
            }
        } else {
            strategy.timing = 'Hold - RSI mean reversion conditions not satisfied';
            strategy.urgency = 'NONE';
            strategy.entryType = 'NONE';
        }

        return strategy;
    }

    /**
     * Build precise exit strategy based on RSI mean reversion risk assessment
     */
    buildPreciseRSIExitStrategy(riskAssessment, rsiAnalysis, supportAnalysis, signal, series) {
        const strategy = {
            stopLoss: riskAssessment.stopLoss,
            targets: riskAssessment.targets,
            timeStop: null,
            systemExit: null,
            trailingStop: false
        };

        // Set precise time stop based on mean reversion nature
        if (signal === 'BUY') {
            strategy.timeStop = 'Monitor for 3-7 trading days maximum for mean reversion completion';
            strategy.systemExit = 'Exit when RSI reaches 50-60 range (mean reversion complete) or support breaks';
            strategy.trailingStop = 'Consider 1.5x ATR trailing stop after initial target hit';
        } else if (signal === 'WATCH') {
            strategy.timeStop = 'Monitor for 3-5 trading days for oversold bounce setup confirmation';
            strategy.systemExit = 'Cancel setup if RSI moves above 40 without bounce or support breaks';
            strategy.triggerRequired = 'Oversold bounce confirmation with bullish candle required';
            strategy.trailingStop = 'Plan 1.5x ATR trailing stop after bounce confirmation entry';
        }

        // Add RSI-specific exit conditions for additional clarity
        if (rsiAnalysis.currentRSI < 25) {
            // Deep oversold - expect stronger bounce
            strategy.timeStop = `${strategy.timeStop} (Deep oversold RSI: ${rsiAnalysis.currentRSI.toFixed(1)})`;
            if (signal === 'BUY') {
                strategy.trailingStop = 'Implement aggressive 1x ATR trailing stop - strong bounce expected';
            }
        }

        // Support-specific exit conditions
        if (supportAnalysis.bestSupport) {
            const supportLevel = supportAnalysis.bestSupport.level.toFixed(2);
            const supportType = supportAnalysis.bestSupport.type;
            
            if (signal === 'BUY') {
                strategy.systemExit = `${strategy.systemExit} | Critical: Exit if ${supportType} support at $${supportLevel} breaks`;
            } else if (signal === 'WATCH') {
                strategy.systemExit = `${strategy.systemExit} | Cancel if ${supportType} support at $${supportLevel} fails`;
            }
        }

        return strategy;
    }

    /**
     * Generate execution notes specific to RSI mean reversion methodology
     */
    generateRSIExecutionNotes(rsiAnalysis, supportAnalysis, signal) {
        const notes = [];

        if (signal === 'BUY') {
            notes.push('Mean reversion trade - expect quick bounce from oversold levels');
            notes.push(`RSI at ${rsiAnalysis.currentRSI.toFixed(1)} suggests strong oversold condition`);
            if (supportAnalysis.bestSupport) {
                notes.push(`Support at ${supportAnalysis.bestSupport.type} ($${supportAnalysis.bestSupport.level.toFixed(2)}) provides downside protection`);
            }
            notes.push('Monitor RSI for exit signals as it approaches 50-60 range');
        } else if (signal === 'WATCH') {
            notes.push('RSI oversold setup developing - await confirmation');
            notes.push('Mean reversion trades typically develop quickly once triggered');
            notes.push('High probability setup if all conditions align');
        }

        return notes;
    }

    /**
     * Calculate signal quality grade
     */
    calculateSignalQuality(finalDecision, rsiAnalysis, supportAnalysis) {
        let score = 50; // Base score

        if (finalDecision.signal === 'BUY') {
            // RSI quality scoring (30 points max)
            if (rsiAnalysis.currentRSI < 20) score += 30; // Extremely oversold
            else if (rsiAnalysis.currentRSI < 25) score += 25; // Very oversold
            else if (rsiAnalysis.currentRSI < 30) score += 20; // Oversold
            else score += 10; // Moderate

            // Support quality scoring (20 points max)
            if (supportAnalysis.bestSupport?.strength >= 0.9) score += 20; // Strong support
            else if (supportAnalysis.bestSupport?.strength >= 0.8) score += 15; // Good support
            else score += 10; // Moderate support

            // Confidence bonus
            score += (finalDecision.confidence - 0.5) * 20;

        } else if (finalDecision.signal === 'WATCH') {
            score = 55 + (finalDecision.confidence * 25);
        } else {
            score = 35;
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
        if (!series?.daily || series.daily.length < 20) {
            return false;
        }

        // Check for required RSI indicator
        if (typeof indicators?.base?.rsi14 !== 'number') {
            return false;
        }

        // Check for required OHLCV data
        const latest = series.daily[series.daily.length - 1];
        if (!latest.high || !latest.low || !latest.close || !latest.open) {
            return false;
        }

        return true;
    }

    /**
     * Assess data quality
     */
    assessDataQuality(dailyData, indicators) {
        if (dailyData.length >= 60 && indicators?.base?.rsi14) return 'EXCELLENT';
        if (dailyData.length >= 40 && indicators?.base?.rsi14) return 'GOOD';
        if (dailyData.length >= 20 && indicators?.base?.rsi14) return 'FAIR';
        return 'POOR';
    }

    /**
     * Create AVOID signal with standardized structure (matching Elder)
     */
    createAvoidSignal(code, message, analysisData = null) {
        // Use dynamic confidence even for AVOID signals
        let confidence = 0.2; // Base for AVOID

        // If we have analysis data, use dynamic confidence
        if (analysisData) {
            confidence = this.calculateRSIMeanConfidence(
                analysisData.rsi,
                analysisData.support,
                analysisData.candle,
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
            riskReward: { riskReward: 0 },
            signalQuality: { grade: 'F', percentage: Math.round(confidence * 100) },
            execution: null,
            error: code,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate dynamic confidence for RSI Mean Reversion system based on setup strength
     */
    calculateRSIMeanConfidence(rsiAnalysis, supportAnalysis, candleAnalysis, signalAnalysis, signal) {
        let confidence = 0.3; // Base confidence

        const rsi14 = rsiAnalysis?.currentRSI || 50;
        const isRising = rsiAnalysis?.isRising || false;

        // Adjust base confidence by signal type - standardized across all systems
        if (signal === 'BUY') {
            confidence = 0.65; // Standard base for BUY signals
        } else if (signal === 'WATCH') {
            confidence = 0.40; // Standardized base for WATCH signals
        } else if (signal === 'SELL') {
            confidence = 0.65; // Standard base for SELL signals
        } else {
            confidence = 0.25; // Standard base for HOLD/AVOID signals
        }

        // RSI oversold depth (deeper = higher confidence for bounce)
        if (rsi14 <= 20) {
            confidence += 0.20; // Very oversold
        } else if (rsi14 <= 25) {
            confidence += 0.15; // Deeply oversold
        } else if (rsi14 <= 30) {
            confidence += 0.10; // Oversold
        }

        // RSI rising from oversold levels
        if (isRising && rsi14 <= 35) {
            confidence += 0.12;
        }

        // Support proximity and strength
        if (supportAnalysis?.hasNearbySupport) {
            confidence += 0.08;

            // Strong support levels
            if (supportAnalysis.bestSupport?.strength > 0.8) {
                confidence += 0.10;
            } else if (supportAnalysis.bestSupport?.strength > 0.6) {
                confidence += 0.05;
            }
        }

        // Candle structure quality
        if (candleAnalysis?.isBullish) {
            confidence += 0.08;

            // Strong bullish candle structure
            if (candleAnalysis.closePosition > 0.7) {
                confidence += 0.05;
            }

            // Large body candle shows conviction
            if (candleAnalysis.bodyToRangeRatio > 0.6) {
                confidence += 0.05;
            }
        }

        // Signal strength factor
        if (signalAnalysis?.signalStrength > 0.7) {
            confidence += 0.08;
        } else if (signalAnalysis?.signalStrength > 0.5) {
            confidence += 0.05;
        }

        // Apply standardized confidence caps by signal type
        if (signal === 'WATCH') {
            confidence = Math.min(confidence, 0.70); // Cap WATCH signals at 70%
        } else if (signal === 'BUY' || signal === 'SELL') {
            confidence = Math.min(confidence, 0.90); // Cap action signals at 90%
        } else if (signal === 'AVOID') {
            confidence = Math.min(confidence, 0.45); // Cap AVOID signals at 45%
        }

        return Math.min(Math.max(confidence, 0.15), 0.95);
    }
}

module.exports = RSIMeanReversion;
