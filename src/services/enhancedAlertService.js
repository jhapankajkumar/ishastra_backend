/**
 * Enhanced Alert Service with Sentiment Integration
 * Phase 5: Integrating Sentiment Analysis with Alert System
 * 
 * Features:
 * - Sentiment-enhanced trading signals
 * - News-driven alert filtering
 * - Social sentiment monitoring
 * - Confidence boosting/reduction based on sentiment
 * - Real-time sentiment-alert integration
 */

const AlertService = require('./alertService');
const SentimentAnalysisService = require('./sentimentAnalysisService');

class EnhancedAlertService extends AlertService {
  constructor(config = {}) {
    super();
    
    // Initialize sentiment analysis service
    this.sentimentService = new SentimentAnalysisService({
      enableNews: true,
      enableSocial: true,
      sentimentThreshold: 0.6,
      newsLookbackHours: 24,
      maxArticles: 50
    });

    this.config = {
      useSentimentFiltering: config.useSentimentFiltering !== false,
      sentimentBoostThreshold: config.sentimentBoostThreshold || 0.3,
      sentimentCautionThreshold: config.sentimentCautionThreshold || -0.3,
      maxSentimentBoost: config.maxSentimentBoost || 20, // Max 20% boost
      maxSentimentReduction: config.maxSentimentReduction || 20 // Max 20% reduction
    };

    // Set up sentiment event listeners
    this.setupSentimentEventListeners();

    console.log('🔗 Enhanced Alert Service with Sentiment Analysis initialized');
    console.log(`   Sentiment filtering: ${this.config.useSentimentFiltering ? 'Enabled' : 'Disabled'}`);
    console.log(`   Sentiment boost threshold: ${this.config.sentimentBoostThreshold}`);
    console.log(`   Sentiment caution threshold: ${this.config.sentimentCautionThreshold}`);
  }

  /**
   * Set up sentiment analysis event listeners
   */
  setupSentimentEventListeners() {
    this.sentimentService.on('sentimentAnalyzed', (data) => {
      this.handleSentimentUpdate(data);
    });
  }

  /**
   * Enhanced signal processing with sentiment analysis
   */
  async processSignal(symbol, system, signal, config) {
    try {
      console.log(`    🧠 Processing signal with sentiment analysis for ${symbol}...`);
      
      // Get or analyze sentiment
      const sentimentAnalysis = await this.sentimentService.getCachedOrFreshSentiment(symbol, 30);
      
      // Enhance signal with sentiment
      const enhancedSignal = await this.sentimentService.enhanceSignalWithSentiment({
        ...signal,
        confidence: this.calculateConfidence(system, signal)
      }, sentimentAnalysis);

      // Apply sentiment filtering if enabled
      if (this.config.useSentimentFiltering && this.shouldFilterSignal(enhancedSignal, sentimentAnalysis)) {
        console.log(`    ⚠️  Signal filtered out by sentiment analysis for ${symbol}`);
        return null;
      }

      // Generate enhanced alert
      const systemPerformance = this.performanceThresholds[system];
      const currentPrice = this.watchlist.get(symbol).lastPrice;
      
      const alert = {
        id: ++this.alertCounter,
        symbol,
        system,
        type: signal.direction === 'LONG' ? 'ENTRY_LONG' : 'ENTRY_SHORT',
        price: currentPrice,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        target: signal.targets?.[0] || null,
        
        // Original confidence
        baseConfidence: enhancedSignal.originalConfidence,
        
        // Sentiment-enhanced confidence
        confidence: enhancedSignal.enhancedConfidence,
        
        // Sentiment data
        sentimentScore: enhancedSignal.sentimentScore,
        sentimentImpact: enhancedSignal.sentimentImpact,
        sentimentBoost: enhancedSignal.enhancement.boost,
        
        historicalWinRate: systemPerformance.minWinRate,
        message: this.generateEnhancedAlertMessage(symbol, system, enhancedSignal, systemPerformance, sentimentAnalysis),
        timestamp: new Date(),
        isTriggered: false,
        
        // Sentiment analysis details
        sentimentAnalysis: {
          overall: sentimentAnalysis.overall,
          news: {
            score: sentimentAnalysis.news.score,
            articles: sentimentAnalysis.news.articles,
            keywords: sentimentAnalysis.news.keywords.slice(0, 3) // Top 3 keywords
          },
          social: {
            score: sentimentAnalysis.social.score,
            mentions: sentimentAnalysis.social.mentions
          },
          recommendation: sentimentAnalysis.recommendation,
          enhancementReason: enhancedSignal.enhancement.reason
        }
      };

      // Store alert
      this.activeAlerts.set(alert.id, alert);
      
      // Add to symbol's alert history
      const watchConfig = this.watchlist.get(symbol);
      watchConfig.alertHistory.push(alert);

      // Send enhanced notifications
      await this.sendEnhancedNotifications(alert, config.notificationMethods);

      // Emit enhanced alert event
      this.emit('alertGenerated', alert);

      console.log(`    🚨 Enhanced ${alert.type} alert generated for ${symbol} (${system} system)`);
      console.log(`       Base confidence: ${alert.baseConfidence.toFixed(1)}% → Enhanced: ${alert.confidence.toFixed(1)}%`);
      console.log(`       Sentiment impact: ${alert.sentimentImpact} (${alert.sentimentScore >= 0 ? '+' : ''}${alert.sentimentScore.toFixed(3)})`);
      
      return alert;

    } catch (error) {
      console.log(`      ❌ Error processing enhanced signal for ${symbol}: ${error.message}`);
      // Fall back to basic signal processing
      return await super.processSignal(symbol, system, signal, config);
    }
  }

  /**
   * Determine if signal should be filtered based on sentiment
   */
  shouldFilterSignal(enhancedSignal, sentimentAnalysis) {
    const { overall } = sentimentAnalysis;
    const { sentimentScore, sentimentImpact } = enhancedSignal;
    
    // Don't filter if sentiment confidence is low
    if (overall.confidence < 0.5) return false;
    
    // Filter very negative sentiment for LONG positions
    if (enhancedSignal.direction === 'LONG' && 
        sentimentScore < -0.6 && 
        overall.confidence > 0.7) {
      return true;
    }
    
    // Filter very positive sentiment for SHORT positions
    if (enhancedSignal.direction === 'SHORT' && 
        sentimentScore > 0.6 && 
        overall.confidence > 0.7) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate enhanced alert message with sentiment context
   */
  generateEnhancedAlertMessage(symbol, system, enhancedSignal, systemPerformance, sentimentAnalysis) {
    const direction = enhancedSignal.direction === 'LONG' ? '📈 LONG' : '📉 SHORT';
    const systemName = system.toUpperCase();
    const winRate = systemPerformance.minWinRate;
    const sentimentEmoji = this.getSentimentEmoji(sentimentAnalysis.overall.score);
    
    let message = `${direction} signal detected for ${symbol} using ${systemName} system (${winRate}% historical win rate). `;
    message += `Entry: $${enhancedSignal.entryPrice?.toFixed(2) || 'Market'}, `;
    message += `Stop: $${enhancedSignal.stopLoss?.toFixed(2)}, `;
    message += `Target: $${enhancedSignal.targets?.[0]?.toFixed(2) || 'Dynamic'}. `;
    
    // Add sentiment context
    message += `${sentimentEmoji} Sentiment: ${sentimentAnalysis.overall.score.toFixed(2)} `;
    message += `(${sentimentAnalysis.news.articles} news articles, ${sentimentAnalysis.social.mentions} social mentions). `;
    
    // Add confidence enhancement info
    const boost = enhancedSignal.enhancement.boost;
    if (Math.abs(boost) > 2) {
      const direction = boost > 0 ? 'boosted' : 'reduced';
      message += `Confidence ${direction} by ${Math.abs(boost).toFixed(1)}% due to ${enhancedSignal.sentimentImpact.toLowerCase()} sentiment.`;
    }
    
    return message;
  }

  /**
   * Get sentiment emoji representation
   */
  getSentimentEmoji(score) {
    if (score > 0.6) return '🚀';      // Very positive
    if (score > 0.3) return '📈';      // Positive
    if (score > -0.3) return '➡️';     // Neutral
    if (score > -0.6) return '📉';     // Negative
    return '⚠️';                       // Very negative
  }

  /**
   * Send enhanced notifications with sentiment context
   */
  async sendEnhancedNotifications(alert, methods) {
    for (const method of methods) {
      switch (method) {
        case 'console':
          this.sendEnhancedConsoleNotification(alert);
          break;
        case 'email':
          await this.sendEnhancedEmailNotification(alert);
          break;
        case 'push':
          await this.sendEnhancedPushNotification(alert);
          break;
      }
    }
  }

  /**
   * Enhanced console notification with sentiment details
   */
  sendEnhancedConsoleNotification(alert) {
    console.log('\n🚨 ENHANCED TRADING ALERT 🚨');
    console.log(`Symbol: ${alert.symbol}`);
    console.log(`System: ${alert.system.toUpperCase()}`);
    console.log(`Signal: ${alert.type}`);
    console.log(`Price: $${alert.price?.toFixed(2)}`);
    console.log(`Base Confidence: ${alert.baseConfidence.toFixed(1)}%`);
    console.log(`Enhanced Confidence: ${alert.confidence.toFixed(1)}% (${alert.sentimentBoost >= 0 ? '+' : ''}${alert.sentimentBoost.toFixed(1)}%)`);
    console.log(`Historical Win Rate: ${alert.historicalWinRate}%`);
    
    // Sentiment details
    console.log('');
    console.log('📰 SENTIMENT ANALYSIS:');
    console.log(`Overall Score: ${alert.sentimentScore.toFixed(3)} (${alert.sentimentImpact})`);
    console.log(`News Sentiment: ${alert.sentimentAnalysis.news.score.toFixed(3)} (${alert.sentimentAnalysis.news.articles} articles)`);
    console.log(`Social Sentiment: ${alert.sentimentAnalysis.social.score.toFixed(3)} (${alert.sentimentAnalysis.social.mentions} mentions)`);
    
    if (alert.sentimentAnalysis.news.keywords.length > 0) {
      console.log(`Key Terms: ${alert.sentimentAnalysis.news.keywords.join(', ')}`);
    }
    
    console.log(`Enhancement: ${alert.sentimentAnalysis.enhancementReason}`);
    console.log(`Recommendation: ${alert.sentimentAnalysis.recommendation}`);
    
    console.log('');
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp.toLocaleString()}`);
    console.log('─'.repeat(60));
  }

  /**
   * Enhanced email notification (placeholder)
   */
  async sendEnhancedEmailNotification(alert) {
    // TODO: Implement enhanced email notification with sentiment charts
    console.log(`📧 Enhanced email notification sent for ${alert.symbol} ${alert.type} (Sentiment: ${alert.sentimentScore.toFixed(2)})`);
  }

  /**
   * Enhanced push notification (placeholder)
   */
  async sendEnhancedPushNotification(alert) {
    // TODO: Implement enhanced push notification
    const sentimentEmoji = this.getSentimentEmoji(alert.sentimentScore);
    console.log(`📱 Enhanced push: ${sentimentEmoji} ${alert.symbol} ${alert.type} - Confidence: ${alert.confidence.toFixed(1)}%`);
  }

  /**
   * Handle sentiment updates
   */
  handleSentimentUpdate(data) {
    const { symbol, analysis } = data;
    
    // Check if we have active positions or alerts for this symbol
    const watchConfig = this.watchlist.get(symbol);
    if (watchConfig) {
      console.log(`📊 Sentiment update for monitored stock ${symbol}: ${analysis.overall.score.toFixed(3)} (${analysis.recommendation})`);
      
      // Emit sentiment update event for portfolio management
      this.emit('sentimentUpdated', { symbol, sentiment: analysis });
      
      // Check for significant sentiment changes
      const trend = this.sentimentService.getSentimentTrend(symbol, 6);
      if (trend.trend === 'IMPROVING' && trend.change > 0.3) {
        console.log(`📈 Significant positive sentiment shift detected for ${symbol}: +${trend.change.toFixed(2)}`);
      } else if (trend.trend === 'DECLINING' && trend.change < -0.3) {
        console.log(`📉 Significant negative sentiment shift detected for ${symbol}: ${trend.change.toFixed(2)}`);
      }
    }
  }

  /**
   * Batch sentiment analysis for watchlist
   */
  async refreshWatchlistSentiment() {
    const symbols = Array.from(this.watchlist.keys());
    if (symbols.length === 0) return;

    console.log(`🔄 Refreshing sentiment analysis for ${symbols.length} watchlist stocks...`);
    
    try {
      const sentimentBatch = await this.sentimentService.batchAnalyzeSentiment(symbols);
      
      let positiveSentiment = 0;
      let negativeSentiment = 0;
      
      for (const [symbol, sentiment] of Object.entries(sentimentBatch)) {
        if (sentiment.overall.score > 0.3) positiveSentiment++;
        else if (sentiment.overall.score < -0.3) negativeSentiment++;
      }
      
      console.log(`✅ Watchlist sentiment refresh complete:`);
      console.log(`   Positive sentiment: ${positiveSentiment} stocks`);
      console.log(`   Negative sentiment: ${negativeSentiment} stocks`);
      console.log(`   Neutral sentiment: ${symbols.length - positiveSentiment - negativeSentiment} stocks`);
      
      // Emit batch sentiment update
      this.emit('batchSentimentUpdated', { symbols, sentiments: sentimentBatch });
      
    } catch (error) {
      console.error('❌ Error refreshing watchlist sentiment:', error.message);
    }
  }

  /**
   * Get enhanced watchlist status with sentiment
   */
  getEnhancedWatchlistStatus() {
    const baseStatus = super.getWatchlistStatus();
    
    const watchlistWithSentiment = baseStatus.watchlist.map(item => {
      const sentiment = this.sentimentService.sentimentCache.get(item.symbol);
      return {
        ...item,
        sentiment: sentiment ? {
          score: sentiment.overall.score,
          confidence: sentiment.overall.confidence,
          recommendation: sentiment.recommendation,
          lastAnalyzed: sentiment.timestamp
        } : null
      };
    });
    
    const sentimentSummary = this.sentimentService.getSentimentSummary();
    
    return {
      ...baseStatus,
      watchlist: watchlistWithSentiment,
      sentimentSummary: sentimentSummary.totalSymbols > 0 ? {
        averageScore: sentimentSummary.avgSentiment,
        positiveCount: sentimentSummary.distribution.veryPositive + sentimentSummary.distribution.positive,
        negativeCount: sentimentSummary.distribution.negative + sentimentSummary.distribution.veryNegative,
        neutralCount: sentimentSummary.distribution.neutral,
        totalSymbols: sentimentSummary.totalSymbols,
        lastUpdated: new Date(sentimentSummary.lastUpdated)
      } : null
    };
  }

  /**
   * Start enhanced monitoring with sentiment analysis
   */
  startEnhancedMonitoring(intervalMinutes = 5, sentimentRefreshMinutes = 30) {
    // Start basic monitoring
    this.startMonitoring(intervalMinutes);
    
    // Set up periodic sentiment refresh
    this.sentimentRefreshInterval = setInterval(() => {
      this.refreshWatchlistSentiment();
    }, sentimentRefreshMinutes * 60 * 1000);
    
    // Initial sentiment analysis
    setTimeout(() => {
      this.refreshWatchlistSentiment();
    }, 5000); // 5 seconds after start
    
    console.log(`🔗 Enhanced monitoring started with sentiment refresh every ${sentimentRefreshMinutes} minutes`);
  }

  /**
   * Stop enhanced monitoring
   */
  stopEnhancedMonitoring() {
    this.stopMonitoring();
    
    if (this.sentimentRefreshInterval) {
      clearInterval(this.sentimentRefreshInterval);
      this.sentimentRefreshInterval = null;
      console.log('⏹️  Sentiment refresh stopped');
    }
  }

  /**
   * Generate sentiment-enhanced alert for a specific symbol
   * @param {string} symbol - Stock symbol to analyze
   * @returns {Object} Enhanced alert with sentiment analysis
   */
  async generateSentimentEnhancedAlert(symbol) {
    try {
      console.log(`🔔 Generating sentiment-enhanced alert for ${symbol}...`);

      // Get sentiment analysis for the symbol
      const sentimentAnalysis = await this.sentimentService.analyzeSentiment(symbol, {
        includeNews: true,
        includeRealNews: true
      });

      // Create a basic alert structure
      const alert = {
        symbol: symbol,
        timestamp: new Date(),
        type: 'SENTIMENT_ALERT',
        priority: this.determinePriority(sentimentAnalysis),
        confidence: this.calculateConfidence(sentimentAnalysis),
        sentimentAnalysis: {
          overall: sentimentAnalysis.overall || 0,
          news: sentimentAnalysis.news || {},
          social: sentimentAnalysis.social || {},
          impact: sentimentAnalysis.impact || 'NEUTRAL'
        },
        recommendation: this.generateRecommendation(sentimentAnalysis),
        reasoning: this.generateReasoning(sentimentAnalysis)
      };

      console.log(`✅ Generated ${alert.priority} priority alert for ${symbol} with ${alert.confidence}% confidence`);
      return alert;

    } catch (error) {
      console.error(`❌ Error generating sentiment alert for ${symbol}:`, error.message);
      return {
        symbol: symbol,
        error: error.message,
        timestamp: new Date(),
        type: 'ERROR_ALERT',
        priority: 'LOW',
        confidence: 0
      };
    }
  }

  /**
   * Determine alert priority based on sentiment analysis
   */
  determinePriority(sentimentAnalysis) {
    const overall = sentimentAnalysis.overall || 0;
    
    if (Math.abs(overall) > 0.7) {
      return 'HIGH';
    } else if (Math.abs(overall) > 0.3) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Calculate confidence based on sentiment strength and data quality
   */
  calculateConfidence(sentimentAnalysis) {
    // ✅ VALIDATE SENTIMENT ANALYSIS INPUT
    if (!sentimentAnalysis || typeof sentimentAnalysis !== 'object') {
      console.warn('⚠️ Invalid sentimentAnalysis input for confidence calculation');
      return 50; // Default confidence
    }

    // Handle both object and numeric overall values
    let overall = 0;
    if (sentimentAnalysis.overall && typeof sentimentAnalysis.overall === 'object') {
      overall = Math.abs(sentimentAnalysis.overall.score || 0);
    } else {
      overall = Math.abs(sentimentAnalysis.overall || 0);
    }
    
    const newsCount = sentimentAnalysis.news?.articleCount || sentimentAnalysis.news?.articles || 0;
    
    // ✅ VALIDATE OVERALL SENTIMENT VALUE
    if (isNaN(overall) || !isFinite(overall)) {
      console.warn('⚠️ Invalid overall sentiment value for confidence calculation:', overall);
      return 50; // Default confidence
    }
    
    let confidence = overall * 100; // Base confidence from sentiment strength
    
    // ✅ VALIDATE CONFIDENCE CALCULATION
    if (isNaN(confidence) || !isFinite(confidence)) {
      console.warn('⚠️ Invalid confidence calculation result:', confidence);
      return 50; // Default confidence
    }
    
    // Boost confidence if we have more news articles
    if (newsCount > 10) {
      confidence = Math.min(100, confidence * 1.2);
    } else if (newsCount > 5) {
      confidence = Math.min(100, confidence * 1.1);
    }
    
    // ✅ FINAL VALIDATION BEFORE RETURN
    const finalConfidence = Math.round(confidence);
    if (isNaN(finalConfidence) || !isFinite(finalConfidence)) {
      console.warn('⚠️ Invalid final confidence value:', finalConfidence);
      return 50; // Default confidence
    }
    
    return finalConfidence;
  }

  /**
   * Generate recommendation based on sentiment
   */
  generateRecommendation(sentimentAnalysis) {
    const overall = sentimentAnalysis.overall || 0;
    
    if (overall > 0.5) {
      return 'STRONG_BUY';
    } else if (overall > 0.2) {
      return 'BUY';
    } else if (overall < -0.5) {
      return 'STRONG_SELL';
    } else if (overall < -0.2) {
      return 'SELL';
    }
    return 'HOLD';
  }

  /**
   * Generate human-readable reasoning for the alert
   */
  generateReasoning(sentimentAnalysis) {
    const overall = sentimentAnalysis.overall || 0;
    const newsCount = sentimentAnalysis.news?.articleCount || 0;
    
    let reasoning = `Sentiment analysis based on ${newsCount} news articles. `;
    
    if (overall > 0.5) {
      reasoning += 'Very positive market sentiment detected with strong bullish indicators.';
    } else if (overall > 0.2) {
      reasoning += 'Positive market sentiment with moderate bullish signals.';
    } else if (overall < -0.5) {
      reasoning += 'Very negative market sentiment detected with strong bearish indicators.';
    } else if (overall < -0.2) {
      reasoning += 'Negative market sentiment with moderate bearish signals.';
    } else {
      reasoning += 'Neutral market sentiment with mixed signals.';
    }
    
    return reasoning;
  }
}

module.exports = EnhancedAlertService;
