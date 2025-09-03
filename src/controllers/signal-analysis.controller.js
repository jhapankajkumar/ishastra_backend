/**
 * 🎯 BRUTALLY SIMPLE SIGNAL ANALYSIS CONTROLLER
 * 
 * ONE JOB: Run Template + Cascade systems, return BUY/SELL decision
 * NO BULLSHIT. NO OVER-ENGINEERING. NO COMPLEX VOTING.
 */

const MinerviniTemplateAdvanced = require('../systems/minervini-template-advanced');
const InstitutionalMomentumCascade = require('../systems/institutional-momentum-cascade');
const { getSimpleTechnicalData } = require('../utils/simpleTechnicalDataFetcher');
const CapitalManager = require('../utils/capitalManager');

class TradingSystemController {
  constructor() {
    // Initialize all trading systems
    this.systems = {
      // 🏛️ NEW INSTITUTIONAL SYSTEMS
      'minervini_template_advanced': new MinerviniTemplateAdvanced(),
      'institutional_momentum_cascade': new InstitutionalMomentumCascade()
    };
    // 🚨 REMOVED: Complex system analyzer dependency
    // this.systemAnalyzer = new SingleSystemAnalyzer(generateExpertAIDecision);
  }

  /**
   * POST /api/trading/stock-analysis
   * Analyze stocks using all available trading systems with REAL API data
   */
  async analyzeTradingSystem(req, res) {
    try {
      const {
        symbols
      } = req.body;
      
      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'symbols array is required',
          example: {
            symbols: ['AAPL', 'MSFT', 'GOOGL'],
          }
        });
      }

      const response = await this.getStockAnalysis(symbols);

      res.json(response);

    } catch (error) {
      console.error('❌ Elder\'s Triple Screen API Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        system: this.systems.join(', '),
      });
    }
  }

  async getStockAnalysis(symbols) {
    // 🚨 EMERGENCY REFACTOR: Force only the 2 BEST systems regardless of input
  
    const CORE_SYSTEMS = [
      'minervini_template_advanced',
      'institutional_momentum_cascade'
    ];
    
    const supportedSystems = CORE_SYSTEMS.filter(sys => this.systems[sys]);

    if (supportedSystems.length === 0) {
      return {
        success: false,
        error: 'Core systems not available',
        availableSystems: Object.keys(this.systems),
        note: 'SIMPLE MODE: Using only Minervini + Momentum'
      };
    }


    // PERFORMANCE OPTIMIZATION: Limit symbols and process in parallel
    const maxSymbols = 10; // Limit for performance
    const limitedSymbols = symbols.slice(0, maxSymbols);

    // Process all symbols in parallel instead of sequential
    const symbolPromises = limitedSymbols.map(async (symbol) => {
      try {
        // � CAPITAL: Get real capital from database
        let remainingCapital = 100000; // Fallback
        try {
          // Determine currency based on symbol
          const currency = symbol.includes('.NS') ? 'INR' : 'USD';
          const capitalData = await CapitalManager.getCapital(currency);
          remainingCapital = capitalData ? capitalData.remaining : remainingCapital;
          console.log(`  💰 CAPITAL: Using ${currency} capital: ${remainingCapital.toLocaleString()} (from DB)`);
        } catch (error) {
          console.log(`  ⚠️ CAPITAL: Using fallback capital: $${remainingCapital.toLocaleString()} (DB error: ${error.message})`);
        }

        // 🚨 SIMPLE MODE: Basic technical data only (no complex AI analysis)
        
        const technicalData = await getSimpleTechnicalData(symbol);
        
        if (!technicalData || !technicalData.ohlcData || technicalData.ohlcData.length === 0) {
          throw new Error(`Failed to fetch technical data for ${symbol}`);
        }
        

        // Create simple analysis context (no complex AI signals)
        const analysisContext = {
          technical: technicalData,
        };

        // Phase 2: 🚨 SIMPLE MODE - Run only 2 core systems

        const systemResults = {};
        const systemFinalResults = {};

        for (const systemId of supportedSystems) {

          try {
            // 🚨 EMERGENCY FIX: Convert technical data to format systems expect
            let systemData;
            
            if (systemId === 'minervini_template_advanced' || systemId === 'institutional_momentum_cascade') {
              // 🎯 CRITICAL: Systems need structured format {indicators, series}
              systemData = {
                indicators: technicalData.indicators,
                series: {
                  daily: technicalData.ohlcData
                }
              };
            } else {
              // Fallback - use technical data directly
              systemData = technicalData;
            }

            // 🚨 SIMPLE: Run system analysis directly (skip complex gate engine for now)
            const systemInstance = this.systems[systemId];
            
            let systemAnalysis;
            if (systemInstance && typeof systemInstance.analyze === 'function') {
              // Call the system's analyze method directly
              const options = {
                capital: remainingCapital,
                symbol: symbol,
                currentPrice: technicalData?.currentPrice || technicalData?.latestPrice,
                // 🚨 REMOVED: aiSignals (no complex AI analysis)
                // aiSignals: analysisContext.aiSignals || []
              };
              
              systemAnalysis = await systemInstance.analyze(systemData, options);
              
              // Normalize the response to match expected structure
              if (systemAnalysis && systemAnalysis.action) {
                systemAnalysis.decision = systemAnalysis.action;
                systemAnalysis.confidence = systemAnalysis.confidence || 0;
              }
            } else {
              throw new Error(`System ${systemId} not found or invalid`);
            }

            systemResults[systemId] = systemAnalysis;
            systemFinalResults[systemId] = systemAnalysis;

            console.log(`    ✅ SIMPLE: ${systemId} analysis complete: ${systemAnalysis.decision} (${Math.round(systemAnalysis.confidence * 100)}%)`);

          } catch (systemError) {
            console.error(`    ❌ ${systemId} analysis failed:`, systemError.message);
            systemResults[systemId] = {
              decision: 'ERROR',
              error: systemError.message,
              confidence: 0
            };
            systemFinalResults[systemId] = {
              action: 'AVOID',
              confidence: 0,
              error: systemError.message
            };
          }
        }

        // Phase 3: 🚨 SIMPLE MODE - Create simple 2-system vote
        
        
        // Get the 2 system results
        const minerviniResult = systemResults['minervini_template_advanced'] || { decision: 'HOLD', confidence: 0 };
        const momentumResult = systemResults['institutional_momentum_cascade'] || { decision: 'HOLD', confidence: 0 };
        
        // 🚨 SIMPLE VOTING LOGIC - No complex weighting
        const unifiedDecision = this.simpleVote(minerviniResult, momentumResult);
        
        // 🚨 SIMPLE MODE: Create simple final result (no complex gate engine)
        const finalResult = {
          action: unifiedDecision.action,
          confidence: unifiedDecision.confidence,
          reasoning: unifiedDecision.reasoning,
        };
        
        // Build comprehensive response using the fetched data
        const gateResult = finalResult.gateEngine || {};

        // Build enhanced analysis result with all trading information
        const analysisResult = await this.buildEnhancedTradingResponse({
          symbol,
          technicalData,
          systemResults,
          supportedSystems,
          finalResult,
          unifiedDecision,
          analysisContext
        });
        return analysisResult;

      } catch (error) {
        console.error(`  ❌ Error analyzing ${symbol}:`, error.message);
        throw { symbol, error: error.message, timestamp: new Date().toISOString() };
      }
    });

    // Wait for all symbols to complete (parallel processing)
    const symbolResults = await Promise.allSettled(symbolPromises);

    const results = [];
    const errors = [];

    symbolResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const symbol = limitedSymbols[index];
        errors.push({
          symbol,
          error: result.reason?.error || result.reason?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Build comprehensive API response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
    };

    return response
  }
  // Calculate EMA - fixed version
  calculateEMA(data, period) {
    if (!data || data.length === 0) return [];
    if (period <= 0) return [];

    // Ensure we have valid numeric data
    const validData = data.filter(val => typeof val === 'number' && !isNaN(val));
    if (validData.length === 0) return [];

    // Adjust period if we don't have enough data
    const effectivePeriod = Math.min(period, validData.length);
    if (effectivePeriod === 1) {
      return [validData[validData.length - 1]];
    }

    const k = 2 / (effectivePeriod + 1);
    const ema = [];

    // Start with SMA
    let sum = 0;
    for (let i = 0; i < effectivePeriod; i++) {
      sum += validData[i];
    }
    const sma = sum / effectivePeriod;
    ema.push(sma);

    // Continue with EMA
    for (let i = effectivePeriod; i < validData.length; i++) {
      const prevEMA = ema[ema.length - 1];
      const currentValue = validData[i];
      const newEMA = currentValue * k + prevEMA * (1 - k);
      ema.push(newEMA);
    }

    return ema;
  }


  // 🚨 SIMPLE: 2-system voting method (replaces complex unified decision)
  simpleVote(minerviniResult, momentumResult) {
    const minervini = minerviniResult || { decision: 'HOLD', confidence: 0 };
    const momentum = momentumResult || { decision: 'HOLD', confidence: 0 };

    console.log(`  🗳️  SIMPLE VOTE: Minervini=${minervini.decision}(${Math.round(minervini.confidence * 100)}%), Momentum=${momentum.decision}(${Math.round(momentum.confidence * 100)}%)`);

    // Both systems agree on BUY
    if (minervini.decision === 'BUY' && momentum.decision === 'BUY') {
      return {
        action: 'STRONG_BUY',
        confidence: Math.min(0.95, (minervini.confidence + momentum.confidence) / 2 + 0.10),
        reasoning: 'Both systems bullish - strong confluence'
      };
    }

    // Both systems agree on AVOID
    if (minervini.decision === 'AVOID' && momentum.decision === 'AVOID') {
      return {
        action: 'AVOID',
        confidence: Math.min(0.70, (minervini.confidence + momentum.confidence) / 2),
        reasoning: 'Both systems avoid entry - no signal to buy'
      };
    }

    // One BUY, one HOLD/WATCH - check confidence levels
    if ((minervini.decision === 'BUY' && (momentum.decision === 'HOLD'|| momentum.decision === 'WATCH')) ||
        ((minervini.decision === 'HOLD' || minervini.decision === 'WATCH') && momentum.decision === 'BUY')) {
      const buySystem = minervini.decision === 'BUY' ? minervini : momentum;
      
      // 🎯 IMPROVED: If BUY system has high confidence (>70%), honor the BUY signal
      if (buySystem.confidence >= 0.70) {
        return {
          action: 'BUY',
          confidence: Math.min(0.85, buySystem.confidence),
          reasoning: `Strong ${buySystem.systemId === 'minervini_template_advanced' ? 'Template' : 'Momentum'} BUY signal (${Math.round(buySystem.confidence * 100)}%) with supporting system confirmation`
        };
      }
      
      // 🎯 CONSERVATIVE: Lower confidence BUY signals with mixed systems → WATCH
      return {
        action: 'WATCH',
        confidence: Math.min(0.75, buySystem.confidence),
        reasoning: 'Mixed signals - watch for entry'
      };
    }

    // Both have low confidence
    if (minervini.confidence < 0.60 && momentum.confidence < 0.60) {
      return {
        action: 'HOLD',
        confidence: 0.30,
        reasoning: 'Low confidence from both systems'
      };
    }

    // Default: Follow the stronger system
    if (minervini.confidence > momentum.confidence) {
      return {
        action: minervini.decision,
        confidence: Math.min(0.80, minervini.confidence),
        reasoning: `Following Minervini system (${Math.round(minervini.confidence * 100)}% confidence)`
      };
    } else {
      return {
        action: momentum.decision,
        confidence: Math.min(0.80, momentum.confidence),
        reasoning: `Following momentum system (${Math.round(momentum.confidence * 100)}% confidence)`
      };
    }
  }

  /**
   * CENTRALIZED GRADE CALCULATION - NO MORE DUPLICATES!
   */
  getGrade(confidence) {
    const confidencePercent = Math.round(confidence * 100);
    if (confidencePercent >= 80) return 'A';
    if (confidencePercent >= 70) return 'B';
    if (confidencePercent >= 60) return 'C';
    if (confidencePercent >= 50) return 'C-';
    return 'D';
  }

  // NEW: Build enhanced trading response with all critical trading information
  // NEW: Build enhanced trading response with CLEAN single decision structure
  async buildEnhancedTradingResponse({
    symbol,
    technicalData,
    systemResults,
    supportedSystems,
    unifiedDecision
  }) {

    const currentPrice = technicalData.currentPrice || technicalData.latestPrice;

    // CREATE SINGLE UNIFIED DECISION (no confusion)
    const unifiedAction = unifiedDecision.action || 'AVOID';
    const unifiedConfidence = unifiedDecision.confidence || 0;
    const confidencePercent = Math.round(unifiedConfidence * 100);

    // 🚀 OPTIMIZED: Identify winning system and use its execution data directly
    const winningSystem = this.identifyWinningSystem(systemResults, unifiedDecision);
    let execution = {};

    if (winningSystem && (unifiedAction === 'BUY' || unifiedAction === 'SELL' || unifiedAction === 'WATCH')) {
      // ✅ FIXED: Safe access with null checks
      execution = winningSystem.execution || {};
      
      console.log(`🎯 Using winning system: ${winningSystem.systemId} for ${unifiedAction}`);
    } else if (winningSystem) {
      // ✅ FIXED: Safe fallback when winningSystem exists but action doesn't match
      execution = winningSystem.execution || {};
      
      console.log(`⚠️ Using winning system: ${winningSystem.systemId} as fallback for ${unifiedAction}`);
    } else {
      // ✅ FIXED: Safe fallback when no winning system found
      console.log(`⚠️ No winning system found for ${symbol}, using default execution/riskReward`);
      execution = null;
    }

    // 🎯 SIMPLIFIED: Extract grade with clear hierarchy and single log
    let grade = this.getGrade(unifiedConfidence); // Fallback
    
    // Check in order of preference: signalQuality > system-specific grades
    if (winningSystem?.grade) {
      grade = winningSystem.grade;
    } else if (winningSystem?.templateAnalysis?.templateGrade) {
      grade = winningSystem.templateAnalysis.templateGrade;
    } else if (winningSystem?.cascadeAnalysis?.momentumCascade?.grade) {
      grade = winningSystem.cascadeAnalysis.momentumCascade.grade;
    }
    // 🎯 CLEAN RESPONSE: Winning system name in decision, no systems bloat
    const winningSystemName = winningSystem?.systemName || 'Unknown System';
    const winningSystemId = winningSystem?.systemId || 'unknown';

    return {
      symbol,
      currentPrice: Number(currentPrice.toFixed(2)),
      timestamp: new Date().toISOString(),

      // SINGLE DECISION OBJECT - No Confusion
      decision: {
        action: unifiedAction,
        confidence: confidencePercent,
        grade: grade,
        reasoning: unifiedDecision.reasoning || 'Analysis complete',
        systemsAgreement: unifiedDecision.systemsAgreement || 'PARTIAL',
        winningSystem: winningSystemName,
        winningSystemId: winningSystemId
      },

      execution: execution,
      systems: systemResults,
      // 🚨 DELETED: systems object - eliminated redundancy and confusion
    };
  }

  // 🎯 SIMPLE: Identify winning system for attribution
  identifyWinningSystem(systemResults, unifiedDecision) {
    try {
      // Convert systemResults to array format for processing
      const resultsArray = Object.entries(systemResults).map(([systemId, result]) => ({
        ...result,
        systemId: systemId,
        system: systemId
      })).filter(result => {
        return result && result.decision && result.decision !== 'AVOID' && result.decision !== 'ERROR';
      });

      if (resultsArray.length === 0) {
        // console.log(`⚠️ No valid systems found for winning system identification`);
        return null;
      }

      // Logic 1: If unified decision matches a specific system with high confidence, use that system
      const highConfidenceSystems = resultsArray.filter(result =>
        result.confidence >= 0.75 && result.decision === unifiedDecision.action
      );

      if (highConfidenceSystems.length === 1) {
        //console.log(`🎯 High confidence winner: ${highConfidenceSystems[0].systemId} (${(highConfidenceSystems[0].confidence * 100).toFixed(1)}%)`);
        return highConfidenceSystems[0];
      }

      // Logic 2: If multiple high confidence systems, use the highest confidence one
      if (highConfidenceSystems.length > 1) {
        const winner = highConfidenceSystems.reduce((prev, current) =>
          current.confidence > prev.confidence ? current : prev
        );
        // console.log(`🎯 Highest confidence winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
        return winner;
      }

      // Logic 3: Use system with highest confidence that matches unified action
      const matchingActionSystems = resultsArray.filter(result =>
        result.decision === unifiedDecision.action
      );

      if (matchingActionSystems.length > 0) {
        const winner = matchingActionSystems.reduce((prev, current) =>
          current.confidence > prev.confidence ? current : prev
        );
        // console.log(`🎯 Action-matching winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
        return winner;
      }

      // Logic 4: Fallback to highest confidence system overall
      const winner = resultsArray.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );
      // console.log(`🎯 Overall highest confidence winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
      return winner;

    } catch (error) {
      console.error(`❌ Error identifying winning system:`, error.message);
      return null;
    }
  }

}

module.exports = { TradingSystemController };
