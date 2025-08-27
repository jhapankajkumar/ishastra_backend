/**
 * SIGNAL HISTORY SERVICE
 * Automatically stores and compares signals for alert generation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SignalHistoryService {
    /**
     * Store current analysis results as signal history
     */
    async storeSignalResults(analysisResults) {
        const signals = [];
        
        for (const result of analysisResults) {
            const signalData = {
                symbol: result.symbol,
                action: result.decision.action,
                confidence: result.decision.confidence,
                grade: result.decision.grade,
                signalQuality: result.signal_quality || 'STANDARD',
                universe: result.universe || 'UNKNOWN',
                analysisTimestamp: new Date(),
                metadata: JSON.stringify({
                    systems: result.systems || [],
                    technicals: result.technicals || {}
                })
            };
            
            signals.push(signalData);
        }
        
        // Store in database (SQLite doesn't support createMany, so use individual creates)
        for (const signal of signals) {
            await prisma.signalHistory.create({
                data: signal
            });
        }
        
        console.log(`✅ Stored ${signals.length} signal results in history`);
        return signals;
    }
    
    /**
     * Get previous signal results for comparison
     */
    async getPreviousSignals(symbols = null, hoursBack = 24) {
        const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        
        // Get the most recent signal for each symbol before current analysis
        const previousSignals = await prisma.signalHistory.findMany({
            where: {
                ...(symbols && { symbol: { in: symbols } }),
                analysisTimestamp: { gte: cutoffTime }
            },
            orderBy: { analysisTimestamp: 'desc' },
            distinct: ['symbol']
        });
        
        // Convert to lookup format
        const signalMap = {};
        previousSignals.forEach(signal => {
            signalMap[signal.symbol] = {
                action: signal.action,
                confidence: signal.confidence,
                grade: signal.grade,
                signalQuality: signal.signalQuality,
                timestamp: signal.analysisTimestamp
            };
        });
        
        return signalMap;
    }
    
    /**
     * Compare current vs previous signals and generate alerts
     */
    async generateAlertsFromSignalComparison(currentResults) {
        // Get symbols from current results
        const symbols = currentResults.map(r => r.symbol);
        
        // Get previous signals for these symbols
        const previousSignals = await this.getPreviousSignals(symbols);
        
        const alerts = {
            critical: [],
            urgent: [],
            important: []
        };
        
        for (const current of currentResults) {
            const previous = previousSignals[current.symbol];
            
            if (!previous) continue; // No previous signal to compare
            
            // Check for critical signal breakdowns
            if (this.isSignalBreakdown(previous, current)) {
                alerts.critical.push({
                    type: 'CRITICAL',
                    category: 'SIGNAL_BREAKDOWN',
                    symbol: current.symbol,
                    message: `${current.symbol} signal breakdown: ${previous.action} → ${current.decision.action}`,
                    previous: previous,
                    current: current.decision,
                    timestamp: new Date()
                });
            }
            
            // Check for new high-quality opportunities
            if (this.isNewOpportunity(previous, current)) {
                alerts.urgent.push({
                    type: 'URGENT',
                    category: 'NEW_OPPORTUNITY',
                    symbol: current.symbol,
                    message: `${current.symbol} new ${current.decision.action} signal (${current.decision.grade}, ${(current.decision.confidence * 100).toFixed(0)}% confidence)`,
                    signal: current.decision,
                    timestamp: new Date()
                });
            }
            
            // Check for signal strengthening
            if (this.isSignalStrengthening(previous, current)) {
                alerts.important.push({
                    type: 'IMPORTANT',
                    category: 'SIGNAL_STRENGTHENING',
                    symbol: current.symbol,
                    message: `${current.symbol} signal strengthening: ${(previous.confidence * 100).toFixed(0)}% → ${(current.decision.confidence * 100).toFixed(0)}% confidence`,
                    improvement: (current.decision.confidence - previous.confidence) * 100,
                    timestamp: new Date()
                });
            }
        }
        
        return alerts;
    }
    
    /**
     * Check if signal is breaking down (BUY → WATCH/AVOID)
     */
    isSignalBreakdown(previous, current) {
        const prevRank = this.getSignalRank(previous.action);
        const currRank = this.getSignalRank(current.decision.action);
        
        // Signal breakdown: BUY/STRONG_BUY → WATCH/AVOID/SELL
        return prevRank >= 4 && currRank <= 3;
    }
    
    /**
     * Check if this is a new opportunity
     */
    isNewOpportunity(previous, current) {
        const prevRank = this.getSignalRank(previous.action);
        const currRank = this.getSignalRank(current.decision.action);
        
        // New opportunity: WATCH/AVOID → BUY and high confidence
        return prevRank <= 3 && currRank >= 4 && current.decision.confidence >= 0.7;
    }
    
    /**
     * Check if signal is strengthening
     */
    isSignalStrengthening(previous, current) {
        // Same action but higher confidence
        return previous.action === current.decision.action && 
               current.decision.confidence > previous.confidence + 0.1;
    }
    
    /**
     * Get numeric rank for signal action
     */
    getSignalRank(action) {
        const ranks = {
            'STRONG_BUY': 5,
            'BUY': 4,
            'WATCH': 3,
            'HOLD': 2,
            'AVOID': 1,
            'SELL': 0
        };
        return ranks[action] || 0;
    }
}

module.exports = SignalHistoryService;
