/**
 * Single System Analyzer with Gate Engine Integration
 * 
 * Takes a trading system (like Elder's Triple Screen) and integrates it with
 * the existing sophisticated gate-based decision engine for complete
 * end-to-end analysis and execution planning.
 * 
 * Phase 2: System Analysis (Elder's Triple Screen)
 * Phase 3: Gate Engine Integration  
 * Phase 4: Final Decision with Position Sizing
 */

const { ElderTripleScreen } = require('./elder-triple-screen');
const MinerviniSEPA = require('./minervini-sepa');
const CupWithHandle = require('./cup-with-handle');
const RSIMeanReversion = require('./rsi-mean-reversion');
const MACDDivergence = require('./macd-divergence');

class SingleSystemAnalyzer {
  constructor(gateEngineFunction) {
    this.gateEngine = gateEngineFunction; // Your existing generateExpertAIDecision function
    this.availableSystems = {
      'triple_screen': new ElderTripleScreen(),
      'sepa_method': new MinerviniSEPA(),
      'cup_handle': new CupWithHandle(),
      'rsi_mean': new RSIMeanReversion(),
      'divergence': new MACDDivergence()
    };
  }

  /**
   * Complete end-to-end analysis for a single trading system
   * @param {string} systemId - Trading system to use ('triple_screen' or 'sepa_method') 
   * @param {Object} systemData - Pre-computed indicators from MultiSystemDataGenerator
   * @param {Object} analysisContext - Additional market context for gate engine
   * @param {Object} options - Analysis options
   * @returns {Object} Complete analysis with final trading decision
   */
  async analyzeSystem(systemId, systemData, analysisContext = {}, options = {}) {
    try {
      //Get System
      const system = this.availableSystems[systemId];
      if (!system) {
        throw new Error(`Unknown trading system: ${systemId}`);
      }

      // Phase 2: Execute Trading System Analysis
      const systemAnalysis = system.analyze(systemData);
      console.log(`📊 ${systemId} Analysis Result:`, systemAnalysis.decision, systemAnalysis.confidence, systemAnalysis.reasoning);
      if (!systemAnalysis || systemAnalysis.decision === 'AVOID') {
        return this.createSystemBlockedResult(systemAnalysis, 'System analysis failed or returned AVOID');
      }

      // Phase 3: Prepare context for Gate Engine Integration
       // Convert system analysis to proven signals format for the Expert Engine
      const provenSignals = this.convertToProvenSignals(systemAnalysis);

      // Inject proven signals into analysis context
      analysisContext.provenSignals = provenSignals;


      // Phase 4: Execute Gate Engine Analysis
      const gateEngineResult = await this.executeGateEngine(analysisContext);

      // Phase 5: Combine System + Gate Results
      const finalResult = this.combineFinalResult(systemAnalysis, gateEngineResult, systemData);


      return finalResult;

    } catch (error) {
      console.error(`❌ Single System Analysis Error:`, error);
      return this.createErrorResult(systemId, error.message);
    }
  }

  /**
   * Convert system analysis to proven signals format
   * @param {Object} systemAnalysis - Results from trading system
   * @returns {Array} Array of proven signals for Expert Engine
   */
  convertToProvenSignals(systemAnalysis) {
    if (!systemAnalysis || !systemAnalysis.decision || systemAnalysis.decision === 'AVOID') {
      return []; // No proven signals if system avoided trade
    }

    const provenSignals = [];

    // Main system signal
    provenSignals.push({
      source: systemAnalysis.system,
      signal: systemAnalysis.decision.toUpperCase(),
      confidence: systemAnalysis.confidence || 0.5,
      tier: 'CONFIRMER', // Default to confirmer to respect existing hierarchy
      reasoning: `${systemAnalysis.systemName}: ${systemAnalysis.reasoning?.[0] || 'System analysis'}`,
      metadata: {
        systemName: systemAnalysis.systemName,
        signalQuality: systemAnalysis.signalQuality,
        riskReward: systemAnalysis.riskReward,
        dataQuality: systemAnalysis.dataQuality,
        systemVersion: systemAnalysis.systemVersion,

        // System-specific metadata
        screens: systemAnalysis.screens, // For Triple Screen
        executionPlan: systemAnalysis.executionPlan,

        // Quality metrics
        grade: systemAnalysis.signalQuality?.grade,
        percentage: systemAnalysis.signalQuality?.percentage
      }
    });

    // Add sub-signals if system provides detailed breakdown (e.g., Triple Screen screens)
    if (systemAnalysis.screens) {
      Object.entries(systemAnalysis.screens).forEach(([screenName, screen], index) => {
        if (screen.status && screen.status !== 'NEUTRAL' && screen.status !== 'NO_TRADE') {
          provenSignals.push({
            source: `${systemAnalysis.system}_${screenName}`,
            signal: this.mapScreenStatusToSignal(screen.status),
            confidence: (systemAnalysis.confidence || 0.5) * 0.7, // Slightly lower confidence for sub-signals
            tier: 'SUPPLEMENTARY',
            priority: 5.1 + (index * 0.01), // Low priority supplementary signals
            reasoning: `${systemAnalysis.systemName} ${screenName}: ${screen.reasoning?.[0] || screen.status}`,
            metadata: {
              parentSystem: systemAnalysis.system,
              screenName: screenName,
              screenData: screen
            }
          });
        }
      });
    }

    return provenSignals;
  }

  /**
   * Map system-specific screen status to standard signal format
   */
  mapScreenStatusToSignal(status) {
    const statusMap = {
      'GO_LONG': 'BUY',
      'GO_SHORT': 'SELL',
      'SETUP': 'WATCH',
      'NO_SETUP': 'HOLD',
      'BULLISH': 'BUY',
      'BEARISH': 'SELL',
      'NEUTRAL': 'HOLD'
    };
    return statusMap[status] || 'HOLD';
  }

  /**
   * Phase 4: Execute your existing gate engine with prepared context
   */
  async executeGateEngine(context) {
    if (!this.gateEngine) {
      throw new Error('Gate engine function not provided to analyzer');
    }
    // Call your existing generateExpertAIDecision function
    const result = await this.gateEngine(context);

    return result;
  }

  /**
   * Phase 5: Combine system analysis with gate engine results
   */
  combineFinalResult(systemAnalysis, gateResult, tickerData) {
    return {
      // System analysis (Phase 2)
      system: {
        id: systemAnalysis.system,
        name: systemAnalysis.systemName,
        decision: systemAnalysis.decision,
        confidence: systemAnalysis.confidence,
        reasoning: systemAnalysis.reasoning,
        signalQuality: systemAnalysis.signalQuality,
        riskReward: systemAnalysis.riskReward,
        screens: systemAnalysis.screens,
        executionPlan: systemAnalysis.executionPlan
      },

      // Gate engine results (Phase 3-4)
      gateEngine: {
        finalDecision: gateResult.finalDecision,
        tradeReadiness: gateResult.tradeReadiness,
        riskRewardAnalysis: gateResult.executionPlan,
        positionSizing: gateResult.positionSizing,
        scenarioPlans: gateResult.scenarioPlans,

        // Gate-specific analysis
        signalQuality: gateResult.signalQuality,
        contextualGates: {
          trendAnalysis: gateResult.trendAnalysis,
          earningsProximity: gateResult.riskAssessment?.earningsProximity,
          regimeDetection: gateResult.regimeDetection
        }
      },

      // Final integrated decision (Phase 4)
      finalDecision: {
        action: gateResult.finalDecision?.action || 'AVOID',
        confidence: gateResult.finalDecision?.confidence ?? systemAnalysis.confidence ?? 0.3,
        reasoning: this.combineReasoning(systemAnalysis, gateResult),

        // Execution details
        executionPlan: gateResult.executionPlan,
        positionSizing: gateResult.positionSizing,
        riskManagement: gateResult.scenarioPlans
      },

      // Quality metrics
      qualityMetrics: {
        systemGrade: systemAnalysis.signalQuality?.grade || 'F',
        systemScore: systemAnalysis.signalQuality?.percentage || 0,
        gateGrade: gateResult.signalQuality?.grade || 'F',
        gateScore: gateResult.signalQuality?.percentage || 0,
        dataQuality: systemAnalysis.dataQuality || 'UNKNOWN'
      },

      // Metadata
      meta: {
        symbol: tickerData.meta?.symbol || 'TEST',
        timestamp: new Date().toISOString(),
        system: systemAnalysis.system,
        market: tickerData.meta?.market || 'US',
        analysisPhases: ['System Analysis', 'Gate Engine Integration', 'Final Decision'],
        systemVersion: systemAnalysis.systemVersion || '1.0'
      }
    };
  }


  /**
   * Helper: Combine reasoning from system and gate analysis
   */
  combineReasoning(systemAnalysis, gateResult) {
    const systemReasoning = systemAnalysis.reasoning || [];
    const gateReasoning = gateResult.finalDecision?.reasoning || [];

    return [
      `System Analysis (${systemAnalysis.systemName}):`,
      ...systemReasoning.map(r => `  • ${r}`),
      '',
      'Gate Engine Analysis:',
      ...gateReasoning.map(r => `  • ${r}`)
    ];
  }

  /**
   * Helper: Create result when system is blocked
   */
  createSystemBlockedResult(systemAnalysis, reason) {
    return {
      system: {
        id: systemAnalysis?.system || 'unknown',
        name: systemAnalysis?.systemName || 'Unknown System',
        decision: 'AVOID',
        confidence: 0.2,
        reasoning: systemAnalysis.reasoning,
        signalQuality: { grade: 'F', percentage: 0 }
      },

      gateEngine: { finalDecision: { action: 'AVOID', confidence: 0.2 } },

      finalDecision: {
        action: 'AVOID',
        confidence: 0.2,
        reasoning: [`System blocked: ${reason}`]
      },

      qualityMetrics: { systemGrade: 'F', gateGrade: 'F' },
      meta: { timestamp: new Date().toISOString(), error: 'SYSTEM_BLOCKED' }
    };
  }

  /**
   * Helper: Create error result
   */
  createErrorResult(systemId, errorMessage) {
    return {
      system: { id: systemId, decision: 'AVOID' },
      gateEngine: { finalDecision: { action: 'AVOID', confidence: 0.1 } },
      finalDecision: { action: 'AVOID', confidence: 0.1, reasoning: [`Error: ${errorMessage}`] },
      qualityMetrics: { systemGrade: 'F', gateGrade: 'F' },
      meta: { timestamp: new Date().toISOString(), error: 'ANALYSIS_ERROR' }
    };
  }
}

module.exports = { SingleSystemAnalyzer };
