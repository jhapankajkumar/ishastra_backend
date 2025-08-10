const yahooFinance = require('yahoo-finance2').default;
const AdvancedTechnicalAnalysis = require('./advancedTechnicalAnalysis');
const AdvancedPatterns = require('./advancedPatterns');
const _ = require('lodash');

/**
 * Multi-Timeframe Analysis for Phase 2
 * Confluence scoring across different timeframes
 */

class MultiTimeframeAnalysis {
  
  /**
   * Perform comprehensive multi-timeframe analysis
   * @param {string} symbol - Stock symbol
   * @param {Array} timeframes - Array of timeframes ['1d', '1wk', '1mo']
   * @returns {Object} Multi-timeframe analysis results
   */
  static async analyzeMultipleTimeframes(symbol, timeframes = ['1d', '1wk']) {
    const results = {};
    const confluenceScores = {};
    
    try {
      // Analyze each timeframe
      for (const timeframe of timeframes) {
        console.log(`📊 Analyzing ${symbol} on ${timeframe} timeframe...`);
        
        const period = this.getPeriodForTimeframe(timeframe);
        const historicalData = await yahooFinance.historical(symbol, {
          period1: period.start,
          period2: period.end,
          interval: timeframe
        });
        
        if (historicalData && historicalData.length > 50) {
          // Basic technical analysis
          const analysis = await AdvancedTechnicalAnalysis.analyzeStock(historicalData, symbol);
          
          // Advanced patterns
          const patterns = AdvancedPatterns.detectAdvancedPatterns(historicalData);
          
          // Supertrend analysis
          const supertrend = AdvancedPatterns.calculateSupertrend(historicalData);
          
          // Fibonacci analysis
          const recentHigh = Math.max(...historicalData.slice(-30).map(d => d.high));
          const recentLow = Math.min(...historicalData.slice(-30).map(d => d.low));
          const fibonacci = AdvancedPatterns.calculateFibonacci(recentHigh, recentLow, true);
          
          // Volume analysis
          const volumeAnalysis = AdvancedPatterns.analyzeVolumeProfile(historicalData);
          
          results[timeframe] = {
            ...analysis,
            advancedPatterns: patterns,
            supertrend: _.last(supertrend),
            fibonacci,
            volumeAnalysis,
            dataPoints: historicalData.length
          };
          
          // Calculate confluence score for this timeframe
          confluenceScores[timeframe] = this.calculateConfluenceScore(results[timeframe]);
        }
      }
      
      // Calculate overall confluence
      const overallConfluence = this.calculateOverallConfluence(confluenceScores);
      
      // Generate multi-timeframe recommendation
      const recommendation = this.generateMultiTimeframeRecommendation(results, overallConfluence);
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        timeframes: results,
        confluenceScores,
        overallConfluence,
        recommendation,
        analysis: 'MULTI_TIMEFRAME_COMPLETE'
      };
      
    } catch (error) {
      console.error('Error in multi-timeframe analysis:', error);
      throw error;
    }
  }

  /**
   * Get appropriate period for timeframe
   * @param {string} timeframe - Timeframe (1d, 1wk, 1mo)
   * @returns {Object} Start and end dates
   */
  static getPeriodForTimeframe(timeframe) {
    const now = new Date();
    const periods = {
      '1d': {
        start: new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000)), // 6 months
        end: now
      },
      '1wk': {
        start: new Date(now.getTime() - (2 * 365 * 24 * 60 * 60 * 1000)), // 2 years
        end: now
      },
      '1mo': {
        start: new Date(now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000)), // 5 years
        end: now
      }
    };
    
    return periods[timeframe] || periods['1d'];
  }

  /**
   * Calculate confluence score for a single timeframe
   * @param {Object} analysis - Analysis results for timeframe
   * @returns {Object} Confluence score breakdown
   */
  static calculateConfluenceScore(analysis) {
    let score = 0;
    const factors = [];
    
    // Technical indicators confluence
    const { latest } = analysis.technicalIndicators;
    
    // EMA alignment (20 points)
    if (latest.ema12 > latest.ema26 && latest.ema26 > latest.ema50) {
      score += 20;
      factors.push('Bullish EMA alignment (+20)');
    } else if (latest.ema12 < latest.ema26 && latest.ema26 < latest.ema50) {
      score -= 20;
      factors.push('Bearish EMA alignment (-20)');
    }
    
    // RSI analysis (15 points)
    if (latest.rsi > 40 && latest.rsi < 70) {
      score += 15;
      factors.push('RSI in bullish zone (+15)');
    } else if (latest.rsi < 30) {
      score += 10; // Oversold can be bullish
      factors.push('RSI oversold - potential bounce (+10)');
    } else if (latest.rsi > 70) {
      score -= 10;
      factors.push('RSI overbought (-10)');
    }
    
    // MACD analysis (15 points)
    if (latest.macd && latest.macd.histogram > 0) {
      score += 15;
      factors.push('MACD bullish divergence (+15)');
    } else if (latest.macd && latest.macd.histogram < 0) {
      score -= 15;
      factors.push('MACD bearish divergence (-15)');
    }
    
    // Supertrend analysis (20 points)
    if (analysis.supertrend && analysis.supertrend.trend === 1) {
      score += 20;
      factors.push('Supertrend bullish (+20)');
    } else if (analysis.supertrend && analysis.supertrend.trend === -1) {
      score -= 20;
      factors.push('Supertrend bearish (-20)');
    }
    
    // Core systems analysis (30 points)
    const systemSignals = Object.values(analysis.signals.systems);
    const bullishSystems = systemSignals.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length;
    const bearishSystems = systemSignals.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL').length;
    
    if (bullishSystems >= 3) {
      score += 30;
      factors.push(`${bullishSystems} bullish systems (+30)`);
    } else if (bullishSystems >= 2) {
      score += 15;
      factors.push(`${bullishSystems} bullish systems (+15)`);
    } else if (bearishSystems >= 2) {
      score -= 20;
      factors.push(`${bearishSystems} bearish systems (-20)`);
    }
    
    // Advanced patterns (15 points)
    if (analysis.advancedPatterns && analysis.advancedPatterns.length > 0) {
      analysis.advancedPatterns.forEach(pattern => {
        if (pattern.signal === 'BULLISH') {
          score += 15;
          factors.push(`${pattern.pattern} bullish (+15)`);
        } else if (pattern.signal === 'BEARISH') {
          score -= 15;
          factors.push(`${pattern.pattern} bearish (-15)`);
        }
      });
    }
    
    // Volume analysis (10 points)
    if (analysis.volumeAnalysis) {
      const volAnalysis = analysis.volumeAnalysis.analysis;
      if (volAnalysis === 'STRONG_BULLISH_VOLUME') {
        score += 10;
        factors.push('Strong bullish volume (+10)');
      } else if (volAnalysis === 'ELEVATED_VOLUME') {
        score += 5;
        factors.push('Elevated volume (+5)');
      } else if (volAnalysis === 'LOW_VOLUME') {
        score -= 5;
        factors.push('Low volume concern (-5)');
      }
    }
    
    // Normalize score to 0-100
    const normalizedScore = Math.max(0, Math.min(100, score + 50));
    
    return {
      score: normalizedScore,
      rawScore: score,
      factors,
      interpretation: this.interpretConfluenceScore(normalizedScore)
    };
  }

  /**
   * Calculate overall confluence across timeframes
   * @param {Object} confluenceScores - Scores for each timeframe
   * @returns {Object} Overall confluence analysis
   */
  static calculateOverallConfluence(confluenceScores) {
    const timeframes = Object.keys(confluenceScores);
    if (timeframes.length === 0) {
      return { score: 50, interpretation: 'NO_DATA' };
    }
    
    // Weight different timeframes
    const weights = {
      '1d': 0.4,   // Daily - 40% weight
      '1wk': 0.6,  // Weekly - 60% weight (more important for swing trading)
      '1mo': 0.8   // Monthly - 80% weight if available
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    const agreements = [];
    
    timeframes.forEach(tf => {
      const weight = weights[tf] || 0.4;
      const score = confluenceScores[tf].score;
      
      weightedScore += score * weight;
      totalWeight += weight;
      
      agreements.push({
        timeframe: tf,
        score,
        interpretation: confluenceScores[tf].interpretation
      });
    });
    
    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 50;
    
    // Check for timeframe agreement
    const bullishTimeframes = timeframes.filter(tf => confluenceScores[tf].score > 60).length;
    const bearishTimeframes = timeframes.filter(tf => confluenceScores[tf].score < 40).length;
    
    let agreement = 'MIXED';
    if (bullishTimeframes === timeframes.length) {
      agreement = 'STRONG_BULLISH_CONSENSUS';
    } else if (bearishTimeframes === timeframes.length) {
      agreement = 'STRONG_BEARISH_CONSENSUS';
    } else if (bullishTimeframes > bearishTimeframes) {
      agreement = 'BULLISH_MAJORITY';
    } else if (bearishTimeframes > bullishTimeframes) {
      agreement = 'BEARISH_MAJORITY';
    }
    
    return {
      score: Math.round(finalScore),
      interpretation: this.interpretConfluenceScore(finalScore),
      agreement,
      timeframeBreakdown: agreements,
      confidence: this.calculateConfidenceLevel(finalScore, agreement)
    };
  }

  /**
   * Interpret confluence score
   * @param {number} score - Confluence score (0-100)
   * @returns {string} Interpretation
   */
  static interpretConfluenceScore(score) {
    if (score >= 80) return 'VERY_BULLISH';
    if (score >= 65) return 'BULLISH';
    if (score >= 55) return 'MILDLY_BULLISH';
    if (score >= 45) return 'NEUTRAL';
    if (score >= 35) return 'MILDLY_BEARISH';
    if (score >= 20) return 'BEARISH';
    return 'VERY_BEARISH';
  }

  /**
   * Calculate confidence level
   * @param {number} score - Overall score
   * @param {string} agreement - Timeframe agreement
   * @returns {number} Confidence percentage
   */
  static calculateConfidenceLevel(score, agreement) {
    let baseConfidence = Math.abs(score - 50) * 2; // Distance from neutral
    
    // Boost confidence based on timeframe agreement
    const agreementBoost = {
      'STRONG_BULLISH_CONSENSUS': 20,
      'STRONG_BEARISH_CONSENSUS': 20,
      'BULLISH_MAJORITY': 10,
      'BEARISH_MAJORITY': 10,
      'MIXED': -10
    };
    
    const confidence = Math.min(95, baseConfidence + (agreementBoost[agreement] || 0));
    return Math.round(confidence);
  }

  /**
   * Generate multi-timeframe recommendation
   * @param {Object} results - Analysis results for all timeframes
   * @param {Object} confluence - Overall confluence analysis
   * @returns {Object} Trading recommendation
   */
  static generateMultiTimeframeRecommendation(results, confluence) {
    const { score, interpretation, agreement, confidence } = confluence;
    
    // Determine action based on confluence
    let action = 'NEUTRAL';
    let reasoning = [];
    
    if (score >= 70 && confidence >= 70) {
      action = 'STRONG_BUY';
      reasoning.push('High confluence across timeframes supports strong buy signal');
    } else if (score >= 60) {
      action = 'BUY';
      reasoning.push('Positive confluence suggests buying opportunity');
    } else if (score <= 30 && confidence >= 70) {
      action = 'STRONG_SELL';
      reasoning.push('High confluence across timeframes supports strong sell signal');
    } else if (score <= 40) {
      action = 'SELL';
      reasoning.push('Negative confluence suggests selling opportunity');
    } else {
      action = 'HOLD';
      reasoning.push('Mixed signals across timeframes suggest holding position');
    }
    
    // Add specific timeframe insights
    Object.entries(results).forEach(([timeframe, data]) => {
      const tfScore = confluence.timeframeBreakdown.find(tf => tf.timeframe === timeframe)?.score || 50;
      if (tfScore > 65) {
        reasoning.push(`${timeframe} timeframe shows bullish setup`);
      } else if (tfScore < 35) {
        reasoning.push(`${timeframe} timeframe shows bearish setup`);
      }
    });
    
    // Calculate position sizing based on confidence
    let positionSize = 'NORMAL';
    if (confidence >= 85 && (action === 'STRONG_BUY' || action === 'STRONG_SELL')) {
      positionSize = 'LARGE';
    } else if (confidence >= 70 && (action === 'BUY' || action === 'SELL')) {
      positionSize = 'NORMAL';
    } else if (confidence < 60) {
      positionSize = 'SMALL';
    }
    
    return {
      action,
      confidence,
      confluenceScore: score,
      interpretation,
      agreement,
      positionSize,
      reasoning,
      riskLevel: this.calculateRiskLevel(action, confidence, agreement)
    };
  }

  /**
   * Calculate risk level
   * @param {string} action - Trading action
   * @param {number} confidence - Confidence level
   * @param {string} agreement - Timeframe agreement
   * @returns {string} Risk level
   */
  static calculateRiskLevel(action, confidence, agreement) {
    if (action === 'HOLD' || action === 'NEUTRAL') {
      return 'LOW';
    }
    
    if (confidence >= 80 && agreement.includes('CONSENSUS')) {
      return 'LOW';
    } else if (confidence >= 60 && !agreement.includes('MIXED')) {
      return 'MODERATE';
    } else {
      return 'HIGH';
    }
  }
}

module.exports = MultiTimeframeAnalysis;
