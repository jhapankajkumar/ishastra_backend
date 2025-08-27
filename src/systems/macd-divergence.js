
/**
 * MACD Divergence Trading System
 * 
 * Detects potential trend reversals based on divergence between price action and MACD histogram.
 * Identifies high-probability reversal opportunities when price and MACD move in opposite directions.
 * 
 * Signal Requirements:
 * Bullish Divergence:
 * - Price makes lower low while MACD histogram makes higher low
 * - Divergence spans at least 2 swing points (5-20 days apart)
 * - Confirmation with bullish candle structure
 * 
 * Bearish Divergence:
 * - Price makes higher high while MACD histogram makes lower high
 * - Divergence spans at least 2 swing points (5-20 days apart)
 * - Confirmation with bearish candle structure
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2024
 */

class MACDDivergence {
    constructor() {
        this.systemId = 'divergence';
        this.name = 'MACD Divergence';
        this.description = 'Trend reversal system detecting price-MACD histogram divergences';
        this.version = '1.0.0';
        
        // Configuration constants
        this.MACD_FAST_PERIOD = 12;
        this.MACD_SLOW_PERIOD = 26;
        this.MACD_SIGNAL_PERIOD = 9;
        this.MIN_SWING_SEPARATION = 5; // Minimum days between swing points
        this.MAX_SWING_SEPARATION = 20; // Maximum days between swing points
        this.SWING_LOOKBACK = 30; // Days to look back for swing points
        this.MIN_DIVERGENCE_STRENGTH = 0.6; // Minimum divergence quality score
        this.STOP_LOSS_PCT = 0.05; // 5% stop loss
        this.TARGET_MULTIPLE = 2.0; // 2:1 risk/reward minimum
    }

    /**
     * Main analysis method for MACD divergence detection
     * @param {Object} data - Technical data with OHLCV and indicators
     * @param {Object} options - Analysis options
     * @returns {Object} - Complete MACD divergence analysis result
     */
    analyze(data, options = {}) {
        //console.log(`  📊 MACD-DIV: Starting MACD Divergence analysis...`);

        try {
            const { series, indicators } = data;
            
            if (!this.validateData(series, indicators)) {
                return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required OHLCV data or MACD indicators');
            }

            const dailyData = series.daily;
            const latest = dailyData[dailyData.length - 1];
            
            //console.log(`  📊 Analyzing ${dailyData.length} days of data, current price: $${latest.close.toFixed(2)}`);

            // Phase 1: Calculate or extract MACD components
            const macdAnalysis = this.analyzeMACDData(dailyData, indicators);
            
            // Phase 2: Find swing points in price and MACD
            const swingAnalysis = this.findSwingPoints(dailyData, macdAnalysis);
            
            // Phase 3: Detect divergences
            const divergenceAnalysis = this.detectDivergences(swingAnalysis, dailyData, macdAnalysis);
            
            // Phase 4: Validate candle structure
            const candleAnalysis = this.validateCandleStructure(dailyData, divergenceAnalysis);
            
            // Phase 5: Generate trading signals
            const signalAnalysis = this.generateSignals(divergenceAnalysis, candleAnalysis, latest);
            

            if (signalAnalysis.signal === 'AVOID') {
                return {
                    system: this.systemId,
                    systemName: this.name,
                    decision: signalAnalysis.signal,
                    confidence: 0,
                    reasoning: [signalAnalysis.reasoning]
                };
            }

            // Phase 6: Assess risk
            const riskAssessment = this.assessRisk(signalAnalysis, swingAnalysis, latest, series);
            
            // Phase 6.5: Calculate preliminary risk/reward for confidence adjustment
            const preliminaryRiskReward = this.calculatePreliminaryRiskReward(signalAnalysis, riskAssessment, divergenceAnalysis, swingAnalysis, latest);
            
            // Phase 7: Make final decision
            const finalDecision = this.makeFinalDecision(signalAnalysis, riskAssessment, divergenceAnalysis, candleAnalysis, swingAnalysis, preliminaryRiskReward);

            // Extract capital and pricing information from options
            const { capital, symbol, currentPrice } = options;
            const entryPrice = currentPrice || latest.close;

            // Phase 8: Calculate risk/reward with confidence-adjusted parameters
            const riskReward = this.calculateRiskReward(finalDecision, riskAssessment, divergenceAnalysis, swingAnalysis, latest);

            // Create execution plan with capital-aware position sizing (matching Elder format)
            let execution = null;
            if (finalDecision.signal === 'BUY' || finalDecision.signal === 'SELL' || finalDecision.signal === 'WATCH') {
                // Build entry strategy first to get anticipatedEntry for WATCH signals
                const entryStrategy = this.buildPreciseMACDEntryStrategy(riskAssessment, divergenceAnalysis, candleAnalysis, finalDecision.signal, latest);
                
                // Create enhanced risk reward data including anticipated entry for position sizing
                const enhancedRiskReward = {
                    ...riskReward,
                    anticipatedEntry: entryStrategy.anticipatedEntry
                };
                
                // Calculate position sizing based on available capital and confidence
                const positionSizing = this.calculateMACDPositionSizing(finalDecision.confidence, { capital, symbol, entryPrice }, enhancedRiskReward, divergenceAnalysis);
                execution = {
                    entry: entryStrategy,
                    exit: this.buildPreciseMACDExitStrategy(riskAssessment, divergenceAnalysis, candleAnalysis, finalDecision.signal, latest),
                    position: positionSizing,
                };
            }

            return {
                system: this.systemId,
                systemName: this.name,
                decision: finalDecision.signal,
                confidence: finalDecision.confidence,
                reasoning: [finalDecision.reasoning],
                
                // Risk management (matching Elder format - only riskReward, no riskAssessment)
                riskReward: riskReward,
                
                // Execution details (matching Elder format with position sizing)
                execution: execution,
                
                // Quality metrics
                signalQuality: this.calculateSignalQuality(finalDecision, divergenceAnalysis),
            };

        } catch (error) {
            console.error('MACD Divergence analysis error:', error);
            return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
        }
    }

    /**
     * Phase 1: Analyze MACD data (calculate if needed or use existing)
     */
    analyzeMACDData(dailyData, indicators) {
        //console.log(`  📊 Phase 1: Analyzing MACD data...`);
        
        // Try to use existing MACD data first
        let macdLine = indicators?.base?.macd;
        let macdSignal = indicators?.base?.macd_signal;
        let macdHistogram = indicators?.base?.macd_histogram;
        
        // If not available, calculate MACD
        if (!macdLine || !macdSignal || !macdHistogram) {
            const calculated = this.calculateMACD(dailyData);
            macdLine = calculated.macdLine;
            macdSignal = calculated.macdSignal;
            macdHistogram = calculated.macdHistogram;
        }
        
        // Ensure we have arrays
        const macdArray = Array.isArray(macdLine) ? macdLine : [macdLine];
        const signalArray = Array.isArray(macdSignal) ? macdSignal : [macdSignal];
        const histogramArray = Array.isArray(macdHistogram) ? macdHistogram : [macdHistogram];
        
        const currentMACD = macdArray[macdArray.length - 1];
        const currentSignal = signalArray[signalArray.length - 1];
        const currentHistogram = histogramArray[histogramArray.length - 1];
        
        //console.log(`  📊 MACD: ${currentMACD?.toFixed(4) || 'N/A'}, Signal: ${currentSignal?.toFixed(4) || 'N/A'}, Hist: ${currentHistogram?.toFixed(4) || 'N/A'}`);
        
        return {
            macdLine: macdArray,
            macdSignal: signalArray,
            macdHistogram: histogramArray,
            currentMACD,
            currentSignal,
            currentHistogram,
            hasValidData: macdArray.length > 0 && signalArray.length > 0 && histogramArray.length > 0
        };
    }

    /**
     * Calculate MACD if not provided in indicators
     */
    calculateMACD(dailyData) {
        const closes = dailyData.map(d => d.close);
        const ema12 = this.calculateEMA(closes, this.MACD_FAST_PERIOD);
        const ema26 = this.calculateEMA(closes, this.MACD_SLOW_PERIOD);
        
        // MACD Line = EMA12 - EMA26
        const macdLine = [];
        for (let i = 0; i < ema12.length; i++) {
            if (ema12[i] !== null && ema26[i] !== null) {
                macdLine.push(ema12[i] - ema26[i]);
            } else {
                macdLine.push(null);
            }
        }
        
        // Signal Line = EMA9 of MACD Line
        const validMACD = macdLine.filter(val => val !== null);
        const macdSignal = this.calculateEMA(validMACD, this.MACD_SIGNAL_PERIOD);
        
        // Histogram = MACD - Signal
        const macdHistogram = [];
        const signalStartIndex = macdLine.length - macdSignal.length;
        
        for (let i = 0; i < macdLine.length; i++) {
            if (i >= signalStartIndex && macdLine[i] !== null && macdSignal[i - signalStartIndex] !== null) {
                macdHistogram.push(macdLine[i] - macdSignal[i - signalStartIndex]);
            } else {
                macdHistogram.push(null);
            }
        }
        
        return { macdLine, macdSignal, macdHistogram };
    }

    /**
     * Calculate Exponential Moving Average
     */
    calculateEMA(data, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // Start with SMA for first value
        let sum = 0;
        let validStart = -1;
        
        for (let i = 0; i < data.length; i++) {
            if (data[i] !== null && data[i] !== undefined) {
                if (validStart === -1) validStart = i;
                sum += data[i];
                
                if (i - validStart + 1 >= period) {
                    ema.push(sum / period);
                    break;
                } else {
                    ema.push(null);
                }
            } else {
                ema.push(null);
            }
        }
        
        // Calculate EMA for remaining values
        for (let i = ema.length; i < data.length; i++) {
            if (data[i] !== null && ema[i - 1] !== null) {
                ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
            } else {
                ema.push(null);
            }
        }
        
        return ema;
    }

    /**
     * Phase 2: Find swing points in price and MACD histogram
     */
    findSwingPoints(dailyData, macdAnalysis) {
        //console.log(`  📊 Phase 2: Finding swing points...`);
        
        const recentData = dailyData.slice(-this.SWING_LOOKBACK);
        const recentHistogram = macdAnalysis.macdHistogram.slice(-this.SWING_LOOKBACK);
        
        const priceSwings = this.findPriceSwings(recentData);
        const macdSwings = this.findMACDSwings(recentHistogram, recentData);
        
        //console.log(`  📊 Found ${priceSwings.highs.length} price highs, ${priceSwings.lows.length} price lows`);
        //console.log(`  📊 Found ${macdSwings.highs.length} MACD highs, ${macdSwings.lows.length} MACD lows`);
        
        return {
            price: priceSwings,
            macd: macdSwings,
            dataLength: recentData.length
        };
    }

    /**
     * Find price swing highs and lows
     */
    findPriceSwings(priceData) {
        const highs = [];
        const lows = [];
        
        for (let i = 2; i < priceData.length - 2; i++) {
            const current = priceData[i];
            const prev2 = priceData[i - 2];
            const prev1 = priceData[i - 1];
            const next1 = priceData[i + 1];
            const next2 = priceData[i + 2];
            
            // Swing high
            if (current.high > prev2.high && current.high > prev1.high && 
                current.high > next1.high && current.high > next2.high) {
                highs.push({
                    index: i,
                    price: current.high,
                    value: current.high,
                    date: current.date
                });
            }
            
            // Swing low
            if (current.low < prev2.low && current.low < prev1.low && 
                current.low < next1.low && current.low < next2.low) {
                lows.push({
                    index: i,
                    price: current.low,
                    value: current.low,
                    date: current.date
                });
            }
        }
        
        return { highs, lows };
    }

    /**
     * Find MACD histogram swing highs and lows
     */
    findMACDSwings(histogramData, dailyData = null) {
        const highs = [];
        const lows = [];
        
        for (let i = 3; i < histogramData.length - 3; i++) { // Changed from 2 to 3 for stronger detection
            const current = histogramData[i];
            const prev3 = histogramData[i - 3];
            const prev2 = histogramData[i - 2];
            const prev1 = histogramData[i - 1];
            const next1 = histogramData[i + 1];
            const next2 = histogramData[i + 2];
            const next3 = histogramData[i + 3];
            
            if (current === null || prev3 === null || prev2 === null || prev1 === null || 
                next1 === null || next2 === null || next3 === null) continue;
            
            // Swing high (require dominance over ±3 bars AND minimum magnitude)
            const isSwingHigh = current > prev3 && current > prev2 && current > prev1 && 
                               current > next1 && current > next2 && current > next3;
            const highMagnitude = Math.abs(current) > 0.1; // Minimum histogram value to avoid noise
            
            if (isSwingHigh && highMagnitude) {
                const swingPoint = {
                    index: i,
                    value: current
                };
                
                // Add date if daily data is available (for swing analysis within lookback window)
                if (dailyData && dailyData[i]) {
                    swingPoint.date = dailyData[i].date;
                }
                
                highs.push(swingPoint);
            }
            
            // Swing low (require dominance over ±3 bars AND minimum magnitude)
            const isSwingLow = current < prev3 && current < prev2 && current < prev1 && 
                              current < next1 && current < next2 && current < next3;
            const lowMagnitude = Math.abs(current) > 0.1; // Minimum histogram value to avoid noise
            
            if (isSwingLow && lowMagnitude) {
                const swingPoint = {
                    index: i,
                    value: current
                };
                
                // Add date if daily data is available (for swing analysis within lookback window)
                if (dailyData && dailyData[i]) {
                    swingPoint.date = dailyData[i].date;
                }
                
                lows.push(swingPoint);
            }
        }
        
        return { highs, lows };
    }

    /**
     * Phase 3: Detect divergences between price and MACD
     * Enhanced: Includes regular, triple, and continuation divergences.
     */
    detectDivergences(swingAnalysis, dailyData, macdAnalysis) {
        //console.log(`  📊 Phase 3: Detecting divergences...`);

        // --- Standard divergences ---
        const bullish = this.findBullishDivergences(swingAnalysis);
        const bearish = this.findBearishDivergences(swingAnalysis);

        // --- Additional advanced divergence checks ---
        // For triple and continuation divergences, use last 50 candles and full histogram
        const candles = dailyData;
        const macdHistogram = macdAnalysis.macdHistogram;
        // Triple divergences
        const tripleBullish = this.detectTripleBullishDivergence(candles, macdHistogram);
        const tripleBearish = this.detectTripleBearishDivergence(candles, macdHistogram);
        // Continuation divergences
        const continuationBullish = this.detectBullishContinuationDivergence(candles, macdHistogram);
        const continuationBearish = this.detectBearishContinuationDivergence(candles, macdHistogram);

        // --- Combine all bullish and bearish signals ---
        // Bullish: regular, triple, continuation
        const bullishSignals = [...bullish, ...tripleBullish, ...continuationBullish];
        // Bearish: regular, triple, continuation
        const bearishSignals = [...bearish, ...tripleBearish, ...continuationBearish];

        // Score and validate standard divergences (for bestBullish/bestBearish legacy fields)
        const validBullish = bullish.filter(div => this.validateDivergence(div));
        const validBearish = bearish.filter(div => this.validateDivergence(div));
        const bestBullish = validBullish.length > 0 ?
            validBullish.reduce((best, current) => current.strength > best.strength ? current : best) : null;
        const bestBearish = validBearish.length > 0 ?
            validBearish.reduce((best, current) => current.strength > best.strength ? current : best) : null;

        // Determine if any divergence found (of any type)
        const hasDivergence = bullishSignals.length > 0 || bearishSignals.length > 0;
        let divergenceType = 'NONE';
        if (bullishSignals.length > 0) divergenceType = 'BULLISH';
        else if (bearishSignals.length > 0) divergenceType = 'BEARISH';

        //console.log(`  📊 Divergences:`);
        //console.log(`      Standard Bullish=${bullish.length}, Triple Bullish=${tripleBullish.length}, Continuation Bullish=${continuationBullish.length}`);
        //console.log(`      Standard Bearish=${bearish.length}, Triple Bearish=${tripleBearish.length}, Continuation Bearish=${continuationBearish.length}`);
        //console.log(`      Type=${divergenceType}`);

        // Create summary of formation dates for chart verification
        const formationSummary = this.createFormationDateSummary(bullishSignals, bearishSignals, bestBullish, bestBearish);

        return {
            hasDivergence,
            divergenceType,
            bestBullish,
            bestBearish,
            // For transparency, expose all signals by type
            allBullish: bullishSignals,
            allBearish: bearishSignals,
            // Raw breakdown for debugging/analysis
            _standardBullish: bullish,
            _tripleBullish: tripleBullish,
            _continuationBullish: continuationBullish,
            _standardBearish: bearish,
            _tripleBearish: tripleBearish,
            _continuationBearish: continuationBearish,
            // Formation dates for chart verification
            formationDates: formationSummary,
            reason: hasDivergence ?
                `${divergenceType.toLowerCase()} divergence detected (standard/triple/continuation)` :
                'No valid divergences found'
        };
    }

    /**
     * Find bullish divergences (price lower low, MACD higher low)
     */
    findBullishDivergences(swingAnalysis) {
        const priceLows = swingAnalysis.price.lows;
        const macdLows = swingAnalysis.macd.lows;
        const dataLength = swingAnalysis.dataLength; // Available bars in the analysis window
        const divergences = [];
        
        // Compare recent price lows with MACD lows
        for (let i = 1; i < priceLows.length; i++) {
            const recentPriceLow = priceLows[i];
            const previousPriceLow = priceLows[i - 1];
            
            // Find corresponding MACD lows
            const recentMACDLow = this.findClosestMACDSwing(recentPriceLow.index, macdLows);
            const previousMACDLow = this.findClosestMACDSwing(previousPriceLow.index, macdLows);
            
            if (recentMACDLow && previousMACDLow) {
                // Check for bullish divergence
                const priceDecline = recentPriceLow.value < previousPriceLow.value;
                const macdRise = recentMACDLow.value > previousMACDLow.value;
                const validSeparation = Math.abs(recentPriceLow.index - previousPriceLow.index) >= this.MIN_SWING_SEPARATION;
                
                // Calculate recency: how many bars ago did this divergence complete?
                const ageInBars = dataLength - 1 - recentPriceLow.index; // Bars from most recent swing to current bar
                const isRecent = ageInBars <= 15; // Only consider divergences within last 15 bars
                
                if (priceDecline && macdRise && validSeparation && isRecent) {
                    const strength = this.calculateDivergenceStrength('BULLISH', {
                        priceChange: (previousPriceLow.value - recentPriceLow.value) / previousPriceLow.value,
                        macdChange: (recentMACDLow.value - previousMACDLow.value) / Math.abs(previousMACDLow.value),
                        separation: Math.abs(recentPriceLow.index - previousPriceLow.index)
                    });
                    
                    // We already calculated ageInBars above
                    
                    // Calculate formation period dates
                    const formationStartDate = previousPriceLow.date;
                    const formationEndDate = recentPriceLow.date;
                    const macdStartDate = previousMACDLow.date || formationStartDate;
                    const macdEndDate = recentMACDLow.date || formationEndDate;
                    
                    divergences.push({
                        type: 'BULLISH',
                        strength,
                        pricePoints: [previousPriceLow, recentPriceLow],
                        macdPoints: [previousMACDLow, recentMACDLow],
                        separation: Math.abs(recentPriceLow.index - previousPriceLow.index),
                        ageInBars: ageInBars,  // Add recency tracking
                        // Formation date ranges for chart verification
                        formationDates: {
                            start: formationStartDate,
                            end: formationEndDate,
                            priceStart: formationStartDate,
                            priceEnd: formationEndDate,
                            macdStart: macdStartDate,
                            macdEnd: macdEndDate,
                            durationDays: this.calculateDaysBetween(formationStartDate, formationEndDate)
                        }
                    });
                }
            }
        }
        
        return divergences;
    }

    /**
     * Find bearish divergences (price higher high, MACD lower high)
     * Updated: Use strict logic as in main inline divergence detection.
     * Only runs if at least two recent swing highs.
     * Returns a structured signal if conditions match, otherwise [].
     *
     * This method is designed for direct use with raw candles and histogram if needed.
     */
    findBearishDivergences(swingAnalysis, candles = null, histogram = null) {
        // If candles and histogram are provided, use strict logic as per instructions
        if (candles && histogram) {
            if (candles.length < 50) return [];
            // Find swing highs over last 20 candles
            const findSwingHighs = (candlesArr, lookback = 20) => {
                const highs = [];
                for (let i = candlesArr.length - lookback; i < candlesArr.length; i++) {
                    if (i < 2 || i > candlesArr.length - 3) continue;
                    const current = candlesArr[i];
                    const prev2 = candlesArr[i - 2];
                    const prev1 = candlesArr[i - 1];
                    const next1 = candlesArr[i + 1];
                    const next2 = candlesArr[i + 2];
                    if (
                        current.high > prev2.high &&
                        current.high > prev1.high &&
                        current.high > next1.high &&
                        current.high > next2.high
                    ) {
                        highs.push({
                            index: i,
                            price: current.high,
                            date: current.date
                        });
                    }
                }
                return highs;
            };
            const recentHighs = findSwingHighs(candles, 20);
            if (recentHighs.length < 2) return [];
            const high1 = recentHighs[recentHighs.length - 2];
            const high2 = recentHighs[recentHighs.length - 1];
            const hist1 = histogram[high1.index];
            const hist2 = histogram[high2.index];
            const isBearishDivergence = high2.price > high1.price && hist2 < hist1;
            const latest = candles[candles.length - 1];
            const bearishCandle = latest.close < latest.open;
            if (isBearishDivergence && bearishCandle) {
                return [{
                    signal: 'SELL',
                    high1,
                    high2,
                    histogramDrop: hist1 - hist2,
                    reason: 'Bearish divergence: price made higher high, MACD histogram made lower high'
                }];
            }
            return [];
        }
        // Default behavior: legacy logic for divergence scoring
        const priceHighs = swingAnalysis.price.highs;
        const macdHighs = swingAnalysis.macd.highs;
        const dataLength = swingAnalysis.dataLength; // Available bars in the analysis window
        const divergences = [];
        // Compare recent price highs with MACD highs
        for (let i = 1; i < priceHighs.length; i++) {
            const recentPriceHigh = priceHighs[i];
            const previousPriceHigh = priceHighs[i - 1];
            // Find corresponding MACD highs
            const recentMACDHigh = this.findClosestMACDSwing(recentPriceHigh.index, macdHighs);
            const previousMACDHigh = this.findClosestMACDSwing(previousPriceHigh.index, macdHighs);
            if (recentMACDHigh && previousMACDHigh) {
                // Check for bearish divergence
                const priceRise = recentPriceHigh.value > previousPriceHigh.value;
                const macdDecline = recentMACDHigh.value < previousMACDHigh.value;
                const validSeparation = Math.abs(recentPriceHigh.index - previousPriceHigh.index) >= this.MIN_SWING_SEPARATION;
                
                // Calculate recency: how many bars ago did this divergence complete?
                const ageInBars = dataLength - 1 - recentPriceHigh.index; // Bars from most recent swing to current bar
                const isRecent = ageInBars <= 15; // Only consider divergences within last 15 bars
                
                if (priceRise && macdDecline && validSeparation && isRecent) {
                    const strength = this.calculateDivergenceStrength('BEARISH', {
                        priceChange: (recentPriceHigh.value - previousPriceHigh.value) / previousPriceHigh.value,
                        macdChange: (previousMACDHigh.value - recentMACDHigh.value) / Math.abs(previousMACDHigh.value),
                        separation: Math.abs(recentPriceHigh.index - previousPriceHigh.index)
                    });
                    
                    // We already calculated ageInBars above
                    
                    // Calculate formation period dates
                    const formationStartDate = previousPriceHigh.date;
                    const formationEndDate = recentPriceHigh.date;
                    const macdStartDate = previousMACDHigh.date || formationStartDate;
                    const macdEndDate = recentMACDHigh.date || formationEndDate;
                    
                    divergences.push({
                        type: 'BEARISH',
                        strength,
                        pricePoints: [previousPriceHigh, recentPriceHigh],
                        macdPoints: [previousMACDHigh, recentMACDHigh],
                        separation: Math.abs(recentPriceHigh.index - previousPriceHigh.index),
                        ageInBars: ageInBars,  // Add recency tracking
                        // Formation date ranges for chart verification
                        formationDates: {
                            start: formationStartDate,
                            end: formationEndDate,
                            priceStart: formationStartDate,
                            priceEnd: formationEndDate,
                            macdStart: macdStartDate,
                            macdEnd: macdEndDate,
                            durationDays: this.calculateDaysBetween(formationStartDate, formationEndDate)
                        }
                    });
                }
            }
        }
        return divergences;
    }

    /**
     * Find the closest MACD swing to a price swing
     */
    findClosestMACDSwing(priceIndex, macdSwings) {
        let closest = null;
        let minDistance = Infinity;
        
        for (const swing of macdSwings) {
            const distance = Math.abs(swing.index - priceIndex);
            if (distance < minDistance && distance <= 3) { // Within 3 days
                minDistance = distance;
                closest = swing;
            }
        }
        
        return closest;
    }

    /**
     * Calculate divergence strength score
     */
    calculateDivergenceStrength(type, metrics) {
        let strength = 0.5; // Base strength
        
        // Price change magnitude (higher = stronger)
        const priceWeight = Math.min(Math.abs(metrics.priceChange) * 10, 0.3);
        strength += priceWeight;
        
        // MACD change magnitude (higher = stronger)
        const macdWeight = Math.min(Math.abs(metrics.macdChange) * 5, 0.2);
        strength += macdWeight;
        
        // Separation bonus (optimal 10-15 days)
        if (metrics.separation >= 8 && metrics.separation <= 18) {
            strength += 0.1;
        }
        
        return Math.min(1.0, strength);
    }

    /**
     * Validate divergence quality
     */
    validateDivergence(divergence) {
        return divergence.strength >= this.MIN_DIVERGENCE_STRENGTH &&
               divergence.separation >= this.MIN_SWING_SEPARATION &&
               divergence.separation <= this.MAX_SWING_SEPARATION;
    }

    /**
     * Phase 4: Validate candle structure for confirmation
     */
    validateCandleStructure(dailyData, divergenceAnalysis) {
        //console.log(`  📊 Phase 4: Validating candle structure...`);
        
        if (!divergenceAnalysis.hasDivergence) {
            return { isValid: false, reason: 'No divergence to confirm' };
        }
        
        const latest = dailyData[dailyData.length - 1];
        const previous = dailyData[dailyData.length - 2];
        
        const isBullish = latest.close > latest.open;
        const isBearish = latest.close < latest.open;
        
        let isValid = false;
        let reason = '';
        
        // Get the best divergence for additional validation
        const { bestBullish, bestBearish } = divergenceAnalysis;
        
        if (divergenceAnalysis.divergenceType === 'BULLISH' && bestBullish) {
            // Require: 1) Bullish candle, 2) Recent divergence (≤10 bars), 3) Strong candle body
            const recentDivergence = bestBullish.ageInBars <= 10;
            const strongCandle = this.isStrongBullishCandle(latest, previous);
            
            isValid = isBullish && recentDivergence && strongCandle;
            reason = isValid ? 'Strong bullish candle confirms recent bullish divergence' : 
                    !isBullish ? 'Waiting for bullish candle confirmation' :
                    !recentDivergence ? `Divergence too old (${bestBullish.ageInBars} bars ago)` :
                    'Waiting for stronger bullish confirmation';
                    
        } else if (divergenceAnalysis.divergenceType === 'BEARISH' && bestBearish) {
            // Require: 1) Bearish candle, 2) Recent divergence (≤10 bars), 3) Strong candle body
            const recentDivergence = bestBearish.ageInBars <= 10;
            const strongCandle = this.isStrongBearishCandle(latest, previous);
            
            isValid = isBearish && recentDivergence && strongCandle;
            reason = isValid ? 'Strong bearish candle confirms recent bearish divergence' : 
                    !isBearish ? 'Waiting for bearish candle confirmation' :
                    !recentDivergence ? `Divergence too old (${bestBearish.ageInBars} bars ago)` :
                    'Waiting for stronger bearish confirmation';
        }
        
        // Additional candle strength checks
        const candleRange = latest.high - latest.low;
        const bodySize = Math.abs(latest.close - latest.open);
        const bodyRatio = candleRange > 0 ? bodySize / candleRange : 0;
        
        const hasGoodBody = bodyRatio >= 0.4; // At least 40% body
        const volumeIncrease = previous && latest.volume > previous.volume;
        
        //console.log(`  📊 Candle: ${isBullish ? 'Bullish' : isBearish ? 'Bearish' : 'Neutral'}, Body=${(bodyRatio * 100).toFixed(0)}%, Vol=${volumeIncrease ? 'Up' : 'Down'}`);
        
        return {
            isValid,
            isBullish,
            isBearish,
            hasGoodBody,
            volumeIncrease,
            bodyRatio,
            reason
        };
    }

    /**
     * Helper: Check if candle shows strong bullish structure
     */
    isStrongBullishCandle(current, previous) {
        const bodySize = current.close - current.open;
        const candleRange = current.high - current.low;
        const bodyRatio = candleRange > 0 ? bodySize / candleRange : 0;
        
        const hasGoodBody = bodyRatio >= 0.5; // At least 50% body
        const strongClose = current.close > current.open; // Obviously bullish
        const volumeConfirmation = !previous || current.volume >= previous.volume * 0.8; // Not terrible volume
        
        return hasGoodBody && strongClose && volumeConfirmation;
    }

    /**
     * Helper: Check if candle shows strong bearish structure  
     */
    isStrongBearishCandle(current, previous) {
        const bodySize = current.open - current.close;
        const candleRange = current.high - current.low;
        const bodyRatio = candleRange > 0 ? bodySize / candleRange : 0;
        
        const hasGoodBody = bodyRatio >= 0.5; // At least 50% body
        const strongClose = current.close < current.open; // Obviously bearish
        const volumeConfirmation = !previous || current.volume >= previous.volume * 0.8; // Not terrible volume
        
        return hasGoodBody && strongClose && volumeConfirmation;
    }

    /**
     * Phase 5: Generate trading signals
     * Modified: Uses all divergence types (standard, triple, continuation).
     */
    generateSignals(divergenceAnalysis, candleAnalysis, latest) {
        //console.log(`  📊 Phase 5: Generating trading signals...`);

        let signal = 'AVOID';
        let signalStrength = 0;
        let reasoning = [];

        // Use allBullish/allBearish (which includes standard, triple, continuation)
        const bullishSignals = divergenceAnalysis.allBullish || [];
        const bearishSignals = divergenceAnalysis.allBearish || [];
        
        if (bullishSignals.length > 0) {
            const bestSignal = bullishSignals[0];
        }

        // Filter signals to only include recent ones (≤15 bars)
        const recentBullishSignals = bullishSignals.filter(s => s.ageInBars <= 15);
        const recentBearishSignals = bearishSignals.filter(s => s.ageInBars <= 15);

        // Determine if any signals present and if candle confirmed
        if (recentBullishSignals.length > 0 && candleAnalysis.isValid) {
            const bestSignal = recentBullishSignals[0];
            signal = 'BUY';
            // If triple/continuation, use their confidence, else fallback to standard
            signalStrength = bestSignal.confidence || (divergenceAnalysis.bestBullish?.strength + 0.3) * 0.8 || 0.8;
            // Compose reasoning
            if (bestSignal.reason) {
                reasoning.push(bestSignal.reason);
            } else {
                reasoning.push('Bullish MACD divergence detected');
            }
            reasoning.push('Confirmed with bullish candle structure');
            if (bestSignal.setupQuality) reasoning.push(`Setup quality: ${bestSignal.setupQuality}`);
            if (divergenceAnalysis.bestBullish?.strength)
                reasoning.push(`Divergence strength: ${(divergenceAnalysis.bestBullish.strength * 100).toFixed(0)}%`);
        } else if (recentBearishSignals.length > 0 && candleAnalysis.isValid) {
            const bestSignal = recentBearishSignals[0];
            signal = 'SELL';
            signalStrength = bestSignal.confidence || (divergenceAnalysis.bestBearish?.strength + 0.3) * 0.8 || 0.8;
            if (bestSignal.reason) {
                reasoning.push(bestSignal.reason);
            } else {
                reasoning.push('Bearish MACD divergence detected');
            }
            reasoning.push('Confirmed with bearish candle structure');
            if (bestSignal.setupQuality) reasoning.push(`Setup quality: ${bestSignal.setupQuality}`);
            if (divergenceAnalysis.bestBearish?.strength)
                reasoning.push(`Divergence strength: ${(divergenceAnalysis.bestBearish.strength * 100).toFixed(0)}%`);
        } else if (recentBullishSignals.length > 0 || recentBearishSignals.length > 0) {
            // Divergence exists but not confirmed by candle
            signal = 'WATCH';
            const bestSignal = recentBullishSignals[0] || recentBearishSignals[0];
            signalStrength = bestSignal.confidence ? bestSignal.confidence * 0.7 :
                (divergenceAnalysis.bestBullish?.strength || divergenceAnalysis.bestBearish?.strength || 0.6) * 0.6;
            if (bestSignal.reason) {
                reasoning.push(bestSignal.reason);
            } else {
                reasoning.push(`${divergenceAnalysis.divergenceType.toLowerCase()} MACD divergence detected`);
            }
            reasoning.push('Waiting for candle confirmation');
        } else {
            signal = 'AVOID';
            signalStrength = 0;
            reasoning.push('No valid MACD divergences detected');
        }

        return {
            signal,
            signalStrength,
            reasoning: reasoning.join('; '),
            entryPrice: latest.close,
            factors: {
                hasDivergence: divergenceAnalysis.hasDivergence,
                divergenceType: divergenceAnalysis.divergenceType,
                candleConfirmed: candleAnalysis.isValid,
                divergenceStrength: divergenceAnalysis.bestBullish?.strength || divergenceAnalysis.bestBearish?.strength || 0
            }
        };
    }

    /**
     * Phase 6: Assess risk metrics
     */
    assessRisk(signalAnalysis, swingAnalysis, latest, series) {
        //console.log(`  📊 Phase 6: Assessing risk...`);
        const entryPrice = signalAnalysis.entryPrice;
        let stopLoss = 0;
        let targets = [];
        
        if (signalAnalysis.signal === 'BUY') {
            // Stop loss: below recent low or percentage-based
            const recentLow = Math.min(...series.daily.slice(-10).map(d => d.low));
            const percentageStop = entryPrice * (1 - this.STOP_LOSS_PCT);
            stopLoss = Math.min(recentLow * 0.98, percentageStop); // 2% below recent low or 5% stop
            
            // Targets based on divergence strength and ATR
            const atr = this.calculateATR(series.daily.slice(-14));
            targets = [
                entryPrice + (atr * 2), // First target: 2x ATR
                entryPrice + (atr * 3), // Second target: 3x ATR
                entryPrice + (atr * 4)  // Third target: 4x ATR
            ];
            
        } else if (signalAnalysis.signal === 'SELL') {
            // Stop loss: above recent high or percentage-based
            const recentHigh = Math.max(...series.daily.slice(-10).map(d => d.high));
            const percentageStop = entryPrice * (1 + this.STOP_LOSS_PCT);
            stopLoss = Math.max(recentHigh * 1.02, percentageStop); // 2% above recent high or 5% stop
            
            // Targets based on divergence strength and ATR
            const atr = this.calculateATR(series.daily.slice(-14));
            targets = [
                entryPrice - (atr * 2), // First target: 2x ATR
                entryPrice - (atr * 3), // Second target: 3x ATR
                entryPrice - (atr * 4)  // Third target: 4x ATR
            ];
            
        } else if (signalAnalysis.signal === 'WATCH') {
            // Projected risk/reward for watch scenarios
            const projectedEntry = signalAnalysis.signal === 'BUY' ? latest.close * 1.02 : latest.close * 0.98;
            const atr = this.calculateATR(series.daily.slice(-14));
            
            if (signalAnalysis.factors.divergenceType === 'BULLISH') {
                stopLoss = projectedEntry * (1 - this.STOP_LOSS_PCT);
                targets = [projectedEntry + (atr * 2)];
            } else {
                stopLoss = projectedEntry * (1 + this.STOP_LOSS_PCT);
                targets = [projectedEntry - (atr * 2)];
            }
        }
        
        return {
            stopLoss: Math.round(stopLoss * 100) / 100,
            targets: targets.map(t => Math.round(t * 100) / 100),
            entryPrice: Math.round(entryPrice * 100) / 100,
            assessmentType: 'MACD_DIVERGENCE'
        };
    }

    /**
     * Phase 8: Calculate risk/reward metrics (renamed from calculateRisk)
     */
    /**
     * Calculate preliminary risk/reward for confidence adjustment in makeFinalDecision
     * This is a simplified version that doesn't depend on finalDecision
     */
    calculatePreliminaryRiskReward(signalAnalysis, riskAssessment, divergenceAnalysis, swingAnalysis, latest) {
        // Use base risk assessment for preliminary calculation
        const stopLoss = riskAssessment.stopLoss;
        const targets = riskAssessment.targets;
        
        // Calculate basic risk/reward ratio based on signal type
        let riskReward = 0;
        
        if (signalAnalysis.signal === 'BUY' || signalAnalysis.signal === 'SELL') {
            const risk = Math.abs(riskAssessment.entryPrice - stopLoss);
            const reward = targets.length > 0 ? Math.abs(targets[0] - riskAssessment.entryPrice) : 0;
            riskReward = risk > 0 ? reward / risk : 0;
        } else if (signalAnalysis.signal === 'WATCH') {
            // For WATCH signals, calculate projected risk/reward
            const projectedEntry = latest.close;
            const risk = Math.abs(projectedEntry - stopLoss);
            const reward = targets.length > 0 ? Math.abs(targets[0] - projectedEntry) : 0;
            riskReward = risk > 0 ? reward / risk : 0;
        }
        
        return {
            stopLoss,
            targets,
            riskReward,
            entryPrice: riskAssessment.entryPrice || latest.close
        };
    }

    calculateRiskReward(finalDecision, riskAssessment, divergenceAnalysis, swingAnalysis, latest) {
        //console.log(`  📊 Phase 8: Calculating confidence-adjusted risk/reward...`);
        
        // Use base risk assessment but adjust based on final confidence
        let stopLoss = riskAssessment.stopLoss;
        let targets = [...riskAssessment.targets];
        let riskReward = 0;
        
        // Confidence-based adjustments
        if (finalDecision.confidence >= 0.8) {
            // High confidence: slightly tighter stop, extended targets
            stopLoss = finalDecision.signal === 'BUY' ? stopLoss * 1.02 : stopLoss * 0.98;
            targets = targets.map(t => finalDecision.signal === 'BUY' ? t * 1.05 : t * 0.95);
        } else if (finalDecision.confidence <= 0.5) {
            // Lower confidence: wider stop, conservative targets
            stopLoss = finalDecision.signal === 'BUY' ? stopLoss * 0.98 : stopLoss * 1.02;
            targets = targets.map(t => finalDecision.signal === 'BUY' ? t * 0.97 : t * 1.03);
        }
        
        // Calculate risk/reward ratio
        if (finalDecision.signal === 'BUY' || finalDecision.signal === 'SELL') {
            const risk = Math.abs(riskAssessment.entryPrice - stopLoss);
            const reward = Math.abs(targets[0] - riskAssessment.entryPrice);
            riskReward = risk > 0 ? reward / risk : 0;
        } else if (finalDecision.signal === 'WATCH') {
            // For WATCH signals, calculate projected risk/reward
            const projectedEntry = latest.close;
            const risk = Math.abs(projectedEntry - stopLoss);
            const reward = targets.length > 0 ? Math.abs(targets[0] - projectedEntry) : 0;
            riskReward = risk > 0 ? reward / risk : 0;
        }
        
        return {
            stopLoss: Math.round(stopLoss * 100) / 100,
            targets: targets.map(t => Math.round(t * 100) / 100),
            riskReward: Math.round(riskReward * 100) / 100,
            entryPrice: riskAssessment.entryPrice,
            confidenceAdjusted: true
        };
    }

    /**
     * Phase 7: Make final trading decision
     */
    makeFinalDecision(signalAnalysis, riskAssessment, divergenceAnalysis, candleAnalysis, swingAnalysis, riskReward = null) {
        //console.log(`  📊 Phase 7: Making final decision...`);

        let finalSignal = signalAnalysis.signal;
        let confidence = 0.5;
        let reasoning = [signalAnalysis.reasoning];

        // Add recency check for divergence signals
        const { bestBullish, bestBearish } = divergenceAnalysis;
        // For structured logic: Only allow BUY/SELL if has recent divergence and the divergence list is not empty
        // We need access to allBullish/allBearish arrays and candles
        // We'll try to get candles from riskReward or assume analyze() has candles in scope
        // Here, we must make sure that for a BUY signal:
        // - There is a recent bullish divergence (bestBullish)
        // - The bullish divergence array is not empty
        // - The divergence is recent (within last 10 candles)
        // For SELL, similar
        // We'll try to get candles from the divergence arrays
        let bullishDivergences = divergenceAnalysis.allBullish || [];
        let bearishDivergences = divergenceAnalysis.allBearish || [];
        // Try to get candles from the context (ideally should be passed in)
        // For now, we cannot, so we'll only use index checks if possible
        // If candles are not available, fallback to ageInBars check

        // Structured logic for final signal
        if (
            finalSignal === 'BUY' &&
            bestBullish &&
            bullishDivergences.length > 0 &&
            (
                (typeof bestBullish.ageInBars === 'number' && bestBullish.ageInBars <= 10)
                // || safeIsRecent(bullishDivergences[bullishDivergences.length - 1], candles, 10)
            )
        ) {
            // All good, keep BUY
        } else if (
            finalSignal === 'SELL' &&
            bestBearish &&
            bearishDivergences.length > 0 &&
            (
                (typeof bestBearish.ageInBars === 'number' && bestBearish.ageInBars <= 10)
                // || safeIsRecent(bearishDivergences[bearishDivergences.length - 1], candles, 10)
            )
        ) {
            // All good, keep SELL
        } else if (finalSignal === 'BUY' || finalSignal === 'SELL') {
            // If the above conditions are NOT met, override to AVOID
            //console.log(`     ❌ Overriding ${finalSignal} to AVOID: divergence not recent or missing`);
            finalSignal = 'AVOID';
            if (finalSignal === 'AVOID' && bestBullish && finalSignal === 'BUY') {
                reasoning = [`Divergence detected but too old (${bestBullish?.ageInBars} bars ago)`];
            } else if (finalSignal === 'AVOID' && bestBearish && finalSignal === 'SELL') {
                reasoning = [`Divergence detected but too old (${bestBearish?.ageInBars} bars ago)`];
            } else {
                reasoning = ['No recent divergence detected'];
            }
        }

        // Calculate confidence based on analysis quality
        if (finalSignal === 'BUY' || finalSignal === 'SELL') {
            confidence = 0.75; // Base confidence for divergence signals
            // Boost confidence for strong divergences
            const bestDivergence = divergenceAnalysis.bestBullish || divergenceAnalysis.bestBearish;
            if (bestDivergence && bestDivergence.strength >= 0.8) {
                confidence = Math.min(0.90, confidence + 0.1);
            }
            // Boost confidence for good candle confirmation
            if (candleAnalysis.hasGoodBody && candleAnalysis.volumeIncrease) {
                confidence = Math.min(0.92, confidence + 0.08);
            }
            // Good risk/reward bonus
            if (riskReward && riskReward.riskReward >= 2.5) {
                confidence = Math.min(0.95, confidence + 0.05);
            }
            // Reduce confidence for weak signals
            if (signalAnalysis.signalStrength < 0.7) {
                confidence = Math.max(0.65, confidence - 0.1);
            }
        } else if (finalSignal === 'WATCH') {
            // Standardized WATCH confidence calculation
            confidence = 0.40 + (signalAnalysis.signalStrength * 0.25); // Base 0.40 + bonus
            confidence = Math.min(confidence, 0.70); // Cap WATCH signals at 70%
        } else {
            confidence = this.calculateMACDDivergenceConfidence(divergenceAnalysis, candleAnalysis, swingAnalysis); // Dynamic confidence for AVOID
        }

        // Build execution plan
        const executionPlan = this.buildExecutionPlan(finalSignal, riskAssessment, divergenceAnalysis);

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
    buildExecutionPlan(signal, riskAssessment, divergenceAnalysis) {
        const plan = {
            action: signal,
            entryStrategy: null,
            exitStrategy: null,
            positionSizing: null
        };
        
        if (signal === 'BUY' || signal === 'SELL') {
            const direction = signal === 'BUY' ? 'bullish' : 'bearish';
            
            plan.entryStrategy = {
                type: 'DIVERGENCE',
                method: `Market order on ${direction} divergence confirmation`,
                conditions: [`${divergenceAnalysis.divergenceType} MACD divergence`, 'Candle confirmation', 'Volume support']
            };
            
            plan.exitStrategy = {
                stopLoss: riskAssessment.stopLoss,
                targets: riskAssessment.targets,
                timeStop: 'Review if no follow-through within 5-7 days',
                macdExit: signal === 'BUY' ? 'Consider exit when MACD turns negative' : 'Consider exit when MACD turns positive'
            };
            
            // Calculate risk/reward for position sizing
            const risk = Math.abs(riskAssessment.entryPrice - riskAssessment.stopLoss);
            const reward = riskAssessment.targets.length > 0 ? Math.abs(riskAssessment.targets[0] - riskAssessment.entryPrice) : 0;
            const riskRewardRatio = risk > 0 ? reward / risk : 0;
            
            plan.positionSizing = {
                risk: '1-2% of portfolio at stop loss',
                recommendation: riskRewardRatio >= 2.5 ? 'FULL' : 'HALF'
            };
            
        } else if (signal === 'WATCH') {
            plan.entryStrategy = {
                type: 'PENDING_CONFIRMATION',
                method: 'Wait for candle confirmation',
                conditions: ['Monitor for reversal candle', 'Watch for volume increase', 'Confirm trend change']
            };
        }
        
        return plan;
    }

    /**
     * Build standardized MACD Divergence entry strategy matching Elder format
     */
    buildPreciseMACDEntryStrategy(riskAssessment, divergenceAnalysis, candleAnalysis, signal, latest) {
        const strategy = {
            conditions: [],
            timing: null,
            readiness: null,
            urgency: null,
            entryType: null,
            anticipatedEntry: null,
            triggerLevel: null
        };

        if (signal === 'BUY') {
            strategy.conditions = [
                'Bullish MACD divergence confirmed',
                'Price making lower low, MACD making higher low',
                'Reversal candle structure present',
                'Entry on break above recent resistance'
            ];
            
            const divergenceStrength = divergenceAnalysis.bestBullish?.strength || 0;
            const divergenceType = divergenceAnalysis.divergenceType;
            
            strategy.timing = `Immediate entry on bullish confirmation above ${latest.close.toFixed(2)}`;
            strategy.readiness = 'Divergence confirmed - ready for reversal entry';
            strategy.urgency = divergenceStrength > 0.8 ? 'HIGH - strong divergence signal' : 'MEDIUM - moderate divergence signal';
            strategy.entryType = 'REVERSAL_MOMENTUM';
            strategy.anticipatedEntry = riskAssessment.entryPrice;
            strategy.triggerLevel = latest.close;
            
            // Add divergence-specific context
            if (divergenceAnalysis.bestBullish) {
                const divInfo = divergenceAnalysis.bestBullish;
                strategy.divergenceContext = `${divInfo.separation}-day divergence span, strength: ${(divInfo.strength * 100).toFixed(0)}%`;
            }
            
        } else if (signal === 'SELL') {
            strategy.conditions = [
                'Bearish MACD divergence confirmed',
                'Price making higher high, MACD making lower high',
                'Reversal candle structure present',
                'Entry on break below recent support'
            ];
            
            const divergenceStrength = divergenceAnalysis.bestBearish?.strength || 0;
            
            strategy.timing = `Immediate entry on bearish confirmation below ${latest.close.toFixed(2)}`;
            strategy.readiness = 'Divergence confirmed - ready for reversal entry';
            strategy.urgency = divergenceStrength > 0.8 ? 'HIGH - strong divergence signal' : 'MEDIUM - moderate divergence signal';
            strategy.entryType = 'REVERSAL_MOMENTUM';
            strategy.anticipatedEntry = riskAssessment.entryPrice;
            strategy.triggerLevel = latest.close;
            
            // Add divergence-specific context
            if (divergenceAnalysis.bestBearish) {
                const divInfo = divergenceAnalysis.bestBearish;
                strategy.divergenceContext = `${divInfo.separation}-day divergence span, strength: ${(divInfo.strength * 100).toFixed(0)}%`;
            }
            
        } else if (signal === 'WATCH') {
            const divType = divergenceAnalysis.divergenceType.toLowerCase();
            
            strategy.conditions = [
                `${divergenceAnalysis.divergenceType} divergence pattern developing`,
                'Awaiting stronger candle confirmation',
                'Monitoring for volume expansion',
                'Watching for trend reversal signals'
            ];
            
            strategy.timing = 'Setup developing - monitor for confirmation trigger';
            strategy.readiness = 'Divergence detected - waiting for confirmation';
            strategy.urgency = 'MEDIUM - pattern developing, prepare for potential reversal';
            strategy.entryType = 'REVERSAL_PENDING';
            
            const projectedEntry = divType === 'bullish' ? latest.close * 1.02 : latest.close * 0.98;
            strategy.anticipatedEntry = projectedEntry;
            strategy.triggerLevel = latest.close;
        }

        return strategy;
    }

    /**
     * Build standardized MACD Divergence exit strategy matching Elder format
     */
    buildPreciseMACDExitStrategy(riskAssessment, divergenceAnalysis, candleAnalysis, signal, latest) {
        const strategy = {
            stopLoss: riskAssessment.stopLoss,
            targets: riskAssessment.targets,
            timeStop: null,
            systemExit: null,
            trailingStop: false
        };

        if (signal === 'BUY') {
            strategy.timeStop = 'Monitor for 5-10 trading days for reversal completion';
            strategy.systemExit = 'Exit if MACD turns negative or divergence pattern fails';
            strategy.trailingStop = 'Consider 1x ATR trailing stop after 50% target hit';
            
            const divergenceStrength = divergenceAnalysis.bestBullish?.strength || 0;
            
            if (divergenceStrength > 0.8) {
                strategy.timeStop = 'Extended holding period - strong divergence allows 2-3 week reversal';
                strategy.trailingStop = 'Implement aggressive 0.5x ATR trailing stop - strong signal';
            }
            
        } else if (signal === 'SELL') {
            strategy.timeStop = 'Monitor for 5-10 trading days for reversal completion';
            strategy.systemExit = 'Exit if MACD turns positive or divergence pattern fails';
            strategy.trailingStop = 'Consider 1x ATR trailing stop after 50% target hit';
            
            const divergenceStrength = divergenceAnalysis.bestBearish?.strength || 0;
            
            if (divergenceStrength > 0.8) {
                strategy.timeStop = 'Extended holding period - strong divergence allows 2-3 week reversal';
                strategy.trailingStop = 'Implement aggressive 0.5x ATR trailing stop - strong signal';
            }
            
        } else if (signal === 'WATCH') {
            strategy.timeStop = 'Cancel setup if no confirmation within 3-5 trading days';
            strategy.systemExit = 'Abandon if divergence pattern deteriorates or MACD alignment reverses';
            strategy.triggerRequired = 'Strong reversal candle with volume confirmation required';
            strategy.trailingStop = 'Plan 1x ATR trailing stop after confirmation entry';
        }

        // Add divergence-specific exit conditions
        const hasActiveDivergence = divergenceAnalysis.bestBullish || divergenceAnalysis.bestBearish;
        
        if (hasActiveDivergence && (signal === 'BUY' || signal === 'SELL')) {
            const divType = signal === 'BUY' ? 'bullish' : 'bearish';
            strategy.systemExit = `${strategy.systemExit} | Critical: Exit if ${divType} divergence pattern breaks down`;
        }

        return strategy;
    }

    /**
     * Calculate signal quality grade
     */
    calculateSignalQuality(finalDecision, divergenceAnalysis) {
        let score = 50; // Base score
        
        if (finalDecision.signal === 'BUY' || finalDecision.signal === 'SELL') {
            const bestDivergence = divergenceAnalysis.bestBullish || divergenceAnalysis.bestBearish;
            
            // Divergence strength scoring (30 points max)
            if (bestDivergence) {
                score += bestDivergence.strength * 30;
            }
            
            // Separation quality (good timing) (15 points max)
            if (bestDivergence && bestDivergence.separation >= 8 && bestDivergence.separation <= 15) {
                score += 15;
            } else if (bestDivergence) {
                score += 10;
            }
            
            // Confidence bonus
            score += (finalDecision.confidence - 0.5) * 10;
            
        } else if (finalDecision.signal === 'WATCH') {
            score = 55 + (finalDecision.confidence * 20);
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
        if (!series?.daily || series.daily.length < 30) {
            return false;
        }
        
        // Check for required OHLCV data
        const latest = series.daily[series.daily.length - 1];
        if (!latest.high || !latest.low || !latest.close || !latest.open) {
            return false;
        }
        
        // MACD can be calculated if not provided
        return true;
    }

    /**
     * Assess data quality
     */
    assessDataQuality(dailyData, indicators) {
        const hasMACD = indicators?.base?.macd && indicators?.base?.macd_signal && indicators?.base?.macd_histogram;
        
        if (dailyData.length >= 60 && hasMACD) return 'EXCELLENT';
        if (dailyData.length >= 50) return 'GOOD';
        if (dailyData.length >= 30) return 'FAIR';
        return 'POOR';
    }

    /**
     * Create AVOID signal
     */
    createAvoidSignal(code, message) {
        return {
            system: this.systemId,
            systemName: this.name,
            decision: 'AVOID',
            confidence: 0.3,
            reasoning: [message],
            
            analysis: null,
            riskReward: null,
            executionPlan: null,
            signalQuality: { grade: 'F', percentage: 30 },
            
            timestamp: new Date().toISOString(),
            systemVersion: this.version,
            errorCode: code
        };
    }

    /**
     * Detect bullish continuation divergence:
     * - Price makes higher low, MACD histogram makes higher low, latest candle bullish.
     */
    detectBullishContinuationDivergence(candles, macdHistogram) {
        // Helper: find swing lows
        const findSwingLows = (candlesArr, lookback = 20) => {
            const lows = [];
            const start = Math.max(2, candlesArr.length - lookback);
            for (let i = start; i < candlesArr.length - 2; i++) {
                const current = candlesArr[i];
                const prev2 = candlesArr[i - 2];
                const prev1 = candlesArr[i - 1];
                const next1 = candlesArr[i + 1];
                const next2 = candlesArr[i + 2];
                if (
                    current.low < prev2.low &&
                    current.low < prev1.low &&
                    current.low < next1.low &&
                    current.low < next2.low
                ) {
                    lows.push({
                        index: i,
                        price: current.low,
                        date: current.date
                    });
                }
            }
            return lows;
        };
        
        const swingLows = findSwingLows(candles, 20);
        if (swingLows.length < 2) return [];

        const [low1, low2] = swingLows.slice(-2); // last two
        const hist1 = macdHistogram[low1.index];
        const hist2 = macdHistogram[low2.index];

        const priceHigherLow = low2.price > low1.price;
        const histHigherLow = hist2 > hist1;

        const latest = candles[candles.length - 1];
        const bullishCandle = latest.close > latest.open;

        if (priceHigherLow && histHigherLow && bullishCandle) {
            // Calculate age of the most recent divergence point
            const ageInBars = candles.length - 1 - low2.index; // Bars from most recent swing to current bar
            
            return [{
                signal: 'BUY',
                confidence: 0.85,
                reason: 'Bullish continuation divergence: price made higher low with stronger MACD histogram',
                pivots: [low1, low2],
                histograms: [hist1, hist2],
                setupQuality: 'B+',
                ageInBars: ageInBars  // Add recency tracking
            }];
        }

        return [];
    }

    /**
     * Detect bearish continuation divergence:
     * - Price makes lower high, MACD histogram makes lower high, latest candle bearish.
     */
    detectBearishContinuationDivergence(candles, macdHistogram) {
        // Helper: find swing highs
        const findSwingHighs = (candlesArr, lookback = 20) => {
            const highs = [];
            const start = Math.max(2, candlesArr.length - lookback);
            for (let i = start; i < candlesArr.length - 2; i++) {
                const current = candlesArr[i];
                const prev2 = candlesArr[i - 2];
                const prev1 = candlesArr[i - 1];
                const next1 = candlesArr[i + 1];
                const next2 = candlesArr[i + 2];
                if (
                    current.high > prev2.high &&
                    current.high > prev1.high &&
                    current.high > next1.high &&
                    current.high > next2.high
                ) {
                    highs.push({
                        index: i,
                        price: current.high,
                        date: current.date
                    });
                }
            }
            return highs;
        };
        
        const swingHighs = findSwingHighs(candles, 20);
        if (swingHighs.length < 2) return [];

        const [high1, high2] = swingHighs.slice(-2); // last two
        const hist1 = macdHistogram[high1.index];
        const hist2 = macdHistogram[high2.index];

        const priceLowerHigh = high2.price < high1.price;
        const histLowerHigh = hist2 < hist1;

        const latest = candles[candles.length - 1];
        const bearishCandle = latest.close < latest.open;

        if (priceLowerHigh && histLowerHigh && bearishCandle) {
            // Calculate age of the most recent divergence point
            const ageInBars = candles.length - 1 - high2.index; // Bars from most recent swing to current bar
            
            return [{
                signal: 'SELL',
                confidence: 0.85,
                reason: 'Bearish continuation divergence: price made lower high with weaker MACD histogram',
                pivots: [high1, high2],
                histograms: [hist1, hist2],
                setupQuality: 'B+',
                ageInBars: ageInBars  // Add recency tracking
            }];
        }

        return [];
    }

    /**
     * Detect triple bullish divergence:
     * - Three consecutive lower lows in price, but higher lows in MACD histogram
     */
    detectTripleBullishDivergence(candles, macdHistogram) {
        if (candles.length < 60 || macdHistogram.length < 60) return [];

        const tripleLows = this.findMultiplePivotLows(candles, 3);
        const results = [];

        if (tripleLows.length === 3) {
            const [pivot1, pivot2, pivot3] = tripleLows;

            const priceLowValid = pivot1.low > pivot2.low && pivot2.low > pivot3.low;
            const macdLowValid = macdHistogram[pivot1.index] < macdHistogram[pivot2.index] &&
                                 macdHistogram[pivot2.index] < macdHistogram[pivot3.index];

            const latest = candles[candles.length - 1];
            const isBullishCandle = latest.close > latest.open;

            if (priceLowValid && macdLowValid && isBullishCandle) {
                // Calculate age of the most recent divergence point (pivot3 is the most recent)
                const ageInBars = candles.length - 1 - pivot3.index; // Bars from most recent swing to current bar
                
                results.push({
                    type: 'triple_bullish',
                    signal: 'BUY',
                    reason: 'Triple bullish divergence detected',
                    pivots: [pivot1, pivot2, pivot3],
                    ageInBars: ageInBars  // Add recency tracking
                });
            }
        }

        return results;
    }

    /**
     * Detect triple bearish divergence:
     * - Three consecutive higher highs in price, but lower highs in MACD histogram
     */
    detectTripleBearishDivergence(candles, macdHistogram) {
        if (candles.length < 60 || macdHistogram.length < 60) return [];

        const tripleHighs = this.findMultiplePivotHighs(candles, 3);
        const results = [];

        if (tripleHighs.length === 3) {
            const [pivot1, pivot2, pivot3] = tripleHighs;

            const priceHighValid = pivot1.high < pivot2.high && pivot2.high < pivot3.high;
            const macdHighValid = macdHistogram[pivot1.index] > macdHistogram[pivot2.index] &&
                                  macdHistogram[pivot2.index] > macdHistogram[pivot3.index];

            const latest = candles[candles.length - 1];
            const isBearishCandle = latest.close < latest.open;

            if (priceHighValid && macdHighValid && isBearishCandle) {
                // Calculate age of the most recent divergence point (pivot3 is the most recent)
                const ageInBars = candles.length - 1 - pivot3.index; // Bars from most recent swing to current bar
                
                results.push({
                    type: 'triple_bearish',
                    signal: 'SELL',
                    reason: 'Triple bearish divergence detected',
                    pivots: [pivot1, pivot2, pivot3],
                    ageInBars: ageInBars  // Add recency tracking
                });
            }
        }

        return results;
    }

    /**
     * Helper: find multiple pivot lows
     */
    findMultiplePivotLows(candles, count = 3) {
        const lows = [];
        for (let i = 2; i < candles.length - 2; i++) {
            const current = candles[i];
            const prev2 = candles[i - 2];
            const prev1 = candles[i - 1];
            const next1 = candles[i + 1];
            const next2 = candles[i + 2];
            if (
                current.low < prev2.low &&
                current.low < prev1.low &&
                current.low < next1.low &&
                current.low < next2.low
            ) {
                lows.push({
                    index: i,
                    low: current.low,
                    date: current.date
                });
            }
        }
        return lows.slice(-count);
    }

    /**
     * Helper: find multiple pivot highs
     */
    findMultiplePivotHighs(candles, count = 3) {
        const highs = [];
        for (let i = 2; i < candles.length - 2; i++) {
            const current = candles[i];
            const prev2 = candles[i - 2];
            const prev1 = candles[i - 1];
            const next1 = candles[i + 1];
            const next2 = candles[i + 2];
            if (
                current.high > prev2.high &&
                current.high > prev1.high &&
                current.high > next1.high &&
                current.high > next2.high
            ) {
                highs.push({
                    index: i,
                    high: current.high,
                    date: current.date
                });
            }
        }
        return highs.slice(-count);
    }

    /**
     * Calculate dynamic confidence for MACD Divergence system based on setup strength
     */
    calculateMACDDivergenceConfidence(divergenceAnalysis, candleAnalysis, swingAnalysis) {
        let confidence = 0.3; // Base confidence
        
        const { divergenceType, bestBullish, bestBearish } = divergenceAnalysis || {};
        
        // Divergence strength and recency
        if (divergenceType === 'BULLISH' && bestBullish) {
            const strength = bestBullish.strength || 0;
            const ageInBars = bestBullish.ageInBars || 50;
            
            confidence += strength * 0.15;
            
            // Recent divergence is more valuable
            if (ageInBars <= 5) {
                confidence += 0.12;
            } else if (ageInBars <= 10) {
                confidence += 0.08;
            } else if (ageInBars <= 20) {
                confidence += 0.05;
            }
        } else if (divergenceType === 'BEARISH' && bestBearish) {
            const strength = bestBearish.strength || 0;
            const ageInBars = bestBearish.ageInBars || 50;
            
            confidence += strength * 0.12;
            
            if (ageInBars <= 5) {
                confidence += 0.10;
            } else if (ageInBars <= 10) {
                confidence += 0.06;
            }
        }
        
        // Candle confirmation
        if (candleAnalysis?.isBullish && divergenceType === 'BULLISH') {
            confidence += 0.06;
        } else if (candleAnalysis?.isBearish && divergenceType === 'BEARISH') {
            confidence += 0.06;
        }
        
        // Swing point quality
        if (swingAnalysis) {
            const priceSwings = swingAnalysis.price;
            const macdSwings = swingAnalysis.macd;
            if (priceSwings?.highs?.length >= 2 && priceSwings?.lows?.length >= 2 && 
                macdSwings?.highs?.length >= 2 && macdSwings?.lows?.length >= 2) {
                confidence += 0.08;
            }
        }
        
        return Math.min(Math.max(confidence, 0.15), 0.75);
    }
    /**
 * Helper: Check if a divergence point is recent (within last N candles)
 */
     isRecentDivergence(divergencePoint, candles, lookback = 10) {
        return divergencePoint && divergencePoint.index >= candles.length - lookback;
    }

    /**
     * Create formation date summary for chart verification
     */
    createFormationDateSummary(bullishSignals, bearishSignals, bestBullish, bestBearish) {
        const summary = {
            hasDivergences: (bullishSignals.length > 0 || bearishSignals.length > 0),
            totalBullish: bullishSignals.length,
            totalBearish: bearishSignals.length,
            bullishFormations: [],
            bearishFormations: []
        };

        // Extract formation dates from bullish divergences
        bullishSignals.forEach((divergence, index) => {
            if (divergence.formationDates) {
                summary.bullishFormations.push({
                    index: index + 1,
                    type: divergence.type || 'BULLISH',
                    strength: divergence.strength,
                    ageInBars: divergence.ageInBars,
                    ...divergence.formationDates
                });
            } else if (divergence.pivots && divergence.pivots.length >= 2) {
                // Handle advanced divergences (triple, continuation) that have pivots with dates
                const start = divergence.pivots[0];
                const end = divergence.pivots[divergence.pivots.length - 1];
                summary.bullishFormations.push({
                    index: index + 1,
                    type: divergence.signal === 'BUY' ? 'BULLISH_CONTINUATION' : 'BULLISH_TRIPLE',
                    confidence: divergence.confidence,
                    ageInBars: divergence.ageInBars,
                    start: start.date,
                    end: end.date,
                    priceStart: start.date,
                    priceEnd: end.date,
                    durationDays: this.calculateDaysBetween(start.date, end.date)
                });
            }
        });

        // Extract formation dates from bearish divergences
        bearishSignals.forEach((divergence, index) => {
            if (divergence.formationDates) {
                summary.bearishFormations.push({
                    index: index + 1,
                    type: divergence.type || 'BEARISH',
                    strength: divergence.strength,
                    ageInBars: divergence.ageInBars,
                    ...divergence.formationDates
                });
            } else if (divergence.pivots && divergence.pivots.length >= 2) {
                // Handle advanced divergences (triple, continuation) that have pivots with dates
                const start = divergence.pivots[0];
                const end = divergence.pivots[divergence.pivots.length - 1];
                summary.bearishFormations.push({
                    index: index + 1,
                    type: divergence.signal === 'SELL' ? 'BEARISH_CONTINUATION' : 'BEARISH_TRIPLE',
                    confidence: divergence.confidence,
                    ageInBars: divergence.ageInBars,
                    start: start.date,
                    end: end.date,
                    priceStart: start.date,
                    priceEnd: end.date,
                    durationDays: this.calculateDaysBetween(start.date, end.date)
                });
            }
        });

        // Add best divergence summary
        if (bestBullish && bestBullish.formationDates) {
            summary.bestBullish = {
                type: bestBullish.type,
                strength: bestBullish.strength,
                ageInBars: bestBullish.ageInBars,
                ...bestBullish.formationDates
            };
        }

        if (bestBearish && bestBearish.formationDates) {
            summary.bestBearish = {
                type: bestBearish.type,
                strength: bestBearish.strength,
                ageInBars: bestBearish.ageInBars,
                ...bestBearish.formationDates
            };
        }

        return summary;
    }

    /**
     * Helper: Calculate days between two dates
     */
    calculateDaysBetween(startDate, endDate) {
        if (!startDate || !endDate) return null;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
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

    /**
     * Calculate MACD Divergence confidence-based position sizing with available capital
     * Divergence approach: Higher confidence = larger position, with risk management
     */
    calculateMACDPositionSizing(confidence, capitalInfo = {}, riskReward = {}, divergenceAnalysis = {}) {
        const { capital = 100000, entryPrice = 100 } = capitalInfo;
        const { stopLoss = 0, riskReward: rrRatio = 1, anticipatedEntry } = riskReward;
        
        // Use anticipated entry for WATCH signals, actual entry for BUY/SELL
        const effectiveEntryPrice = anticipatedEntry || entryPrice;
        
        // MACD Divergence 6-tier confidence-based position sizing
        let recommendation = 'AVOID';
        let maxPosition = 0;
        let riskPercent = 0;
        
        if (confidence >= 0.85) {
            recommendation = 'AGGRESSIVE'; // Strong divergence + confirmation
            maxPosition = 0.08; // 8% of portfolio max
            riskPercent = 2.0; // 2% risk per trade
        } else if (confidence >= 0.75) {
            recommendation = 'FULL'; // Good divergence + confirmation
            maxPosition = 0.06; // 6% of portfolio
            riskPercent = 1.5; // 1.5% risk per trade
        } else if (confidence >= 0.65) {
            recommendation = 'REDUCED'; // Decent divergence setup
            maxPosition = 0.05; // 5% of portfolio
            riskPercent = 1.0; // 1% risk per trade
        } else if (confidence >= 0.55) {
            recommendation = 'SMALL'; // Weak divergence
            maxPosition = 0.03; // 3% of portfolio
            riskPercent = 0.75; // 0.75% risk per trade
        } else if (confidence >= 0.45) {
            recommendation = 'MINIMAL'; // Very weak setup
            maxPosition = 0.02; // 2% of portfolio
            riskPercent = 0.5; // 0.5% risk per trade
        } else {
            recommendation = 'AVOID';
            maxPosition = 0;
            riskPercent = 0;
        }

        // Calculate actual position sizing
        let shares = 0;
        let positionValue = 0;
        let riskAmount = 0;
        
        if (recommendation !== 'AVOID' && effectiveEntryPrice > 0) {
            // Calculate based on risk amount first
            riskAmount = capital * (riskPercent / 100);
            
            if (stopLoss > 0) {
                const riskPerShare = Math.abs(effectiveEntryPrice - stopLoss);
                shares = Math.floor(riskAmount / riskPerShare);
            }
            
            // Ensure position doesn't exceed max portfolio percentage
            const maxPositionValue = capital * maxPosition;
            const calculatedPositionValue = shares * effectiveEntryPrice;
            
            if (calculatedPositionValue > maxPositionValue) {
                shares = Math.floor(maxPositionValue / effectiveEntryPrice);
            }
            
            positionValue = shares * effectiveEntryPrice;
        }

        return {
            recommendation,
            riskPercent,
            maxPosition,
            shares: Math.max(0, shares),
            positionValue: positionValue,
            riskAmount: riskAmount,
            riskPerShare: Math.round((Math.abs(effectiveEntryPrice - stopLoss)) * 100) / 100,
            stopDistance: stopLoss > 0 ? Math.round(((effectiveEntryPrice - stopLoss) / effectiveEntryPrice) * 10000) / 100 : 0,
            entryType: anticipatedEntry ? 'CONDITIONAL' : 'IMMEDIATE',
            effectiveEntry: Math.round(effectiveEntryPrice * 100) / 100
        };
    }
}

module.exports = MACDDivergence;
