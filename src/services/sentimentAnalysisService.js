/**
 * Sentiment Analysis Service
 * Phase 5: Sentiment Analysis Engine with FREE Real News Integration
 * 
 * Features:
 * - Financial news sentiment analysis (Google News RSS + Yahoo Finance)
 * - Social media sentiment tracking
 * - Sentiment-enhanced signal filtering
 * - Real-time news monitoring
 * - Sentiment scoring and confidence adjustment
 */

const EventEmitter = require('events');
const FreeNewsSentimentService = require('./freeNewsSentimentService');

class SentimentAnalysisService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      enableNews: config.enableNews !== false,
      enableSocial: config.enableSocial !== false,
      enableRealNews: config.enableRealNews !== false, // New: Enable real news APIs
      sentimentThreshold: config.sentimentThreshold || 0.6,
      newsLookbackHours: config.newsLookbackHours || 24,
      maxArticles: config.maxArticles || 50,
      refreshInterval: config.refreshInterval || 30 // minutes
    };
    
    this.sentimentCache = new Map(); // symbol -> sentiment data
    this.newsCache = new Map(); // symbol -> news articles
    this.sentimentHistory = new Map(); // symbol -> historical sentiment
    
    // Initialize FREE news sentiment service
    if (this.config.enableRealNews) {
      this.freeNewsService = new FreeNewsSentimentService({
        enableGoogleNews: true,
        enableYahooFinance: true,
        maxArticlesPerSource: 10
      });
      //console.log('🆓 Real news sentiment service enabled (Google News + Yahoo Finance)');
    }
    
    // Initialize sentiment analysis components
    this.initializeSentimentAnalysis();
    
    //console.log('📰 Sentiment Analysis Service initialized');
    //console.log(`   News monitoring: ${this.config.enableNews ? 'Enabled' : 'Disabled'}`);
    //console.log(`   Real news APIs: ${this.config.enableRealNews ? 'Enabled (FREE)' : 'Disabled'}`);
    //console.log(`   Social monitoring: ${this.config.enableSocial ? 'Enabled' : 'Disabled'}`);
    //console.log(`   Sentiment threshold: ${this.config.sentimentThreshold}`);
  }

  /**
   * Initialize sentiment analysis components
   */
  initializeSentimentAnalysis() {
    // Initialize basic sentiment lexicons
    this.positiveLexicon = new Set([
      'bullish', 'positive', 'growth', 'profit', 'gain', 'increase', 'rise', 'strong',
      'beat', 'exceed', 'outperform', 'upgrade', 'buy', 'recommend', 'optimistic',
      'breakthrough', 'expansion', 'success', 'recovery', 'momentum', 'surge',
      'rally', 'soar', 'boost', 'accelerate', 'improve', 'strengthen', 'advance'
    ]);
    
    this.negativeLexicon = new Set([
      'bearish', 'negative', 'decline', 'loss', 'decrease', 'fall', 'weak',
      'miss', 'underperform', 'downgrade', 'sell', 'concern', 'pessimistic',
      'crisis', 'recession', 'crash', 'plunge', 'dump', 'collapse', 'fear',
      'risk', 'volatility', 'uncertainty', 'pressure', 'struggle', 'challenge'
    ]);
    
    // Financial impact multipliers
    this.impactMultipliers = {
      'earnings': 2.0,
      'revenue': 1.8,
      'guidance': 1.6,
      'merger': 2.2,
      'acquisition': 2.0,
      'dividend': 1.4,
      'split': 1.3,
      'buyback': 1.5,
      'partnership': 1.2,
      'contract': 1.3
    };
    
    //console.log('🧠 Sentiment analysis lexicons initialized');
    //console.log(`   Positive keywords: ${this.positiveLexicon.size}`);
    //console.log(`   Negative keywords: ${this.negativeLexicon.size}`);
    //console.log(`   Impact multipliers: ${Object.keys(this.impactMultipliers).length}`);
  }

  /**
   * Analyze sentiment for a stock symbol
   */
  async analyzeSentiment(symbol, options = {}) {
    try {
      //console.log(`📰 Analyzing sentiment for ${symbol}...`);
      
      const analysis = {
        symbol,
        timestamp: new Date(),
        news: { score: 0, articles: 0, keywords: [] },
        social: { score: 0, mentions: 0 },
        overall: { score: 0, confidence: 0 },
        enhancedConfidence: 0,
        recommendation: 'NEUTRAL'
      };

      // Analyze news sentiment
      if (this.config.enableNews) {
        analysis.news = await this.analyzeNewsSentiment(symbol, options);
      }

      // Analyze social sentiment (simulated for now)
      if (this.config.enableSocial) {
        analysis.social = await this.analyzeSocialSentiment(symbol, options);
      }

      // Calculate overall sentiment
      analysis.overall = this.calculateOverallSentiment(analysis.news, analysis.social);
      
      // Generate recommendation
      analysis.recommendation = this.generateSentimentRecommendation(analysis.overall);
      analysis.enhancedConfidence = this.calculateEnhancedConfidence(analysis.overall);

      // Cache the analysis
      this.sentimentCache.set(symbol, analysis);
      
      // Store in history
      this.addToSentimentHistory(symbol, analysis);

      // Emit sentiment analysis event
      this.emit('sentimentAnalyzed', { symbol, analysis });

      //console.log(`✅ Sentiment analysis complete for ${symbol}: ${analysis.overall.score.toFixed(3)} (${analysis.recommendation})`);
      return analysis;

    } catch (error) {
      console.error(`❌ Error analyzing sentiment for ${symbol}: ${error.message}`);
      return this.getDefaultSentiment(symbol);
    }
  }

  /**
   * Analyze news sentiment using REAL or simulated news data
   */
  async analyzeNewsSentiment(symbol, options = {}) {
    try {
      // Try to use real news first if enabled
      if (this.config.enableRealNews && this.freeNewsService) {
        //console.log(`  🆓 Fetching REAL news sentiment for ${symbol}...`);
        
        try {
          const realNewsSentiment = await this.freeNewsService.getNewsSentiment(symbol);
          
          if (realNewsSentiment && !realNewsSentiment.error && realNewsSentiment.articles > 0) {
            //console.log(`  ✅ Real news: ${realNewsSentiment.sentiment} (${realNewsSentiment.score.toFixed(3)}) from ${realNewsSentiment.articles} articles`);
            
            return {
              score: realNewsSentiment.score,
              articles: realNewsSentiment.articles,
              keywords: realNewsSentiment.keywords,
              sources: realNewsSentiment.sources,
              sentiment: realNewsSentiment.sentiment,
              confidence: realNewsSentiment.confidence,
              isReal: true, // Flag to indicate this is real news
              timestamp: realNewsSentiment.timestamp
            };
          } else {
            //console.log(`  ⚠️  Real news failed or no articles found, falling back to simulated...`);
          }
        } catch (realNewsError) {
          console.warn(`  ⚠️  Real news error: ${realNewsError.message}, falling back to simulated...`);
        }
      }
      
      // Fallback to simulated news sentiment
      //console.log(`  🎭 Using simulated news sentiment for ${symbol}...`);
      return await this.analyzeSimulatedNewsSentiment(symbol, options);

    } catch (error) {
      console.error('Error analyzing news sentiment:', error.message);
      return {
        score: 0,
        articles: 0,
        keywords: [],
        sources: [],
        sentiment: 'NEUTRAL',
        confidence: 0.1,
        isReal: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze simulated news sentiment (fallback method)
   */
  async analyzeSimulatedNewsSentiment(symbol, options = {}) {
    const newsAnalysis = {
      score: 0,
      articles: 0,
      keywords: [],
      sources: [],
      sentiment: 'NEUTRAL',
      isReal: false,
      confidence: 0.6 // Lower confidence for simulated data
    };

    // Simulate news articles based on our comprehensive analysis results
    const performanceData = this.getSymbolPerformanceData(symbol);
    if (!performanceData) {
      return newsAnalysis;
    }

    // Generate simulated news sentiment based on historical performance
    newsAnalysis.articles = Math.floor(Math.random() * 15) + 5; // 5-20 articles
    
    // Base sentiment on historical performance
    if (performanceData.avgReturn > 50) {
      // Very positive news for top performers
      newsAnalysis.score = 0.7 + (Math.random() * 0.25);
      newsAnalysis.keywords = ['growth', 'bullish', 'outperform', 'strong', 'positive'];
      newsAnalysis.sentiment = 'VERY_POSITIVE';
    } else if (performanceData.avgReturn > 0) {
      // Moderate positive news
      newsAnalysis.score = 0.3 + (Math.random() * 0.4);
      newsAnalysis.keywords = ['stable', 'growth', 'positive', 'increase'];
      newsAnalysis.sentiment = 'POSITIVE';
    } else if (performanceData.avgReturn > -20) {
      // Neutral to slightly negative
      newsAnalysis.score = -0.2 + (Math.random() * 0.4);
      newsAnalysis.keywords = ['mixed', 'uncertain', 'volatile'];
      newsAnalysis.sentiment = 'NEUTRAL';
    } else {
      // Negative news for poor performers
      newsAnalysis.score = -0.6 + (Math.random() * 0.3);
      newsAnalysis.keywords = ['decline', 'bearish', 'concern', 'weak'];
      newsAnalysis.sentiment = 'NEGATIVE';
    }

    // Add some market noise
    newsAnalysis.score += (Math.random() - 0.5) * 0.2;
    newsAnalysis.score = Math.max(-1, Math.min(1, newsAnalysis.score)); // Clamp to [-1, 1]

    //console.log(`  📊 Simulated news sentiment: ${newsAnalysis.score.toFixed(3)} (${newsAnalysis.articles} articles)`);
    return newsAnalysis;
  }

  /**
   * Analyze social media sentiment (simulated)
   */
  async analyzeSocialSentiment(symbol, options = {}) {
    try {
      // Simulate social sentiment analysis
      const socialAnalysis = {
        score: 0,
        mentions: 0,
        platforms: {
          twitter: { score: 0, mentions: 0 },
          reddit: { score: 0, posts: 0 }
        }
      };

      const performanceData = this.getSymbolPerformanceData(symbol);
      if (!performanceData) {
        return socialAnalysis;
      }

      // Generate social mentions based on popularity
      const baseMentions = ['BHARTIARTL.NS', 'HCLTECH.NS', 'HDFCBANK.NS'].includes(symbol) ? 800 : 200;
      socialAnalysis.mentions = baseMentions + Math.floor(Math.random() * 500);
      
      // Social sentiment tends to be more volatile
      if (performanceData.avgReturn > 100) {
        socialAnalysis.score = 0.6 + (Math.random() * 0.3);
      } else if (performanceData.avgReturn > 0) {
        socialAnalysis.score = 0.2 + (Math.random() * 0.5);
      } else {
        socialAnalysis.score = -0.4 + (Math.random() * 0.6);
      }

      // Add social volatility
      socialAnalysis.score += (Math.random() - 0.5) * 0.3;
      socialAnalysis.score = Math.max(-1, Math.min(1, socialAnalysis.score));

      // Distribute across platforms
      socialAnalysis.platforms.twitter.mentions = Math.floor(socialAnalysis.mentions * 0.7);
      socialAnalysis.platforms.twitter.score = socialAnalysis.score + (Math.random() - 0.5) * 0.2;
      
      socialAnalysis.platforms.reddit.posts = Math.floor(socialAnalysis.mentions * 0.3);
      socialAnalysis.platforms.reddit.score = socialAnalysis.score + (Math.random() - 0.5) * 0.3;

      //console.log(`  💬 Social sentiment: ${socialAnalysis.score.toFixed(3)} (${socialAnalysis.mentions} mentions)`);
      return socialAnalysis;

    } catch (error) {
      console.error('Error analyzing social sentiment:', error.message);
      return { score: 0, mentions: 0, platforms: { twitter: { score: 0, mentions: 0 }, reddit: { score: 0, posts: 0 } } };
    }
  }

  /**
   * Get symbol performance data for sentiment simulation
   */
  getSymbolPerformanceData(symbol) {
    // Based on our comprehensive analysis results
    const performanceMap = {
      'BHARTIARTL.NS': { avgReturn: 1330.18, winRate: 91.3, tier: 'TOP' },
      'HCLTECH.NS': { avgReturn: 62.20, winRate: 82.0, tier: 'HIGH' },
      'HDFCBANK.NS': { avgReturn: 58.28, winRate: 79.2, tier: 'HIGH' },
      'HINDUNILVR.NS': { avgReturn: 52.82, winRate: 86.9, tier: 'HIGH' },
      'KOTAKBANK.NS': { avgReturn: 52.63, winRate: 73.7, tier: 'HIGH' },
      'WIPRO.NS': { avgReturn: 17.13, winRate: 45.0, tier: 'MEDIUM' },
      'ICICIBANK.NS': { avgReturn: 17.03, winRate: 70.8, tier: 'MEDIUM' },
      'SUNPHARMA.NS': { avgReturn: 19.02, winRate: 60.0, tier: 'MEDIUM' },
      'TCS.NS': { avgReturn: -45.67, winRate: 35.0, tier: 'LOW' },
      'RELIANCE.NS': { avgReturn: -47.75, winRate: 30.0, tier: 'LOW' }
    };

    return performanceMap[symbol] || { avgReturn: 0, winRate: 50, tier: 'UNKNOWN' };
  }

  /**
   * Calculate overall sentiment score
   */
  calculateOverallSentiment(newsAnalysis, socialAnalysis) {
    const newsWeight = 0.7; // News has more weight than social
    const socialWeight = 0.3;
    
    const overallScore = (newsAnalysis.score * newsWeight) + (socialAnalysis.score * socialWeight);
    
    // Calculate confidence based on volume and consistency
    let confidence = 0.5; // Base confidence
    
    if (newsAnalysis.articles > 10) confidence += 0.2;
    if (socialAnalysis.mentions > 500) confidence += 0.1;
    
    // Consistency boost
    if (Math.sign(newsAnalysis.score) === Math.sign(socialAnalysis.score)) {
      confidence += 0.2;
    }
    
    confidence = Math.min(confidence, 1.0);
    
    return {
      score: Math.max(-1, Math.min(1, overallScore)),
      confidence: confidence
    };
  }

  /**
   * Generate sentiment-based recommendation
   */
  generateSentimentRecommendation(overallSentiment) {
    const { score, confidence } = overallSentiment;
    
    if (confidence < 0.4) return 'NEUTRAL'; // Low confidence
    
    if (score >= 0.6) return 'ENHANCED_BUY';
    if (score >= 0.3) return 'POSITIVE_BIAS';
    if (score >= -0.3) return 'NEUTRAL';
    if (score >= -0.6) return 'NEGATIVE_BIAS';
    return 'CAUTION';
  }

  /**
   * Calculate enhanced confidence for trading signals
   */
  calculateEnhancedConfidence(overallSentiment) {
    const { score, confidence } = overallSentiment;
    
    // Base enhancement factor
    let enhancement = 1.0;
    
    if (score > 0.5 && confidence > 0.7) {
      enhancement = 1.15; // 15% boost for very positive sentiment
    } else if (score > 0.3 && confidence > 0.6) {
      enhancement = 1.08; // 8% boost for positive sentiment
    } else if (score < -0.5 && confidence > 0.7) {
      enhancement = 0.85; // 15% reduction for very negative sentiment
    } else if (score < -0.3 && confidence > 0.6) {
      enhancement = 0.92; // 8% reduction for negative sentiment
    }
    
    return enhancement;
  }

  /**
   * Enhance trading signal with sentiment analysis
   */
  async enhanceSignalWithSentiment(signal, sentimentAnalysis = null) {
    try {
      // Get or analyze sentiment
      let sentiment = sentimentAnalysis;
      if (!sentiment) {
        sentiment = await this.analyzeSentiment(signal.symbol);
      }

      // Calculate enhanced confidence
      const baseConfidence = signal.confidence || 50;
      const sentimentMultiplier = sentiment.enhancedConfidence;
      const enhancedConfidence = Math.min(95, Math.max(30, baseConfidence * sentimentMultiplier));

      // Determine sentiment impact
      let sentimentImpact = 'NEUTRAL';
      if (sentiment.overall.score > 0.3 && sentiment.overall.confidence > 0.6) {
        sentimentImpact = 'POSITIVE';
      } else if (sentiment.overall.score < -0.3 && sentiment.overall.confidence > 0.6) {
        sentimentImpact = 'NEGATIVE';
      }

      // Create enhanced signal
      const enhancedSignal = {
        ...signal,
        originalConfidence: baseConfidence,
        enhancedConfidence: enhancedConfidence,
        sentimentScore: sentiment.overall.score,
        sentimentConfidence: sentiment.overall.confidence,
        sentimentImpact: sentimentImpact,
        sentimentRecommendation: sentiment.recommendation,
        enhancement: {
          multiplier: sentimentMultiplier,
          boost: enhancedConfidence - baseConfidence,
          reason: this.getSentimentEnhancementReason(sentiment)
        }
      };

      //console.log(`📊 Signal enhanced for ${signal.symbol}: ${baseConfidence}% → ${enhancedConfidence.toFixed(1)}% (${sentimentImpact})`);
      return enhancedSignal;

    } catch (error) {
      console.error('Error enhancing signal with sentiment:', error.message);
      return signal; // Return original signal on error
    }
  }

  /**
   * Get sentiment enhancement reason
   */
  getSentimentEnhancementReason(sentiment) {
    const { score, confidence } = sentiment.overall;
    
    if (score > 0.5 && confidence > 0.7) {
      return 'Very positive sentiment with high confidence';
    } else if (score > 0.3 && confidence > 0.6) {
      return 'Positive sentiment supports signal';
    } else if (score < -0.5 && confidence > 0.7) {
      return 'Very negative sentiment reduces confidence';
    } else if (score < -0.3 && confidence > 0.6) {
      return 'Negative sentiment creates caution';
    } else {
      return 'Neutral sentiment - no adjustment';
    }
  }

  /**
   * Add sentiment analysis to history
   */
  addToSentimentHistory(symbol, analysis) {
    if (!this.sentimentHistory.has(symbol)) {
      this.sentimentHistory.set(symbol, []);
    }
    
    const history = this.sentimentHistory.get(symbol);
    history.push({
      timestamp: analysis.timestamp,
      score: analysis.overall.score,
      confidence: analysis.overall.confidence,
      recommendation: analysis.recommendation
    });
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Get sentiment trend for a symbol
   */
  getSentimentTrend(symbol, hours = 24) {
    const history = this.sentimentHistory.get(symbol) || [];
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const recentHistory = history.filter(h => h.timestamp >= cutoffTime);
    
    if (recentHistory.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', change: 0, dataPoints: recentHistory.length };
    }
    
    const firstScore = recentHistory[0].score;
    const lastScore = recentHistory[recentHistory.length - 1].score;
    const change = lastScore - firstScore;
    
    let trend = 'STABLE';
    if (change > 0.2) trend = 'IMPROVING';
    else if (change < -0.2) trend = 'DECLINING';
    
    return {
      trend,
      change: change,
      dataPoints: recentHistory.length,
      firstScore: firstScore,
      lastScore: lastScore
    };
  }

  /**
   * Get default sentiment for error cases
   */
  getDefaultSentiment(symbol) {
    return {
      symbol,
      timestamp: new Date(),
      news: { score: 0, articles: 0, keywords: [] },
      social: { score: 0, mentions: 0 },
      overall: { score: 0, confidence: 0.3 },
      enhancedConfidence: 1.0,
      recommendation: 'NEUTRAL'
    };
  }

  /**
   * Get cached sentiment or analyze fresh
   */
  async getCachedOrFreshSentiment(symbol, maxAgeMinutes = 30) {
    const cached = this.sentimentCache.get(symbol);
    
    if (cached) {
      const ageMinutes = (Date.now() - cached.timestamp.getTime()) / (1000 * 60);
      if (ageMinutes <= maxAgeMinutes) {
        //console.log(`📊 Using cached sentiment for ${symbol} (${ageMinutes.toFixed(1)} min old)`);
        return cached;
      }
    }
    
    return await this.analyzeSentiment(symbol);
  }

  /**
   * Batch analyze sentiment for multiple symbols
   */
  async batchAnalyzeSentiment(symbols, options = {}) {
    //console.log(`📰 Batch analyzing sentiment for ${symbols.length} symbols...`);
    
    const results = {};
    const promises = symbols.map(async symbol => {
      try {
        const analysis = await this.analyzeSentiment(symbol, options);
        results[symbol] = analysis;
      } catch (error) {
        console.error(`Failed sentiment analysis for ${symbol}: ${error.message}`);
        results[symbol] = this.getDefaultSentiment(symbol);
      }
    });
    
    await Promise.allSettled(promises);
    
    //console.log(`✅ Batch sentiment analysis complete: ${Object.keys(results).length} symbols processed`);
    return results;
  }

  /**
   * Get sentiment summary statistics
   */
  getSentimentSummary() {
    const cached = Array.from(this.sentimentCache.values());
    
    if (cached.length === 0) {
      return { totalSymbols: 0, avgSentiment: 0, distribution: {} };
    }
    
    const scores = cached.map(c => c.overall.score);
    const avgSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    const distribution = {
      veryPositive: scores.filter(s => s > 0.6).length,
      positive: scores.filter(s => s > 0.3 && s <= 0.6).length,
      neutral: scores.filter(s => s >= -0.3 && s <= 0.3).length,
      negative: scores.filter(s => s >= -0.6 && s < -0.3).length,
      veryNegative: scores.filter(s => s < -0.6).length
    };
    
    return {
      totalSymbols: cached.length,
      avgSentiment: avgSentiment,
      distribution: distribution,
      lastUpdated: Math.max(...cached.map(c => c.timestamp.getTime()))
    };
  }
}

module.exports = SentimentAnalysisService;
