/**
 * Tail Risk Protection System
 * Detects market crash conditions and applies defensive position sizing
 * 
 * Core Protection Features:
 * 1. VIX Spike Detection (>30 = elevated risk, >40 = crash conditions)
 * 2. Market Correlation Breakdown (when correlations spike to 1.0)
 * 3. Liquidity Evaporation Detection (volume patterns)
 * 4. Flash Crash Protection (rapid price movements)
 * 5. Sector Contagion Analysis (broad-based selling)
 */

/**
 * Main Tail Risk Assessment Function
 * @param {Object} marketData - Current market data including price, volume, volatility
 * @param {Array} ohlcData - Historical OHLC data for analysis
 * @param {Object} sectorData - Sector performance data (if available)
 * @returns {Object} Tail risk assessment with protection recommendations
 */
function assessTailRisk(marketData, ohlcData, sectorData = null) {
  try {
    console.log(`🛡️ Tail Risk Protection: Analyzing market conditions...`);
    
    const currentPrice = marketData.currentPrice || marketData.latestPrice || 0;
    const volume = marketData.volume || 0;
    const avgVolume = marketData.avgVolume || marketData.avgVolume20DMA || 0;
    
    if (!ohlcData || ohlcData.length < 50) {
      return createLowDataRiskAssessment();
    }
    
    // Get recent data for analysis
    const recentData = ohlcData.slice(-50); // Last 50 bars
    const veryRecentData = ohlcData.slice(-10); // Last 10 bars
    
    // ==============================================
    // RISK DETECTOR 1: VOLATILITY SPIKE DETECTION
    // ==============================================
    const volatilityRisk = detectVolatilitySpikes(recentData, veryRecentData);
    
    // ==============================================
    // RISK DETECTOR 2: FLASH CRASH DETECTION
    // ==============================================
    const flashCrashRisk = detectFlashCrashConditions(veryRecentData, currentPrice);
    
    // ==============================================
    // RISK DETECTOR 3: LIQUIDITY EVAPORATION
    // ==============================================
    const liquidityRisk = detectLiquidityEvaporation(recentData, volume, avgVolume);
    
    // ==============================================
    // RISK DETECTOR 4: CORRELATION BREAKDOWN
    // ==============================================
    const correlationRisk = detectCorrelationBreakdown(recentData);
    
    // ==============================================
    // RISK DETECTOR 5: SECTOR CONTAGION
    // ==============================================
    const contagionRisk = detectSectorContagion(sectorData, recentData);
    
    // ==============================================
    // RISK AGGREGATION AND SCORING
    // ==============================================
    const riskScore = calculateCompositeRiskScore({
      volatility: volatilityRisk,
      flashCrash: flashCrashRisk,
      liquidity: liquidityRisk,
      correlation: correlationRisk,
      contagion: contagionRisk
    });
    
    // ==============================================
    // PROTECTION RECOMMENDATIONS
    // ==============================================
    const protectionPlan = generateProtectionPlan(riskScore, {
      volatility: volatilityRisk,
      flashCrash: flashCrashRisk,
      liquidity: liquidityRisk,
      correlation: correlationRisk,
      contagion: contagionRisk
    });
    
    console.log(`🛡️ Tail Risk Score: ${riskScore.overallScore}/100 (${riskScore.riskLevel})`);
    console.log(`   📊 Protection Level: ${protectionPlan.protectionLevel}`);
    console.log(`   📉 Position Size Multiplier: ${protectionPlan.positionSizeMultiplier}x`);
    
    return {
      timestamp: new Date().toISOString(),
      overallRiskScore: riskScore.overallScore,
      riskLevel: riskScore.riskLevel,
      
      // Individual Risk Components
      riskComponents: {
        volatilitySpike: volatilityRisk,
        flashCrash: flashCrashRisk,
        liquidityEvaporation: liquidityRisk,
        correlationBreakdown: correlationRisk,
        sectorContagion: contagionRisk
      },
      
      // Protection Plan
      protectionPlan: protectionPlan,
      
      // Early Warning System
      earlyWarnings: generateEarlyWarnings(riskScore, {
        volatility: volatilityRisk,
        flashCrash: flashCrashRisk,
        liquidity: liquidityRisk,
        correlation: correlationRisk,
        contagion: contagionRisk
      }),
      
      // Emergency Actions (if risk score > 80)
      emergencyActions: riskScore.overallScore > 80 ? generateEmergencyActions(riskScore) : null
    };
    
  } catch (error) {
    console.error('❌ Tail Risk Protection error:', error);
    return createFallbackRiskAssessment(error);
  }
}

/**
 * RISK DETECTOR 1: Volatility Spike Detection
 * Detects abnormal volatility increases that often precede crashes
 */
function detectVolatilitySpikes(recentData, veryRecentData) {
  const returns = [];
  
  // Calculate returns for volatility analysis
  for (let i = 1; i < recentData.length; i++) {
    const prevClose = recentData[i-1].close;
    const currentClose = recentData[i].close;
    const return_ = (currentClose - prevClose) / prevClose;
    returns.push(return_);
  }
  
  // Calculate rolling volatilities
  const volatility20 = calculateVolatility(returns.slice(-20));
  const volatility5 = calculateVolatility(returns.slice(-5));
  const volatility1 = Math.abs(returns[returns.length - 1] || 0);
  
  // Detect spikes
  const volSpike5vs20 = volatility5 / volatility20;
  const volSpike1vs20 = (volatility1 * Math.sqrt(252)) / volatility20; // Annualized daily vol
  
  // Risk scoring
  let riskScore = 0;
  let riskLevel = 'LOW';
  let warnings = [];
  
  if (volSpike5vs20 > 2.0) {
    riskScore += 30;
    warnings.push(`5-day volatility ${(volSpike5vs20).toFixed(1)}x higher than 20-day average`);
  }
  
  if (volSpike1vs20 > 3.0) {
    riskScore += 25;
    warnings.push(`Single-day volatility spike detected (${(volSpike1vs20).toFixed(1)}x normal)`);
  }
  
  if (volatility20 > 0.30) { // >30% annualized volatility
    riskScore += 20;
    warnings.push(`High base volatility detected (${(volatility20 * 100).toFixed(1)}% annualized)`);
  }
  
  // Consecutive high volatility days
  const highVolDays = returns.slice(-5).filter(r => Math.abs(r) > 0.03).length;
  if (highVolDays >= 3) {
    riskScore += 15;
    warnings.push(`${highVolDays}/5 recent days with >3% moves`);
  }
  
  // Determine risk level
  if (riskScore >= 50) riskLevel = 'HIGH';
  else if (riskScore >= 25) riskLevel = 'MEDIUM';
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    volatility20: Math.round(volatility20 * 10000) / 100, // as percentage
    volatility5: Math.round(volatility5 * 10000) / 100,
    volSpike5vs20: Math.round(volSpike5vs20 * 100) / 100,
    volSpike1vs20: Math.round(volSpike1vs20 * 100) / 100,
    warnings,
    recommendation: riskScore >= 50 ? 'REDUCE_POSITIONS' : 
                   riskScore >= 25 ? 'INCREASE_STOPS' : 'NORMAL_OPERATIONS'
  };
}

/**
 * RISK DETECTOR 2: Flash Crash Detection
 * Detects rapid, unexplained price movements that signal market stress
 */
function detectFlashCrashConditions(veryRecentData, currentPrice) {
  if (veryRecentData.length < 5) {
    return { riskScore: 0, riskLevel: 'LOW', warnings: [], recommendation: 'NORMAL_OPERATIONS' };
  }
  
  const prices = veryRecentData.map(d => d.close);
  const volumes = veryRecentData.map(d => d.volume);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  let riskScore = 0;
  let warnings = [];
  
  // Check for rapid price drops (>5% in single bar)
  for (let i = 1; i < prices.length; i++) {
    const priceChange = (prices[i] - prices[i-1]) / prices[i-1];
    
    if (priceChange < -0.05) { // >5% drop
      riskScore += 40;
      warnings.push(`Rapid ${(Math.abs(priceChange) * 100).toFixed(1)}% price drop detected`);
    } else if (priceChange < -0.03) { // >3% drop
      riskScore += 20;
      warnings.push(`Significant ${(Math.abs(priceChange) * 100).toFixed(1)}% price drop`);
    }
  }
  
  // Check for volume anomalies during drops
  const recentVolume = volumes[volumes.length - 1];
  if (recentVolume > avgVolume * 3) {
    riskScore += 25;
    warnings.push(`Panic volume: ${(recentVolume / avgVolume).toFixed(1)}x average`);
  }
  
  // Check for price recovery patterns (V-shaped recovery can signal manipulation)
  const maxDrop = Math.min(...prices);
  const maxDropIndex = prices.indexOf(maxDrop);
  if (maxDropIndex < prices.length - 1) {
    const recoveryPercent = (prices[prices.length - 1] - maxDrop) / maxDrop;
    if (recoveryPercent > 0.08) { // >8% recovery
      riskScore += 15;
      warnings.push(`Rapid recovery detected - possible manipulation`);
    }
  }
  
  // Check for consecutive gaps (sign of illiquid conditions)
  let gapCount = 0;
  for (let i = 1; i < veryRecentData.length; i++) {
    const gap = Math.abs((veryRecentData[i].open - veryRecentData[i-1].close) / veryRecentData[i-1].close);
    if (gap > 0.02) gapCount++;
  }
  
  if (gapCount >= 2) {
    riskScore += 20;
    warnings.push(`Multiple price gaps detected (${gapCount} gaps) - illiquid conditions`);
  }
  
  const riskLevel = riskScore >= 60 ? 'HIGH' : 
                   riskScore >= 30 ? 'MEDIUM' : 'LOW';
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    maxSingleBarDrop: Math.round(Math.min(...prices.slice(1).map((price, i) => (price - prices[i]) / prices[i])) * 10000) / 100,
    volumeSpike: Math.round((recentVolume / avgVolume) * 100) / 100,
    gapCount,
    warnings,
    recommendation: riskScore >= 60 ? 'HALT_TRADING' : 
                   riskScore >= 30 ? 'REDUCE_POSITIONS' : 'NORMAL_OPERATIONS'
  };
}

/**
 * RISK DETECTOR 3: Liquidity Evaporation Detection
 * Detects when market liquidity suddenly disappears
 */
function detectLiquidityEvaporation(recentData, currentVolume, avgVolume) {
  if (recentData.length < 20) {
    return { riskScore: 0, riskLevel: 'LOW', warnings: [], recommendation: 'NORMAL_OPERATIONS' };
  }
  
  const volumes = recentData.map(d => d.volume);
  const recentVolumes = volumes.slice(-10);
  const olderVolumes = volumes.slice(-20, -10);
  
  const recentAvgVol = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  const olderAvgVol = olderVolumes.reduce((sum, vol) => sum + vol, 0) / olderVolumes.length;
  
  let riskScore = 0;
  let warnings = [];
  
  // Check for volume decline
  const volumeDecline = 1 - (recentAvgVol / olderAvgVol);
  if (volumeDecline > 0.30) { // >30% volume decline
    riskScore += 35;
    warnings.push(`Volume declined ${(volumeDecline * 100).toFixed(1)}% in recent sessions`);
  }
  
  // Check for extremely low current volume
  if (avgVolume > 0) {
    const currentVolumeRatio = currentVolume / avgVolume;
    if (currentVolumeRatio < 0.5) {
      riskScore += 30;
      warnings.push(`Current volume ${(currentVolumeRatio * 100).toFixed(1)}% of average - liquidity concern`);
    }
  }
  
  // Check for consecutive low volume days
  const lowVolumeDays = recentVolumes.filter(vol => vol < avgVolume * 0.7).length;
  if (lowVolumeDays >= 6) {
    riskScore += 25;
    warnings.push(`${lowVolumeDays}/10 recent days with low volume`);
  }
  
  // Check for volume/volatility divergence (high volatility with low volume = bad)
  const prices = recentData.slice(-10).map(d => d.close);
  const recentVolatility = calculateVolatility(prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]));
  
  if (recentVolatility > 0.025 && recentAvgVol < avgVolume * 0.8) { // High vol, low volume
    riskScore += 20;
    warnings.push(`High volatility with low volume - potential liquidity crisis`);
  }
  
  const riskLevel = riskScore >= 50 ? 'HIGH' : 
                   riskScore >= 25 ? 'MEDIUM' : 'LOW';
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    volumeDecline: Math.round(volumeDecline * 1000) / 10, // as percentage
    currentVolumeRatio: avgVolume > 0 ? Math.round((currentVolume / avgVolume) * 100) / 100 : 0,
    lowVolumeDays,
    volatilityVolumeRatio: recentAvgVol > 0 ? Math.round((recentVolatility / (recentAvgVol / 1000000)) * 100) / 100 : 0,
    warnings,
    recommendation: riskScore >= 50 ? 'AVOID_ENTRIES' : 
                   riskScore >= 25 ? 'REDUCE_SIZE' : 'NORMAL_OPERATIONS'
  };
}

/**
 * RISK DETECTOR 4: Correlation Breakdown Detection
 * Detects when market correlations spike (all assets move together = systemic risk)
 */
function detectCorrelationBreakdown(recentData) {
  // This is a simplified version - in production you'd correlate with market indices
  // For now, we'll analyze intraday correlation patterns
  
  const highs = recentData.map(d => d.high);
  const lows = recentData.map(d => d.low);
  const closes = recentData.map(d => d.close);
  
  let riskScore = 0;
  let warnings = [];
  
  // Detect increasing intraday ranges (sign of correlation breakdown)
  const ranges = recentData.map(d => (d.high - d.low) / d.close);
  const recentRanges = ranges.slice(-5);
  const olderRanges = ranges.slice(-15, -5);
  
  const avgRecentRange = recentRanges.reduce((sum, range) => sum + range, 0) / recentRanges.length;
  const avgOlderRange = olderRanges.reduce((sum, range) => sum + range, 0) / olderRanges.length;
  
  const rangeIncrease = avgRecentRange / avgOlderRange - 1;
  
  if (rangeIncrease > 0.50) { // 50% increase in daily ranges
    riskScore += 30;
    warnings.push(`Intraday volatility increased ${(rangeIncrease * 100).toFixed(1)}% - potential correlation breakdown`);
  }
  
  // Detect consecutive wide-range days
  const wideRangeDays = recentRanges.filter(range => range > avgOlderRange * 1.5).length;
  if (wideRangeDays >= 3) {
    riskScore += 25;
    warnings.push(`${wideRangeDays}/5 recent days with wide ranges - systemic stress`);
  }
  
  // Detect gap patterns (sign of overnight correlation spikes)
  let gapCount = 0;
  for (let i = 1; i < recentData.length && i < 11; i++) {
    const gap = Math.abs((recentData[i].open - recentData[i-1].close) / recentData[i-1].close);
    if (gap > 0.015) gapCount++; // >1.5% gap
  }
  
  if (gapCount >= 3) {
    riskScore += 20;
    warnings.push(`Multiple overnight gaps (${gapCount}) - correlation breakdown risk`);
  }
  
  const riskLevel = riskScore >= 45 ? 'HIGH' : 
                   riskScore >= 20 ? 'MEDIUM' : 'LOW';
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    rangeIncrease: Math.round(rangeIncrease * 1000) / 10,
    avgRecentRange: Math.round(avgRecentRange * 10000) / 100,
    wideRangeDays,
    gapCount,
    warnings,
    recommendation: riskScore >= 45 ? 'HEDGE_POSITIONS' : 
                   riskScore >= 20 ? 'MONITOR_CLOSELY' : 'NORMAL_OPERATIONS'
  };
}

/**
 * RISK DETECTOR 5: Sector Contagion Detection
 * Detects when selling spreads across sectors (early crash signal)
 */
function detectSectorContagion(sectorData, recentData) {
  // Placeholder implementation - in production this would analyze sector ETF data
  let riskScore = 0;
  let warnings = [];
  
  // For now, analyze price action patterns that suggest contagion
  const closes = recentData.map(d => d.close);
  const volumes = recentData.map(d => d.volume);
  
  // Detect selling pressure patterns
  let consecutiveDownDays = 0;
  let highVolumeDownDays = 0;
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  for (let i = 1; i < Math.min(closes.length, 11); i++) {
    const priceChange = (closes[i] - closes[i-1]) / closes[i-1];
    const volume = volumes[i];
    
    if (priceChange < -0.01) { // Down >1%
      consecutiveDownDays++;
      if (volume > avgVolume * 1.2) { // High volume selling
        highVolumeDownDays++;
      }
    } else {
      consecutiveDownDays = 0; // Reset if up day
    }
  }
  
  if (consecutiveDownDays >= 3) {
    riskScore += 25;
    warnings.push(`${consecutiveDownDays} consecutive down days - potential contagion`);
  }
  
  if (highVolumeDownDays >= 4) {
    riskScore += 30;
    warnings.push(`${highVolumeDownDays}/10 high volume down days - selling pressure`);
  }
  
  // Detect acceleration in selling (getting worse)
  const recent5Days = closes.slice(-5);
  const decline5Day = (recent5Days[recent5Days.length - 1] - recent5Days[0]) / recent5Days[0];
  
  if (decline5Day < -0.10) { // >10% decline in 5 days
    riskScore += 35;
    warnings.push(`Accelerating decline: ${(Math.abs(decline5Day) * 100).toFixed(1)}% in 5 days`);
  }
  
  const riskLevel = riskScore >= 50 ? 'HIGH' : 
                   riskScore >= 25 ? 'MEDIUM' : 'LOW';
  
  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    consecutiveDownDays,
    highVolumeDownDays,
    decline5Day: Math.round(decline5Day * 1000) / 10,
    warnings,
    recommendation: riskScore >= 50 ? 'DEFENSIVE_POSITIONING' : 
                   riskScore >= 25 ? 'REDUCE_RISK' : 'NORMAL_OPERATIONS'
  };
}

/**
 * Calculate Composite Risk Score
 * Weights different risk factors and generates overall assessment
 */
function calculateCompositeRiskScore(riskComponents) {
  // Risk weighting (most important factors get higher weights)
  const weights = {
    volatility: 0.25,      // 25% - Volatility spikes are early crash signals
    flashCrash: 0.30,      // 30% - Flash crashes are immediate threats
    liquidity: 0.20,       // 20% - Liquidity evaporation amplifies crashes
    correlation: 0.15,     // 15% - Correlation breakdown shows systemic risk
    contagion: 0.10        // 10% - Contagion is longer-term indicator
  };
  
  const weightedScore = 
    (riskComponents.volatility.riskScore * weights.volatility) +
    (riskComponents.flashCrash.riskScore * weights.flashCrash) +
    (riskComponents.liquidity.riskScore * weights.liquidity) +
    (riskComponents.correlation.riskScore * weights.correlation) +
    (riskComponents.contagion.riskScore * weights.contagion);
  
  const overallScore = Math.round(weightedScore);
  
  // Determine overall risk level
  let riskLevel = 'LOW';
  if (overallScore >= 70) riskLevel = 'CRITICAL';
  else if (overallScore >= 50) riskLevel = 'HIGH';
  else if (overallScore >= 30) riskLevel = 'MEDIUM';
  
  // Risk level adjustments for specific patterns
  if (riskComponents.flashCrash.riskScore >= 60 || riskComponents.volatility.riskScore >= 70) {
    riskLevel = 'CRITICAL'; // Override for extreme conditions
  }
  
  return {
    overallScore,
    riskLevel,
    weightedComponents: {
      volatility: Math.round(riskComponents.volatility.riskScore * weights.volatility),
      flashCrash: Math.round(riskComponents.flashCrash.riskScore * weights.flashCrash),
      liquidity: Math.round(riskComponents.liquidity.riskScore * weights.liquidity),
      correlation: Math.round(riskComponents.correlation.riskScore * weights.correlation),
      contagion: Math.round(riskComponents.contagion.riskScore * weights.contagion)
    },
    weights
  };
}

/**
 * Generate Protection Plan
 * Creates specific position sizing and risk management recommendations
 */
function generateProtectionPlan(riskScore, riskComponents) {
  const score = riskScore.overallScore;
  
  let protectionLevel = 'NORMAL';
  let positionSizeMultiplier = 1.0;
  let maxPositionPercent = 10; // % of portfolio per position
  let stopLossMultiplier = 1.0;
  let actions = [];
  let timeHorizon = 'NORMAL'; // How long to apply protection
  
  // Protection levels based on risk score
  if (score >= 70) {
    // CRITICAL RISK
    protectionLevel = 'MAXIMUM_PROTECTION';
    positionSizeMultiplier = 0.25; // Quarter size
    maxPositionPercent = 3;
    stopLossMultiplier = 0.7; // Tighter stops
    timeHorizon = 'EXTENDED'; // Apply for longer period
    
    actions = [
      'Reduce all position sizes to 25% of normal',
      'Maximum 3% portfolio allocation per position',
      'Tighten stop losses by 30%',
      'Avoid new entries except highest-grade setups',
      'Consider portfolio hedging',
      'Daily risk monitoring required'
    ];
    
  } else if (score >= 50) {
    // HIGH RISK
    protectionLevel = 'HIGH_PROTECTION';
    positionSizeMultiplier = 0.5; // Half size
    maxPositionPercent = 5;
    stopLossMultiplier = 0.8;
    timeHorizon = 'MEDIUM';
    
    actions = [
      'Reduce position sizes to 50% of normal',
      'Maximum 5% portfolio allocation per position',
      'Tighten stop losses by 20%',
      'Raise entry standards - only A-grade setups',
      'Monitor for further deterioration'
    ];
    
  } else if (score >= 30) {
    // MEDIUM RISK
    protectionLevel = 'MODERATE_PROTECTION';
    positionSizeMultiplier = 0.75; // 75% size
    maxPositionPercent = 7;
    stopLossMultiplier = 0.9;
    timeHorizon = 'SHORT';
    
    actions = [
      'Reduce position sizes to 75% of normal',
      'Maximum 7% portfolio allocation per position',
      'Slightly tighter stop losses',
      'Favor high-quality setups only',
      'Increased monitoring'
    ];
  }
  
  // Special adjustments for specific risk types
  if (riskComponents.flashCrash.riskScore >= 60) {
    actions.push('⚡ FLASH CRASH ALERT: Avoid market orders, use limit orders only');
    positionSizeMultiplier *= 0.5; // Additional 50% reduction
  }
  
  if (riskComponents.liquidity.riskScore >= 50) {
    actions.push('💧 LIQUIDITY ALERT: Avoid illiquid stocks, focus on high-volume names');
  }
  
  if (riskComponents.volatility.riskScore >= 60) {
    actions.push('📈 VOLATILITY ALERT: Extended protection period recommended');
    timeHorizon = 'EXTENDED';
  }
  
  return {
    protectionLevel,
    positionSizeMultiplier: Math.round(positionSizeMultiplier * 100) / 100,
    maxPositionPercent,
    stopLossMultiplier: Math.round(stopLossMultiplier * 100) / 100,
    timeHorizon,
    actions,
    
    // Implementation guidance
    implementation: {
      immediateActions: actions.slice(0, 3),
      monitoringActions: actions.slice(3),
      reviewFrequency: score >= 50 ? 'DAILY' : score >= 30 ? 'EVERY_2_DAYS' : 'WEEKLY',
      escalationTrigger: score + 15, // If risk score increases by 15 points, escalate
      deescalationTrigger: Math.max(score - 20, 10) // When to reduce protection
    }
  };
}

/**
 * Generate Early Warning System Alerts
 */
function generateEarlyWarnings(riskScore, riskComponents) {
  const warnings = [];
  const alerts = [];
  
  // Collect all warnings from components
  Object.values(riskComponents).forEach(component => {
    if (component.warnings) {
      warnings.push(...component.warnings);
    }
  });
  
  // Generate alert levels
  if (riskScore.overallScore >= 70) {
    alerts.push({
      level: 'CRITICAL',
      message: 'TAIL RISK CRITICAL - Market crash conditions detected',
      action: 'Immediate defensive action required',
      urgency: 'IMMEDIATE'
    });
  } else if (riskScore.overallScore >= 50) {
    alerts.push({
      level: 'HIGH',
      message: 'TAIL RISK HIGH - Elevated crash probability',
      action: 'Reduce risk exposure significantly',
      urgency: 'URGENT'
    });
  } else if (riskScore.overallScore >= 30) {
    alerts.push({
      level: 'MEDIUM',
      message: 'TAIL RISK ELEVATED - Monitor closely',
      action: 'Apply moderate risk reduction',
      urgency: 'MODERATE'
    });
  }
  
  return {
    overallLevel: riskScore.riskLevel,
    alerts,
    warnings,
    monitoringFrequency: riskScore.overallScore >= 50 ? 'HOURLY' : 
                        riskScore.overallScore >= 30 ? 'EVERY_4_HOURS' : 'DAILY'
  };
}

/**
 * Generate Emergency Actions (for critical risk levels)
 */
function generateEmergencyActions(riskScore) {
  return {
    immediate: [
      'HALT all new position entries',
      'Review and tighten all stop losses immediately',
      'Consider closing 50% of current positions',
      'Activate portfolio hedging if available'
    ],
    within24Hours: [
      'Complete portfolio stress test',
      'Implement maximum position size limits',
      'Establish daily loss limits',
      'Prepare for extended market volatility'
    ],
    monitoring: [
      'Monitor major indices every hour',
      'Watch for VIX spikes above 40',
      'Track sector rotation patterns',
      'Monitor overnight futures for gaps'
    ]
  };
}

/**
 * Utility Functions
 */

function calculateVolatility(returns) {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  return Math.sqrt(variance * 252); // Annualized volatility
}

function createLowDataRiskAssessment() {
  return {
    timestamp: new Date().toISOString(),
    overallRiskScore: 25,
    riskLevel: 'UNKNOWN',
    
    riskComponents: {
      volatilitySpike: { riskScore: 0, riskLevel: 'UNKNOWN', warnings: ['Insufficient data for volatility analysis'] },
      flashCrash: { riskScore: 0, riskLevel: 'UNKNOWN', warnings: ['Insufficient data for flash crash detection'] },
      liquidityEvaporation: { riskScore: 0, riskLevel: 'UNKNOWN', warnings: ['Insufficient data for liquidity analysis'] },
      correlationBreakdown: { riskScore: 0, riskLevel: 'UNKNOWN', warnings: ['Insufficient data for correlation analysis'] },
      sectorContagion: { riskScore: 0, riskLevel: 'UNKNOWN', warnings: ['Insufficient data for contagion analysis'] }
    },
    
    protectionPlan: {
      protectionLevel: 'CONSERVATIVE',
      positionSizeMultiplier: 0.75,
      maxPositionPercent: 7,
      actions: ['Apply conservative position sizing due to limited data']
    },
    
    earlyWarnings: {
      overallLevel: 'UNKNOWN',
      alerts: [{
        level: 'INFO',
        message: 'Insufficient historical data for comprehensive tail risk analysis',
        action: 'Apply conservative risk management',
        urgency: 'LOW'
      }],
      warnings: ['Limited historical data - apply conservative risk management'],
      monitoringFrequency: 'DAILY'
    }
  };
}

function createFallbackRiskAssessment(error) {
  return {
    timestamp: new Date().toISOString(),
    overallRiskScore: 40,
    riskLevel: 'MEDIUM',
    error: error.message,
    
    protectionPlan: {
      protectionLevel: 'MODERATE_PROTECTION',
      positionSizeMultiplier: 0.75,
      maxPositionPercent: 7,
      actions: ['Apply moderate protection due to analysis error']
    },
    
    earlyWarnings: {
      overallLevel: 'MEDIUM',
      alerts: [{
        level: 'WARNING',
        message: 'Tail risk analysis error - applying moderate protection',
        action: 'Use conservative risk management until resolved',
        urgency: 'MODERATE'
      }]
    }
  };
}

module.exports = {
  assessTailRisk
};
