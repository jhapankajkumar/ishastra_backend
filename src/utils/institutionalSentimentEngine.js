/**
 * 🧠 INSTITUTIONAL SENTIMENT FUSION ENGINE
 * Multi-Modal Sentiment Analysis with Deep Learning and Alternative Data
 * 
 * TOP 1% FEATURES:
 * - Real-time Social Media Sentiment (Twitter, Reddit, Discord)
 * - Earnings Call Transcript Analysis with NLP
 * - Insider Trading Pattern Detection
 * - Institutional Holdings Change Analysis
 * - News Impact Prediction using Transformer Models
 * - Cross-Asset Correlation Sentiment (Bonds, Commodities, FX)
 * - Sector Rotation and Theme-based Sentiment
 * - Regulatory Sentiment and Policy Impact Analysis
 */

const tf = require('@tensorflow/tfjs-node');
const axios = require('axios');

class InstitutionalSentimentEngine {
  constructor() {
    this.sentimentModel = null;
    this.transformerModel = null;
    this.insiderTradingModel = null;
    this.sectorRotationModel = null;
    
    // Alternative data sources
    this.socialMediaSources = ['twitter', 'reddit', 'discord', 'stocktwits'];
    this.institutionalDataSources = ['13f_filings', 'insider_trades', 'analyst_revisions'];
    this.macroSentimentSources = ['fed_minutes', 'economic_data', 'geopolitical_events'];
    
    this.initializeSentimentModels();
  }

  async initializeSentimentModels() {
    console.log('🧠 Initializing Institutional Sentiment Fusion Engine...');
    
    try {
      // 1. Deep Learning Sentiment Model (BERT-like transformer)
      this.sentimentModel = this.createAdvancedSentimentModel();
      
      // 2. News Impact Prediction Model
      this.transformerModel = this.createNewsImpactModel();
      
      // 3. Insider Trading Pattern Model
      this.insiderTradingModel = this.createInsiderTradingModel();
      
      // 4. Sector Rotation Prediction Model
      this.sectorRotationModel = this.createSectorRotationModel();
      
      console.log('✅ Institutional Sentiment Engine Initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize sentiment models:', error.message);
    }
  }

  /**
   * 🎯 MASTER SENTIMENT ANALYSIS
   * Combines all sentiment sources with institutional weighting
   */
  async analyzeSentimentFusion(symbol, sector, marketCap) {
    console.log(`🧠 Starting Institutional Sentiment Fusion for ${symbol}...`);
    
    const fusionAnalysis = {
      overallSentiment: 'NEUTRAL',
      confidence: 0,
      institutionalSentiment: 'NEUTRAL',
      retailSentiment: 'NEUTRAL',
      smartMoneySentiment: 'NEUTRAL',
      sentimentMomentum: 'STABLE',
      riskFactors: [],
      opportunityFactors: [],
      fusionScore: 0,
      components: {}
    };

    try {
      // Run all sentiment analyses in parallel
      const [
        socialSentiment,
        newsSentiment,
        insiderSentiment,
        institutionalFlowSentiment,
        macroSentiment,
        sectorSentiment,
        crossAssetSentiment
      ] = await Promise.allSettled([
        this.analyzeSocialMediaSentiment(symbol),
        this.analyzeNewsImpactSentiment(symbol),
        this.analyzeInsiderTradingSentiment(symbol),
        this.analyzeInstitutionalFlowSentiment(symbol),
        this.analyzeMacroSentiment(symbol, sector),
        this.analyzeSectorRotationSentiment(symbol, sector),
        this.analyzeCrossAssetSentiment(symbol, sector)
      ]);

      // Extract successful results
      const components = {
        socialMedia: socialSentiment.status === 'fulfilled' ? socialSentiment.value : this.createFallbackComponent(),
        newsImpact: newsSentiment.status === 'fulfilled' ? newsSentiment.value : this.createFallbackComponent(),
        insiderTrading: insiderSentiment.status === 'fulfilled' ? insiderSentiment.value : this.createFallbackComponent(),
        institutionalFlow: institutionalFlowSentiment.status === 'fulfilled' ? institutionalFlowSentiment.value : this.createFallbackComponent(),
        macroEnvironment: macroSentiment.status === 'fulfilled' ? macroSentiment.value : this.createFallbackComponent(),
        sectorRotation: sectorSentiment.status === 'fulfilled' ? sectorSentiment.value : this.createFallbackComponent(),
        crossAsset: crossAssetSentiment.status === 'fulfilled' ? crossAssetSentiment.value : this.createFallbackComponent()
      };

      fusionAnalysis.components = components;

      // Calculate fusion scores with institutional weighting
      const fusionScore = this.calculateInstitutionalFusionScore(components, marketCap);
      fusionAnalysis.fusionScore = fusionScore.score;
      fusionAnalysis.overallSentiment = fusionScore.sentiment;
      fusionAnalysis.confidence = fusionScore.confidence;

      // Separate institutional vs retail sentiment
      const sentimentBreakdown = this.separateInstitutionalRetailSentiment(components);
      fusionAnalysis.institutionalSentiment = sentimentBreakdown.institutional;
      fusionAnalysis.retailSentiment = sentimentBreakdown.retail;
      fusionAnalysis.smartMoneySentiment = sentimentBreakdown.smartMoney;

      // Analyze sentiment momentum
      fusionAnalysis.sentimentMomentum = this.analyzeSentimentMomentum(components);

      // Identify risk and opportunity factors
      const factorAnalysis = this.identifyRiskOpportunityFactors(components);
      fusionAnalysis.riskFactors = factorAnalysis.risks;
      fusionAnalysis.opportunityFactors = factorAnalysis.opportunities;

      return fusionAnalysis;

    } catch (error) {
      console.error('❌ Sentiment Fusion Analysis failed:', error.message);
      return this.createFallbackSentimentAnalysis();
    }
  }

  /**
   * 📱 SOCIAL MEDIA SENTIMENT ANALYSIS
   * Real-time social sentiment with bot detection and influence weighting
   */
  async analyzeSocialMediaSentiment(symbol) {
    console.log(`📱 Analyzing social media sentiment for ${symbol}...`);
    
    const socialAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      volume: 0,
      momentum: 'STABLE',
      influencerSentiment: 'NEUTRAL',
      botDetection: { detected: false, percentage: 0 },
      platforms: {},
      viralRisk: 'LOW',
      communityHealth: 'NORMAL'
    };

    try {
      // Analyze multiple social media platforms
      const platformPromises = this.socialMediaSources.map(platform => 
        this.analyzePlatformSentiment(symbol, platform)
      );

      const platformResults = await Promise.allSettled(platformPromises);
      
      // Process platform results
      platformResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const platform = this.socialMediaSources[index];
          socialAnalysis.platforms[platform] = result.value;
        }
      });

      // Aggregate sentiment across platforms with weighting
      const aggregatedSentiment = this.aggregatePlatformSentiments(socialAnalysis.platforms);
      socialAnalysis.sentiment = aggregatedSentiment.sentiment;
      socialAnalysis.confidence = aggregatedSentiment.confidence;
      socialAnalysis.volume = aggregatedSentiment.volume;

      // Detect bot activity and adjust sentiment
      const botAnalysis = this.detectBotActivity(socialAnalysis.platforms);
      socialAnalysis.botDetection = botAnalysis;
      if (botAnalysis.detected && botAnalysis.percentage > 0.3) {
        socialAnalysis.confidence *= 0.7; // Reduce confidence due to bot activity
      }

      // Analyze influencer sentiment separately (higher weight)
      socialAnalysis.influencerSentiment = this.analyzeInfluencerSentiment(socialAnalysis.platforms);

      // Detect viral risk (sudden spike in negative sentiment)
      socialAnalysis.viralRisk = this.detectViralRisk(socialAnalysis);

      return socialAnalysis;

    } catch (error) {
      console.error('❌ Social Media Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * 📰 NEWS IMPACT SENTIMENT ANALYSIS
   * Advanced NLP with transformer models for news impact prediction
   */
  async analyzeNewsImpactSentiment(symbol) {
    console.log(`📰 Analyzing news impact sentiment for ${symbol}...`);
    
    const newsAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      impactScore: 0,
      urgency: 'LOW',
      credibility: 'MEDIUM',
      thematicAlignment: 'NEUTRAL',
      predictedPriceImpact: { direction: 'NEUTRAL', magnitude: 0 },
      keyTopics: [],
      sentimentEvolution: []
    };

    try {
      // Fetch recent news articles
      const newsData = await this.fetchRecentNews(symbol);
      
      if (!newsData || newsData.length === 0) {
        return newsAnalysis;
      }

      // Process each article with advanced NLP
      const articleAnalyses = [];
      for (const article of newsData) {
        const analysis = await this.analyzeNewsArticle(article);
        articleAnalyses.push(analysis);
      }

      // Aggregate news sentiment with recency weighting
      const aggregatedSentiment = this.aggregateNewsAnalyses(articleAnalyses);
      newsAnalysis.sentiment = aggregatedSentiment.sentiment;
      newsAnalysis.confidence = aggregatedSentiment.confidence;
      newsAnalysis.impactScore = aggregatedSentiment.impactScore;

      // Predict price impact using transformer model
      if (this.transformerModel) {
        const priceImpact = await this.predictPriceImpact(articleAnalyses);
        newsAnalysis.predictedPriceImpact = priceImpact;
      }

      // Analyze news credibility and urgency
      newsAnalysis.credibility = this.analyzeNewsCredibility(articleAnalyses);
      newsAnalysis.urgency = this.analyzeNewsUrgency(articleAnalyses);

      // Extract key topics and themes
      newsAnalysis.keyTopics = this.extractKeyTopics(articleAnalyses);
      newsAnalysis.thematicAlignment = this.analyzeThematicAlignment(newsAnalysis.keyTopics);

      // Track sentiment evolution over time
      newsAnalysis.sentimentEvolution = this.trackSentimentEvolution(articleAnalyses);

      return newsAnalysis;

    } catch (error) {
      console.error('❌ News Impact Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * 🔍 INSIDER TRADING SENTIMENT ANALYSIS
   * Detects insider trading patterns and their sentiment implications
   */
  async analyzeInsiderTradingSentiment(symbol) {
    console.log(`🔍 Analyzing insider trading sentiment for ${symbol}...`);
    
    const insiderAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      recentActivity: 'NORMAL',
      buyingSentiment: 'NEUTRAL',
      sellingSentiment: 'NEUTRAL',
      executiveSentiment: 'NEUTRAL',
      directorSentiment: 'NEUTRAL',
      insiderScore: 0,
      patterns: [],
      riskSignals: []
    };

    try {
      // Fetch insider trading data
      const insiderData = await this.fetchInsiderTradingData(symbol);
      
      if (!insiderData || insiderData.length === 0) {
        return insiderAnalysis;
      }

      // Analyze insider trading patterns
      const patternAnalysis = this.analyzeInsiderPatterns(insiderData);
      insiderAnalysis.patterns = patternAnalysis.patterns;
      insiderAnalysis.recentActivity = patternAnalysis.activityLevel;

      // Separate buying vs selling sentiment
      const tradingBreakdown = this.analyzeInsiderTradingBreakdown(insiderData);
      insiderAnalysis.buyingSentiment = tradingBreakdown.buying;
      insiderAnalysis.sellingSentiment = tradingBreakdown.selling;

      // Analyze by role (executives vs directors)
      const roleAnalysis = this.analyzeInsiderByRole(insiderData);
      insiderAnalysis.executiveSentiment = roleAnalysis.executives;
      insiderAnalysis.directorSentiment = roleAnalysis.directors;

      // Calculate overall insider sentiment score
      const sentimentScore = this.calculateInsiderSentimentScore(
        tradingBreakdown, roleAnalysis, patternAnalysis
      );
      insiderAnalysis.insiderScore = sentimentScore.score;
      insiderAnalysis.sentiment = sentimentScore.sentiment;
      insiderAnalysis.confidence = sentimentScore.confidence;

      // Detect risk signals (unusual selling patterns)
      insiderAnalysis.riskSignals = this.detectInsiderRiskSignals(insiderData, patternAnalysis);

      return insiderAnalysis;

    } catch (error) {
      console.error('❌ Insider Trading Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * 🏦 INSTITUTIONAL FLOW SENTIMENT ANALYSIS
   * Analyzes institutional money flow patterns and sentiment
   */
  async analyzeInstitutionalFlowSentiment(symbol) {
    console.log(`🏦 Analyzing institutional flow sentiment for ${symbol}...`);
    
    const flowAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      flowDirection: 'NEUTRAL',
      flowMagnitude: 0,
      institutionalTypes: {},
      hedgeFundSentiment: 'NEUTRAL',
      mutualFundSentiment: 'NEUTRAL',
      pensionFundSentiment: 'NEUTRAL',
      etfFlowSentiment: 'NEUTRAL',
      flowConsistency: 'STABLE',
      concentrationRisk: 'LOW'
    };

    try {
      // Fetch institutional holdings data (13F filings, etc.)
      const institutionalData = await this.fetchInstitutionalHoldingsData(symbol);
      
      if (!institutionalData || institutionalData.length === 0) {
        return flowAnalysis;
      }

      // Analyze flow by institution type
      const typeAnalysis = this.analyzeFlowByInstitutionType(institutionalData);
      flowAnalysis.institutionalTypes = typeAnalysis.types;
      flowAnalysis.hedgeFundSentiment = typeAnalysis.hedgeFunds;
      flowAnalysis.mutualFundSentiment = typeAnalysis.mutualFunds;
      flowAnalysis.pensionFundSentiment = typeAnalysis.pensionFunds;

      // Analyze ETF flows separately
      const etfFlowData = await this.fetchETFFlowData(symbol);
      flowAnalysis.etfFlowSentiment = this.analyzeETFFlowSentiment(etfFlowData);

      // Calculate overall flow sentiment
      const overallFlow = this.calculateOverallFlowSentiment(
        typeAnalysis, flowAnalysis.etfFlowSentiment
      );
      flowAnalysis.sentiment = overallFlow.sentiment;
      flowAnalysis.confidence = overallFlow.confidence;
      flowAnalysis.flowDirection = overallFlow.direction;
      flowAnalysis.flowMagnitude = overallFlow.magnitude;

      // Analyze flow consistency and concentration risk
      flowAnalysis.flowConsistency = this.analyzeFlowConsistency(institutionalData);
      flowAnalysis.concentrationRisk = this.analyzeConcentrationRisk(institutionalData);

      return flowAnalysis;

    } catch (error) {
      console.error('❌ Institutional Flow Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * 🌍 MACRO SENTIMENT ANALYSIS
   * Analyzes macroeconomic factors and their impact on sector/stock sentiment
   */
  async analyzeMacroSentiment(symbol, sector) {
    console.log(`🌍 Analyzing macro sentiment for ${symbol} in ${sector} sector...`);
    
    const macroAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      economicEnvironment: 'NEUTRAL',
      monetaryPolicySentiment: 'NEUTRAL',
      geopoliticalSentiment: 'NEUTRAL',
      sectorSpecificMacro: 'NEUTRAL',
      inflationImpact: 'NEUTRAL',
      interestRateImpact: 'NEUTRAL',
      dollarImpact: 'NEUTRAL',
      commodityImpact: 'NEUTRAL',
      riskFactors: []
    };

    try {
      // Analyze multiple macro factors in parallel
      const [
        economicData,
        monetaryPolicy,
        geopolitical,
        sectorMacro,
        marketRegime
      ] = await Promise.allSettled([
        this.analyzeEconomicDataSentiment(),
        this.analyzeMonetaryPolicySentiment(),
        this.analyzeGeopoliticalSentiment(),
        this.analyzeSectorSpecificMacro(sector),
        this.analyzeMarketRegimeSentiment()
      ]);

      // Process results
      if (economicData.status === 'fulfilled') {
        const econ = economicData.value;
        macroAnalysis.economicEnvironment = econ.sentiment;
        macroAnalysis.inflationImpact = econ.inflationImpact;
      }

      if (monetaryPolicy.status === 'fulfilled') {
        const monetary = monetaryPolicy.value;
        macroAnalysis.monetaryPolicySentiment = monetary.sentiment;
        macroAnalysis.interestRateImpact = monetary.rateImpact;
      }

      if (geopolitical.status === 'fulfilled') {
        macroAnalysis.geopoliticalSentiment = geopolitical.value.sentiment;
      }

      if (sectorMacro.status === 'fulfilled') {
        const sector = sectorMacro.value;
        macroAnalysis.sectorSpecificMacro = sector.sentiment;
        macroAnalysis.commodityImpact = sector.commodityImpact;
      }

      // Analyze currency impact
      macroAnalysis.dollarImpact = await this.analyzeDollarImpactSentiment(symbol);

      // Calculate overall macro sentiment
      const overallMacro = this.calculateOverallMacroSentiment(macroAnalysis);
      macroAnalysis.sentiment = overallMacro.sentiment;
      macroAnalysis.confidence = overallMacro.confidence;

      // Identify macro risk factors
      macroAnalysis.riskFactors = this.identifyMacroRiskFactors(macroAnalysis);

      return macroAnalysis;

    } catch (error) {
      console.error('❌ Macro Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * 🔄 SECTOR ROTATION SENTIMENT ANALYSIS
   * Analyzes sector rotation trends and their impact on individual stocks
   */
  async analyzeSectorRotationSentiment(symbol, sector) {
    console.log(`🔄 Analyzing sector rotation sentiment for ${symbol} in ${sector}...`);
    
    const rotationAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      sectorMomentum: 'NEUTRAL',
      rotationStage: 'NEUTRAL',
      relativeStrength: 0,
      institutionalRotation: 'NEUTRAL',
      retailRotation: 'NEUTRAL',
      themeAlignment: [],
      rotationRisk: 'LOW',
      opportunityScore: 0
    };

    try {
      // Analyze sector performance vs market
      const sectorPerformance = await this.analyzeSectorPerformance(sector);
      rotationAnalysis.sectorMomentum = sectorPerformance.momentum;
      rotationAnalysis.relativeStrength = sectorPerformance.relativeStrength;

      // Identify current rotation stage (Early Cycle, Mid Cycle, Late Cycle, Recession)
      const rotationStage = await this.identifyRotationStage();
      rotationAnalysis.rotationStage = rotationStage.stage;

      // Analyze rotation patterns by investor type
      const rotationPatterns = await this.analyzeRotationPatterns(sector);
      rotationAnalysis.institutionalRotation = rotationPatterns.institutional;
      rotationAnalysis.retailRotation = rotationPatterns.retail;

      // Analyze thematic alignment (ESG, Tech Innovation, Energy Transition, etc.)
      const themes = await this.analyzeThematicAlignment(sector);
      rotationAnalysis.themeAlignment = themes.alignedThemes;

      // Calculate rotation-based sentiment
      const rotationSentiment = this.calculateRotationSentiment(
        sectorPerformance, rotationStage, rotationPatterns, themes
      );
      rotationAnalysis.sentiment = rotationSentiment.sentiment;
      rotationAnalysis.confidence = rotationSentiment.confidence;
      rotationAnalysis.opportunityScore = rotationSentiment.opportunityScore;

      // Assess rotation risk (risk of sector falling out of favor)
      rotationAnalysis.rotationRisk = this.assessRotationRisk(
        rotationStage, sectorPerformance, rotationPatterns
      );

      return rotationAnalysis;

    } catch (error) {
      console.error('❌ Sector Rotation Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  /**
   * ⚖️ CROSS-ASSET SENTIMENT ANALYSIS
   * Analyzes sentiment from bonds, commodities, FX, and crypto markets
   */
  async analyzeCrossAssetSentiment(symbol, sector) {
    console.log(`⚖️ Analyzing cross-asset sentiment for ${symbol}...`);
    
    const crossAssetAnalysis = {
      sentiment: 'NEUTRAL',
      confidence: 0,
      bondSentiment: 'NEUTRAL',
      commoditySentiment: 'NEUTRAL',
      fxSentiment: 'NEUTRAL',
      cryptoSentiment: 'NEUTRAL',
      yieldCurveSentiment: 'NEUTRAL',
      volatilitySentiment: 'NEUTRAL',
      riskOnOffSentiment: 'NEUTRAL',
      correlationStrength: 0
    };

    try {
      // Analyze multiple asset classes in parallel
      const [
        bondAnalysis,
        commodityAnalysis,
        fxAnalysis,
        cryptoAnalysis,
        volatilityAnalysis
      ] = await Promise.allSettled([
        this.analyzeBondSentiment(sector),
        this.analyzeCommoditySentiment(sector),
        this.analyzeFXSentiment(symbol),
        this.analyzeCryptoSentiment(),
        this.analyzeVolatilitySentiment()
      ]);

      // Process results
      if (bondAnalysis.status === 'fulfilled') {
        crossAssetAnalysis.bondSentiment = bondAnalysis.value.sentiment;
        crossAssetAnalysis.yieldCurveSentiment = bondAnalysis.value.yieldCurveSentiment;
      }

      if (commodityAnalysis.status === 'fulfilled') {
        crossAssetAnalysis.commoditySentiment = commodityAnalysis.value.sentiment;
      }

      if (fxAnalysis.status === 'fulfilled') {
        crossAssetAnalysis.fxSentiment = fxAnalysis.value.sentiment;
      }

      if (cryptoAnalysis.status === 'fulfilled') {
        crossAssetAnalysis.cryptoSentiment = cryptoAnalysis.value.sentiment;
      }

      if (volatilityAnalysis.status === 'fulfilled') {
        crossAssetAnalysis.volatilitySentiment = volatilityAnalysis.value.sentiment;
      }

      // Determine risk-on vs risk-off sentiment
      crossAssetAnalysis.riskOnOffSentiment = this.determineRiskOnOffSentiment(crossAssetAnalysis);

      // Calculate correlation strength with equity markets
      crossAssetAnalysis.correlationStrength = await this.calculateCrossAssetCorrelation(symbol);

      // Calculate overall cross-asset sentiment
      const overallCrossAsset = this.calculateOverallCrossAssetSentiment(crossAssetAnalysis);
      crossAssetAnalysis.sentiment = overallCrossAsset.sentiment;
      crossAssetAnalysis.confidence = overallCrossAsset.confidence;

      return crossAssetAnalysis;

    } catch (error) {
      console.error('❌ Cross-Asset Sentiment Analysis failed:', error.message);
      return this.createFallbackComponent();
    }
  }

  // ========================================
  // FUSION AND AGGREGATION METHODS
  // ========================================

  calculateInstitutionalFusionScore(components, marketCap) {
    // Institutional weighting based on market cap and data reliability
    const weights = this.calculateInstitutionalWeights(marketCap);
    
    let totalScore = 0;
    let totalWeight = 0;
    let confidence = 0;

    // Weight each component based on institutional relevance
    Object.entries(components).forEach(([key, component]) => {
      if (component && component.confidence > 0.3) {
        const weight = weights[key] || 0.1;
        const sentimentScore = this.convertSentimentToScore(component.sentiment);
        
        totalScore += sentimentScore * weight * component.confidence;
        totalWeight += weight * component.confidence;
        confidence += component.confidence * weight;
      }
    });

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const normalizedConfidence = totalWeight > 0 ? confidence / Object.keys(weights).length : 0;

    return {
      score: normalizedScore,
      sentiment: this.convertScoreToSentiment(normalizedScore),
      confidence: Math.min(normalizedConfidence, 0.95)
    };
  }

  calculateInstitutionalWeights(marketCap) {
    // Higher weight to institutional signals for large caps
    const isLargeCap = marketCap > 10000000000; // $10B+
    const isMidCap = marketCap > 2000000000; // $2B+
    
    if (isLargeCap) {
      return {
        institutionalFlow: 0.25,
        insiderTrading: 0.20,
        newsImpact: 0.15,
        macroEnvironment: 0.15,
        sectorRotation: 0.10,
        crossAsset: 0.10,
        socialMedia: 0.05
      };
    } else if (isMidCap) {
      return {
        socialMedia: 0.20,
        newsImpact: 0.18,
        institutionalFlow: 0.15,
        insiderTrading: 0.15,
        sectorRotation: 0.12,
        macroEnvironment: 0.10,
        crossAsset: 0.10
      };
    } else {
      // Small cap - higher weight to social and news
      return {
        socialMedia: 0.25,
        newsImpact: 0.20,
        insiderTrading: 0.15,
        sectorRotation: 0.15,
        institutionalFlow: 0.10,
        macroEnvironment: 0.08,
        crossAsset: 0.07
      };
    }
  }

  separateInstitutionalRetailSentiment(components) {
    // Institutional signals: insider trading, institutional flow, macro, cross-asset
    const institutionalComponents = [
      components.insiderTrading,
      components.institutionalFlow,
      components.macroEnvironment,
      components.crossAsset
    ].filter(c => c && c.confidence > 0.3);

    // Retail signals: social media, some news sentiment
    const retailComponents = [
      components.socialMedia
    ].filter(c => c && c.confidence > 0.3);

    // Smart money: combination of institutional flow and insider trading
    const smartMoneyComponents = [
      components.insiderTrading,
      components.institutionalFlow
    ].filter(c => c && c.confidence > 0.5);

    return {
      institutional: this.aggregateComponentSentiment(institutionalComponents),
      retail: this.aggregateComponentSentiment(retailComponents),
      smartMoney: this.aggregateComponentSentiment(smartMoneyComponents)
    };
  }

  // Helper methods and model creation functions would continue here...
  // (Implementation details for all the analysis methods)

  createFallbackComponent() {
    return {
      sentiment: 'NEUTRAL',
      confidence: 0,
      enabled: false,
      reasoning: 'Analysis unavailable'
    };
  }

  createFallbackSentimentAnalysis() {
    return {
      overallSentiment: 'NEUTRAL',
      confidence: 0,
      institutionalSentiment: 'NEUTRAL',
      retailSentiment: 'NEUTRAL',
      smartMoneySentiment: 'NEUTRAL',
      sentimentMomentum: 'STABLE',
      riskFactors: [],
      opportunityFactors: [],
      fusionScore: 0,
      components: {}
    };
  }

  convertSentimentToScore(sentiment) {
    const sentimentMap = {
      'VERY_BULLISH': 1.0,
      'BULLISH': 0.7,
      'SLIGHTLY_BULLISH': 0.3,
      'NEUTRAL': 0.0,
      'SLIGHTLY_BEARISH': -0.3,
      'BEARISH': -0.7,
      'VERY_BEARISH': -1.0
    };
    return sentimentMap[sentiment] || 0;
  }

  convertScoreToSentiment(score) {
    if (score >= 0.8) return 'VERY_BULLISH';
    if (score >= 0.5) return 'BULLISH';
    if (score >= 0.2) return 'SLIGHTLY_BULLISH';
    if (score >= -0.2) return 'NEUTRAL';
    if (score >= -0.5) return 'SLIGHTLY_BEARISH';
    if (score >= -0.8) return 'BEARISH';
    return 'VERY_BEARISH';
  }

  // Additional implementation methods would go here...
}

module.exports = InstitutionalSentimentEngine;
