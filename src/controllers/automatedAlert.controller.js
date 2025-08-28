/**
 * 📊 POSITION ALERT CONTROLLER - Clean & Focused
 * Only handles position alerts for owned stocks
 */

const { PrismaClient } = require('@prisma/client');

class AutomatedAlertController {
    constructor() {
        this.db = new PrismaClient();
    }
    
    /**
     * 📊 POSITION ALERTS - Core Method
     * Returns comprehensive alerts for owned positions only
     */
    async getPositionSignalAlerts() {
        try {
            console.log('📊 Getting position alerts...');
            
            // Get symbols of stocks you own
            const openTrades = await this.db.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { 
                    ticker: true, 
                    quantity: true, 
                    remainingQuantity: true,
                    entryPrice: true,
                    currentPrice: true,
                    entryDate: true,
                    createdAt: true,
                    id: true
                }
            });
            
            if (openTrades.length === 0) {
                console.log('📊 No open positions found');
                return [];
            }
            
            const ownedSymbols = [...new Set(openTrades.map(t => t.ticker))];
            console.log(`📊 Checking ${ownedSymbols.length} owned positions: ${ownedSymbols.join(', ')}`);
            
            const positionAlerts = [];
            
            // 1. PRICE-BASED POSITION PERFORMANCE ALERTS (Primary)
            const performanceAlerts = await this.analyzePositionPerformance(openTrades);
            positionAlerts.push(...performanceAlerts);
            
            // 2. CURRENT SIGNAL STATUS CHECK (Secondary)
            const currentSignals = await this.getCurrentSignalsForSymbols(ownedSymbols);
            
            for (const signal of currentSignals) {
                const tradeInfo = openTrades.find(t => t.ticker === signal.symbol);
                
                // Alert if current end-of-day signal shows AVOID (high priority risk)
                if (signal.decision && signal.decision.action === 'AVOID') {
                    positionAlerts.push({
                        type: 'TRADE_ALERT',
                        category: 'SIGNAL_RISK',
                        ticker: signal.symbol,
                        priority: 'HIGH',
                        message: `⚠️ ${signal.symbol}: Current signal shows AVOID (${signal.decision.grade} grade, ${(signal.decision.confidence * 100).toFixed(0)}% confidence)`,
                        actionSuggested: 'CONSIDER_REDUCING',
                        intelligence: {
                            currentSignal: signal.decision,
                            alertReason: 'End-of-day analysis shows AVOID',
                            context: 'signal_risk_check',
                            confidence: signal.decision.confidence,
                            reasoning: signal.decision.reasoning
                        },
                        trade: tradeInfo ? {
                            remainingQuantity: tradeInfo.remainingQuantity || tradeInfo.quantity,
                            entryPrice: tradeInfo.entryPrice,
                            currentPrice: tradeInfo.currentPrice,
                            unrealizedPnL: tradeInfo.currentPrice && tradeInfo.entryPrice ? 
                                (tradeInfo.currentPrice - tradeInfo.entryPrice) * (tradeInfo.remainingQuantity || tradeInfo.quantity) : 0
                        } : null,
                        timestamp: new Date()
                    });
                }
                
                // Alert if current signal shows WATCH with low confidence (medium priority)
                if (signal.decision && signal.decision.action === 'WATCH' && signal.decision.confidence < 0.6) {
                    positionAlerts.push({
                        type: 'TRADE_ALERT',
                        category: 'SIGNAL_UNCERTAINTY',
                        ticker: signal.symbol,
                        priority: 'MEDIUM',
                        message: `🔍 ${signal.symbol}: Signal uncertain - WATCH with ${(signal.decision.confidence * 100).toFixed(0)}% confidence`,
                        actionSuggested: 'MONITOR_CLOSELY',
                        intelligence: {
                            currentSignal: signal.decision,
                            alertReason: 'Low confidence WATCH signal',
                            context: 'signal_uncertainty',
                            confidence: signal.decision.confidence,
                            reasoning: signal.decision.reasoning
                        },
                        trade: tradeInfo,
                        timestamp: new Date()
                    });
                }
            }
            
            console.log(`📊 Generated ${positionAlerts.length} position alerts (${performanceAlerts.length} performance + ${positionAlerts.length - performanceAlerts.length} signal)`);
            return positionAlerts;
            
        } catch (error) {
            console.error('❌ Error getting position alerts:', error);
            return [];
        }
    }

    /**
     * 🔍 Get current AI signals for specific symbols
     */
    async getCurrentSignalsForSymbols(symbols) {
        try {
            const { generateExpertAIDecision, prepareAnalysisContext } = require('./ai/stock.expert.controller');
            
            const signals = [];
            
            for (const symbol of symbols) {
                try {
                    console.log(`🔍 Getting current signal for ${symbol}...`);
                    
                    // Get AI analysis for the symbol
                    const context = await prepareAnalysisContext(symbol);
                    const aiDecision = await generateExpertAIDecision(context);
                    
                    if (aiDecision && aiDecision.decision) {
                        signals.push({
                            symbol: symbol,
                            decision: {
                                action: aiDecision.decision.action || 'WATCH',
                                confidence: aiDecision.decision.confidence || 0.5,
                                grade: aiDecision.decision.grade || 'C',
                                reasoning: aiDecision.decision.reasoning || []
                            },
                            signal_quality: aiDecision.signal_quality || 'STANDARD',
                            universe: 'OWNED_POSITIONS',
                            systems: aiDecision.systems || [],
                            technicals: aiDecision.technicals || {}
                        });
                    }
                    
                } catch (symbolError) {
                    console.error(`❌ Error getting signal for ${symbol}:`, symbolError.message);
                }
            }
            
            console.log(`🔍 Retrieved ${signals.length} signals out of ${symbols.length} symbols`);
            return signals;
            
        } catch (error) {
            console.error('❌ Error getting current signals:', error);
            return [];
        }
    }
    
    /**
     * 📊 ANALYZE POSITION PERFORMANCE
     * Focus on price-based alerts rather than signal changes
     */
    async analyzePositionPerformance(openTrades) {
        const performanceAlerts = [];
        
        for (const trade of openTrades) {
            const alert = this.analyzeIndividualPosition(trade);
            if (alert) {
                performanceAlerts.push(alert);
            }
        }
        
        return performanceAlerts;
    }

    /**
     * 📈 Analyze individual position performance
     */
    analyzeIndividualPosition(trade) {
        const currentPrice = trade.currentPrice || trade.entryPrice;
        const pnlPercent = (currentPrice - trade.entryPrice) / trade.entryPrice;
        const daysHeld = Math.floor((Date.now() - new Date(trade.createdAt)) / (1000 * 60 * 60 * 24));
        
        // Major gain alert (15%+ gain)
        if (pnlPercent >= 0.15) {
            return {
                type: 'POSITION_ALERT',
                category: 'MAJOR_GAIN',
                ticker: trade.ticker,
                priority: 'HIGH',
                message: `🎉 ${trade.ticker} up ${(pnlPercent * 100).toFixed(1)}% - consider profit taking`,
                details: {
                    entryPrice: trade.entryPrice,
                    currentPrice: currentPrice,
                    pnlPercent: pnlPercent,
                    pnlAmount: (currentPrice - trade.entryPrice) * trade.quantity,
                    daysHeld: daysHeld
                },
                actionSuggested: 'CONSIDER_PROFIT_TAKING',
                timestamp: new Date()
            };
        }
        
        // Major loss alert (10%+ loss)
        if (pnlPercent <= -0.10) {
            return {
                type: 'POSITION_ALERT',
                category: 'MAJOR_LOSS',
                ticker: trade.ticker,
                priority: 'CRITICAL',
                message: `🚨 ${trade.ticker} down ${(Math.abs(pnlPercent) * 100).toFixed(1)}% - review stop loss`,
                details: {
                    entryPrice: trade.entryPrice,
                    currentPrice: currentPrice,
                    pnlPercent: pnlPercent,
                    pnlAmount: (currentPrice - trade.entryPrice) * trade.quantity,
                    daysHeld: daysHeld
                },
                actionSuggested: 'REVIEW_STOP_LOSS',
                timestamp: new Date()
            };
        }
        
        // Stale position alert (90+ days with minimal movement)
        if (daysHeld >= 90 && Math.abs(pnlPercent) < 0.05) {
            return {
                type: 'POSITION_ALERT',
                category: 'STALE_POSITION',
                ticker: trade.ticker,
                priority: 'MEDIUM',
                message: `⏰ ${trade.ticker} held ${daysHeld} days with minimal movement - review strategy`,
                details: {
                    entryPrice: trade.entryPrice,
                    currentPrice: currentPrice,
                    pnlPercent: pnlPercent,
                    daysHeld: daysHeld
                },
                actionSuggested: 'REVIEW_STRATEGY',
                timestamp: new Date()
            };
        }
        
        return null; // No alert needed
    }
}

module.exports = AutomatedAlertController;
