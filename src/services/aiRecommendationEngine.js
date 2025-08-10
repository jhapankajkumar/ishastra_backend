/**
 * AI Recommendation Engine
 * Phase 6: Intelligent Portfolio & Trading Recommendations
 * 
 * Features:
 * - Smart stock recommendations based on sentiment + technical analysis
 * - Portfolio optimization with risk-adjusted returns
 * - Market timing signals using sentiment momentum
 * - Sector rotation strategies
 * - Dynamic position sizing recommendations
 * - Multi-factor scoring system
 */

const EventEmitter = require('events');

class AIRecommendationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxRecommendations: config.maxRecommendations || 10,
      minConfidenceThreshold: config.minConfidenceThreshold || 0.6,
      sentimentWeight: config.sentimentWeight || 0.3,
      technicalWeight: config.technicalWeight || 0.4,
      fundamentalWeight: config.fundamentalWeight || 0.2,
      riskWeight: config.riskWeight || 0.1,
      lookbackDays: config.lookbackDays || 30,
      portfolioTargetSize: config.portfolioTargetSize || 1000000, // ₹10L default
      maxPositionWeight: config.maxPositionWeight || 0.2 // Max 20% per position
    };
    
    // Dependencies will be injected
    this.sentimentService = null;
    this.backtestingEngine = null;
    this.riskManager = null;
    this.portfolioService = null;
    
    // Recommendation cache
    this.recommendations = new Map();
    this.marketAnalysis = null;
    this.lastUpdate = null;
    
    console.log('🧠 AI Recommendation Engine initialized');
    console.log(`   Max recommendations: ${this.config.maxRecommendations}`);
    console.log(`   Confidence threshold: ${(this.config.minConfidenceThreshold * 100).toFixed(1)}%`);
    console.log(`   Weights - Sentiment: ${(this.config.sentimentWeight * 100)}%, Technical: ${(this.config.technicalWeight * 100)}%, Risk: ${(this.config.riskWeight * 100)}%`);
  }

  /**
   * Initialize with required services
   */
  initialize(services = {}) {
    this.sentimentService = services.sentimentService;
    this.backtestingEngine = services.backtestingEngine;
    this.riskManager = services.riskManager;
    this.portfolioService = services.portfolioService;
    
    console.log('🔗 AI Recommendation Engine services connected');
    
    // Validate required services
    const requiredServices = ['sentimentService'];
    const missingServices = requiredServices.filter(service => !this[service]);
    
    if (missingServices.length > 0) {
      console.warn(`⚠️  Missing services: ${missingServices.join(', ')}`);
    }
    
    return this;
  }

  /**
   * Generate comprehensive trading recommendations
   */
  async generateRecommendations(symbols, options = {}) {
    try {
      console.log('\n🧠 Generating AI Trading Recommendations...');
      console.log(`📊 Analyzing ${symbols.length} stocks with multi-factor scoring`);
      
      const startTime = Date.now();
      
      // Step 1: Analyze market conditions
      const marketConditions = await this.analyzeMarketConditions(symbols);
      
      // Step 2: Score each stock using multi-factor model
      const stockScores = [];
      
      for (const symbol of symbols) {
        try {
          console.log(`   🔍 Analyzing ${symbol}...`);
          const score = await this.scoreStock(symbol, marketConditions, options);
          
          if (score && score.overallScore >= this.config.minConfidenceThreshold) {
            stockScores.push(score);
          }
          
        } catch (error) {
          console.warn(`   ⚠️  Failed to score ${symbol}: ${error.message}`);
        }
      }
      
      // Step 3: Rank and filter recommendations
      const rankedRecommendations = this.rankRecommendations(stockScores, marketConditions);
      
      // Step 4: Generate portfolio optimization
      const portfolioOptimization = this.optimizePortfolio(rankedRecommendations, options);
      
      // Step 5: Create final recommendations
      const finalRecommendations = {
        timestamp: new Date().toISOString(),
        marketConditions,
        recommendations: rankedRecommendations.slice(0, this.config.maxRecommendations),
        portfolioOptimization,
        processingTime: Date.now() - startTime,
        totalAnalyzed: symbols.length,
        qualified: rankedRecommendations.length
      };
      
      // Cache results
      this.recommendations.set('latest', finalRecommendations);
      this.lastUpdate = new Date();
      
      console.log(`✅ Generated ${finalRecommendations.recommendations.length} recommendations in ${finalRecommendations.processingTime}ms`);
      
      // Emit recommendation event
      this.emit('recommendationsGenerated', finalRecommendations);
      
      return finalRecommendations;
      
    } catch (error) {
      console.error('❌ Error generating recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Analyze overall market conditions
   */
  async analyzeMarketConditions(symbols) {
    console.log('   🌍 Analyzing market conditions...');
    
    try {
      // Analyze sentiment across all symbols
      const marketSentiment = await this.analyzeMarketSentiment(symbols);
      
      // Determine market regime
      const marketRegime = this.determineMarketRegime(marketSentiment);
      
      // Calculate market volatility
      const marketVolatility = this.calculateMarketVolatility(symbols);
      
      const conditions = {
        sentiment: marketSentiment,
        regime: marketRegime,
        volatility: marketVolatility,
        recommendedStrategy: this.getRecommendedStrategy(marketRegime, marketSentiment),
        riskLevel: this.assessMarketRisk(marketRegime, marketVolatility),
        timestamp: new Date().toISOString()
      };
      
      console.log(`   📈 Market Regime: ${conditions.regime} | Risk: ${conditions.riskLevel} | Strategy: ${conditions.recommendedStrategy}`);
      
      return conditions;
      
    } catch (error) {
      console.warn('   ⚠️  Market analysis failed, using defaults');
      return {
        sentiment: { score: 0, confidence: 0.5, trend: 'NEUTRAL' },
        regime: 'UNCERTAIN',
        volatility: 'MEDIUM',
        recommendedStrategy: 'BALANCED',
        riskLevel: 'MEDIUM'
      };
    }
  }

  /**
   * Analyze overall market sentiment
   */
  async analyzeMarketSentiment(symbols) {
    if (!this.sentimentService) {
      return { score: 0, confidence: 0.5, trend: 'NEUTRAL' };
    }
    
    const sentimentScores = [];
    const confidenceScores = [];
    
    // Sample a few symbols for market sentiment (to avoid too many API calls)
    const sampleSymbols = symbols.slice(0, Math.min(5, symbols.length));
    
    for (const symbol of sampleSymbols) {
      try {
        const sentiment = await this.sentimentService.analyzeSentiment(symbol);
        if (sentiment && sentiment.overall) {
          sentimentScores.push(sentiment.overall.score);
          confidenceScores.push(sentiment.overall.confidence);
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed sentiment analysis for ${symbol}`);
      }
    }
    
    if (sentimentScores.length === 0) {
      return { score: 0, confidence: 0.5, trend: 'NEUTRAL' };
    }
    
    const avgScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
    
    return {
      score: avgScore,
      confidence: avgConfidence,
      trend: avgScore > 0.2 ? 'BULLISH' : avgScore < -0.2 ? 'BEARISH' : 'NEUTRAL',
      sampleSize: sentimentScores.length
    };
  }

  /**
   * Score individual stock using multi-factor model
   */
  async scoreStock(symbol, marketConditions, options = {}) {
    const scoring = {
      symbol,
      timestamp: new Date().toISOString(),
      sentiment: { score: 0, weight: this.config.sentimentWeight, contribution: 0 },
      technical: { score: 0, weight: this.config.technicalWeight, contribution: 0 },
      fundamental: { score: 0, weight: this.config.fundamentalWeight, contribution: 0 },
      risk: { score: 0, weight: this.config.riskWeight, contribution: 0 },
      marketAlignment: 0,
      overallScore: 0,
      confidence: 0,
      recommendation: 'HOLD'
    };
    
    try {
      // 1. Sentiment Score
      if (this.sentimentService) {
        const sentiment = await this.sentimentService.analyzeSentiment(symbol, { 
          includeNews: true,
          includeSocial: true 
        });
        
        if (sentiment && sentiment.overall) {
          scoring.sentiment.score = Math.max(-1, Math.min(1, sentiment.overall.score));
          scoring.sentiment.contribution = scoring.sentiment.score * scoring.sentiment.weight;
          scoring.confidence = sentiment.overall.confidence;
        }
      }
      
      // 2. Technical Score (simulated - would integrate with your technical analysis)
      scoring.technical.score = this.generateTechnicalScore(symbol);
      scoring.technical.contribution = scoring.technical.score * scoring.technical.weight;
      
      // 3. Fundamental Score (simulated - would integrate with fundamental data)
      scoring.fundamental.score = this.generateFundamentalScore(symbol);
      scoring.fundamental.contribution = scoring.fundamental.score * scoring.fundamental.weight;
      
      // 4. Risk Score
      scoring.risk.score = this.generateRiskScore(symbol, marketConditions);
      scoring.risk.contribution = scoring.risk.score * scoring.risk.weight;
      
      // 5. Market Alignment Bonus/Penalty
      scoring.marketAlignment = this.calculateMarketAlignment(scoring, marketConditions);
      
      // 6. Calculate Overall Score
      scoring.overallScore = scoring.sentiment.contribution + 
                           scoring.technical.contribution + 
                           scoring.fundamental.contribution + 
                           scoring.risk.contribution + 
                           scoring.marketAlignment;
      
      // Normalize to [-1, 1] range
      scoring.overallScore = Math.max(-1, Math.min(1, scoring.overallScore));
      
      // 7. Generate Recommendation
      scoring.recommendation = this.generateRecommendation(scoring.overallScore, scoring.confidence);
      
      console.log(`     📊 ${symbol}: ${scoring.recommendation} (${scoring.overallScore.toFixed(3)}) - Conf: ${(scoring.confidence * 100).toFixed(1)}%`);
      
      return scoring;
      
    } catch (error) {
      console.warn(`   ⚠️  Scoring failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate technical analysis score (simulated)
   */
  generateTechnicalScore(symbol) {
    // In real implementation, this would use actual technical indicators
    // RSI, MACD, Moving Averages, Support/Resistance, etc.
    
    const technicalIndicators = {
      rsi: 45 + (Math.random() * 20), // Random RSI between 45-65
      macdSignal: Math.random() > 0.5 ? 'BUY' : 'SELL',
      movingAverageAlignment: Math.random() > 0.4, // 60% chance of alignment
      volumeConfirmation: Math.random() > 0.3, // 70% chance of volume confirmation
      breakoutSignal: Math.random() > 0.7 // 30% chance of breakout
    };
    
    let score = 0;
    
    // RSI scoring
    if (technicalIndicators.rsi < 30) score += 0.3; // Oversold - bullish
    else if (technicalIndicators.rsi > 70) score -= 0.3; // Overbought - bearish
    else if (technicalIndicators.rsi >= 40 && technicalIndicators.rsi <= 60) score += 0.1; // Neutral zone
    
    // MACD signal
    score += technicalIndicators.macdSignal === 'BUY' ? 0.2 : -0.2;
    
    // Moving average alignment
    score += technicalIndicators.movingAverageAlignment ? 0.2 : -0.1;
    
    // Volume confirmation
    score += technicalIndicators.volumeConfirmation ? 0.15 : -0.05;
    
    // Breakout signal
    score += technicalIndicators.breakoutSignal ? 0.25 : 0;
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Generate fundamental analysis score (simulated)
   */
  generateFundamentalScore(symbol) {
    // In real implementation, this would use actual fundamental data
    // P/E ratio, ROE, Debt-to-Equity, Revenue Growth, etc.
    
    const fundamentalMetrics = {
      peRatio: 15 + (Math.random() * 20), // P/E between 15-35
      roe: 5 + (Math.random() * 25), // ROE between 5-30%
      debtToEquity: Math.random() * 2, // D/E between 0-2
      revenueGrowth: -10 + (Math.random() * 30), // Growth between -10% to 20%
      profitMargin: 5 + (Math.random() * 15) // Margin between 5-20%
    };
    
    let score = 0;
    
    // P/E ratio scoring (lower is generally better, but not too low)
    if (fundamentalMetrics.peRatio < 15) score += 0.2;
    else if (fundamentalMetrics.peRatio < 25) score += 0.1;
    else score -= 0.1;
    
    // ROE scoring (higher is better)
    if (fundamentalMetrics.roe > 20) score += 0.3;
    else if (fundamentalMetrics.roe > 15) score += 0.2;
    else if (fundamentalMetrics.roe > 10) score += 0.1;
    else score -= 0.1;
    
    // Debt-to-Equity (lower is better)
    if (fundamentalMetrics.debtToEquity < 0.3) score += 0.2;
    else if (fundamentalMetrics.debtToEquity < 0.6) score += 0.1;
    else if (fundamentalMetrics.debtToEquity > 1.5) score -= 0.3;
    
    // Revenue Growth
    if (fundamentalMetrics.revenueGrowth > 15) score += 0.25;
    else if (fundamentalMetrics.revenueGrowth > 10) score += 0.15;
    else if (fundamentalMetrics.revenueGrowth > 5) score += 0.05;
    else if (fundamentalMetrics.revenueGrowth < 0) score -= 0.2;
    
    // Profit Margin
    if (fundamentalMetrics.profitMargin > 15) score += 0.15;
    else if (fundamentalMetrics.profitMargin > 10) score += 0.1;
    else if (fundamentalMetrics.profitMargin < 5) score -= 0.1;
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Generate risk score
   */
  generateRiskScore(symbol, marketConditions) {
    // Higher risk score = lower risk (positive contribution)
    let riskScore = 0;
    
    // Market volatility impact
    if (marketConditions.volatility === 'LOW') riskScore += 0.3;
    else if (marketConditions.volatility === 'MEDIUM') riskScore += 0.1;
    else riskScore -= 0.2; // High volatility
    
    // Market regime impact
    if (marketConditions.regime === 'BULL_MARKET') riskScore += 0.2;
    else if (marketConditions.regime === 'BEAR_MARKET') riskScore -= 0.3;
    
    // Simulated stock-specific risk factors
    const stockRisk = Math.random();
    if (stockRisk < 0.3) riskScore += 0.2; // Low risk stock
    else if (stockRisk > 0.7) riskScore -= 0.2; // High risk stock
    
    return Math.max(-1, Math.min(1, riskScore));
  }

  /**
   * Calculate market alignment bonus/penalty
   */
  calculateMarketAlignment(scoring, marketConditions) {
    let alignment = 0;
    
    // If stock sentiment aligns with market sentiment
    const stockSentiment = scoring.sentiment.score;
    const marketSentiment = marketConditions.sentiment.score;
    
    if ((stockSentiment > 0 && marketSentiment > 0) || 
        (stockSentiment < 0 && marketSentiment < 0)) {
      alignment += 0.1; // Alignment bonus
    } else if (Math.abs(stockSentiment - marketSentiment) > 0.5) {
      alignment -= 0.05; // Strong divergence penalty
    }
    
    return alignment;
  }

  /**
   * Generate recommendation based on score and confidence
   */
  generateRecommendation(overallScore, confidence) {
    if (confidence < 0.4) return 'WAIT'; // Low confidence
    
    if (overallScore > 0.6) return 'STRONG_BUY';
    if (overallScore > 0.3) return 'BUY';
    if (overallScore > -0.3) return 'HOLD';
    if (overallScore > -0.6) return 'SELL';
    return 'STRONG_SELL';
  }

  /**
   * Rank recommendations by score and apply filters
   */
  rankRecommendations(stockScores, marketConditions) {
    // Sort by overall score (descending)
    const ranked = stockScores
      .filter(score => score && score.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => b.overallScore - a.overallScore);
    
    // Add additional metadata
    return ranked.map((score, index) => ({
      ...score,
      rank: index + 1,
      percentile: ((ranked.length - index) / ranked.length * 100).toFixed(1),
      marketAlignment: score.marketAlignment > 0 ? 'ALIGNED' : 'DIVERGENT',
      riskAdjustedScore: score.overallScore * score.confidence,
      recommendedAllocation: this.calculateRecommendedAllocation(score, index, ranked.length)
    }));
  }

  /**
   * Calculate recommended allocation percentage
   */
  calculateRecommendedAllocation(score, rank, totalRecommendations) {
    const baseAllocation = this.config.maxPositionWeight;
    
    // Allocate more to higher-ranked stocks
    const rankMultiplier = Math.max(0.3, 1 - (rank / totalRecommendations) * 0.7);
    
    // Adjust by confidence and score
    const confidenceMultiplier = score.confidence;
    const scoreMultiplier = Math.max(0.1, (score.overallScore + 1) / 2); // Normalize to 0.1-1.0
    
    const allocation = baseAllocation * rankMultiplier * confidenceMultiplier * scoreMultiplier;
    
    return Math.max(0.01, Math.min(this.config.maxPositionWeight, allocation));
  }

  /**
   * Optimize portfolio allocation
   */
  optimizePortfolio(recommendations, options = {}) {
    if (recommendations.length === 0) {
      return {
        totalAllocation: 0,
        recommendations: [],
        cashAllocation: 1.0,
        expectedReturn: 0,
        estimatedRisk: 0
      };
    }
    
    // Calculate optimal allocation
    let totalAllocation = 0;
    const optimizedRecommendations = recommendations.map(rec => {
      const allocation = Math.min(rec.recommendedAllocation, 
                                 (1.0 - totalAllocation), 
                                 this.config.maxPositionWeight);
      totalAllocation += allocation;
      
      return {
        ...rec,
        optimalAllocation: allocation,
        estimatedValue: allocation * this.config.portfolioTargetSize
      };
    });
    
    // Portfolio risk/return estimates
    const weightedReturn = optimizedRecommendations.reduce((sum, rec) => 
      sum + (rec.overallScore * rec.optimalAllocation), 0);
    
    const portfolioRisk = Math.sqrt(optimizedRecommendations.reduce((sum, rec) => 
      sum + Math.pow(rec.optimalAllocation * (1 - rec.confidence), 2), 0));
    
    return {
      recommendations: optimizedRecommendations,
      totalAllocation,
      cashAllocation: Math.max(0, 1.0 - totalAllocation),
      expectedReturn: weightedReturn,
      estimatedRisk: portfolioRisk,
      riskAdjustedReturn: weightedReturn / Math.max(0.01, portfolioRisk),
      diversificationScore: this.calculateDiversificationScore(optimizedRecommendations)
    };
  }

  /**
   * Calculate diversification score
   */
  calculateDiversificationScore(recommendations) {
    if (recommendations.length <= 1) return 0;
    
    // Simple diversification: more positions = better diversification
    // but diminishing returns after 8-10 positions
    const positionCount = recommendations.length;
    const maxAllocation = Math.max(...recommendations.map(r => r.optimalAllocation));
    
    let diversificationScore = Math.min(1.0, positionCount / 8) * 0.7; // Position count component
    diversificationScore += (1 - maxAllocation) * 0.3; // Concentration component
    
    return Math.max(0, Math.min(1, diversificationScore));
  }

  /**
   * Determine market regime
   */
  determineMarketRegime(marketSentiment) {
    const score = marketSentiment.score;
    const confidence = marketSentiment.confidence;
    
    if (confidence < 0.4) return 'UNCERTAIN';
    
    if (score > 0.4) return 'BULL_MARKET';
    if (score < -0.4) return 'BEAR_MARKET';
    if (score > 0.1) return 'BULLISH_NEUTRAL';
    if (score < -0.1) return 'BEARISH_NEUTRAL';
    
    return 'NEUTRAL';
  }

  /**
   * Calculate market volatility
   */
  calculateMarketVolatility(symbols) {
    // Simulated volatility calculation
    // In real implementation, would calculate from price data
    const randomVolatility = Math.random();
    
    if (randomVolatility < 0.3) return 'LOW';
    if (randomVolatility < 0.7) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Get recommended strategy for market conditions
   */
  getRecommendedStrategy(regime, sentiment) {
    switch (regime) {
      case 'BULL_MARKET':
        return 'GROWTH_FOCUSED';
      case 'BEAR_MARKET':
        return 'DEFENSIVE';
      case 'BULLISH_NEUTRAL':
        return 'MOMENTUM';
      case 'BEARISH_NEUTRAL':
        return 'VALUE_FOCUSED';
      case 'UNCERTAIN':
        return 'WAIT_AND_WATCH';
      default:
        return 'BALANCED';
    }
  }

  /**
   * Assess market risk level
   */
  assessMarketRisk(regime, volatility) {
    if (regime === 'BEAR_MARKET' || volatility === 'HIGH') return 'HIGH';
    if (regime === 'BULL_MARKET' && volatility === 'LOW') return 'LOW';
    return 'MEDIUM';
  }

  /**
   * Get latest recommendations
   */
  getLatestRecommendations() {
    return this.recommendations.get('latest') || null;
  }

  /**
   * Get recommendation summary
   */
  getRecommendationSummary() {
    const latest = this.getLatestRecommendations();
    if (!latest) return null;
    
    const summary = {
      timestamp: latest.timestamp,
      totalRecommendations: latest.recommendations.length,
      marketConditions: latest.marketConditions,
      topRecommendation: latest.recommendations[0] || null,
      portfolioAllocation: latest.portfolioOptimization.totalAllocation,
      expectedReturn: latest.portfolioOptimization.expectedReturn,
      riskLevel: latest.marketConditions.riskLevel
    };
    
    // Recommendation breakdown
    summary.recommendationBreakdown = {};
    latest.recommendations.forEach(rec => {
      summary.recommendationBreakdown[rec.recommendation] = 
        (summary.recommendationBreakdown[rec.recommendation] || 0) + 1;
    });
    
    return summary;
  }
}

module.exports = AIRecommendationEngine;
