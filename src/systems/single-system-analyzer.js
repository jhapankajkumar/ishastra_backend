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
const RSIMeanReversion = require('./rsi-mean-reversion');
const MACDDivergence = require('./macd-divergence');

// 🏆 ADVANCED INSTITUTIONAL SYSTEMS
const MinerviniTemplateAdvanced = require('./minervini-template-advanced');
const InstitutionalMomentumCascade = require('./institutional-momentum-cascade');

class SingleSystemAnalyzer {
  constructor(gateEngineFunction) {
    this.gateEngine = gateEngineFunction; // Your existing generateExpertAIDecision function
    
    // 🔥 SYSTEM HIERARCHY - INSTITUTIONAL APPROACH (Advanced Systems Ready)
    this.systemHierarchy = {
      // TIER 1: INSTITUTIONAL GRADE (95% capital)
      INSTITUTIONAL: {
        'minervini_template_advanced': { system: new MinerviniTemplateAdvanced(), weight: 0.6, priority: 1, allocation: 'ASYMMETRIC_HIGH' },
        'institutional_momentum_cascade': { system: new InstitutionalMomentumCascade(), weight: 0.35, priority: 2, allocation: 'ASYMMETRIC_HIGH' }
      },
      
      // TIER 2: CORE PORTFOLIO (Current best - fallback when institutional systems unavailable)
      CORE: {
        'triple_screen': { system: new ElderTripleScreen(), weight: 0.6, priority: 3, allocation: 'ASYMMETRIC_HIGH' },
        'sepa_method': { system: new MinerviniSEPA(), weight: 0.35, priority: 4, allocation: 'ASYMMETRIC_HIGH' }
      },
      
      // TIER 3: HEDGE SYSTEMS (5% capital)
      HEDGE: {
        'rsi_mean': { system: new RSIMeanReversion(), weight: 0.05, priority: 5, allocation: 'TACTICAL_HEDGE' }
      },
      
      // TIER 4: DELETED (Institutional cleanup)
      DELETED: {
        'divergence': { system: new MACDDivergence(), weight: 0.0, priority: 99, disabled: true, reason: 'INSTITUTIONAL_CLEANUP' }
      }
    };
    
    // Legacy compatibility
    this.availableSystems = this.flattenSystemsForCompatibility();
  }
  
  flattenSystemsForCompatibility() {
    const flattened = {};
    Object.values(this.systemHierarchy).forEach(tier => {
      Object.entries(tier).forEach(([id, config]) => {
        if (!config.disabled) {
          flattened[id] = config.system;
        }
      });
    });
    return flattened;
  }

  /**
   * 🔥 GET SYSTEM CONFIGURATION WITH HIERARCHY
   */
  getSystemConfig(systemId) {
    for (const [tier, systems] of Object.entries(this.systemHierarchy)) {
      if (systems[systemId] && !systems[systemId].disabled) {
        return {
          ...systems[systemId],
          tier: tier,
          systemId: systemId
        };
      }
    }
    return null;
  }

  /**
   * 🏛️ INSTITUTIONAL CAPITAL ALLOCATION
   * Advanced systems get highest allocation, fallback to current systems
   */
  getInstitutionalAllocation(systemId, marketRegime, trendStrength) {
    const config = this.getSystemConfig(systemId);
    if (!config) return 0;

    // 🏆 INSTITUTIONAL TIER: Advanced Systems (when available)
    if (systemId === 'minervini_template') {
      // Stock Selection System - works in all regimes but best in BULL
      if (marketRegime === 'BULL') return 0.60;
      if (marketRegime === 'SIDEWAYS') return 0.45;
      if (marketRegime === 'BEAR') return 0.20; // Reduced but still active
      return 0.45; // Default allocation
    }

    if (systemId === 'institutional_momentum') {
      // Timing System - works with Minervini Template selections
      if (marketRegime === 'BULL' && trendStrength > 0.7) return 0.35;
      if (marketRegime === 'SIDEWAYS') return 0.50; // Best in breakout conditions
      if (marketRegime === 'BEAR') return 0.15; // Reduced in bear markets
      return 0.35; // Default allocation
    }

    // 🔄 FALLBACK: Current Core Systems (when institutional systems unavailable)
    // Elder Triple Screen: Trend Foundation
    if (systemId === 'triple_screen') {
      // Reduced allocation when institutional systems are active
      if (marketRegime === 'BULL' || trendStrength > 0.7) return 0.30; // Reduced from 0.95
      if (marketRegime === 'SIDEWAYS' && trendStrength > 0.4) return 0.20; // Reduced from 0.30
      return 0.0;
    }

    // SEPA Method: Breakout Specialist (fallback)
    if (systemId === 'sepa_method') {
      if (marketRegime === 'SIDEWAYS' || (marketRegime === 'BULL' && trendStrength < 0.6)) return 0.25; // Reduced from 0.65
      return 0.0;
    }

    // RSI Mean Reversion: Hedge Only (unchanged)
    if (systemId === 'rsi_mean') {
      if (marketRegime === 'SIDEWAYS' && trendStrength < 0.3) return 0.15;
      return 0.05;
    }

    return 0.0;
  }

  /**
   * 🚫 BRUTAL AI VETO LOGIC - Override systems when AI shows clear danger
   */
  checkAIVeto(analysisContext, systemId) {
    // VETO 1: Earnings in 0-2 days = KILL ALL NEW POSITIONS (Always check first)
    if (analysisContext.riskAssessment?.earningsProximity?.daysUntilEarnings !== undefined && 
        analysisContext.riskAssessment.earningsProximity.daysUntilEarnings <= 2) {
      return {
        vetoed: true,
        reason: `AI VETO: Earnings in ${analysisContext.riskAssessment.earningsProximity.daysUntilEarnings} days - blocking new positions`
      };
    }

    const aiSignals = analysisContext.aiSignals;
    if (!aiSignals) return { vetoed: false };

    // VETO 2: Building Bear + Low Conviction = KILL ALL LONGS
    if (aiSignals.momentum === 'BUILDING_BEAR' && aiSignals.conviction === 'LOW') {
      return {
        vetoed: true,
        reason: `AI VETO: Building bearish momentum with low conviction detected - blocking ${systemId} long signals`
      };
    }

    // VETO 3: Strong Bear + Any System = KILL ALL LONGS
    if (aiSignals.momentum === 'STRONG_BEAR') {
      return {
        vetoed: true,
        reason: `AI VETO: Strong bearish momentum detected - blocking ${systemId} long signals`
      };
    }

    return { vetoed: false };
  }

  /**
   * 🚫 CREATE VETO RESULT
   */
  createVetoResult(systemId, reason, systemConfig) {
    return {
      system: {
        id: systemId,
        name: systemConfig.system.name || systemId,
        decision: 'AVOID',
        confidence: 0.95, // High confidence in veto
        reasoning: [reason],
        signalQuality: { grade: 'VETO', percentage: 95 },
        vetoed: true
      },

      gateEngine: { 
        finalDecision: { action: 'AVOID', confidence: 0.95 },
        vetoApplied: true 
      },

      finalDecision: {
        action: 'AVOID',
        confidence: 0.95,
        reasoning: [`AI VETO APPLIED: ${reason}`],
        vetoApplied: true
      },

      qualityMetrics: { 
        systemGrade: 'VETO', 
        gateGrade: 'VETO',
        vetoReason: reason 
      },
      
      meta: { 
        timestamp: new Date().toISOString(), 
        veto: 'AI_MOMENTUM_VETO',
        systemId: systemId
      }
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
      // 🔥 HIERARCHICAL SYSTEM RETRIEVAL
      const systemConfig = this.getSystemConfig(systemId);
      if (!systemConfig) {
        throw new Error(`Unknown trading system: ${systemId}`);
      }

      // 🚫 EARLY VETO CHECK - AI Momentum Override
      const vetoResult = this.checkAIVeto(analysisContext, systemId);
      if (vetoResult.vetoed) {
        return this.createVetoResult(systemId, vetoResult.reason, systemConfig);
      }

      // Phase 2: Execute Trading System Analysis with capital information and AI signals
      const systemAnalysisOptions = {
        capital: analysisContext.capital,
        symbol: analysisContext.symbol,
        currentPrice: analysisContext.technical?.currentPrice || analysisContext.technical?.latestPrice,
        // 🤖 PASS AI SIGNALS TO SYSTEM
        aiSignals: analysisContext.aiSignals || systemData.aiSignals,
        // 🔥 PASS SYSTEM TIER FOR INTERNAL LOGIC
        systemTier: systemConfig.tier,
        systemPriority: systemConfig.priority
      };
      
      const systemAnalysis = systemConfig.system.analyze(systemData, systemAnalysisOptions);
      // console.log(`📊 ${systemId} Analysis Result:`, analysisContext.symbol, systemAnalysis.decision, systemAnalysis.confidence, systemAnalysis.reasoning);
      // console.log(`📊 ${systemId} Analysis:`, systemAnalysis);
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
      // console.log(`🤖 Gate Engine Result:`, gateEngineResult);

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
    
    // 🔥 HIERARCHICAL TIER ASSIGNMENT BASED ON SYSTEM PRIORITY
    const systemConfig = this.getSystemConfig(systemAnalysis.system);
    const tier = this.getSystemSignalTier(systemConfig, systemAnalysis);
    const priority = this.getSystemSignalPriority(systemConfig, systemAnalysis);

    // Main system signal with hierarchy
    provenSignals.push({
      source: systemAnalysis.system,
      signal: systemAnalysis.decision.toUpperCase(),
      confidence: systemAnalysis.confidence || 0.5,
      tier: tier, // 🔥 HIERARCHICAL TIER ASSIGNMENT
      priority: priority, // 🔥 PRIORITY BASED ORDERING
      reasoning: `${systemAnalysis.systemName}: ${systemAnalysis.reasoning?.[0] || 'System analysis'}`,
      metadata: {
        systemName: systemAnalysis.systemName,
        systemTier: systemConfig?.tier || 'UNKNOWN',
        systemWeight: systemConfig?.weight || 0.1,
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
   * 🔥 GET HIERARCHICAL SIGNAL TIER BASED ON SYSTEM PERFORMANCE
   */
  getSystemSignalTier(systemConfig, systemAnalysis) {
    if (!systemConfig) return 'SUPPLEMENTARY';

    const confidence = systemAnalysis.confidence || 0;
    const grade = systemAnalysis.signalQuality?.grade || 'F';

    // PRIMARY systems can get PRIMARY tier with high confidence + grade
    if (systemConfig.tier === 'PRIMARY') {
      if (confidence >= 0.8 && ['A+', 'A', 'A-'].includes(grade)) {
        return 'PRIMARY';
      }
      if (confidence >= 0.7 && ['B+', 'B'].includes(grade)) {
        return 'CONFIRMER';
      }
      return 'SUPPLEMENTARY'; // Low confidence PRIMARY drops to supplementary
    }

    // TACTICAL systems max out at CONFIRMER
    if (systemConfig.tier === 'TACTICAL') {
      if (confidence >= 0.7 && ['A+', 'A', 'A-', 'B+', 'B'].includes(grade)) {
        return 'CONFIRMER';
      }
      return 'SUPPLEMENTARY';
    }

    // SUPPLEMENTARY systems stay supplementary
    return 'SUPPLEMENTARY';
  }

  /**
   * 🔥 GET SIGNAL PRIORITY BASED ON SYSTEM HIERARCHY + PERFORMANCE
   */
  getSystemSignalPriority(systemConfig, systemAnalysis) {
    if (!systemConfig) return 9.0; // Low priority for unknown systems

    const basePriority = systemConfig.priority;
    const confidence = systemAnalysis.confidence || 0;
    const grade = systemAnalysis.signalQuality?.grade || 'F';

    // Grade bonus (higher grade = lower priority number = higher actual priority)
    const gradeBonus = {
      'A+': -0.3, 'A': -0.2, 'A-': -0.1,
      'B+': 0, 'B': 0.1, 'B-': 0.2,
      'C+': 0.3, 'C': 0.4, 'C-': 0.5,
      'D': 0.6, 'F': 0.8
    }[grade] || 0.8;

    // Confidence bonus (higher confidence = lower priority number)
    const confidenceBonus = (1 - confidence) * 0.5;

    return basePriority + gradeBonus + confidenceBonus;
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
        reasoning: this.normalizeReasoning(systemAnalysis.reasoning),
        signalQuality: systemAnalysis.signalQuality,
        riskReward: systemAnalysis.riskReward,
        execution: systemAnalysis.execution
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
   * Helper: Normalize reasoning to always be an array
   */
  normalizeReasoning(reasoning) {
    if (!reasoning) return [];
    if (typeof reasoning === 'string') return [reasoning];
    if (Array.isArray(reasoning)) return reasoning;
    return [];
  }

  /**
   * Helper: Combine reasoning from system and gate analysis
   */
  combineReasoning(systemAnalysis, gateResult) {
    const systemReasoning = this.normalizeReasoning(systemAnalysis.reasoning);
    const gateReasoning = this.normalizeReasoning(gateResult.finalDecision?.reasoning);

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
        reasoning: this.normalizeReasoning(systemAnalysis?.reasoning),
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
