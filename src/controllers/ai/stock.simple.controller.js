/**
 * SIMPLE Trading Controller - EMERGENCY REFACTOR
 * Clean, fast, profitable decisions without the AI complexity
 */

const AdvancedTechnicalAnalysis = require('../../utils/advancedTechnicalAnalysis');

/**
 * SIMPLE DECISION ENGINE - 2 Systems Only
 * Minervini SEPA + Momentum Cascade = Winning Combination
 */
async function getSimpleAnalysis(req, res) {
  try {
    const { symbol, period = '3mo', capital = 100000 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required'
      });
    }

    // Get clean technical data
    const technical = await getTechnicalAnalysisData(symbol, period);
    
    if (!technical || !technical.ohlcData || technical.ohlcData.length < 50) {
      return res.json({
        success: true,
        symbol,
        decision: 'HOLD',
        confidence: 0,
        reason: 'Insufficient data',
        systems: {}
      });
    }

    // Run ONLY the 2 best systems
    const systems = await runCoreSystems(technical);
    
    // Simple voting - no complex weighting
    const decision = simpleVote(systems);
    
    // Clean position sizing
    const position = calculateSimplePosition(capital, decision, technical);

    return res.json({
      success: true,
      symbol,
      decision: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      systems: systems,
      position: position,
      executionTime: Date.now(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Simple analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: error.message
    });
  }
}

/**
 * Run ONLY the 2 core profitable systems
 */
async function runCoreSystems(technical) {
  const systems = {};
  
  try {
    // System 1: Minervini SEPA (Proven Winner)
    const minerviniSystem = require('../../systems/minervini-template-advanced');
    if (minerviniSystem && typeof minerviniSystem.analyzeStock === 'function') {
      const minerviniResult = await minerviniSystem.analyzeStock(technical);
      systems.minervini = {
        signal: minerviniResult.signal || 'HOLD',
        confidence: minerviniResult.confidence || 0,
        reasoning: minerviniResult.reasoning || 'Minervini SEPA analysis'
      };
    }
  } catch (error) {
    console.error('Minervini system error:', error);
    systems.minervini = { signal: 'HOLD', confidence: 0, reasoning: 'System error' };
  }

  try {
    // System 2: Momentum Cascade (Proven Winner)
    const momentumSystem = require('../../systems/institutional-momentum-cascade');
    if (momentumSystem && typeof momentumSystem.analyzeStock === 'function') {
      const momentumResult = await momentumSystem.analyzeStock(technical);
      systems.momentum = {
        signal: momentumResult.signal || 'HOLD',
        confidence: momentumResult.confidence || 0,
        reasoning: momentumResult.reasoning || 'Momentum cascade analysis'
      };
    }
  } catch (error) {
    console.error('Momentum system error:', error);
    systems.momentum = { signal: 'HOLD', confidence: 0, reasoning: 'System error' };
  }

  return systems;
}

/**
 * Simple 2-system voting - No complexity
 */
function simpleVote(systems) {
  const minervini = systems.minervini || { signal: 'HOLD', confidence: 0 };
  const momentum = systems.momentum || { signal: 'HOLD', confidence: 0 };

  // Both systems agree on BUY
  if (minervini.signal === 'BUY' && momentum.signal === 'BUY') {
    return {
      action: 'BUY',
      confidence: Math.min(95, (minervini.confidence + momentum.confidence) / 2 + 10),
      reasoning: 'Both systems bullish - strong confluence'
    };
  }

  // Both systems agree on SELL
  if (minervini.signal === 'SELL' && momentum.signal === 'SELL') {
    return {
      action: 'SELL',
      confidence: Math.min(90, (minervini.confidence + momentum.confidence) / 2 + 5),
      reasoning: 'Both systems bearish - avoid/exit'
    };
  }

  // One BUY, one HOLD - moderate bullish
  if ((minervini.signal === 'BUY' && momentum.signal === 'HOLD') ||
      (minervini.signal === 'HOLD' && momentum.signal === 'BUY')) {
    const buySystem = minervini.signal === 'BUY' ? minervini : momentum;
    return {
      action: 'WATCH',
      confidence: Math.min(75, buySystem.confidence),
      reasoning: 'Mixed signals - watch for entry'
    };
  }

  // Conflicting signals or weak signals
  if (minervini.confidence < 60 && momentum.confidence < 60) {
    return {
      action: 'HOLD',
      confidence: 30,
      reasoning: 'Low confidence from both systems'
    };
  }

  // Default: Follow the stronger system
  if (minervini.confidence > momentum.confidence) {
    return {
      action: minervini.signal,
      confidence: Math.min(80, minervini.confidence),
      reasoning: `Following Minervini system (${minervini.confidence}% confidence)`
    };
  } else {
    return {
      action: momentum.signal,
      confidence: Math.min(80, momentum.confidence),
      reasoning: `Following momentum system (${momentum.confidence}% confidence)`
    };
  }
}

/**
 * Simple position sizing - No complex multipliers
 */
function calculateSimplePosition(capital, decision, technical) {
  const currentPrice = technical.currentPrice || technical.latestPrice || 0;
  
  if (currentPrice <= 0 || decision.action === 'HOLD') {
    return {
      shares: 0,
      value: 0,
      riskPercent: 0,
      stopLoss: 0
    };
  }

  // Simple 2% risk rule
  const riskPercent = 2.0;
  const riskAmount = capital * (riskPercent / 100);
  
  // Simple ATR stop
  const atr = technical.technicalIndicators?.latest?.atr || (currentPrice * 0.02);
  const stopDistance = atr * 2; // 2x ATR stop
  const stopLoss = currentPrice - stopDistance;
  
  // Position size based on stop distance
  const shares = Math.floor(riskAmount / stopDistance);
  const value = shares * currentPrice;
  
  // Size adjustments based on confidence
  let sizeMultiplier = 1.0;
  if (decision.confidence >= 85) sizeMultiplier = 1.2;
  else if (decision.confidence >= 75) sizeMultiplier = 1.0;
  else if (decision.confidence >= 65) sizeMultiplier = 0.8;
  else sizeMultiplier = 0.5;

  const adjustedShares = Math.floor(shares * sizeMultiplier);
  const adjustedValue = adjustedShares * currentPrice;

  return {
    shares: adjustedShares,
    value: adjustedValue,
    riskPercent: riskPercent,
    stopLoss: stopLoss,
    riskAmount: riskAmount,
    positionPercent: (adjustedValue / capital) * 100
  };
}

/**
 * Get technical analysis data - simplified
 */
async function getTechnicalAnalysisData(symbol, period) {
  try {
    const analysis = new AdvancedTechnicalAnalysis();
    return await analysis.analyze(symbol, period);
  } catch (error) {
    console.error('Technical analysis error:', error);
    return null;
  }
}

/**
 * Direct access for testing
 */
async function getSimpleAnalysisDirect(symbol, period = '3mo', capital = 100000) {
  const mockReq = {
    query: { symbol, period, capital: capital.toString() }
  };
  
  let result = null;
  const mockRes = {
    json: (data) => { result = data; },
    status: (code) => ({ json: (data) => { result = { ...data, statusCode: code }; } })
  };
  
  await getSimpleAnalysis(mockReq, mockRes);
  return result;
}

module.exports = {
  getSimpleAnalysis,
  getSimpleAnalysisDirect,
  runCoreSystems,
  simpleVote,
  calculateSimplePosition
};
