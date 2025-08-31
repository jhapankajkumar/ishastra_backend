const _ = require('lodash');
const { ATR } = require('technicalindicators');

/**
 * Advanced Pattern Recognition for Phase 2
 * Supertrend, Fibonacci, and Enhanced Patterns
 */

class AdvancedPatterns {
  
  /**
   * Calculate Supertrend Indicator
   * @param {Array} ohlcData - OHLC data
   * @param {number} period - ATR period (default 10)
   * @param {number} multiplier - ATR multiplier (default 3)
   * @returns {Array} Supertrend values
   */
  static calculateSupertrend(ohlcData, period = 10, multiplier = 3) {
    if (ohlcData.length < period) {
      return [];
    }

    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    const closes = ohlcData.map(d => d.close);
    
    // Calculate ATR
    const atr = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period
    });

    const supertrend = [];
    let trend = 1; // 1 for uptrend, -1 for downtrend
    
    for (let i = period - 1; i < ohlcData.length; i++) {
      const hl2 = (highs[i] + lows[i]) / 2;
      const atrValue = atr[i - period + 1];
      
      const upperBand = hl2 + (multiplier * atrValue);
      const lowerBand = hl2 - (multiplier * atrValue);
      
      let supertrendValue;
      
      if (i === period - 1) {
        // First calculation
        supertrendValue = lowerBand;
        trend = 1;
      } else {
        const prevSupertrend = supertrend[supertrend.length - 1];
        
        // Calculate basic upper and lower bands
        const basicUpper = upperBand;
        const basicLower = lowerBand;
        
        // Final upper and lower bands
        const finalUpper = basicUpper < prevSupertrend.upperBand || closes[i - 1] > prevSupertrend.upperBand 
          ? basicUpper 
          : prevSupertrend.upperBand;
          
        const finalLower = basicLower > prevSupertrend.lowerBand || closes[i - 1] < prevSupertrend.lowerBand 
          ? basicLower 
          : prevSupertrend.lowerBand;
        
        // Determine trend and supertrend value
        if (closes[i] <= finalLower) {
          trend = -1;
          supertrendValue = finalUpper;
        } else if (closes[i] >= finalUpper) {
          trend = 1;
          supertrendValue = finalLower;
        } else {
          trend = supertrend[supertrend.length - 1].trend;
          supertrendValue = trend === 1 ? finalLower : finalUpper;
        }
      }
      
      supertrend.push({
        value: supertrendValue,
        trend,
        upperBand,
        lowerBand,
        close: closes[i]
      });
    }
    
    return supertrend;
  }

  /**
   * Calculate Fibonacci Retracement Levels
   * @param {number} high - Swing high
   * @param {number} low - Swing low
   * @param {boolean} isUptrend - Direction of trend
   * @returns {Object} Fibonacci levels
   */
  static calculateFibonacci(high, low, isUptrend = true) {
    const difference = high - low;
    
    const levels = {
      '0%': isUptrend ? high : low,
      '23.6%': isUptrend ? high - (difference * 0.236) : low + (difference * 0.236),
      '38.2%': isUptrend ? high - (difference * 0.382) : low + (difference * 0.382),
      '50%': isUptrend ? high - (difference * 0.5) : low + (difference * 0.5),
      '61.8%': isUptrend ? high - (difference * 0.618) : low + (difference * 0.618),
      '78.6%': isUptrend ? high - (difference * 0.786) : low + (difference * 0.786),
      '100%': isUptrend ? low : high
    };
    
    return {
      levels,
      range: difference,
      direction: isUptrend ? 'UPTREND_RETRACEMENT' : 'DOWNTREND_RETRACEMENT'
    };
  }

  /**
   * Detect advanced chart patterns
   * @param {Array} ohlcData - OHLC data
   * @returns {Array} Detected patterns
   */
  static detectAdvancedPatterns(ohlcData) {
    const patterns = [];
    
    // Head and Shoulders detection
    const headShoulders = this.detectHeadAndShoulders(ohlcData);
    if (headShoulders.detected) {
      patterns.push(headShoulders);
    }
    
    // Triangle patterns
    const triangles = this.detectTriangles(ohlcData);
    if (triangles.detected) {
      patterns.push(triangles);
    }
    
    // Double Top/Bottom
    const doubleTopBottom = this.detectDoubleTopBottom(ohlcData);
    if (doubleTopBottom.detected) {
      patterns.push(doubleTopBottom);
    }
    
    // Wedge patterns
    const wedges = this.detectWedges(ohlcData);
    if (wedges.detected) {
      patterns.push(wedges);
    }
    
    return patterns;
  }

  /**
   * Detect Head and Shoulders pattern
   * @param {Array} ohlcData - OHLC data (last 50+ periods)
   * @returns {Object} Pattern detection result
   */
  static detectHeadAndShoulders(ohlcData) {
    if (ohlcData.length < 30) {
      return { detected: false, pattern: 'HEAD_AND_SHOULDERS' };
    }
    
    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    const closes = ohlcData.map(d => d.close);
    
    // Find potential peaks (simplified)
    const peaks = [];
    for (let i = 5; i < highs.length - 5; i++) {
      const isLocalHigh = highs.slice(i - 5, i).every(h => h < highs[i]) && 
                         highs.slice(i + 1, i + 6).every(h => h < highs[i]);
      if (isLocalHigh) {
        peaks.push({ index: i, price: highs[i] });
      }
    }
    
    // Need at least 3 peaks for head and shoulders
    if (peaks.length < 3) {
      return { detected: false, pattern: 'HEAD_AND_SHOULDERS' };
    }
    
    // Check for head and shoulders pattern (simplified)
    const lastThreePeaks = peaks.slice(-3);
    const [leftShoulder, head, rightShoulder] = lastThreePeaks;
    
    const isHeadAndShoulders = head.price > leftShoulder.price && 
                              head.price > rightShoulder.price &&
                              Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.05; // Similar shoulder heights
    
    if (isHeadAndShoulders) {
      // Calculate neckline (simplified)
      const necklinePrice = Math.min(
        Math.min(...lows.slice(leftShoulder.index, head.index)),
        Math.min(...lows.slice(head.index, rightShoulder.index))
      );
      
      return {
        detected: true,
        pattern: 'HEAD_AND_SHOULDERS',
        confidence: 0.7,
        peaks: lastThreePeaks,
        neckline: necklinePrice,
        target: necklinePrice - (head.price - necklinePrice), // Target below neckline
        signal: 'BEARISH',
        reasoning: 'Head and shoulders pattern detected - reversal signal'
      };
    }
    
    return { detected: false, pattern: 'HEAD_AND_SHOULDERS' };
  }

  /**
   * Detect Triangle patterns (Ascending, Descending, Symmetrical)
   * @param {Array} ohlcData - OHLC data
   * @returns {Object} Pattern detection result
   */
  static detectTriangles(ohlcData) {
    if (ohlcData.length < 20) {
      return { detected: false, pattern: 'TRIANGLE' };
    }
    
    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    
    // Get recent data for triangle analysis
    const recentData = ohlcData.slice(-20);
    const recentHighs = recentData.map(d => d.high);
    const recentLows = recentData.map(d => d.low);
    
    // Calculate trend lines (simplified)
    const maxHigh = Math.max(...recentHighs);
    const minLow = Math.min(...recentLows);
    const latestHigh = recentHighs[recentHighs.length - 1];
    const latestLow = recentLows[recentLows.length - 1];
    
    // Check for ascending triangle (horizontal resistance, rising support)
    const resistanceLevel = maxHigh;
    const supportSlope = (latestLow - recentLows[0]) / recentLows.length;
    const isAscending = supportSlope > 0 && 
                       recentHighs.filter(h => Math.abs(h - resistanceLevel) / resistanceLevel < 0.02).length >= 2;
    
    if (isAscending) {
      return {
        detected: true,
        pattern: 'ASCENDING_TRIANGLE',
        confidence: 0.75,
        resistance: resistanceLevel,
        support: latestLow,
        breakoutLevel: resistanceLevel * 1.01,
        target: resistanceLevel + (resistanceLevel - minLow) * 0.5,
        signal: 'BULLISH',
        reasoning: 'Ascending triangle - bullish continuation pattern'
      };
    }
    
    // Check for descending triangle (horizontal support, falling resistance)
    const supportLevel = minLow;
    const resistanceSlope = (latestHigh - recentHighs[0]) / recentHighs.length;
    const isDescending = resistanceSlope < 0 && 
                        recentLows.filter(l => Math.abs(l - supportLevel) / supportLevel < 0.02).length >= 2;
    
    if (isDescending) {
      return {
        detected: true,
        pattern: 'DESCENDING_TRIANGLE',
        confidence: 0.75,
        resistance: latestHigh,
        support: supportLevel,
        breakoutLevel: supportLevel * 0.99,
        target: supportLevel - (maxHigh - supportLevel) * 0.5,
        signal: 'BEARISH',
        reasoning: 'Descending triangle - bearish continuation pattern'
      };
    }
    
    return { detected: false, pattern: 'TRIANGLE' };
  }

  /**
   * Detect Double Top/Bottom patterns
   * @param {Array} ohlcData - OHLC data
   * @returns {Object} Pattern detection result
   */
  static detectDoubleTopBottom(ohlcData) {
    if (ohlcData.length < 25) {
      return { detected: false, pattern: 'DOUBLE_TOP_BOTTOM' };
    }
    
    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    
    // Find peaks and troughs
    const peaks = [];
    const troughs = [];
    
    for (let i = 3; i < ohlcData.length - 3; i++) {
      // Peak detection
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        peaks.push({ index: i, price: highs[i] });
      }
      
      // Trough detection
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        troughs.push({ index: i, price: lows[i] });
      }
    }
    
    // Check for double top
    if (peaks.length >= 2) {
      const lastTwoPeaks = peaks.slice(-2);
      const [firstPeak, secondPeak] = lastTwoPeaks;
      
      const pricesSimilar = Math.abs(firstPeak.price - secondPeak.price) / firstPeak.price < 0.03;
      const timeSpacedApart = secondPeak.index - firstPeak.index > 5;
      
      if (pricesSimilar && timeSpacedApart) {
        // Find valley between peaks
        const valleyData = ohlcData.slice(firstPeak.index, secondPeak.index + 1);
        const valleyLow = Math.min(...valleyData.map(d => d.low));
        
        return {
          detected: true,
          pattern: 'DOUBLE_TOP',
          confidence: 0.8,
          peaks: lastTwoPeaks,
          neckline: valleyLow,
          target: valleyLow - (firstPeak.price - valleyLow),
          signal: 'BEARISH',
          reasoning: 'Double top pattern - bearish reversal signal'
        };
      }
    }
    
    // Check for double bottom
    if (troughs.length >= 2) {
      const lastTwoTroughs = troughs.slice(-2);
      const [firstTrough, secondTrough] = lastTwoTroughs;
      
      const pricesSimilar = Math.abs(firstTrough.price - secondTrough.price) / firstTrough.price < 0.03;
      const timeSpacedApart = secondTrough.index - firstTrough.index > 5;
      
      if (pricesSimilar && timeSpacedApart) {
        // Find peak between troughs
        const peakData = ohlcData.slice(firstTrough.index, secondTrough.index + 1);
        const peakHigh = Math.max(...peakData.map(d => d.high));
        
        return {
          detected: true,
          pattern: 'DOUBLE_BOTTOM',
          confidence: 0.8,
          troughs: lastTwoTroughs,
          neckline: peakHigh,
          target: peakHigh + (peakHigh - firstTrough.price),
          signal: 'BULLISH',
          reasoning: 'Double bottom pattern - bullish reversal signal'
        };
      }
    }
    
    return { detected: false, pattern: 'DOUBLE_TOP_BOTTOM' };
  }

  /**
   * Detect Wedge patterns (Rising/Falling)
   * @param {Array} ohlcData - OHLC data
   * @returns {Object} Pattern detection result
   */
  static detectWedges(ohlcData) {
    if (ohlcData.length < 15) {
      return { detected: false, pattern: 'WEDGE' };
    }
    
    const recentData = ohlcData.slice(-15);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    
    // Calculate simple trend lines
    const firstHigh = highs[0];
    const lastHigh = highs[highs.length - 1];
    const firstLow = lows[0];
    const lastLow = lows[lows.length - 1];
    
    const highSlope = (lastHigh - firstHigh) / highs.length;
    const lowSlope = (lastLow - firstLow) / lows.length;
    
    // Rising wedge: both lines rising, but resistance rises slower
    const isRisingWedge = highSlope > 0 && lowSlope > 0 && lowSlope > highSlope;
    
    // Falling wedge: both lines falling, but support falls slower
    const isFallingWedge = highSlope < 0 && lowSlope < 0 && Math.abs(lowSlope) < Math.abs(highSlope);
    
    if (isRisingWedge) {
      return {
        detected: true,
        pattern: 'RISING_WEDGE',
        confidence: 0.65,
        signal: 'BEARISH',
        reasoning: 'Rising wedge - bearish reversal pattern'
      };
    }
    
    if (isFallingWedge) {
      return {
        detected: true,
        pattern: 'FALLING_WEDGE',
        confidence: 0.65,
        signal: 'BULLISH',
        reasoning: 'Falling wedge - bullish reversal pattern'
      };
    }
    
    return { detected: false, pattern: 'WEDGE' };
  }

  /**
   * Analyze volume profile
   * @param {Array} ohlcData - OHLC data with volume
   * @returns {Object} Volume analysis
   */
  static analyzeVolumeProfile(ohlcData) {
    if (ohlcData.length < 20) {
      return { analysis: 'insufficient_data' };
    }
    
    const volumes = ohlcData.map(d => d.volume || 0);
    const closes = ohlcData.map(d => d.close);
    
    // Calculate average volume
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    const recentVolume = _.last(volumes);
    
    // Volume trend analysis
    const recent10Vol = volumes.slice(-10);
    const previous10Vol = volumes.slice(-20, -10);
    const recentAvg = recent10Vol.reduce((a, b) => a + b) / recent10Vol.length;
    const previousAvg = previous10Vol.reduce((a, b) => a + b) / previous10Vol.length;
    
    const volumeTrend = recentAvg > previousAvg ? 'INCREASING' : 'DECREASING';
    
    // Price-Volume relationship
    const priceVolCorrelation = this.calculatePriceVolumeCorrelation(closes.slice(-20), volumes.slice(-20));
    
    return {
      avgVolume,
      recentVolume,
      volumeRatio: recentVolume / avgVolume,
      volumeTrend,
      priceVolCorrelation,
      analysis: this.interpretVolumeAnalysis(recentVolume / avgVolume, volumeTrend, priceVolCorrelation)
    };
  }

  /**
   * Calculate price-volume correlation
   * @param {Array} prices - Price data
   * @param {Array} volumes - Volume data
   * @returns {number} Correlation coefficient
   */
  static calculatePriceVolumeCorrelation(prices, volumes) {
    if (prices.length !== volumes.length || prices.length < 2) {
      return 0;
    }
    
    const n = prices.length;
    const priceChanges = prices.slice(1).map((price, i) => price - prices[i]);
    const volChanges = volumes.slice(1).map((vol, i) => vol - volumes[i]);
    
    if (priceChanges.length === 0) return 0;
    
    const meanPriceChange = priceChanges.reduce((a, b) => a + b) / priceChanges.length;
    const meanVolChange = volChanges.reduce((a, b) => a + b) / volChanges.length;
    
    let numerator = 0;
    let denomPriceSum = 0;
    let denomVolSum = 0;
    
    for (let i = 0; i < priceChanges.length; i++) {
      const priceDiff = priceChanges[i] - meanPriceChange;
      const volDiff = volChanges[i] - meanVolChange;
      
      numerator += priceDiff * volDiff;
      denomPriceSum += priceDiff * priceDiff;
      denomVolSum += volDiff * volDiff;
    }
    
    const denominator = Math.sqrt(denomPriceSum * denomVolSum);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Interpret volume analysis
   * @param {number} volumeRatio - Current volume vs average
   * @param {string} volumeTrend - Volume trend direction
   * @param {number} correlation - Price-volume correlation
   * @returns {string} Volume interpretation
   */
  static interpretVolumeAnalysis(volumeRatio, volumeTrend, correlation) {
    if (volumeRatio > 2.0 && correlation > 0.5) {
      return 'STRONG_BULLISH_VOLUME';
    } else if (volumeRatio > 2.0 && correlation < -0.5) {
      return 'STRONG_BEARISH_VOLUME';
    } else if (volumeRatio > 1.5) {
      return 'ELEVATED_VOLUME';
    } else if (volumeRatio < 0.5) {
      return 'LOW_VOLUME';
    } else if (volumeTrend === 'INCREASING') {
      return 'BUILDING_VOLUME';
    } else {
      return 'NORMAL_VOLUME';
    }
  }
}

module.exports = AdvancedPatterns;
