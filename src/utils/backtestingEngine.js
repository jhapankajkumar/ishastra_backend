/**
 * AI Trading System - Phase 3: Enhanced Backtesting Engine
 * Historical validation of trading systems with LONG and SHORT positions
 */

const yahoo = require('../yahoo');
const AdvancedTechnicalAnalysis = require('./advancedTechnicalAnalysis');

class BacktestingEngine {
  constructor(historicalData = null, options = {}) {
    this.historicalData = historicalData; // Allow direct data injection
    this.initialCapital = options.initialCapital || 100000; // $100k default
    this.commissionPerTrade = options.commissionPerTrade || 5; // $5 per trade
    this.maxPositionSize = options.maxPositionSize || 0.25; // 25% max per position
    this.riskPerTrade = options.riskPerTrade || 0.02; // 2% risk per trade
    this.slippagePercent = options.slippagePercent || 0.001; // 0.1% slippage
    this.allowShortSelling = options.allowShortSelling !== false; // Enable short selling by default
    this.shortBorrowRate = options.shortBorrowRate || 0.02; // 2% annual borrow rate for shorts
  }

  /**
   * Run backtest with pre-loaded historical data (for testing)
   */
  async runBacktest() {
    if (!this.historicalData || this.historicalData.length < 100) {
      throw new Error(`Insufficient historical data: ${this.historicalData?.length || 0} points`);
    }

    try {
      //console.log(`📊 Running backtest with ${this.historicalData.length} data points...`);
      
      // Initialize backtest state
      const backtestState = {
        capital: this.initialCapital,
        totalInvested: 0,
        positions: [], // Current open positions
        trades: [], // Completed trades
        equity: [], // Daily equity curve
        drawdown: [], // Drawdown tracking
        systemSignals: {}, // Track signals by system
        systemPerformance: {} // Track system performance
      };

      // Get technical indicators for all data points
      let signals = [];
      for (let i = 50; i < this.historicalData.length; i++) { // Start after 50 days for indicators
        const dataSlice = this.historicalData.slice(0, i + 1);
        const currentDate = this.historicalData[i].date;
        const currentPrice = this.historicalData[i].close;
        
        try {
          // Get signals from our AI system (using the same method as backtestSymbol)
          const analysis = await AdvancedTechnicalAnalysis.analyzeStock(dataSlice, 'TEST_SYMBOL');
          
          // Extract signals for each system - BOTH LONG AND SHORT
          const systemsToTest = ['threeWeeksTight', 'cupHandle', 'flagPennant', 'tripleScreen', 'sepa', 'darvasBox'];
          
          for (const systemName of systemsToTest) {
            const systemSignal = analysis.signals.systems[systemName];
            if (systemSignal) {
              // LONG signals
              if (systemSignal.signal === 'BUY' || systemSignal.signal === 'STRONG_BUY') {
                signals.push({
                  date: currentDate,
                  price: currentPrice,
                  system: systemName,
                  signal: systemSignal.signal,
                  direction: 'LONG',
                  confidence: systemSignal.confidence || 0.5,
                  index: i,
                  analysis: analysis
                });
              }
              
              // SHORT signals (if enabled)
              if (this.allowShortSelling && (systemSignal.signal === 'SELL' || systemSignal.signal === 'STRONG_SELL')) {
                signals.push({
                  date: currentDate,
                  price: currentPrice,
                  system: systemName,
                  signal: systemSignal.signal,
                  direction: 'SHORT',
                  confidence: systemSignal.confidence || 0.5,
                  index: i,
                  analysis: analysis
                });
              }
            }
          }
        } catch (error) {
          // Skip this window if analysis fails
          continue;
        }
      }
      
      // Apply signal filters if defined
      if (this.filterSignalsByDirection) {
        signals = this.filterSignalsByDirection(signals);
      }
      if (this.filterSignalsBySystem) {
        signals = this.filterSignalsBySystem(signals);
      }
      
      //console.log(`🎯 Generated ${signals.length} signals across all systems (${signals.filter(s => s.direction === 'LONG').length} LONG, ${signals.filter(s => s.direction === 'SHORT').length} SHORT)`);

      // Simulate trading
      await this.simulateTrading(backtestState, signals, this.historicalData, ['threeWeeksTight', 'cupHandle', 'flagPennant', 'tripleScreen', 'sepa', 'darvasBox']);

      // Close any remaining positions
      const finalPrice = this.historicalData[this.historicalData.length - 1].close;
      for (const position of backtestState.positions) {
        this.closePosition(position, finalPrice, this.historicalData[this.historicalData.length - 1].date, 'END_OF_PERIOD', backtestState);
      }

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(backtestState, this.historicalData);

      return {
        symbol: 'HISTORICAL_DATA',
        period: `${this.historicalData.length} days`,
        ...performanceMetrics,
        trades: backtestState.trades,
        dailyEquity: backtestState.equity,
        maxDrawdown: Math.max(...backtestState.drawdown) || 0
      };

    } catch (error) {
      console.error(`❌ Backtest failed:`, error.message);
      throw error;
    }
  }

  /**
   * Backtest a single symbol across multiple trading systems
   */
  async backtestSymbol(symbol, period = '2y', systems = ['all']) {
    try {
      //console.log(`📊 Starting backtest for ${symbol} over ${period}...`);
      
      // Get historical data
      const historicalData = await yahoo.getHistorical(symbol, period);
      if (!historicalData || historicalData.length < 100) {
        throw new Error(`Insufficient data for ${symbol}: ${historicalData?.length || 0} points`);
      }

      //console.log(`✅ Retrieved ${historicalData.length} data points for ${symbol}`);

      // Initialize backtest state
      const backtestState = {
        capital: this.initialCapital,
        positions: [],
        trades: [],
        equity: [this.initialCapital],
        drawdowns: [],
        systemPerformance: {}
      };

      // Systems to test
      const systemsToTest = systems.includes('all') ? [
        'threeWeeksTight',
        'cupHandle', 
        'flagPennant',
        'tripleScreen',
        'sepa',
        'darvasBox'
      ] : systems;

      // Run analysis on sliding windows for signal generation
      const windowSize = 50; // Minimum data needed for analysis
      let signals = [];

      for (let i = windowSize; i < historicalData.length; i++) {
        const windowData = historicalData.slice(0, i + 1);
        const currentDate = historicalData[i].date;
        const currentPrice = historicalData[i].close;

        try {
          // Get signals from our AI system
          const analysis = await AdvancedTechnicalAnalysis.analyzeStock(windowData, symbol);
          
          // Extract signals for each system - BOTH LONG AND SHORT
          for (const systemName of systemsToTest) {
            const systemSignal = analysis.signals.systems[systemName];
            if (systemSignal) {
              // LONG signals
              if (systemSignal.signal === 'BUY' || systemSignal.signal === 'STRONG_BUY') {
                signals.push({
                  date: currentDate,
                  price: currentPrice,
                  system: systemName,
                  signal: systemSignal.signal,
                  direction: 'LONG',
                  confidence: systemSignal.confidence || 0.5,
                  index: i,
                  analysis: analysis
                });
              }
              
              // SHORT signals (if enabled)
              if (this.allowShortSelling && (systemSignal.signal === 'SELL' || systemSignal.signal === 'STRONG_SELL')) {
                signals.push({
                  date: currentDate,
                  price: currentPrice,
                  system: systemName,
                  signal: systemSignal.signal,
                  direction: 'SHORT',
                  confidence: systemSignal.confidence || 0.5,
                  index: i,
                  analysis: analysis
                });
              }
            }
          }
        } catch (error) {
          // Skip this window if analysis fails
          continue;
        }
      }
      
      // Apply signal filters if defined
      if (this.filterSignalsByDirection) {
        signals = this.filterSignalsByDirection(signals);
      }
      if (this.filterSignalsBySystem) {
        signals = this.filterSignalsBySystem(signals);
      }

      //console.log(`🎯 Generated ${signals.length} signals across all systems (${signals.filter(s => s.direction === 'LONG').length} LONG, ${signals.filter(s => s.direction === 'SHORT').length} SHORT)`);

      // Simulate trading based on signals
      await this.simulateTrading(backtestState, signals, historicalData, systemsToTest);

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(backtestState, historicalData);

      return {
        symbol,
        period,
        systemsToTest,
        ...performanceMetrics,
        trades: backtestState.trades,
        signals: signals.length,
        historicalDataPoints: historicalData.length
      };

    } catch (error) {
      console.error(`❌ Backtest failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Simulate trading based on generated signals - LONG and SHORT
   */
  async simulateTrading(backtestState, signals, historicalData, systems) {
    let currentPositions = new Map(); // system -> position info
    
    for (const signal of signals) {
      const systemName = signal.system;
      const positionKey = `${systemName}_${signal.direction}`;
      
      // Skip if we already have a position in this system/direction
      if (currentPositions.has(positionKey)) {
        continue;
      }

      // Calculate position size based on risk management
      // FORCE CORRECT TARGET/STOP CALCULATIONS based on direction
      let finalTargetPrice, finalStopLoss;
      
      if (signal.direction === 'LONG') {
        finalTargetPrice = signal.analysis.recommendations.targets?.[0]?.price || signal.price * 1.1;
        finalStopLoss = signal.analysis.recommendations.stopLoss || signal.price * 0.95;
      } else {
        // SHORT: FORCE target below entry and stop above entry
        finalTargetPrice = signal.price * 0.9;  // Target 10% below entry
        finalStopLoss = signal.price * 1.05;    // Stop 5% above entry
      }

      const positionSize = this.calculatePositionSize(
        backtestState.capital,
        signal.price,
        finalStopLoss,
        signal.direction
      );

      if (positionSize <= 0) continue;

      // Enter position with slippage
      const entryPrice = signal.direction === 'LONG' ? 
        signal.price * (1 + this.slippagePercent) : // LONG: pay slippage
        signal.price * (1 - this.slippagePercent);   // SHORT: receive less due to slippage
        
      const shares = Math.floor(positionSize / signal.price); // Use original price for share calculation
      const totalCost = shares * entryPrice + this.commissionPerTrade;

      // For SHORT positions, we receive cash but need margin
      const capitalRequired = signal.direction === 'LONG' ? totalCost : shares * entryPrice * 0.5; // 50% margin for shorts
      
      if (capitalRequired > backtestState.capital) continue; // Not enough capital

      // Create position
      const position = {
        system: systemName,
        direction: signal.direction,
        entryDate: signal.date,
        entryPrice: entryPrice,
        shares: shares,
        stopLoss: finalStopLoss,
        target1: finalTargetPrice,
        target2: signal.direction === 'LONG' ? 
          (signal.analysis.recommendations.targets?.[1]?.price || signal.price * 1.2) :
          (signal.analysis.recommendations.targets?.[1]?.price || signal.price * 0.8),
        confidence: signal.confidence,
        entryIndex: signal.index
      };

      // Update capital based on position type
      if (signal.direction === 'LONG') {
        backtestState.capital -= capitalRequired;
      } else {
        // SHORT: receive cash from sale, but tie up margin
        backtestState.capital += (shares * entryPrice - this.commissionPerTrade - capitalRequired);
      }
      
      currentPositions.set(positionKey, position);

      // Look for exit signals
      await this.findExitSignals(position, historicalData, signal.index, backtestState, currentPositions);
    }

    // Close any remaining positions at the end
    for (const [positionKey, position] of currentPositions) {
      const finalPrice = historicalData[historicalData.length - 1].close;
      this.closePosition(position, finalPrice, historicalData[historicalData.length - 1].date, 'END_OF_PERIOD', backtestState);
    }
  }

  /**
   * Find exit signals for an open position - LONG and SHORT
   */
  async findExitSignals(position, historicalData, startIndex, backtestState, currentPositions) {
    const maxHoldingPeriod = 60; // Maximum 60 days holding period
    const positionKey = `${position.system}_${position.direction}`;
    
    for (let i = startIndex + 1; i < historicalData.length && i < startIndex + maxHoldingPeriod; i++) {
      const currentPrice = historicalData[i].close;
      const currentDate = historicalData[i].date;
      const low = historicalData[i].low;
      const high = historicalData[i].high;

      // Check exit conditions based on position direction
      if (position.direction === 'LONG') {
        // LONG position exit logic
        
        // Check stop loss (price drops below stop)
        if (low <= position.stopLoss) {
          const exitPrice = position.stopLoss * (1 - this.slippagePercent);
          this.closePosition(position, exitPrice, currentDate, 'STOP_LOSS', backtestState);
          currentPositions.delete(positionKey);
          return;
        }

        // Check target hits (price rises above targets)
        if (high >= position.target1) {
          // Partial exit at target 1 (50% of position)
          const exitPrice = position.target1 * (1 - this.slippagePercent);
          const partialShares = Math.floor(position.shares * 0.5);
          
          if (partialShares > 0) {
            this.closePartialPosition(position, partialShares, exitPrice, currentDate, 'TARGET_1', backtestState);
            position.shares -= partialShares;
            
            // Adjust stop loss to break even
            position.stopLoss = position.entryPrice;
          }
        }

        if (high >= position.target2) {
          // Exit remaining position at target 2
          const exitPrice = position.target2 * (1 - this.slippagePercent);
          this.closePosition(position, exitPrice, currentDate, 'TARGET_2', backtestState);
          currentPositions.delete(positionKey);
          return;
        }
        
      } else {
        // SHORT position exit logic
        
        // Check stop loss (price rises above stop)
        if (high >= position.stopLoss) {
          const exitPrice = position.stopLoss * (1 + this.slippagePercent);
          this.closePosition(position, exitPrice, currentDate, 'STOP_LOSS', backtestState);
          currentPositions.delete(positionKey);
          return;
        }

        // Check target hits (price drops below targets)
        if (low <= position.target1) {
          // Partial exit at target 1 (50% of position)
          const exitPrice = position.target1 * (1 + this.slippagePercent);
          const partialShares = Math.floor(position.shares * 0.5);
          
          if (partialShares > 0) {
            this.closePartialPosition(position, partialShares, exitPrice, currentDate, 'TARGET_1', backtestState);
            position.shares -= partialShares;
            
            // Adjust stop loss to break even
            position.stopLoss = position.entryPrice;
          }
        }

        if (low <= position.target2) {
          // Exit remaining position at target 2
          const exitPrice = position.target2 * (1 + this.slippagePercent);
          this.closePosition(position, exitPrice, currentDate, 'TARGET_2', backtestState);
          currentPositions.delete(positionKey);
          return;
        }
      }

      // Calculate borrow costs for SHORT positions
      if (position.direction === 'SHORT' && i % 5 === 0) { // Check every 5 days
        const daysSinceEntry = i - startIndex;
        const borrowCost = (position.shares * position.entryPrice * this.shortBorrowRate * daysSinceEntry) / 365;
        backtestState.capital -= borrowCost;
      }

      // Time-based exit after maximum holding period
      if (i === startIndex + maxHoldingPeriod - 1) {
        const positionKey = `${position.system}_${position.direction}`;
        this.closePosition(position, currentPrice, currentDate, 'TIME_EXIT', backtestState);
        currentPositions.delete(positionKey);
        return;
      }
    }
  }

  /**
   * Close a position and record the trade - LONG and SHORT
   */
  closePosition(position, exitPrice, exitDate, exitReason, backtestState) {
    let profit, returnPercent, netProceeds;
    
    if (position.direction === 'LONG') {
      // LONG position: profit when exit price > entry price
      const grossProceeds = position.shares * exitPrice;
      netProceeds = grossProceeds - this.commissionPerTrade;
      const initialInvestment = position.shares * position.entryPrice + this.commissionPerTrade;
      profit = netProceeds - initialInvestment;
      returnPercent = (profit / initialInvestment) * 100;
      
      backtestState.capital += netProceeds;
      
    } else {
      // SHORT position: profit when exit price < entry price
      // We need to buy back the shares to close the short
      const costToCover = position.shares * exitPrice + this.commissionPerTrade;
      const originalSaleProceeds = position.shares * position.entryPrice - this.commissionPerTrade;
      
      // Profit/Loss = Original Sale Proceeds - Cost to Buy Back
      profit = originalSaleProceeds - costToCover;
      
      // Return calculation based on the margin requirement
      const marginUsed = position.shares * position.entryPrice * 0.5; // 50% margin
      returnPercent = (profit / marginUsed) * 100;
      
      // Release the margin and account for profit/loss
      // We already received cash when opening the position, now we pay to close it
      backtestState.capital -= costToCover; // Pay to buy back shares
      backtestState.capital += marginUsed;   // Release margin
      // Net effect: -costToCover + marginUsed = -(costToCover - marginUsed)
      
      netProceeds = marginUsed + profit; // For tracking purposes
    }

    // Record trade
    const trade = {
      system: position.system,
      direction: position.direction,
      entryDate: position.entryDate,
      exitDate: exitDate,
      entryPrice: position.entryPrice,
      exitPrice: exitPrice,
      shares: position.shares,
      profit: profit,
      returnPercent: returnPercent,
      exitReason: exitReason,
      confidence: position.confidence,
      holdingDays: this.calculateDaysBetween(position.entryDate, exitDate)
    };

    backtestState.trades.push(trade);

    // Update system performance
    const systemKey = `${position.system}_${position.direction}`;
    if (!backtestState.systemPerformance[systemKey]) {
      backtestState.systemPerformance[systemKey] = {
        trades: 0,
        wins: 0,
        totalReturn: 0,
        totalProfit: 0,
        direction: position.direction
      };
    }

    const systemPerf = backtestState.systemPerformance[systemKey]; // Use systemKey, not position.system
    systemPerf.trades++;
    systemPerf.totalReturn += returnPercent;
    systemPerf.totalProfit += profit;
    if (profit > 0) systemPerf.wins++;
  }

  /**
   * Close partial position
   */
  closePartialPosition(position, shares, exitPrice, exitDate, exitReason, backtestState) {
    const partialPosition = { ...position, shares };
    this.closePosition(partialPosition, exitPrice, exitDate, exitReason, backtestState);
  }

  /**
   * Calculate position size based on risk management - LONG and SHORT
   */
  calculatePositionSize(capital, entryPrice, stopLoss, direction = 'LONG') {
    const riskAmount = capital * this.riskPerTrade;
    
    let riskPerShare;
    if (direction === 'LONG') {
      riskPerShare = entryPrice - stopLoss; // Risk when price goes down
    } else {
      riskPerShare = stopLoss - entryPrice; // Risk when price goes up
    }
    
    if (riskPerShare <= 0) return 0;
    
    const maxShares = Math.floor(riskAmount / riskPerShare);
    const maxPositionValue = capital * this.maxPositionSize;
    const maxSharesByPosition = Math.floor(maxPositionValue / entryPrice);
    
    return Math.min(maxShares * entryPrice, maxSharesByPosition * entryPrice);
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(backtestState, historicalData) {
    const trades = backtestState.trades;
    const finalCapital = backtestState.capital;
    
    if (trades.length === 0) {
      return {
        totalReturn: 0,
        winRate: 0,
        totalTrades: 0,
        systemPerformance: {}
      };
    }

    // Overall metrics
    const totalReturn = ((finalCapital - this.initialCapital) / this.initialCapital) * 100;
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    const winRate = (winningTrades.length / trades.length) * 100;
    
    // Risk metrics
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.returnPercent, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, t) => sum + t.returnPercent, 0) / losingTrades.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // System-specific performance
    const systemPerformance = {};
    for (const [systemName, perf] of Object.entries(backtestState.systemPerformance)) {
      systemPerformance[systemName] = {
        ...perf,
        winRate: perf.trades > 0 ? (perf.wins / perf.trades) * 100 : 0,
        avgReturn: perf.trades > 0 ? perf.totalReturn / perf.trades : 0,
        profitability: perf.totalProfit
      };
    }

    // Buy and hold comparison
    const buyHoldReturn = ((historicalData[historicalData.length - 1].close - historicalData[0].close) / historicalData[0].close) * 100;

    return {
      totalReturn: totalReturn,
      buyHoldReturn: buyHoldReturn,
      alpha: totalReturn - buyHoldReturn,
      winRate: winRate,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin: avgWin,
      avgLoss: avgLoss,
      profitFactor: profitFactor,
      finalCapital: finalCapital,
      systemPerformance: systemPerformance,
      bestTrade: trades.reduce((best, trade) => trade.returnPercent > best.returnPercent ? trade : best, trades[0]),
      worstTrade: trades.reduce((worst, trade) => trade.returnPercent < worst.returnPercent ? trade : worst, trades[0])
    };
  }

  /**
   * Calculate days between two dates
   */
  calculateDaysBetween(date1, date2) {
    const timeDiff = new Date(date2) - new Date(date1);
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Backtest multiple symbols and systems
   */
  async backtestPortfolio(symbols, period = '2y', systems = ['all']) {
    //console.log(`🚀 Starting portfolio backtest for ${symbols.length} symbols...`);
    
    const results = [];
    const portfolioPerformance = {
      totalReturn: 0,
      winRate: 0,
      totalTrades: 0,
      systemPerformance: {}
    };

    for (const symbol of symbols) {
      try {
        const result = await this.backtestSymbol(symbol, period, systems);
        results.push(result);
        
        // Aggregate portfolio metrics
        portfolioPerformance.totalReturn += result.totalReturn;
        portfolioPerformance.totalTrades += result.totalTrades;
        
        // Aggregate system performance
        for (const [systemName, perf] of Object.entries(result.systemPerformance)) {
          if (!portfolioPerformance.systemPerformance[systemName]) {
            portfolioPerformance.systemPerformance[systemName] = {
              trades: 0,
              wins: 0,
              totalReturn: 0,
              totalProfit: 0
            };
          }
          
          const portfolioSystemPerf = portfolioPerformance.systemPerformance[systemName];
          portfolioSystemPerf.trades += perf.trades;
          portfolioSystemPerf.wins += perf.wins;
          portfolioSystemPerf.totalReturn += perf.totalReturn;
          portfolioSystemPerf.totalProfit += perf.totalProfit;
        }
        
      } catch (error) {
        console.error(`❌ Failed to backtest ${symbol}:`, error.message);
        results.push({ symbol, error: error.message });
      }
    }

    // Calculate portfolio averages
    const validResults = results.filter(r => !r.error);
    if (validResults.length > 0) {
      portfolioPerformance.avgReturn = portfolioPerformance.totalReturn / validResults.length;
      portfolioPerformance.winRate = validResults.reduce((sum, r) => sum + r.winRate, 0) / validResults.length;
    }

    // Calculate system rankings
    const systemRankings = this.rankSystems(portfolioPerformance.systemPerformance);

    return {
      symbols,
      period,
      results,
      portfolioPerformance,
      systemRankings,
      validBacktests: validResults.length,
      failedBacktests: results.length - validResults.length
    };
  }

  /**
   * Rank trading systems by performance
   */
  rankSystems(systemPerformance) {
    const systems = Object.entries(systemPerformance).map(([name, perf]) => ({
      name,
      winRate: perf.trades > 0 ? (perf.wins / perf.trades) * 100 : 0,
      avgReturn: perf.trades > 0 ? perf.totalReturn / perf.trades : 0,
      totalTrades: perf.trades,
      totalProfit: perf.totalProfit,
      profitability: perf.totalProfit,
      score: this.calculateSystemScore(perf)
    }));

    return systems.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate composite score for system ranking
   */
  calculateSystemScore(perf) {
    if (perf.trades === 0) return 0;
    
    const winRate = (perf.wins / perf.trades) * 100;
    const avgReturn = perf.totalReturn / perf.trades;
    const frequency = perf.trades; // More trades = more data points
    
    // Composite score: weighted combination of metrics
    return (winRate * 0.4) + (avgReturn * 0.4) + (Math.min(frequency, 10) * 0.2);
  }
}

module.exports = BacktestingEngine;
