/**
 * MARKET REGIME DETECTOR
 * Dynamically adjusts thresholds based on market conditions
 */

class MarketRegimeDetector {
  constructor() {
    this.regimes = {
      BULL_STRONG: {
        name: 'Strong Bull Market',
        description: 'Rising markets, high momentum, low volatility',
        thresholds: {
          minervini: {
            criterion6: 70, // Relative Strength
            criterion7: 1.5, // Volume expansion
            criterion8: 60, // Fundamental proxy
            gradeForBuy: 'B' // B grade sufficient
          },
          institutional: {
            weeklyMomentum: 8,
            accumulationRatio: 0.65,
            correlationThreshold: 0.3,
            winRatio: 0.6,
            gradeForBuy: 'B'
          }
        }
      },
      
      BULL_WEAK: {
        name: 'Weak Bull Market', 
        description: 'Choppy uptrend, mixed signals',
        thresholds: {
          minervini: {
            criterion6: 60,
            criterion7: 1.3,
            criterion8: 50,
            gradeForBuy: 'B+'
          },
          institutional: {
            weeklyMomentum: 6,
            accumulationRatio: 0.60,
            correlationThreshold: 0.25,
            winRatio: 0.55,
            gradeForBuy: 'B+'
          }
        }
      },

      SIDEWAYS: {
        name: 'Sideways/Range-bound',
        description: 'No clear trend, high selectivity needed',
        thresholds: {
          minervini: {
            criterion6: 50, // Current relaxed level
            criterion7: 1.1,
            criterion8: 40,
            gradeForBuy: 'A-' // Higher grade required
          },
          institutional: {
            weeklyMomentum: 4,
            accumulationRatio: 0.55,
            correlationThreshold: 0.2,
            winRatio: 0.5,
            gradeForBuy: 'A-'
          }
        }
      },

      BEAR_WEAK: {
        name: 'Weak Bear Market',
        description: 'Declining but with bounces',
        thresholds: {
          minervini: {
            criterion6: 75, // Much higher standards
            criterion7: 1.8,
            criterion8: 70,
            gradeForBuy: 'A+' // Only A+ trades
          },
          institutional: {
            weeklyMomentum: 10,
            accumulationRatio: 0.70,
            correlationThreshold: 0.4,
            winRatio: 0.65,
            gradeForBuy: 'A+'
          }
        }
      },

      BEAR_STRONG: {
        name: 'Strong Bear Market',
        description: 'Major decline, avoid most trades',
        thresholds: {
          minervini: {
            criterion6: 85, // Extreme selectivity
            criterion7: 2.0,
            criterion8: 80,
            gradeForBuy: 'A++' // Practically no trades
          },
          institutional: {
            weeklyMomentum: 15,
            accumulationRatio: 0.80,
            correlationThreshold: 0.5,
            winRatio: 0.75,
            gradeForBuy: 'A++'
          }
        }
      }
    };
  }

  /**
   * Detect current market regime based on S&P 500 data
   */
  async detectMarketRegime(marketData) {
    try {
      const analysis = this.analyzeMarketConditions(marketData);
      
      console.log('📊 MARKET REGIME ANALYSIS:');
      console.log(`📈 Trend Score: ${analysis.trendScore}/100`);
      console.log(`💨 Momentum Score: ${analysis.momentumScore}/100`); 
      console.log(`📊 Volatility Score: ${analysis.volatilityScore}/100`);
      console.log(`🎯 Breadth Score: ${analysis.breadthScore}/100`);
      
      const regime = this.classifyRegime(analysis);
      console.log(`\n🏛️ DETECTED REGIME: ${regime.name}`);
      console.log(`📝 Description: ${regime.description}`);
      
      return regime;
      
    } catch (error) {
      console.error('⚠️ Market regime detection failed, using SIDEWAYS default');
      return this.regimes.SIDEWAYS;
    }
  }

  analyzeMarketConditions(marketData) {
    // Simplified market analysis
    const sma20 = this.calculateSMA(marketData, 20);
    const sma50 = this.calculateSMA(marketData, 50);
    const sma200 = this.calculateSMA(marketData, 200);
    const currentPrice = marketData[marketData.length - 1].close;
    
    // Trend Analysis (0-100)
    let trendScore = 50; // Neutral
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) {
      trendScore = 85; // Strong uptrend
    } else if (currentPrice > sma20 && sma20 > sma50) {
      trendScore = 70; // Moderate uptrend
    } else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) {
      trendScore = 15; // Strong downtrend
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trendScore = 30; // Moderate downtrend
    }
    
    // Momentum Analysis (0-100)
    const momentum20Day = (currentPrice - marketData[marketData.length - 21].close) / marketData[marketData.length - 21].close;
    const momentumScore = Math.max(0, Math.min(100, 50 + (momentum20Day * 200)));
    
    // Volatility Analysis (0-100) - Lower is better for bull markets
    const volatility = this.calculateVolatility(marketData, 20);
    const volatilityScore = Math.max(0, Math.min(100, 100 - (volatility * 500)));
    
    // Breadth proxy (simplified)
    const breadthScore = (trendScore + momentumScore) / 2;
    
    return {
      trendScore: Math.round(trendScore),
      momentumScore: Math.round(momentumScore),
      volatilityScore: Math.round(volatilityScore),
      breadthScore: Math.round(breadthScore)
    };
  }

  classifyRegime(analysis) {
    const { trendScore, momentumScore, volatilityScore, breadthScore } = analysis;
    const overallScore = (trendScore + momentumScore + volatilityScore + breadthScore) / 4;
    
    if (overallScore >= 75 && trendScore >= 70) {
      return this.regimes.BULL_STRONG;
    } else if (overallScore >= 60 && trendScore >= 55) {
      return this.regimes.BULL_WEAK;
    } else if (overallScore <= 25 && trendScore <= 30) {
      return this.regimes.BEAR_STRONG;
    } else if (overallScore <= 40 && trendScore <= 45) {
      return this.regimes.BEAR_WEAK;
    } else {
      return this.regimes.SIDEWAYS;
    }
  }

  calculateSMA(data, period) {
    if (data.length < period) return data[data.length - 1].close;
    const slice = data.slice(-period);
    return slice.reduce((sum, item) => sum + item.close, 0) / period;
  }

  calculateVolatility(data, period) {
    if (data.length < period) return 0.02; // Default 2%
    
    const returns = [];
    for (let i = data.length - period; i < data.length - 1; i++) {
      returns.push((data[i + 1].close - data[i].close) / data[i].close);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Get expected signal distribution for current regime
   */
  getExpectedSignalDistribution(regime) {
    const distributions = {
      BULL_STRONG: { buy: 45, watch: 35, avoid: 20 },
      BULL_WEAK: { buy: 35, watch: 40, avoid: 25 },
      SIDEWAYS: { buy: 25, watch: 35, avoid: 40 },
      BEAR_WEAK: { buy: 15, watch: 25, avoid: 60 },
      BEAR_STRONG: { buy: 5, watch: 15, avoid: 80 }
    };
    
    return distributions[regime.name.replace(/\s+/g, '_').toUpperCase()] || distributions.SIDEWAYS;
  }
}

module.exports = { MarketRegimeDetector };
