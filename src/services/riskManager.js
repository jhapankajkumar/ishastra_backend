/**
 * Risk Management Service
 * Phase 4: Advanced Risk Control & Portfolio Management
 * 
 * Features:
 * - Position sizing based on volatility and account size
 * - Risk-reward ratio calculations
 * - Maximum drawdown protection
 * - Correlation analysis between positions
 * - Dynamic stop-loss adjustments
 */

const AdvancedTechnicalAnalysis = require('../utils/advancedTechnicalAnalysis');

class RiskManager {
  constructor(config = {}) {
    this.config = {
      maxRiskPerTrade: config.maxRiskPerTrade || 0.02,          // 2% max risk per trade
      maxPortfolioRisk: config.maxPortfolioRisk || 0.06,        // 6% max total portfolio risk
      maxPositions: config.maxPositions || 5,                   // Max concurrent positions
      minRiskReward: config.minRiskReward || 2.0,               // Minimum 1:2 risk/reward
      maxDrawdown: config.maxDrawdown || 0.15,                  // 15% max drawdown limit
      maxCorrelation: config.maxCorrelation || 0.7,             // Max correlation between positions
      accountSize: config.accountSize || 100000,               // Account size in currency
      stopLossMethod: config.stopLossMethod || 'atr',           // 'atr', 'support', 'percentage'
      trailingStopEnabled: config.trailingStopEnabled || true   // Enable trailing stops
    };
    
    this.positions = new Map();
    this.riskMetrics = {
      currentPortfolioRisk: 0,
      currentDrawdown: 0,
      maxDrawdownReached: 0,
      totalRiskCapital: 0
    };
    
    //console.log('🛡️  Risk Manager initialized with strict controls');
    //console.log(`   Max risk per trade: ${this.config.maxRiskPerTrade * 100}%`);
    //console.log(`   Max portfolio risk: ${this.config.maxPortfolioRisk * 100}%`);
    //console.log(`   Max positions: ${this.config.maxPositions}`);
  }

  /**
   * Calculate optimal position size based on risk parameters
   */
  calculatePositionSize(signal, marketData) {
    try {
      const { entryPrice, stopLoss, accountValue = this.config.accountSize } = signal;
      
      if (!entryPrice || !stopLoss) {
        throw new Error('Entry price and stop loss required for position sizing');
      }

      // Calculate risk per share
      const riskPerShare = Math.abs(entryPrice - stopLoss);
      const riskPercent = riskPerShare / entryPrice;

      // Calculate maximum risk capital
      const maxRiskCapital = accountValue * this.config.maxRiskPerTrade;
      
      // Basic position size
      let positionSize = Math.floor(maxRiskCapital / riskPerShare);
      
      // Apply volatility adjustment
      const volatilityMultiplier = this.calculateVolatilityAdjustment(marketData);
      positionSize = Math.floor(positionSize * volatilityMultiplier);
      
      // Apply portfolio heat adjustment
      const heatMultiplier = this.calculatePortfolioHeatAdjustment();
      positionSize = Math.floor(positionSize * heatMultiplier);
      
      // Position value limits
      const positionValue = positionSize * entryPrice;
      const maxPositionValue = accountValue * 0.25; // Max 25% per position
      
      if (positionValue > maxPositionValue) {
        positionSize = Math.floor(maxPositionValue / entryPrice);
      }

      const actualRisk = (positionSize * riskPerShare) / accountValue;
      const actualPositionValue = positionSize * entryPrice;

      return {
        positionSize,
        positionValue: actualPositionValue,
        riskAmount: positionSize * riskPerShare,
        riskPercent: actualRisk,
        riskPerShare,
        volatilityAdjustment: volatilityMultiplier,
        portfolioHeatAdjustment: heatMultiplier,
        recommendation: this.getPositionSizeRecommendation(actualRisk)
      };

    } catch (error) {
      console.error('❌ Error calculating position size:', error.message);
      return null;
    }
  }

  /**
   * Calculate volatility-based position size adjustment
   */
  calculateVolatilityAdjustment(marketData) {
    try {
      if (!marketData || marketData.length < 20) return 1.0;

      // Calculate 20-day ATR
      const technicalAnalysis = new AdvancedTechnicalAnalysis();
      const atr = technicalAnalysis.calculateATR(marketData, 20);
      const currentPrice = marketData[marketData.length - 1].close;
      const atrPercent = atr / currentPrice;

      // Adjust position size based on volatility
      // Higher volatility = smaller position
      if (atrPercent > 0.05) return 0.7;      // Very volatile: 70% size
      if (atrPercent > 0.03) return 0.85;     // High volatility: 85% size
      if (atrPercent > 0.02) return 1.0;      // Normal volatility: 100% size
      if (atrPercent > 0.01) return 1.1;      // Low volatility: 110% size
      return 1.2;                             // Very low volatility: 120% size

    } catch (error) {
      console.error('Error calculating volatility adjustment:', error.message);
      return 1.0;
    }
  }

  /**
   * Calculate portfolio heat adjustment
   */
  calculatePortfolioHeatAdjustment() {
    const currentRisk = this.riskMetrics.currentPortfolioRisk;
    const maxRisk = this.config.maxPortfolioRisk;
    
    if (currentRisk >= maxRisk) return 0; // No new positions
    if (currentRisk >= maxRisk * 0.8) return 0.5; // Reduce size by 50%
    if (currentRisk >= maxRisk * 0.6) return 0.75; // Reduce size by 25%
    
    return 1.0; // Normal sizing
  }

  /**
   * Validate trade before execution
   */
  validateTrade(signal, positionSizing, marketData) {
    const validationResults = {
      approved: false,
      reasons: [],
      warnings: [],
      adjustments: []
    };

    try {
      // Check max positions limit
      if (this.positions.size >= this.config.maxPositions) {
        validationResults.reasons.push('Maximum position limit reached');
        return validationResults;
      }

      // Check portfolio risk limit
      const newPortfolioRisk = this.riskMetrics.currentPortfolioRisk + positionSizing.riskPercent;
      if (newPortfolioRisk > this.config.maxPortfolioRisk) {
        validationResults.reasons.push(`Would exceed max portfolio risk (${(newPortfolioRisk * 100).toFixed(1)}% > ${(this.config.maxPortfolioRisk * 100)}%)`);
        return validationResults;
      }

      // Check minimum position size
      if (positionSizing.positionSize < 100) {
        validationResults.reasons.push('Position size too small (min 100 shares)');
        return validationResults;
      }

      // Check risk-reward ratio
      const riskReward = this.calculateRiskReward(signal);
      if (riskReward < this.config.minRiskReward) {
        validationResults.warnings.push(`Low risk-reward ratio: ${riskReward.toFixed(2)} (min ${this.config.minRiskReward})`);
      }

      // Check correlation with existing positions
      const correlation = this.checkPositionCorrelation(signal.symbol);
      if (correlation > this.config.maxCorrelation) {
        validationResults.warnings.push(`High correlation with existing positions: ${(correlation * 100).toFixed(1)}%`);
      }

      // Check drawdown status
      if (this.riskMetrics.currentDrawdown > this.config.maxDrawdown * 0.8) {
        validationResults.warnings.push(`Approaching max drawdown limit: ${(this.riskMetrics.currentDrawdown * 100).toFixed(1)}%`);
      }

      // All checks passed
      validationResults.approved = true;
      
      if (validationResults.warnings.length > 0) {
        //console.log(`⚠️  Trade approved with warnings for ${signal.symbol}:`);
        validationResults.warnings.forEach(warning => //console.log(`   - ${warning}`));
      }

    } catch (error) {
      validationResults.reasons.push(`Validation error: ${error.message}`);
    }

    return validationResults;
  }

  /**
   * Calculate risk-reward ratio
   */
  calculateRiskReward(signal) {
    try {
      if (!signal.entryPrice || !signal.stopLoss || !signal.targets) {
        return 0;
      }

      const risk = Math.abs(signal.entryPrice - signal.stopLoss);
      const reward = Math.abs(signal.targets[0] - signal.entryPrice);
      
      return reward / risk;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check correlation with existing positions
   */
  checkPositionCorrelation(newSymbol) {
    // Simplified correlation check - in real implementation, 
    // you'd calculate actual price correlations
    const sectorCorrelations = {
      'TECH': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'],
      'FINANCE': ['JPM', 'BAC', 'WFC', 'GS'],
      'HEALTHCARE': ['JNJ', 'PFE', 'UNH', 'ABBV'],
      'ENERGY': ['XOM', 'CVX', 'COP', 'SLB']
    };

    let maxCorrelation = 0;
    
    for (const [symbol, position] of this.positions) {
      // Find sectors for both symbols
      let newSector = null;
      let existingSector = null;
      
      for (const [sector, symbols] of Object.entries(sectorCorrelations)) {
        if (symbols.includes(newSymbol)) newSector = sector;
        if (symbols.includes(symbol)) existingSector = sector;
      }
      
      // High correlation if same sector
      if (newSector && existingSector && newSector === existingSector) {
        maxCorrelation = Math.max(maxCorrelation, 0.8);
      }
    }
    
    return maxCorrelation;
  }

  /**
   * Calculate dynamic stop loss
   */
  calculateStopLoss(signal, marketData, method = null) {
    const stopMethod = method || this.config.stopLossMethod;
    const entryPrice = signal.entryPrice;
    const direction = signal.direction || 'LONG';
    
    try {
      switch (stopMethod) {
        case 'atr':
          return this.calculateATRStopLoss(entryPrice, marketData, direction);
        
        case 'support':
          return this.calculateSupportStopLoss(entryPrice, marketData, direction);
        
        case 'percentage':
          return this.calculatePercentageStopLoss(entryPrice, direction);
        
        default:
          return this.calculateATRStopLoss(entryPrice, marketData, direction);
      }
    } catch (error) {
      console.error('Error calculating stop loss:', error.message);
      return this.calculatePercentageStopLoss(entryPrice, direction);
    }
  }

  /**
   * ATR-based stop loss
   */
  calculateATRStopLoss(entryPrice, marketData, direction, multiplier = 2.0) {
    const technicalAnalysis = new AdvancedTechnicalAnalysis();
    const atr = technicalAnalysis.calculateATR(marketData, 14);
    
    if (direction === 'LONG') {
      return entryPrice - (atr * multiplier);
    } else {
      return entryPrice + (atr * multiplier);
    }
  }

  /**
   * Support/resistance based stop loss
   */
  calculateSupportStopLoss(entryPrice, marketData, direction) {
    // Simplified support/resistance calculation
    const recentData = marketData.slice(-20);
    const lows = recentData.map(d => d.low);
    const highs = recentData.map(d => d.high);
    
    if (direction === 'LONG') {
      const support = Math.min(...lows);
      return support * 0.99; // 1% below support
    } else {
      const resistance = Math.max(...highs);
      return resistance * 1.01; // 1% above resistance
    }
  }

  /**
   * Percentage-based stop loss
   */
  calculatePercentageStopLoss(entryPrice, direction, percentage = 0.08) {
    if (direction === 'LONG') {
      return entryPrice * (1 - percentage);
    } else {
      return entryPrice * (1 + percentage);
    }
  }

  /**
   * Add new position to risk tracking
   */
  addPosition(symbol, positionData) {
    const position = {
      symbol,
      ...positionData,
      addedAt: new Date(),
      unrealizedPnL: 0,
      trailingStop: positionData.stopLoss
    };

    this.positions.set(symbol, position);
    this.updateRiskMetrics();
    
    //console.log(`📊 Position added to risk tracking: ${position.direction} ${symbol}`);
    //console.log(`   Position size: ${position.positionSize} shares`);
    //console.log(`   Risk amount: $${position.riskAmount?.toFixed(2)}`);
    //console.log(`   Portfolio risk: ${(this.riskMetrics.currentPortfolioRisk * 100).toFixed(2)}%`);
  }

  /**
   * Update position with current market data
   */
  updatePosition(symbol, currentPrice) {
    const position = this.positions.get(symbol);
    if (!position) return null;

    // Calculate current P&L
    const priceDiff = position.direction === 'LONG' ? 
      currentPrice - position.entryPrice : 
      position.entryPrice - currentPrice;
    
    position.currentPrice = currentPrice;
    position.unrealizedPnL = priceDiff * position.positionSize;
    position.unrealizedPnLPercent = priceDiff / position.entryPrice;
    
    // Update trailing stop if enabled
    if (this.config.trailingStopEnabled) {
      position.trailingStop = this.updateTrailingStop(position, currentPrice);
    }
    
    this.updateRiskMetrics();
    return position;
  }

  /**
   * Update trailing stop loss
   */
  updateTrailingStop(position, currentPrice) {
    const { direction, entryPrice, trailingStop, positionSize } = position;
    
    if (direction === 'LONG') {
      // Move stop up if price increased
      const profitPercent = (currentPrice - entryPrice) / entryPrice;
      if (profitPercent > 0.1) { // If 10% profit, trail closer
        const newStop = currentPrice * 0.95; // 5% trailing
        return Math.max(newStop, trailingStop);
      }
    } else {
      // SHORT position - move stop down if price decreased
      const profitPercent = (entryPrice - currentPrice) / entryPrice;
      if (profitPercent > 0.1) {
        const newStop = currentPrice * 1.05; // 5% trailing
        return Math.min(newStop, trailingStop);
      }
    }
    
    return trailingStop;
  }

  /**
   * Update portfolio risk metrics
   */
  updateRiskMetrics() {
    let totalRiskCapital = 0;
    let totalUnrealizedPnL = 0;
    let totalPositionValue = 0;

    for (const [symbol, position] of this.positions) {
      totalRiskCapital += position.riskAmount || 0;
      totalUnrealizedPnL += position.unrealizedPnL || 0;
      totalPositionValue += (position.currentPrice || position.entryPrice) * position.positionSize;
    }

    this.riskMetrics = {
      currentPortfolioRisk: totalRiskCapital / this.config.accountSize,
      currentDrawdown: Math.min(0, totalUnrealizedPnL / this.config.accountSize),
      maxDrawdownReached: Math.max(this.riskMetrics.maxDrawdownReached, Math.abs(this.riskMetrics.currentDrawdown)),
      totalRiskCapital,
      totalUnrealizedPnL,
      totalPositionValue,
      positionCount: this.positions.size
    };
  }

  /**
   * Get position size recommendation
   */
  getPositionSizeRecommendation(riskPercent) {
    if (riskPercent > this.config.maxRiskPerTrade) return 'REDUCE_SIZE';
    if (riskPercent < this.config.maxRiskPerTrade * 0.5) return 'CAN_INCREASE';
    return 'OPTIMAL';
  }

  /**
   * Get current risk status
   */
  getRiskStatus() {
    return {
      riskMetrics: this.riskMetrics,
      config: this.config,
      positions: Array.from(this.positions.entries()).map(([symbol, pos]) => ({
        symbol,
        direction: pos.direction,
        positionSize: pos.positionSize,
        riskAmount: pos.riskAmount,
        unrealizedPnL: pos.unrealizedPnL,
        trailingStop: pos.trailingStop
      })),
      recommendations: this.generateRiskRecommendations()
    };
  }

  /**
   * Get risk summary for portfolio display
   */
  getRiskSummary() {
    return {
      currentRisk: this.riskMetrics.currentPortfolioRisk * 100, // Convert to percentage
      maxRisk: this.config.maxPortfolioRisk,
      currentPositions: this.positions.size,
      maxPositions: this.config.maxPositions,
      availableRisk: this.config.maxPortfolioRisk - (this.riskMetrics.currentPortfolioRisk * 100),
      totalRiskCapital: this.riskMetrics.totalRiskCapital,
      totalUnrealizedPnL: this.riskMetrics.totalUnrealizedPnL,
      riskUtilization: (this.riskMetrics.currentPortfolioRisk * 100) / this.config.maxPortfolioRisk,
      status: this.getRiskStatus()
    };
  }

  /**
   * Generate risk management recommendations
   */
  generateRiskRecommendations() {
    const recommendations = [];
    
    if (this.riskMetrics.currentPortfolioRisk > this.config.maxPortfolioRisk * 0.8) {
      recommendations.push('⚠️  Approaching maximum portfolio risk limit - consider reducing position sizes');
    }
    
    if (this.riskMetrics.currentDrawdown < -this.config.maxDrawdown * 0.5) {
      recommendations.push('⚠️  Significant drawdown detected - review stop losses and position sizing');
    }
    
    if (this.positions.size >= this.config.maxPositions) {
      recommendations.push('📊 Maximum position count reached - close positions before adding new ones');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Portfolio risk levels are within acceptable limits');
    }
    
    return recommendations;
  }
}

module.exports = RiskManager;
