/**
 * AI Trading System - Phase 3: Backtesting Controller
 * API endpoints for historical validation and system performance analysis
 */

const BacktestingEngine = require('../../utils/backtestingEngine');

/**
 * Backtest a single symbol across all trading systems
 * 
 * Endpoint: GET /api/trading/backtest?symbol=AAPL&period=2y&systems=all
 */
exports.backtestSymbol = async (req, res) => {
  try {
    const { symbol, period = '2y', systems = 'all', capital = 100000 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Stock symbol is required',
        usage: 'GET /api/trading/backtest?symbol=AAPL&period=2y&systems=all'
      });
    }

    console.log(`📊 Starting backtest for ${symbol}...`);

    // Initialize backtesting engine
    const backtester = new BacktestingEngine({
      initialCapital: parseInt(capital),
      commissionPerTrade: 5,
      maxPositionSize: 0.25,
      riskPerTrade: 0.02,
      slippagePercent: 0.001
    });

    // Parse systems to test
    const systemsToTest = systems === 'all' ? ['all'] : systems.split(',').map(s => s.trim());

    // Run backtest
    const result = await backtester.backtestSymbol(symbol, period, systemsToTest);

    // Format response
    const response = {
      status: 'success',
      backtest: {
        symbol: symbol.toUpperCase(),
        period,
        phase: 'PHASE_3_BACKTESTING',
        timestamp: new Date().toISOString(),
        
        // Performance Summary
        performance: {
          totalReturn: result.totalReturn,
          buyHoldReturn: result.buyHoldReturn,
          alpha: result.alpha,
          finalCapital: result.finalCapital,
          initialCapital: parseInt(capital)
        },
        
        // Trading Statistics
        statistics: {
          totalTrades: result.totalTrades,
          winningTrades: result.winningTrades,
          losingTrades: result.losingTrades,
          winRate: result.winRate,
          avgWin: result.avgWin,
          avgLoss: result.avgLoss,
          profitFactor: result.profitFactor
        },
        
        // System Performance
        systemPerformance: result.systemPerformance,
        
        // Best and Worst Trades
        extremeTrades: {
          bestTrade: result.bestTrade,
          worstTrade: result.worstTrade
        },
        
        // Metadata
        dataPoints: result.historicalDataPoints,
        signalsGenerated: result.signals,
        trades: result.trades
      }
    };

    console.log(`✅ Backtest complete for ${symbol} - Return: ${result.totalReturn.toFixed(2)}% vs Buy&Hold: ${result.buyHoldReturn.toFixed(2)}%`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in backtesting:', error);
    res.status(500).json({ 
      error: 'Failed to perform backtesting',
      details: error.message,
      symbol: req.query.symbol 
    });
  }
};

/**
 * Backtest multiple symbols and rank systems by performance
 * 
 * Endpoint: POST /api/trading/backtest-portfolio
 * Body: { symbols: ['AAPL', 'NVDA', 'TSLA'], period: '2y', systems: ['all'] }
 */
exports.backtestPortfolio = async (req, res) => {
  try {
    const { symbols, period = '2y', systems = ['all'], capital = 100000 } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ 
        error: 'Array of symbols is required',
        usage: 'POST /api/trading/backtest-portfolio with body: {"symbols": ["AAPL", "NVDA", "TSLA"]}'
      });
    }

    console.log(`🚀 Starting portfolio backtest for ${symbols.length} symbols...`);

    // Initialize backtesting engine
    const backtester = new BacktestingEngine({
      initialCapital: parseInt(capital),
      commissionPerTrade: 5,
      maxPositionSize: 0.25,
      riskPerTrade: 0.02,
      slippagePercent: 0.001
    });

    // Run portfolio backtest
    const result = await backtester.backtestPortfolio(symbols, period, systems);

    // Format response
    const response = {
      status: 'success',
      portfolioBacktest: {
        symbols: symbols,
        period,
        phase: 'PHASE_3_PORTFOLIO_BACKTESTING',
        timestamp: new Date().toISOString(),
        
        // Portfolio Performance
        portfolioPerformance: {
          avgReturn: result.portfolioPerformance.avgReturn,
          totalTrades: result.portfolioPerformance.totalTrades,
          winRate: result.portfolioPerformance.winRate,
          validBacktests: result.validBacktests,
          failedBacktests: result.failedBacktests
        },
        
        // System Rankings (Most Important!)
        systemRankings: result.systemRankings,
        
        // Individual Results
        individualResults: result.results.map(r => ({
          symbol: r.symbol,
          totalReturn: r.totalReturn,
          buyHoldReturn: r.buyHoldReturn,
          alpha: r.alpha,
          winRate: r.winRate,
          totalTrades: r.totalTrades,
          error: r.error
        })),
        
        // Summary
        summary: {
          bestPerformingSystem: result.systemRankings[0]?.name || 'None',
          topSystemScore: result.systemRankings[0]?.score || 0,
          topSystemWinRate: result.systemRankings[0]?.winRate || 0,
          topSystemAvgReturn: result.systemRankings[0]?.avgReturn || 0,
          totalSystemsTested: result.systemRankings.length
        }
      }
    };

    console.log(`✅ Portfolio backtest complete! Best system: ${response.portfolioBacktest.summary.bestPerformingSystem}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error in portfolio backtesting:', error);
    res.status(500).json({ 
      error: 'Failed to perform portfolio backtesting',
      details: error.message 
    });
  }
};

/**
 * Get system performance comparison and rankings
 * 
 * Endpoint: GET /api/trading/system-rankings?symbols=AAPL,NVDA,TSLA&period=2y
 */
exports.getSystemRankings = async (req, res) => {
  try {
    const { symbols = 'AAPL,NVDA,TSLA,MSFT,GOOGL', period = '1y' } = req.query;
    
    console.log(`📈 Generating system rankings for ${symbols}...`);

    const symbolsArray = symbols.split(',').map(s => s.trim());
    
    // Quick backtest for rankings
    const backtester = new BacktestingEngine({
      initialCapital: 100000,
      riskPerTrade: 0.02
    });

    const result = await backtester.backtestPortfolio(symbolsArray, period, ['all']);

    // Enhanced rankings with insights
    const rankedSystems = result.systemRankings.map((system, index) => ({
      rank: index + 1,
      name: system.name,
      displayName: getSystemDisplayName(system.name),
      score: system.score,
      winRate: system.winRate,
      avgReturn: system.avgReturn,
      totalTrades: system.totalTrades,
      totalProfit: system.totalProfit,
      recommendation: getSystemRecommendation(system),
      description: getSystemDescription(system.name)
    }));

    const response = {
      status: 'success',
      systemRankings: {
        period,
        symbolsAnalyzed: symbolsArray,
        timestamp: new Date().toISOString(),
        rankings: rankedSystems,
        insights: {
          mostReliable: rankedSystems.find(s => s.winRate > 60),
          mostProfitable: rankedSystems.find(s => s.avgReturn > 5),
          mostActive: rankedSystems.reduce((max, s) => s.totalTrades > max.totalTrades ? s : max, rankedSystems[0]),
          recommendation: getOverallRecommendation(rankedSystems)
        }
      }
    };

    console.log(`✅ System rankings complete! Top system: ${rankedSystems[0]?.name || 'None'}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating system rankings:', error);
    res.status(500).json({ 
      error: 'Failed to generate system rankings',
      details: error.message 
    });
  }
};

/**
 * Helper function to get system display names
 */
function getSystemDisplayName(systemName) {
  const displayNames = {
    'threeWeeksTight': 'Three Weeks Tight',
    'cupHandle': 'Cup & Handle',
    'flagPennant': 'Flag & Pennant',
    'tripleScreen': 'Triple Screen',
    'sepa': 'SEPA Method',
    'darvasBox': 'Darvas Box'
  };
  return displayNames[systemName] || systemName;
}

/**
 * Helper function to get system descriptions
 */
function getSystemDescription(systemName) {
  const descriptions = {
    'threeWeeksTight': 'Price consolidation in tight range for 3+ weeks, indicating accumulation',
    'cupHandle': 'Cup-shaped pattern followed by smaller handle, classic bullish continuation',
    'flagPennant': 'Short-term consolidation after strong move, continuation pattern',
    'tripleScreen': 'Multi-timeframe analysis combining trend, oscillator, and entry timing',
    'sepa': 'Stage analysis with relative strength and tight consolidation criteria',
    'darvasBox': 'Price consolidation within defined range with volume confirmation'
  };
  return descriptions[systemName] || 'Advanced pattern recognition system';
}

/**
 * Helper function to get system recommendation
 */
function getSystemRecommendation(system) {
  if (system.winRate > 60 && system.avgReturn > 3) {
    return 'HIGHLY_RECOMMENDED';
  } else if (system.winRate > 50 && system.avgReturn > 2) {
    return 'RECOMMENDED';
  } else if (system.totalTrades < 3) {
    return 'INSUFFICIENT_DATA';
  } else {
    return 'NOT_RECOMMENDED';
  }
}

/**
 * Helper function to get overall recommendation
 */
function getOverallRecommendation(rankedSystems) {
  const topSystems = rankedSystems.filter(s => s.recommendation === 'HIGHLY_RECOMMENDED');
  if (topSystems.length > 0) {
    return `Focus on ${topSystems.map(s => s.displayName).join(' and ')} for best performance`;
  }
  
  const goodSystems = rankedSystems.filter(s => s.recommendation === 'RECOMMENDED');
  if (goodSystems.length > 0) {
    return `Consider using ${goodSystems[0].displayName} as primary system`;
  }
  
  return 'Consider longer backtesting period or parameter optimization';
}

module.exports = {
  backtestSymbol: exports.backtestSymbol,
  backtestPortfolio: exports.backtestPortfolio,
  getSystemRankings: exports.getSystemRankings,
  getSystemDisplayName,
  getSystemDescription,
  getSystemRecommendation,
  getOverallRecommendation
};
