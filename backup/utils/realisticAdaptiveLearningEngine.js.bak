/**
 * 🎯 REALISTIC ADAPTIVE LEARNING ENGINE
 * Market regime detection and strategy adaptation using ACHIEVABLE methods
 * 
 * ✅ ACHIEVABLE FEATURES:
 * - Statistical market regime detection using volatility and trend metrics
 * - Simple multi-armed bandit strategy selection
 * - Performance tracking and strategy weight adjustment
 * - Basic concept drift detection using statistical tests
 * - Strategy ensemble with dynamic weighting
 * 
 * ⚠️ HONEST LIMITATIONS:
 * - No complex reinforcement learning (requires extensive training data)
 * - No deep learning meta-learning (too complex for individual trader)
 * - Simple statistical models (not advanced ML)
 * - Basic regime detection (not sophisticated AI)
 * - Performance tracking only (not predictive learning)
 */

class RealisticAdaptiveLearningEngine {
  constructor() {
    // Simple strategy performance tracking
    this.strategyPerformance = new Map();
    this.currentRegime = 'UNKNOWN';
    this.regimeHistory = [];
    this.performanceWindow = 60; // 60 days of performance tracking
    
    // Strategy weights (starts equal, adapts based on performance)
    this.strategyWeights = {
      momentum: 0.33,
      meanReversion: 0.33,
      breakout: 0.34
    };
    
    // Market regime thresholds
    this.regimeThresholds = {
      highVolatility: 0.02,    // 2% daily volatility threshold
      trendThreshold: 0.05,    // 5% trend strength threshold
      volumeThreshold: 1.5     // Volume ratio threshold
    };
    
    this.initializeRealisticLearning();
  }

  async initializeRealisticLearning() {
    //console.log('🎯 Initializing Realistic Adaptive Learning Engine...');
    
    try {
      // Initialize strategy performance tracking
      this.setupStrategyTracking();
      
      // Initialize market regime detection
      this.setupRegimeDetection();
      
      //console.log('✅ Realistic Adaptive Learning Engine Ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize Adaptive Learning Engine:', error.message);
    }
  }

  setupStrategyTracking() {
    // Initialize performance tracking for each strategy
    const strategies = ['momentum', 'meanReversion', 'breakout'];
    
    strategies.forEach(strategy => {
      this.strategyPerformance.set(strategy, {
        trades: [],
        winRate: 0,
        avgReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        recentPerformance: []
      });
    });
  }

  setupRegimeDetection() {
    // Simple regime detection using statistical measures
    this.regimeDetector = {
      detectVolatilityRegime: (ohlcData) => {
        if (!ohlcData || ohlcData.length < 20) return 'UNKNOWN';
        
        // Calculate 20-day volatility
        const returns = [];
        for (let i = 1; i < Math.min(ohlcData.length, 21); i++) {
          const return_ = (ohlcData[i].close - ohlcData[i-1].close) / ohlcData[i-1].close;
          returns.push(return_);
        }
        
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance * 252); // Annualized
        
        return volatility > this.regimeThresholds.highVolatility ? 'HIGH_VOLATILITY' : 'LOW_VOLATILITY';
      },
      
      detectTrendRegime: (ohlcData) => {
        if (!ohlcData || ohlcData.length < 20) return 'SIDEWAYS';
        
        const current = ohlcData[ohlcData.length - 1].close;
        const sma20 = ohlcData.slice(-20).reduce((sum, bar) => sum + bar.close, 0) / 20;
        
        const trendStrength = (current - sma20) / sma20;
        
        if (trendStrength > this.regimeThresholds.trendThreshold) return 'UPTREND';
        if (trendStrength < -this.regimeThresholds.trendThreshold) return 'DOWNTREND';
        return 'SIDEWAYS';
      }
    };
  }

  /**
   * 🎯 REALISTIC MARKET REGIME DETECTION
   * Uses simple but effective statistical measures
   */
  async detectMarketRegime(ohlcData) {
    //console.log('🎯 Detecting market regime...');
    
    const regimeAnalysis = {
      primaryRegime: 'UNKNOWN',
      confidence: 0.5,
      volatilityRegime: 'NORMAL',
      trendRegime: 'SIDEWAYS',
      regimeStrength: 0.5,
      regimeStability: 'STABLE'
    };

    try {
      if (!ohlcData || ohlcData.length < 20) {
        return regimeAnalysis;
      }

      // Detect volatility regime
      regimeAnalysis.volatilityRegime = this.regimeDetector.detectVolatilityRegime(ohlcData);
      
      // Detect trend regime
      regimeAnalysis.trendRegime = this.regimeDetector.detectTrendRegime(ohlcData);
      
      // Combine into primary regime
      if (regimeAnalysis.volatilityRegime === 'HIGH_VOLATILITY') {
        regimeAnalysis.primaryRegime = 'HIGH_VOLATILITY';
        regimeAnalysis.confidence = 0.8;
      } else if (regimeAnalysis.trendRegime === 'UPTREND') {
        regimeAnalysis.primaryRegime = 'BULL_TRENDING';
        regimeAnalysis.confidence = 0.7;
      } else if (regimeAnalysis.trendRegime === 'DOWNTREND') {
        regimeAnalysis.primaryRegime = 'BEAR_TRENDING';
        regimeAnalysis.confidence = 0.7;
      } else {
        regimeAnalysis.primaryRegime = 'SIDEWAYS_RANGE';
        regimeAnalysis.confidence = 0.6;
      }

      // Check regime stability
      regimeAnalysis.regimeStability = this.assessRegimeStability(regimeAnalysis.primaryRegime);
      
      // Update regime history
      this.updateRegimeHistory(regimeAnalysis);

      return regimeAnalysis;

    } catch (error) {
      console.error('❌ Market Regime Detection failed:', error.message);
      return regimeAnalysis;
    }
  }

  /**
   * 🎲 SIMPLE MULTI-ARMED BANDIT STRATEGY SELECTION
   * Achievable strategy optimization using UCB1 algorithm
   */
  selectOptimalStrategy(currentRegime) {
    //console.log(`🎲 Selecting optimal strategy for ${currentRegime.primaryRegime} regime...`);

    const strategySelection = {
      selectedStrategy: 'momentum',
      confidence: 0.5,
      expectedPerformance: 0,
      allWeights: { ...this.strategyWeights },
      rationale: 'Equal weighting default'
    };

    try {
      // UCB1 Multi-Armed Bandit algorithm
      const strategies = Object.keys(this.strategyWeights);
      let bestStrategy = strategies[0];
      let bestScore = -Infinity;

      const totalTrades = this.getTotalTrades();
      
      strategies.forEach(strategy => {
        const performance = this.strategyPerformance.get(strategy);
        const strategyTrades = performance.trades.length;
        
        if (strategyTrades === 0) {
          // Exploration: give untested strategies high priority
          const explorationBonus = Math.sqrt(2 * Math.log(totalTrades + 1) / 1);
          const ucb1Score = 0.5 + explorationBonus; // Neutral performance + exploration
          
          if (ucb1Score > bestScore) {
            bestScore = ucb1Score;
            bestStrategy = strategy;
            strategySelection.rationale = 'Exploration of untested strategy';
          }
        } else {
          // UCB1 formula: average_reward + sqrt(2 * ln(total_trials) / strategy_trials)
          const avgReward = performance.avgReturn;
          const explorationBonus = Math.sqrt(2 * Math.log(totalTrades) / strategyTrades);
          const ucb1Score = avgReward + explorationBonus;
          
          if (ucb1Score > bestScore) {
            bestScore = ucb1Score;
            bestStrategy = strategy;
            strategySelection.rationale = `Best UCB1 score: ${ucb1Score.toFixed(3)}`;
          }
        }
      });

      strategySelection.selectedStrategy = bestStrategy;
      strategySelection.confidence = Math.min(bestScore, 0.9);
      
      // Apply regime-based adjustments
      strategySelection = this.applyRegimeAdjustments(strategySelection, currentRegime);

      return strategySelection;

    } catch (error) {
      console.error('❌ Strategy Selection failed:', error.message);
      return strategySelection;
    }
  }

  /**
   * 📊 PERFORMANCE TRACKING AND ADAPTATION
   * Updates strategy performance and adjusts weights
   */
  updateStrategyPerformance(strategy, outcome, marketConditions) {
    try {
      const performance = this.strategyPerformance.get(strategy);
      if (!performance) return;

      // Add new trade outcome
      performance.trades.push({
        outcome: outcome,
        date: new Date(),
        marketConditions: marketConditions
      });

      // Keep only recent trades for performance calculation
      if (performance.trades.length > this.performanceWindow) {
        performance.trades = performance.trades.slice(-this.performanceWindow);
      }

      // Recalculate performance metrics
      this.recalculatePerformanceMetrics(strategy);
      
      // Update strategy weights based on performance
      this.updateStrategyWeights();

    } catch (error) {
      console.error('❌ Performance update failed:', error.message);
    }
  }

  recalculatePerformanceMetrics(strategy) {
    const performance = this.strategyPerformance.get(strategy);
    const trades = performance.trades;
    
    if (trades.length === 0) return;

    // Calculate win rate
    const wins = trades.filter(trade => trade.outcome > 0).length;
    performance.winRate = wins / trades.length;

    // Calculate average return
    performance.avgReturn = trades.reduce((sum, trade) => sum + trade.outcome, 0) / trades.length;

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(trade => trade.outcome);
    const stdDev = this.calculateStandardDeviation(returns);
    performance.sharpeRatio = stdDev > 0 ? performance.avgReturn / stdDev : 0;

    // Update recent performance (last 20 trades)
    performance.recentPerformance = trades.slice(-20).map(trade => trade.outcome);
  }

  updateStrategyWeights() {
    // Update weights based on recent performance
    const strategies = Object.keys(this.strategyWeights);
    const performanceScores = {};
    let totalScore = 0;

    strategies.forEach(strategy => {
      const performance = this.strategyPerformance.get(strategy);
      
      // Combine multiple performance factors
      let score = 0.33; // Base score
      
      if (performance.trades.length > 10) {
        score = Math.max(0.1, Math.min(0.9, 
          0.4 * performance.winRate + 
          0.4 * Math.max(0, performance.avgReturn) + 
          0.2 * Math.max(0, performance.sharpeRatio * 0.5)
        ));
      }
      
      performanceScores[strategy] = score;
      totalScore += score;
    });

    // Normalize weights
    if (totalScore > 0) {
      strategies.forEach(strategy => {
        this.strategyWeights[strategy] = performanceScores[strategy] / totalScore;
      });
    }
  }

  /**
   * 🎯 CONCEPT DRIFT DETECTION
   * Simple but effective drift detection using recent performance
   */
  detectConceptDrift() {
    const driftAnalysis = {
      driftDetected: false,
      driftType: 'NONE',
      driftMagnitude: 0,
      affectedStrategies: [],
      confidence: 0
    };

    try {
      const strategies = Object.keys(this.strategyWeights);
      
      strategies.forEach(strategy => {
        const performance = this.strategyPerformance.get(strategy);
        
        if (performance.trades.length > 30) {
          // Compare recent vs historical performance
          const recentTrades = performance.trades.slice(-10);
          const historicalTrades = performance.trades.slice(-30, -10);
          
          const recentAvg = recentTrades.reduce((sum, t) => sum + t.outcome, 0) / recentTrades.length;
          const historicalAvg = historicalTrades.reduce((sum, t) => sum + t.outcome, 0) / historicalTrades.length;
          
          const performanceChange = Math.abs(recentAvg - historicalAvg);
          
          if (performanceChange > 0.1) { // 10% performance change threshold
            driftAnalysis.driftDetected = true;
            driftAnalysis.affectedStrategies.push(strategy);
            driftAnalysis.driftMagnitude = Math.max(driftAnalysis.driftMagnitude, performanceChange);
          }
        }
      });

      if (driftAnalysis.driftDetected) {
        driftAnalysis.driftType = 'PERFORMANCE_DRIFT';
        driftAnalysis.confidence = Math.min(driftAnalysis.driftMagnitude * 2, 0.9);
      }

      return driftAnalysis;

    } catch (error) {
      console.error('❌ Concept Drift Detection failed:', error.message);
      return driftAnalysis;
    }
  }

  /**
   * 📋 MAIN ADAPTIVE ANALYSIS ENTRY POINT
   */
  async adaptiveAnalysis(marketData, currentPrediction, actualOutcome = null) {
    const startTime = performance.now();
    
    //console.log('🎯 Running Realistic Adaptive Analysis...');
    
    const adaptiveResult = {
      enhancedPrediction: currentPrediction,
      modelConfidence: currentPrediction.confidence || 0.5,
      adaptationActions: [],
      regimeDetection: null,
      strategyWeights: { ...this.strategyWeights },
      performanceMetrics: {},
      learningInsights: []
    };

    try {
      const ohlcData = marketData?.ohlcData || marketData?.historicalData || [];

      // 1. Detect current market regime
      const currentRegime = await this.detectMarketRegime(ohlcData);
      adaptiveResult.regimeDetection = currentRegime;

      // 2. Select optimal strategy
      const strategySelection = this.selectOptimalStrategy(currentRegime);
      
      // 3. Enhance prediction based on adaptive learning
      adaptiveResult.enhancedPrediction = this.enhancePredictionWithAdaptation(
        currentPrediction, 
        strategySelection, 
        currentRegime
      );

      // 4. Update performance if actual outcome is provided
      if (actualOutcome !== null && currentPrediction.strategy) {
        this.updateStrategyPerformance(
          currentPrediction.strategy, 
          actualOutcome, 
          currentRegime.primaryRegime
        );
        adaptiveResult.adaptationActions.push('Updated strategy performance');
      }

      // 5. Check for concept drift
      const driftDetection = this.detectConceptDrift();
      if (driftDetection.driftDetected) {
        adaptiveResult.adaptationActions.push(`Drift detected in ${driftDetection.affectedStrategies.join(', ')}`);
        adaptiveResult.learningInsights.push(`Performance drift: ${driftDetection.driftMagnitude.toFixed(2)}`);
      }

      // 6. Generate performance metrics
      adaptiveResult.performanceMetrics = this.generatePerformanceMetrics();

      const endTime = performance.now();
      adaptiveResult.processingTime = `${(endTime - startTime).toFixed(2)}ms`;

      return adaptiveResult;

    } catch (error) {
      console.error('❌ Adaptive Analysis failed:', error.message);
      return this.createFallbackAdaptiveResult(currentPrediction);
    }
  }

  // Helper methods
  getTotalTrades() {
    let total = 0;
    this.strategyPerformance.forEach(performance => {
      total += performance.trades.length;
    });
    return Math.max(total, 1); // Avoid division by zero
  }

  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  assessRegimeStability(currentRegime) {
    const recentRegimes = this.regimeHistory.slice(-5);
    const uniqueRegimes = [...new Set(recentRegimes)];
    return uniqueRegimes.length <= 2 ? 'STABLE' : 'UNSTABLE';
  }

  updateRegimeHistory(regimeAnalysis) {
    this.regimeHistory.push(regimeAnalysis.primaryRegime);
    if (this.regimeHistory.length > 20) {
      this.regimeHistory = this.regimeHistory.slice(-20);
    }
    this.currentRegime = regimeAnalysis.primaryRegime;
  }

  applyRegimeAdjustments(strategySelection, currentRegime) {
    // Simple regime-based strategy preferences
    if (currentRegime.primaryRegime === 'HIGH_VOLATILITY') {
      // Prefer mean reversion in high volatility
      if (strategySelection.selectedStrategy === 'meanReversion') {
        strategySelection.confidence += 0.1;
        strategySelection.rationale += ' + High volatility favors mean reversion';
      }
    } else if (currentRegime.primaryRegime === 'BULL_TRENDING') {
      // Prefer momentum in trending markets
      if (strategySelection.selectedStrategy === 'momentum') {
        strategySelection.confidence += 0.1;
        strategySelection.rationale += ' + Bull trend favors momentum';
      }
    }

    return strategySelection;
  }

  enhancePredictionWithAdaptation(basePrediction, strategySelection, currentRegime) {
    // Simple prediction enhancement based on adaptive learning
    const enhanced = { ...basePrediction };
    
    // Adjust confidence based on regime detection confidence
    if (currentRegime.confidence > 0.7) {
      enhanced.confidence = Math.min(enhanced.confidence * 1.1, 0.95);
    }
    
    // Add adaptive insights
    enhanced.adaptiveInsights = {
      selectedStrategy: strategySelection.selectedStrategy,
      regimeDetected: currentRegime.primaryRegime,
      strategyConfidence: strategySelection.confidence
    };

    return enhanced;
  }

  generatePerformanceMetrics() {
    const metrics = {};
    
    this.strategyPerformance.forEach((performance, strategy) => {
      metrics[strategy] = {
        trades: performance.trades.length,
        winRate: performance.winRate,
        avgReturn: performance.avgReturn,
        sharpeRatio: performance.sharpeRatio,
        weight: this.strategyWeights[strategy]
      };
    });

    return metrics;
  }

  createFallbackAdaptiveResult(basePrediction) {
    return {
      enhancedPrediction: basePrediction,
      modelConfidence: basePrediction.confidence || 0.5,
      adaptationActions: [],
      regimeDetection: { primaryRegime: 'UNKNOWN', confidence: 0 },
      strategyWeights: { ...this.strategyWeights },
      performanceMetrics: {},
      learningInsights: ['Adaptive learning temporarily unavailable']
    };
  }
}

module.exports = { RealisticAdaptiveLearningEngine };
