/**
 * 🎯 ENTRY TRIGGER ALERT SERVICE
 * 
 * ONE JOB: Monitor watchlist stocks for entry trigger conditions
 * Sends alerts when BUY setups meet entry criteria
 * NO BULLSHIT. NO POSITION MONITORING. ENTRY TRIGGERS ONLY.
 */

const { PrismaClient } = require('@prisma/client');
const EmailAlertService = require('./emailAlertService');
const { TRIGGER_TYPES } = require('../utils/systemConstants');
const prisma = new PrismaClient();

class EntryTriggerService {
    constructor() {
        this.emailAlertService = new EmailAlertService();
        // Track trigger states to avoid duplicate alerts
        this.triggerStates = new Map();
    }

    /**
     * MONITOR ENTRY TRIGGERS FOR WATCHLIST STOCKS
     * Checks current trigger conditions vs stored trigger states
     */
    async checkEntryTriggers() {
        console.log('🔍 CHECKING ENTRY TRIGGERS FOR WATCHLIST STOCKS...');

        const watchlistStocks = await prisma.watchlistStock.findMany({
            where: {
                // Only check BUY signals for entry triggers
                decision: {
                    contains: '"action":"BUY"'
                }
            }
        });

        if (watchlistStocks.length === 0) {
            console.log('📋 No BUY signals in watchlist to monitor');
            return {
                monitored: 0,
                triggered: 0,
                alerts: []
            };
        }

        console.log(`📊 Monitoring ${watchlistStocks.length} BUY signals for entry triggers`);

        let triggeredCount = 0;
        const alertsSent = [];

        for (const stock of watchlistStocks) {
            try {
                const result = await this.checkStockEntryTriggers(stock);
                if (result?.triggered) {
                    triggeredCount++;
                    alertsSent.push({
                        symbol: stock.symbol,
                        triggers: result.newlyMetTriggers.length,
                        price: result.currentPrice
                    });
                }
            } catch (error) {
                console.error(`❌ Error checking triggers for ${stock.symbol}:`, error.message);
            }
        }

        console.log('✅ ENTRY TRIGGER CHECK COMPLETE');
        return {
            monitored: watchlistStocks.length,
            triggered: triggeredCount,
            alerts: alertsSent
        };
    }

    /**
     * CHECK INDIVIDUAL STOCK FOR ENTRY TRIGGER CHANGES
     */
    async checkStockEntryTriggers(stock) {
        // Parse stored analysis data
        let execution = null;
        try {
            execution = stock.execution ? JSON.parse(stock.execution) : null;
        } catch (error) {
            console.error(`❌ Error parsing execution data for ${stock.symbol}`);
            return;
        }

        if (!execution?.entryStrategy?.triggerConditions) {
            return; // No trigger conditions to monitor
        }

        // Get current analysis to check updated trigger conditions
        const currentAnalysis = await this.getCurrentAnalysis(stock.symbol);
        if (!currentAnalysis?.execution?.entryStrategy?.triggerConditions) {
            return;
        }

        // Compare current triggers vs stored triggers
        const newlyMetTriggers = this.findNewlyMetTriggers(
            stock.symbol,
            execution.entryStrategy.triggerConditions,
            currentAnalysis.execution.entryStrategy.triggerConditions
        );

        if (newlyMetTriggers.length > 0) {
            await this.sendEntryTriggerAlert(stock, currentAnalysis, newlyMetTriggers);
            return {
                triggered: true,
                newlyMetTriggers,
                currentPrice: currentAnalysis.currentPrice
            };
        }

        return {
            triggered: false,
            newlyMetTriggers: [],
            currentPrice: currentAnalysis.currentPrice
        };
    }

    /**
     * GET CURRENT ANALYSIS FOR STOCK
     */
    async getCurrentAnalysis(symbol) {
        try {
            const response = await fetch(`http://localhost:8000/api/trading/signal-analysis?symbols=${symbol}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.results?.[0];
        } catch (error) {
            console.error(`❌ Error fetching current analysis for ${symbol}:`, error.message);
            return null;
        }
    }

    /**
     * FIND NEWLY MET TRIGGER CONDITIONS
     */
    findNewlyMetTriggers(symbol, previousTriggers, currentTriggers) {
        const previousStates = this.triggerStates.get(symbol) || {};
        const newlyMet = [];

        currentTriggers.forEach(currentTrigger => {
            const previousTrigger = previousTriggers.find(p => p.type === currentTrigger.type);
            const wasPreviouslyMet = previousStates[currentTrigger.type] || false;

            // If trigger is now met and wasn't previously met
            if (currentTrigger.met && !wasPreviouslyMet) {
                newlyMet.push({
                    ...currentTrigger,
                    previousValue: previousTrigger?.current || 'Unknown'
                });
            }
        });

        // Update trigger states
        const newStates = {};
        currentTriggers.forEach(trigger => {
            newStates[trigger.type] = trigger.met;
        });
        this.triggerStates.set(symbol, newStates);

        return newlyMet;
    }

    /**
     * SEND ENTRY TRIGGER ALERT EMAIL
     */
    async sendEntryTriggerAlert(stock, currentAnalysis, newlyMetTriggers) {
        try {
            let decision = null;
            try {
                decision = stock.decision ? JSON.parse(stock.decision) : null;
            } catch (error) {
                console.error(`❌ Error parsing decision for ${stock.symbol}`);
                return;
            }

            // Format newly met triggers
            const newlyMetTriggerDetails = newlyMetTriggers.map(trigger => 
                `• ${trigger.type}: ${this.formatTriggerValue(trigger)} ✅ NEW`
            );

            // Format ALL trigger conditions (both met and unmet) for complete overview
            const allTriggerDetails = currentAnalysis.execution.entryStrategy.triggerConditions.map(trigger => {
                const status = trigger.met ? '✅' : '❌';
                const isNew = newlyMetTriggers.some(newTrigger => 
                    newTrigger.type === trigger.type && newTrigger.current === trigger.current
                );
                const newLabel = isNew ? ' NEW' : '';
                return `• ${trigger.type}: ${this.formatTriggerValue(trigger)} ${status}${newLabel}`;
            });

            const totalMetTriggers = currentAnalysis.execution.entryStrategy.triggerConditions.filter(t => t.met).length;
            const totalTriggers = currentAnalysis.execution.entryStrategy.triggerConditions.length;

            const alertData = {
                type: 'ENTRY_TRIGGER',
                priority: 'HIGH',
                symbol: stock.symbol,
                currentPrice: currentAnalysis.currentPrice,
                action: decision?.action || 'BUY',
                confidence: decision?.confidence || 0,
                grade: decision?.grade || 'N/A',
                message: `Entry triggers activated for ${stock.symbol}`,
                details: {
                    newlyMetTriggers: newlyMetTriggerDetails,
                    allTriggers: allTriggerDetails,
                    totalProgress: `${totalMetTriggers}/${totalTriggers} triggers met`,
                    newlyActivated: `${newlyMetTriggers.length} new trigger(s) activated`,
                    entryZone: currentAnalysis.execution?.entryStrategy?.entryZone || {},
                    stopLoss: currentAnalysis.execution?.exitStrategy?.stopLoss?.initial || 'N/A'
                }
            };

            await this.emailAlertService.sendAlert(alertData);
            console.log(`📧 Entry trigger alert sent for ${stock.symbol} (${newlyMetTriggers.length} new triggers)`);

        } catch (error) {
            console.error(`❌ Error sending entry trigger alert for ${stock.symbol}:`, error.message);
        }
    }

    /**
     * Format trigger value based on type for better readability
     * ONLY handles trigger types that actually exist in the trading systems
     */
    formatTriggerValue(trigger) {
        const { type, current, threshold } = trigger;
        
        switch (type) {
            // Volume trigger (unified for all systems)
            case TRIGGER_TYPES.VOLUME:
                return `${current.toLocaleString()} (threshold: ${threshold.toLocaleString()})`;
            
            // Price breakout trigger (unified for all systems)
            case TRIGGER_TYPES.BREAKOUT_LEVEL:
                return `₹${current.toFixed(2)} (threshold: ₹${threshold.toFixed(2)})`;
            
            // Candle strength trigger
            case TRIGGER_TYPES.CANDLE_STRENGTH:
                return `${(current * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`;
            
            // Momentum acceleration trigger
            case TRIGGER_TYPES.MOMENTUM_ACCELERATION:
                return `${(current * 100).toFixed(2)}% (threshold: ${(threshold * 100).toFixed(2)}%)`;
                
            // System grade trigger
            case TRIGGER_TYPES.CASCADE_GRADE:
                return `${current} (threshold: ${threshold})`;
            
            default:
                return `${current} (threshold: ${threshold})`;
        }
    }
}

module.exports = EntryTriggerService;
