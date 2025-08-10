/**
 * Market Microstructure Awareness System
 * Analyzes order flow patterns, liquidity zones, and market depth for better timing
 * 
 * Core Features:
 * 1. Order Flow Analysis - Detects buying/selling pressure from price-volume patterns
 * 2. Liquidity Zone Detection - Identifies support/resistance based on volume clusters
 * 3. Market Depth Analysis - Analyzes bid-ask spread and volume imbalances
 * 4. Institutional Activity Detection - Spots large player movements
 * 5. Optimal Entry/Exit Timing - Identifies best execution windows
 */

/**
 * Main Market Microstructure Analysis Function
 * @param {Object} marketData - Current market data (price, volume, spread)
 * @param {Array} ohlcvData - Historical OHLCV data with intraday granularity
 * @param {Object} bookData - Level 2 market data (optional - bid/ask levels)
 * @returns {Object} Comprehensive microstructure analysis
 */
function analyzeMarketMicrostructure(marketData, ohlcvData, bookData = null) {
  try {
    console.log(`🔍 Market Microstructure: Analyzing order flow and liquidity patterns...`);
    
    if (!ohlcvData || ohlcvData.length < 20) {
      return createLowDataMicrostructureAssessment();
    }
    
    const currentPrice = marketData.currentPrice || marketData.latestPrice || 0;
    const currentVolume = marketData.volume || 0;
    
    // ==============================================
    // ANALYZER 1: ORDER FLOW ANALYSIS
    // ==============================================
    const orderFlowAnalysis = analyzeOrderFlow(ohlcvData, currentPrice, currentVolume);
    
    // ==============================================
    // ANALYZER 2: LIQUIDITY ZONE DETECTION
    // ==============================================
    const liquidityZones = detectLiquidityZones(ohlcvData, currentPrice);
    
    // ==============================================
    // ANALYZER 3: MARKET DEPTH ANALYSIS
    // ==============================================
    const marketDepth = analyzeMarketDepth(ohlcvData, bookData, currentPrice);
    
    // ==============================================
    // ANALYZER 4: INSTITUTIONAL ACTIVITY DETECTION
    // ==============================================
    const institutionalActivity = detectInstitutionalActivity(ohlcvData, orderFlowAnalysis);
    
    // ==============================================
    // ANALYZER 5: VOLUME PROFILE ANALYSIS
    // ==============================================
    const volumeProfile = analyzeVolumeProfile(ohlcvData, currentPrice);
    
    // ==============================================
    // ANALYZER 6: PRICE IMPACT ASSESSMENT
    // ==============================================
    const priceImpact = assessPriceImpact(ohlcvData, marketData);
    
    // ==============================================
    // TIMING OPTIMIZATION ENGINE
    // ==============================================
    const timingRecommendations = generateTimingRecommendations({
      orderFlow: orderFlowAnalysis,
      liquidity: liquidityZones,
      depth: marketDepth,
      institutional: institutionalActivity,
      volumeProfile: volumeProfile,
      priceImpact: priceImpact
    });
    
    console.log(`🔍 Microstructure Analysis Complete:`);
    console.log(`   📊 Order Flow: ${orderFlowAnalysis.dominantFlow} (${orderFlowAnalysis.strength}/100)`);
    console.log(`   💧 Liquidity Quality: ${liquidityZones.overallQuality} (${liquidityZones.zones.length} zones)`);
    console.log(`   🏛️ Institutional Activity: ${institutionalActivity.level} (${institutionalActivity.confidence}% confidence)`);
    console.log(`   ⏰ Optimal Timing: ${timingRecommendations.recommendation}`);
    
    return {
      timestamp: new Date().toISOString(),
      
      // Core Analysis Components
      orderFlow: orderFlowAnalysis,
      liquidityZones: liquidityZones,
      marketDepth: marketDepth,
      institutionalActivity: institutionalActivity,
      volumeProfile: volumeProfile,
      priceImpact: priceImpact,
      
      // Timing Recommendations
      timing: timingRecommendations,
      
      // Execution Quality Metrics
      executionQuality: {
        slippageRisk: calculateSlippageRisk(marketDepth, volumeProfile),
        liquidityRisk: calculateLiquidityRisk(liquidityZones, currentVolume),
        timingScore: timingRecommendations.score,
        optimalWindow: timingRecommendations.optimalWindow
      },
      
      // Trading Insights
      insights: {
        entryTiming: generateEntryTimingInsights(timingRecommendations, orderFlowAnalysis),
        exitTiming: generateExitTimingInsights(liquidityZones, institutionalActivity),
        riskFactors: identifyMicrostructureRisks(marketDepth, orderFlowAnalysis, institutionalActivity),
        opportunities: identifyMicrostructureOpportunities(liquidityZones, volumeProfile, orderFlowAnalysis)
      }
    };
    
  } catch (error) {
    console.error('❌ Market Microstructure Analysis error:', error);
    return createFallbackMicrostructureAssessment(error);
  }
}

/**
 * ANALYZER 1: Order Flow Analysis
 * Detects buying vs selling pressure from price-volume patterns
 */
function analyzeOrderFlow(ohlcvData, currentPrice, currentVolume) {
  const recentData = ohlcvData.slice(-20); // Last 20 periods for analysis
  
  let buyingPressure = 0;
  let sellingPressure = 0;
  let volumeWeightedPrice = 0;
  let totalVolume = 0;
  
  // Analyze each bar for order flow
  recentData.forEach((bar, index) => {
    const open = bar.open;
    const high = bar.high;
    const low = bar.low;
    const close = bar.close;
    const volume = bar.volume || 0;
    
    // Calculate intrabar pressure using closing position within range
    const range = high - low;
    if (range > 0) {
      const closePosition = (close - low) / range; // 0 = closed at low, 1 = closed at high
      
      // Weight by volume and recency (recent bars have more weight)
      const recencyWeight = (index + 1) / recentData.length;
      const weightedVolume = volume * recencyWeight;
      
      if (closePosition > 0.6) { // Closed in upper 40% of range
        buyingPressure += weightedVolume * closePosition;
      } else if (closePosition < 0.4) { // Closed in lower 40% of range
        sellingPressure += weightedVolume * (1 - closePosition);
      }
      
      // Track volume-weighted price
      volumeWeightedPrice += close * volume;
      totalVolume += volume;
    }
  });
  
  // Calculate VWAP and price deviation
  const vwap = totalVolume > 0 ? volumeWeightedPrice / totalVolume : currentPrice;
  const priceDeviation = totalVolume > 0 ? (currentPrice - vwap) / vwap : 0;
  
  // Determine dominant flow
  const totalPressure = buyingPressure + sellingPressure;
  const buyingRatio = totalPressure > 0 ? buyingPressure / totalPressure : 0.5;
  
  let dominantFlow = 'NEUTRAL';
  let strength = Math.abs(buyingRatio - 0.5) * 200; // Scale to 0-100
  
  if (buyingRatio > 0.65) {
    dominantFlow = 'STRONG_BUYING';
  } else if (buyingRatio > 0.55) {
    dominantFlow = 'MODERATE_BUYING';
  } else if (buyingRatio < 0.35) {
    dominantFlow = 'STRONG_SELLING';
  } else if (buyingRatio < 0.45) {
    dominantFlow = 'MODERATE_SELLING';
  }
  
  // Detect order flow divergences
  const priceChange = recentData.length >= 2 ? 
    (recentData[recentData.length - 1].close - recentData[0].close) / recentData[0].close : 0;
    
  const flowDivergence = detectFlowDivergence(priceChange, buyingRatio);
  
  // Calculate flow consistency (how consistent the flow has been)
  const flowConsistency = calculateFlowConsistency(recentData);
  
  return {
    dominantFlow,
    strength: Math.round(strength),
    buyingPressure: Math.round(buyingPressure),
    sellingPressure: Math.round(sellingPressure),
    buyingRatio: Math.round(buyingRatio * 1000) / 10, // as percentage
    vwap: Math.round(vwap * 100) / 100,
    priceDeviation: Math.round(priceDeviation * 10000) / 100, // as percentage
    flowDivergence: flowDivergence,
    consistency: flowConsistency,
    
    // Trading signals
    signals: {
      continuation: dominantFlow !== 'NEUTRAL' && flowConsistency > 70,
      reversal: flowDivergence.detected && flowDivergence.strength > 60,
      accumulation: dominantFlow.includes('BUYING') && Math.abs(priceDeviation) < 0.005, // Buying without price movement
      distribution: dominantFlow.includes('SELLING') && Math.abs(priceDeviation) < 0.005  // Selling without price movement
    }
  };
}

/**
 * ANALYZER 2: Liquidity Zone Detection
 * Identifies key support/resistance levels based on volume concentration
 */
function detectLiquidityZones(ohlcvData, currentPrice) {
  const priceVolumeMap = new Map();
  const recentData = ohlcvData.slice(-50); // Analyze last 50 bars
  
  // Build price-volume histogram
  recentData.forEach(bar => {
    const volume = bar.volume || 0;
    if (volume > 0) {
      // Distribute volume across the price range of the bar
      const priceSteps = 20; // Divide each bar into 20 price steps
      const stepSize = (bar.high - bar.low) / priceSteps;
      
      for (let i = 0; i < priceSteps; i++) {
        const price = bar.low + (i * stepSize);
        const priceKey = Math.round(price * 100) / 100; // Round to nearest cent
        
        const existingVolume = priceVolumeMap.get(priceKey) || 0;
        priceVolumeMap.set(priceKey, existingVolume + (volume / priceSteps));
      }
    }
  });
  
  // Convert to sorted array and find volume clusters
  const priceVolumePairs = Array.from(priceVolumeMap.entries())
    .map(([price, volume]) => ({ price: parseFloat(price), volume }))
    .sort((a, b) => a.price - b.price);
  
  // Identify significant liquidity zones using volume clustering
  const zones = [];
  const volumeThreshold = calculateVolumeThreshold(priceVolumePairs);
  
  let currentZone = null;
  priceVolumePairs.forEach(({ price, volume }) => {
    if (volume >= volumeThreshold) {
      if (!currentZone || price - currentZone.priceHigh > currentPrice * 0.01) { // Start new zone if gap > 1%
        if (currentZone) {
          zones.push(currentZone);
        }
        currentZone = {
          priceLow: price,
          priceHigh: price,
          totalVolume: volume,
          maxVolume: volume,
          strength: 0,
          type: 'UNKNOWN'
        };
      } else {
        // Extend current zone
        currentZone.priceHigh = price;
        currentZone.totalVolume += volume;
        currentZone.maxVolume = Math.max(currentZone.maxVolume, volume);
      }
    }
  });
  
  // Add final zone if exists
  if (currentZone) {
    zones.push(currentZone);
  }
  
  // Classify zones and calculate strength
  zones.forEach(zone => {
    const zoneCenter = (zone.priceLow + zone.priceHigh) / 2;
    zone.center = Math.round(zoneCenter * 100) / 100;
    zone.width = Math.round((zone.priceHigh - zone.priceLow) * 100) / 100;
    zone.strength = Math.min(100, Math.round((zone.totalVolume / volumeThreshold) * 20));
    
    // Classify zone type based on position relative to current price
    if (zoneCenter > currentPrice * 1.005) { // More than 0.5% above current price
      zone.type = 'RESISTANCE';
    } else if (zoneCenter < currentPrice * 0.995) { // More than 0.5% below current price
      zone.type = 'SUPPORT';
    } else {
      zone.type = 'CURRENT_LEVEL';
    }
    
    // Calculate distance from current price
    zone.distanceFromPrice = Math.round(((zoneCenter - currentPrice) / currentPrice) * 10000) / 100; // as percentage
  });
  
  // Sort by strength (strongest first)
  zones.sort((a, b) => b.strength - a.strength);
  
  // Assess overall liquidity quality
  const supportZones = zones.filter(z => z.type === 'SUPPORT');
  const resistanceZones = zones.filter(z => z.type === 'RESISTANCE');
  
  const overallQuality = assessLiquidityQuality(zones, currentPrice);
  
  return {
    zones: zones.slice(0, 10), // Top 10 zones
    supportZones: supportZones.slice(0, 5),
    resistanceZones: resistanceZones.slice(0, 5),
    overallQuality,
    nearestSupport: findNearestZone(supportZones, currentPrice, 'below'),
    nearestResistance: findNearestZone(resistanceZones, currentPrice, 'above'),
    volumeThreshold,
    
    // Trading insights
    insights: {
      strongSupport: supportZones.filter(z => z.strength > 70).length,
      strongResistance: resistanceZones.filter(z => z.strength > 70).length,
      liquidityGaps: identifyLiquidityGaps(zones, currentPrice),
      optimalEntryZones: zones.filter(z => z.type === 'SUPPORT' && z.strength > 60 && Math.abs(z.distanceFromPrice) < 3),
      optimalExitZones: zones.filter(z => z.type === 'RESISTANCE' && z.strength > 60 && z.distanceFromPrice > 1)
    }
  };
}

/**
 * ANALYZER 3: Market Depth Analysis
 * Analyzes bid-ask spread and volume imbalances (works with limited data)
 */
function analyzeMarketDepth(ohlcvData, bookData, currentPrice) {
  const recentData = ohlcvData.slice(-10);
  
  // Calculate implied spread from OHLC data (when L2 data unavailable)
  const avgSpread = calculateImpliedSpread(recentData);
  const spreadAnalysis = analyzeSpreadPatterns(recentData);
  
  // Estimate market depth from volume patterns
  const depthEstimate = estimateMarketDepth(recentData, currentPrice);
  
  // Volume imbalance analysis
  const volumeImbalance = analyzeVolumeImbalance(recentData);
  
  return {
    spread: {
      current: Math.round(avgSpread * 10000) / 100, // as percentage
      pattern: spreadAnalysis.pattern,
      trend: spreadAnalysis.trend,
      quality: spreadAnalysis.quality
    },
    
    depth: {
      estimated: depthEstimate.depth,
      quality: depthEstimate.quality,
      supportStrength: depthEstimate.supportStrength,
      resistanceStrength: depthEstimate.resistanceStrength
    },
    
    imbalance: {
      direction: volumeImbalance.direction,
      strength: volumeImbalance.strength,
      persistence: volumeImbalance.persistence
    },
    
    // Trading implications
    execution: {
      slippageRisk: avgSpread > 0.002 ? 'HIGH' : avgSpread > 0.001 ? 'MEDIUM' : 'LOW',
      optimalOrderSize: depthEstimate.optimalOrderSize,
      marketImpactWarning: depthEstimate.depth < 50000, // Low depth warning
      recommendedExecution: avgSpread > 0.002 ? 'LIMIT_ORDERS' : 'MARKET_ORDERS_OK'
    }
  };
}

/**
 * ANALYZER 4: Institutional Activity Detection
 * Spots large player movements from volume and price patterns
 */
function detectInstitutionalActivity(ohlcvData, orderFlowAnalysis) {
  const recentData = ohlcvData.slice(-30);
  let institutionalScore = 0;
  const signals = [];
  
  // Pattern 1: Unusual Volume Spikes
  const avgVolume = recentData.reduce((sum, bar) => sum + (bar.volume || 0), 0) / recentData.length;
  const recentVolume = recentData.slice(-5).reduce((sum, bar) => sum + (bar.volume || 0), 0) / 5;
  
  if (recentVolume > avgVolume * 2.5) {
    institutionalScore += 25;
    signals.push({
      type: 'VOLUME_SPIKE',
      strength: Math.min(100, Math.round((recentVolume / avgVolume) * 20)),
      description: `Volume spike: ${(recentVolume / avgVolume).toFixed(1)}x average`
    });
  }
  
  // Pattern 2: Iceberg Orders (consistent buying/selling without price movement)
  const priceStability = calculatePriceStability(recentData.slice(-10));
  if (priceStability > 80 && (orderFlowAnalysis.signals.accumulation || orderFlowAnalysis.signals.distribution)) {
    institutionalScore += 30;
    signals.push({
      type: 'ICEBERG_PATTERN',
      strength: priceStability,
      description: `Potential iceberg orders: ${orderFlowAnalysis.dominantFlow.toLowerCase()} with price stability`
    });
  }
  
  // Pattern 3: Block Trading Detection (large single-bar moves with high volume)
  recentData.slice(-5).forEach((bar, index) => {
    const priceMove = Math.abs((bar.close - bar.open) / bar.open);
    const volumeRatio = (bar.volume || 0) / avgVolume;
    
    if (priceMove > 0.02 && volumeRatio > 3) { // >2% move with >3x volume
      institutionalScore += 20;
      signals.push({
        type: 'BLOCK_TRADE',
        strength: Math.min(100, Math.round(volumeRatio * 15)),
        description: `Block trade detected: ${(priceMove * 100).toFixed(1)}% move with ${volumeRatio.toFixed(1)}x volume`
      });
    }
  });
  
  // Pattern 4: End-of-day Activity (if we have intraday data)
  const endOfDayActivity = detectEndOfDayActivity(recentData);
  if (endOfDayActivity.detected) {
    institutionalScore += 15;
    signals.push({
      type: 'END_OF_DAY',
      strength: endOfDayActivity.strength,
      description: 'Institutional end-of-day activity detected'
    });
  }
  
  // Pattern 5: Volume-Price Divergence (institutions often move volume before price)
  const vpDivergence = detectVolumePriceDivergence(recentData);
  if (vpDivergence.detected) {
    institutionalScore += 20;
    signals.push({
      type: 'VP_DIVERGENCE',
      strength: vpDivergence.strength,
      description: `Volume leading price: ${vpDivergence.direction}`
    });
  }
  
  // Determine activity level
  let level = 'LOW';
  let confidence = institutionalScore;
  
  if (institutionalScore >= 70) {
    level = 'HIGH';
  } else if (institutionalScore >= 40) {
    level = 'MODERATE';
  } else if (institutionalScore >= 20) {
    level = 'LOW_MODERATE';
  }
  
  return {
    level,
    score: institutionalScore,
    confidence: Math.min(100, confidence),
    signals: signals.slice(0, 5), // Top 5 signals
    
    // Trading implications
    implications: {
      followInstitutions: level === 'HIGH' && orderFlowAnalysis.consistency > 70,
      contrarian: level === 'HIGH' && signals.some(s => s.type === 'BLOCK_TRADE'),
      patience: level === 'HIGH' && signals.some(s => s.type === 'ICEBERG_PATTERN'),
      urgency: signals.some(s => s.type === 'END_OF_DAY')
    }
  };
}

/**
 * ANALYZER 5: Volume Profile Analysis
 * Analyzes volume distribution across price levels
 */
function analyzeVolumeProfile(ohlcvData, currentPrice) {
  const recentData = ohlcvData.slice(-30);
  
  // Build volume profile
  const priceVolume = new Map();
  let totalVolume = 0;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  
  recentData.forEach(bar => {
    const volume = bar.volume || 0;
    totalVolume += volume;
    minPrice = Math.min(minPrice, bar.low);
    maxPrice = Math.max(maxPrice, bar.high);
    
    // Distribute volume across price range
    const midPrice = (bar.high + bar.low) / 2;
    const priceKey = Math.round(midPrice * 100) / 100;
    priceVolume.set(priceKey, (priceVolume.get(priceKey) || 0) + volume);
  });
  
  // Find Value Area (70% of volume)
  const sortedPrices = Array.from(priceVolume.entries())
    .map(([price, volume]) => ({ price: parseFloat(price), volume }))
    .sort((a, b) => b.volume - a.volume);
  
  let valueAreaVolume = 0;
  const valueAreaPrices = [];
  const targetVolume = totalVolume * 0.7;
  
  for (const { price, volume } of sortedPrices) {
    if (valueAreaVolume < targetVolume) {
      valueAreaPrices.push(price);
      valueAreaVolume += volume;
    }
  }
  
  const valueAreaHigh = Math.max(...valueAreaPrices);
  const valueAreaLow = Math.min(...valueAreaPrices);
  
  // Find Point of Control (highest volume price)
  const poc = sortedPrices[0];
  
  // Analyze current price position
  const pricePosition = analyzeCurrentPricePosition(currentPrice, valueAreaHigh, valueAreaLow, poc.price);
  
  return {
    valueArea: {
      high: Math.round(valueAreaHigh * 100) / 100,
      low: Math.round(valueAreaLow * 100) / 100,
      range: Math.round((valueAreaHigh - valueAreaLow) * 100) / 100,
      volumePct: Math.round((valueAreaVolume / totalVolume) * 100)
    },
    
    pointOfControl: {
      price: Math.round(poc.price * 100) / 100,
      volume: poc.volume,
      volumePct: Math.round((poc.volume / totalVolume) * 100)
    },
    
    currentPosition: pricePosition,
    
    // Trading insights
    insights: {
      fairValue: poc.price,
      overvalued: currentPrice > valueAreaHigh,
      undervalued: currentPrice < valueAreaLow,
      balancedMarket: currentPrice >= valueAreaLow && currentPrice <= valueAreaHigh,
      breakoutPotential: Math.abs(currentPrice - poc.price) / poc.price > 0.05
    }
  };
}

/**
 * ANALYZER 6: Price Impact Assessment
 * Estimates how much a trade will move the market
 */
function assessPriceImpact(ohlcvData, marketData) {
  const recentData = ohlcvData.slice(-10);
  const currentPrice = marketData.currentPrice || marketData.latestPrice || 0;
  const avgVolume = recentData.reduce((sum, bar) => sum + (bar.volume || 0), 0) / recentData.length;
  
  // Calculate price impact factors
  const volatility = calculateRecentVolatility(recentData);
  const liquidity = avgVolume;
  
  // Estimate impact for different order sizes
  const impactEstimates = [
    { orderSize: currentPrice * 100, label: '100_shares' },
    { orderSize: currentPrice * 500, label: '500_shares' },
    { orderSize: currentPrice * 1000, label: '1000_shares' },
    { orderSize: currentPrice * 5000, label: '5000_shares' }
  ].map(order => {
    const volumeRatio = order.orderSize / (avgVolume * currentPrice || 1);
    const impact = Math.sqrt(volatility * volumeRatio) * 100; // Square root market impact model
    
    return {
      ...order,
      shares: order.orderSize / currentPrice,
      estimatedImpact: Math.round(impact * 10000) / 100, // as percentage
      riskLevel: impact > 0.5 ? 'HIGH' : impact > 0.2 ? 'MEDIUM' : 'LOW'
    };
  });
  
  return {
    estimates: impactEstimates,
    volatility: Math.round(volatility * 10000) / 100,
    liquidity: Math.round(liquidity),
    
    recommendations: {
      maxOrderSizeForLowImpact: impactEstimates.find(est => est.estimatedImpact <= 0.2)?.shares || 100,
      optimalExecutionMethod: avgVolume > 1000000 ? 'TWAP' : avgVolume > 500000 ? 'VWAP' : 'CAREFUL_LIMIT',
      splitLargeOrders: impactEstimates.some(est => est.estimatedImpact > 0.5)
    }
  };
}

/**
 * Timing Optimization Engine
 * Combines all microstructure insights for optimal execution timing
 */
function generateTimingRecommendations(analysis) {
  let score = 50; // Base score
  const factors = [];
  const warnings = [];
  
  // Factor 1: Order Flow Alignment
  if (analysis.orderFlow.dominantFlow.includes('BUYING')) {
    score += 20;
    factors.push('Positive order flow momentum');
  } else if (analysis.orderFlow.dominantFlow.includes('SELLING')) {
    score -= 15;
    factors.push('Negative order flow pressure');
  }
  
  // Factor 2: Liquidity Quality
  if (analysis.liquidity.overallQuality === 'HIGH') {
    score += 15;
    factors.push('High liquidity environment');
  } else if (analysis.liquidity.overallQuality === 'LOW') {
    score -= 20;
    warnings.push('Low liquidity - higher slippage risk');
  }
  
  // Factor 3: Institutional Activity
  if (analysis.institutional.level === 'HIGH') {
    if (analysis.institutional.implications.followInstitutions) {
      score += 25;
      factors.push('Strong institutional support');
    } else {
      score -= 10;
      warnings.push('Institutional activity may create volatility');
    }
  }
  
  // Factor 4: Market Depth
  if (analysis.depth.execution.slippageRisk === 'LOW') {
    score += 10;
    factors.push('Good market depth');
  } else if (analysis.depth.execution.slippageRisk === 'HIGH') {
    score -= 15;
    warnings.push('High slippage risk');
  }
  
  // Factor 5: Volume Profile Position
  if (analysis.volumeProfile.insights.undervalued) {
    score += 15;
    factors.push('Price below fair value');
  } else if (analysis.volumeProfile.insights.overvalued) {
    score -= 15;
    warnings.push('Price above fair value');
  }
  
  // Determine recommendation
  let recommendation = 'NEUTRAL';
  let optimalWindow = 'CURRENT';
  
  if (score >= 80) {
    recommendation = 'IMMEDIATE_ENTRY';
    optimalWindow = 'NEXT_15_MINUTES';
  } else if (score >= 65) {
    recommendation = 'FAVORABLE_ENTRY';
    optimalWindow = 'NEXT_HOUR';
  } else if (score >= 45) {
    recommendation = 'WAIT_FOR_BETTER_SETUP';
    optimalWindow = 'NEXT_SESSION';
  } else {
    recommendation = 'AVOID_ENTRY';
    optimalWindow = 'WAIT_FOR_IMPROVEMENT';
  }
  
  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    recommendation,
    optimalWindow,
    factors,
    warnings,
    
    // Specific timing guidance
    guidance: {
      entryMethod: score >= 70 ? 'AGGRESSIVE' : score >= 50 ? 'MODERATE' : 'DEFENSIVE',
      orderType: analysis.depth.execution.recommendedExecution,
      maxOrderSize: analysis.priceImpact.recommendations.maxOrderSizeForLowImpact,
      executionStrategy: analysis.priceImpact.recommendations.optimalExecutionMethod
    }
  };
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function detectFlowDivergence(priceChange, buyingRatio) {
  const priceDirection = priceChange > 0.01 ? 'UP' : priceChange < -0.01 ? 'DOWN' : 'FLAT';
  const flowDirection = buyingRatio > 0.6 ? 'BUYING' : buyingRatio < 0.4 ? 'SELLING' : 'NEUTRAL';
  
  let detected = false;
  let strength = 0;
  let type = 'NONE';
  
  if (priceDirection === 'UP' && flowDirection === 'SELLING') {
    detected = true;
    type = 'BEARISH_DIVERGENCE';
    strength = Math.abs(buyingRatio - 0.5) * 200;
  } else if (priceDirection === 'DOWN' && flowDirection === 'BUYING') {
    detected = true;
    type = 'BULLISH_DIVERGENCE';
    strength = Math.abs(buyingRatio - 0.5) * 200;
  }
  
  return { detected, type, strength: Math.round(strength) };
}

function calculateFlowConsistency(data) {
  const flows = [];
  
  data.forEach(bar => {
    const range = bar.high - bar.low;
    if (range > 0) {
      const closePosition = (bar.close - bar.low) / range;
      flows.push(closePosition > 0.6 ? 1 : closePosition < 0.4 ? -1 : 0);
    }
  });
  
  // Calculate consistency as percentage of bars with same direction
  const positiveFlows = flows.filter(f => f > 0).length;
  const negativeFlows = flows.filter(f => f < 0).length;
  const neutralFlows = flows.filter(f => f === 0).length;
  
  const maxSameDirection = Math.max(positiveFlows, negativeFlows);
  return Math.round((maxSameDirection / flows.length) * 100);
}

function calculateVolumeThreshold(priceVolumePairs) {
  const volumes = priceVolumePairs.map(p => p.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const sortedVolumes = volumes.sort((a, b) => b - a);
  
  // Use 75th percentile as threshold
  const percentile75 = sortedVolumes[Math.floor(sortedVolumes.length * 0.25)];
  return Math.max(avgVolume * 1.5, percentile75);
}

function assessLiquidityQuality(zones, currentPrice) {
  if (zones.length === 0) return 'UNKNOWN';
  
  const strongZones = zones.filter(z => z.strength > 70).length;
  const nearbyZones = zones.filter(z => Math.abs(z.distanceFromPrice) < 5).length;
  
  if (strongZones >= 3 && nearbyZones >= 2) return 'HIGH';
  if (strongZones >= 2 || nearbyZones >= 3) return 'MEDIUM';
  if (strongZones >= 1 || nearbyZones >= 2) return 'LOW_MEDIUM';
  return 'LOW';
}

function findNearestZone(zones, currentPrice, direction) {
  const filteredZones = direction === 'below' ? 
    zones.filter(z => z.center < currentPrice) :
    zones.filter(z => z.center > currentPrice);
  
  if (filteredZones.length === 0) return null;
  
  return filteredZones.reduce((nearest, zone) => {
    const currentDistance = Math.abs(zone.center - currentPrice);
    const nearestDistance = Math.abs(nearest.center - currentPrice);
    return currentDistance < nearestDistance ? zone : nearest;
  });
}

function identifyLiquidityGaps(zones, currentPrice) {
  const sortedZones = zones
    .filter(z => Math.abs(z.distanceFromPrice) < 10) // Within 10%
    .sort((a, b) => a.center - b.center);
  
  const gaps = [];
  for (let i = 1; i < sortedZones.length; i++) {
    const gap = sortedZones[i].center - sortedZones[i-1].center;
    const gapPercent = (gap / currentPrice) * 100;
    
    if (gapPercent > 2) { // Gap > 2%
      gaps.push({
        from: sortedZones[i-1].center,
        to: sortedZones[i].center,
        size: Math.round(gap * 100) / 100,
        sizePercent: Math.round(gapPercent * 10) / 10
      });
    }
  }
  
  return gaps;
}

function calculateImpliedSpread(data) {
  // Estimate spread from high-low ranges as percentage of close
  const spreads = data.map(bar => {
    if (bar.close > 0) {
      return (bar.high - bar.low) / bar.close;
    }
    return 0;
  }).filter(s => s > 0);
  
  return spreads.length > 0 ? spreads.reduce((sum, s) => sum + s, 0) / spreads.length : 0.01;
}

function analyzeSpreadPatterns(data) {
  const spreads = data.map(bar => (bar.high - bar.low) / bar.close);
  const avgSpread = spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
  const recentSpread = spreads.slice(-3).reduce((sum, s) => sum + s, 0) / 3;
  
  return {
    pattern: recentSpread > avgSpread * 1.5 ? 'WIDENING' : recentSpread < avgSpread * 0.7 ? 'NARROWING' : 'STABLE',
    trend: recentSpread > avgSpread ? 'INCREASING' : 'DECREASING',
    quality: avgSpread < 0.005 ? 'TIGHT' : avgSpread < 0.015 ? 'NORMAL' : 'WIDE'
  };
}

function estimateMarketDepth(data, currentPrice) {
  const avgVolume = data.reduce((sum, bar) => sum + (bar.volume || 0), 0) / data.length;
  const avgRange = data.reduce((sum, bar) => sum + (bar.high - bar.low), 0) / data.length;
  
  // Simplified depth estimation
  const estimatedDepth = (avgVolume * currentPrice) / (avgRange || 1);
  
  return {
    depth: Math.round(estimatedDepth),
    quality: estimatedDepth > 100000 ? 'HIGH' : estimatedDepth > 50000 ? 'MEDIUM' : 'LOW',
    supportStrength: Math.round(estimatedDepth * 0.6),
    resistanceStrength: Math.round(estimatedDepth * 0.4),
    optimalOrderSize: Math.round(avgVolume * 0.1)
  };
}

function analyzeVolumeImbalance(data) {
  let buyVolume = 0;
  let sellVolume = 0;
  
  data.forEach(bar => {
    const range = bar.high - bar.low;
    const volume = bar.volume || 0;
    
    if (range > 0) {
      const closePosition = (bar.close - bar.low) / range;
      buyVolume += volume * closePosition;
      sellVolume += volume * (1 - closePosition);
    }
  });
  
  const totalVolume = buyVolume + sellVolume;
  const imbalance = totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;
  
  return {
    direction: imbalance > 0.1 ? 'BUY_SIDE' : imbalance < -0.1 ? 'SELL_SIDE' : 'BALANCED',
    strength: Math.abs(imbalance) * 100,
    persistence: calculateImbalancePersistence(data)
  };
}

function calculatePriceStability(data) {
  if (data.length < 2) return 50;
  
  const priceChanges = [];
  for (let i = 1; i < data.length; i++) {
    const change = Math.abs((data[i].close - data[i-1].close) / data[i-1].close);
    priceChanges.push(change);
  }
  
  const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
  const stability = Math.max(0, 100 - (avgChange * 10000)); // Inverse relationship
  
  return Math.round(stability);
}

function detectEndOfDayActivity(data) {
  // Simplified - would need actual time data for full implementation
  const lastBar = data[data.length - 1];
  const avgVolume = data.reduce((sum, bar) => sum + (bar.volume || 0), 0) / data.length;
  
  const volumeSpike = (lastBar.volume || 0) > avgVolume * 2;
  const priceMove = Math.abs((lastBar.close - lastBar.open) / lastBar.open) > 0.01;
  
  return {
    detected: volumeSpike && priceMove,
    strength: volumeSpike && priceMove ? Math.min(100, ((lastBar.volume || 0) / avgVolume) * 25) : 0
  };
}

function detectVolumePriceDivergence(data) {
  if (data.length < 5) return { detected: false, strength: 0, direction: 'NONE' };
  
  const recentData = data.slice(-5);
  const volumeTrend = calculateTrend(recentData.map(d => d.volume || 0));
  const priceTrend = calculateTrend(recentData.map(d => d.close));
  
  const divergence = (volumeTrend > 0 && priceTrend < 0) || (volumeTrend < 0 && priceTrend > 0);
  
  return {
    detected: Math.abs(volumeTrend) > 0.1 && Math.abs(priceTrend) > 0.01 && divergence,
    strength: divergence ? Math.min(100, (Math.abs(volumeTrend) + Math.abs(priceTrend)) * 50) : 0,
    direction: volumeTrend > 0 ? 'VOLUME_LEADING_UP' : 'VOLUME_LEADING_DOWN'
  };
}

function calculateTrend(values) {
  if (values.length < 2) return 0;
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
}

function analyzeCurrentPricePosition(currentPrice, vaHigh, vaLow, pocPrice) {
  let position = 'UNKNOWN';
  let significance = 'NORMAL';
  
  if (currentPrice > vaHigh) {
    position = 'ABOVE_VALUE_AREA';
    significance = currentPrice > vaHigh * 1.02 ? 'SIGNIFICANT' : 'MINOR';
  } else if (currentPrice < vaLow) {
    position = 'BELOW_VALUE_AREA';
    significance = currentPrice < vaLow * 0.98 ? 'SIGNIFICANT' : 'MINOR';
  } else if (Math.abs(currentPrice - pocPrice) / pocPrice < 0.005) {
    position = 'AT_POC';
    significance = 'SIGNIFICANT';
  } else {
    position = 'IN_VALUE_AREA';
  }
  
  return { position, significance };
}

function calculateRecentVolatility(data) {
  if (data.length < 2) return 0.02;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    const return_ = (data[i].close - data[i-1].close) / data[i-1].close;
    returns.push(return_);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

function calculateImbalancePersistence(data) {
  // Simplified persistence calculation
  const imbalances = data.map(bar => {
    const range = bar.high - bar.low;
    if (range > 0) {
      const closePosition = (bar.close - bar.low) / range;
      return closePosition > 0.6 ? 1 : closePosition < 0.4 ? -1 : 0;
    }
    return 0;
  });
  
  let persistence = 0;
  let currentStreak = 0;
  let lastDirection = 0;
  
  imbalances.forEach(imbalance => {
    if (imbalance !== 0) {
      if (imbalance === lastDirection) {
        currentStreak++;
      } else {
        persistence = Math.max(persistence, currentStreak);
        currentStreak = 1;
        lastDirection = imbalance;
      }
    }
  });
  
  persistence = Math.max(persistence, currentStreak);
  return Math.round((persistence / imbalances.length) * 100);
}

function calculateSlippageRisk(marketDepth, volumeProfile) {
  let riskScore = 0;
  
  if (marketDepth.execution.slippageRisk === 'HIGH') riskScore += 40;
  else if (marketDepth.execution.slippageRisk === 'MEDIUM') riskScore += 20;
  
  if (volumeProfile.insights.overvalued || volumeProfile.insights.undervalued) riskScore += 15;
  
  return Math.min(100, riskScore);
}

function calculateLiquidityRisk(liquidityZones, currentVolume) {
  const nearbyZones = liquidityZones.zones.filter(z => Math.abs(z.distanceFromPrice) < 2);
  const strongNearbyZones = nearbyZones.filter(z => z.strength > 60);
  
  let riskScore = 50; // Base risk
  
  if (strongNearbyZones.length === 0) riskScore += 30;
  else if (strongNearbyZones.length === 1) riskScore += 15;
  else riskScore -= 15;
  
  if (liquidityZones.overallQuality === 'LOW') riskScore += 25;
  else if (liquidityZones.overallQuality === 'HIGH') riskScore -= 20;
  
  return Math.max(0, Math.min(100, riskScore));
}

// Entry and Exit Timing Insights
function generateEntryTimingInsights(timingRecs, orderFlow) {
  const insights = [];
  
  if (timingRecs.score >= 80) {
    insights.push('🟢 EXCELLENT entry timing - all factors aligned');
  } else if (timingRecs.score >= 65) {
    insights.push('🟡 GOOD entry timing - most factors favorable');
  } else {
    insights.push('🔴 POOR entry timing - wait for better setup');
  }
  
  if (orderFlow.signals.accumulation) {
    insights.push('📈 Accumulation pattern detected - institutional buying');
  }
  
  if (orderFlow.signals.reversal) {
    insights.push('🔄 Order flow reversal signal - potential trend change');
  }
  
  return insights;
}

function generateExitTimingInsights(liquidityZones, institutionalActivity) {
  const insights = [];
  
  const strongResistance = liquidityZones.nearestResistance;
  if (strongResistance && strongResistance.strength > 70) {
    insights.push(`🎯 Strong resistance at ${strongResistance.center} - consider profit taking`);
  }
  
  if (institutionalActivity.implications.contrarian) {
    insights.push('⚠️ Institutional block trades - consider defensive exits');
  }
  
  if (liquidityZones.insights.liquidityGaps.length > 0) {
    insights.push('📉 Liquidity gaps detected - potential for rapid moves');
  }
  
  return insights;
}

function identifyMicrostructureRisks(marketDepth, orderFlow, institutional) {
  const risks = [];
  
  if (marketDepth.execution.slippageRisk === 'HIGH') {
    risks.push({ type: 'SLIPPAGE', level: 'HIGH', description: 'High bid-ask spread increases execution costs' });
  }
  
  if (orderFlow.signals.distribution) {
    risks.push({ type: 'DISTRIBUTION', level: 'MEDIUM', description: 'Institutional selling pressure detected' });
  }
  
  if (institutional.level === 'HIGH' && !institutional.implications.followInstitutions) {
    risks.push({ type: 'INSTITUTIONAL', level: 'HIGH', description: 'Conflicting institutional activity' });
  }
  
  return risks;
}

function identifyMicrostructureOpportunities(liquidityZones, volumeProfile, orderFlow) {
  const opportunities = [];
  
  if (volumeProfile.insights.undervalued && orderFlow.dominantFlow.includes('BUYING')) {
    opportunities.push({ type: 'VALUE_BUY', strength: 'HIGH', description: 'Price below fair value with buying pressure' });
  }
  
  if (liquidityZones.insights.optimalEntryZones.length > 0) {
    opportunities.push({ type: 'LIQUIDITY_SUPPORT', strength: 'MEDIUM', description: 'Strong liquidity zones provide support' });
  }
  
  if (orderFlow.signals.continuation && orderFlow.consistency > 80) {
    opportunities.push({ type: 'MOMENTUM', strength: 'HIGH', description: 'Strong consistent order flow momentum' });
  }
  
  return opportunities;
}

// Fallback functions
function createLowDataMicrostructureAssessment() {
  return {
    timestamp: new Date().toISOString(),
    orderFlow: { dominantFlow: 'UNKNOWN', strength: 0, signals: {} },
    liquidityZones: { zones: [], overallQuality: 'UNKNOWN' },
    marketDepth: { execution: { slippageRisk: 'MEDIUM', recommendedExecution: 'LIMIT_ORDERS' } },
    institutionalActivity: { level: 'UNKNOWN', confidence: 0 },
    volumeProfile: { insights: {} },
    priceImpact: { recommendations: {} },
    timing: { score: 50, recommendation: 'NEUTRAL', guidance: {} },
    executionQuality: {},
    insights: { entryTiming: [], exitTiming: [], riskFactors: [], opportunities: [] }
  };
}

function createFallbackMicrostructureAssessment(error) {
  return {
    timestamp: new Date().toISOString(),
    error: error.message,
    orderFlow: { dominantFlow: 'ERROR', strength: 0 },
    liquidityZones: { overallQuality: 'UNKNOWN' },
    marketDepth: { execution: { slippageRisk: 'HIGH', recommendedExecution: 'LIMIT_ORDERS' } },
    institutionalActivity: { level: 'UNKNOWN', confidence: 0 },
    timing: { score: 25, recommendation: 'AVOID_ENTRY', guidance: { entryMethod: 'DEFENSIVE' } },
    insights: { 
      riskFactors: [{ type: 'ANALYSIS_ERROR', level: 'HIGH', description: 'Microstructure analysis failed' }]
    }
  };
}

module.exports = {
  analyzeMarketMicrostructure
};
