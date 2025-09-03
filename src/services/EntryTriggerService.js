/**
 * 🎯 ENTRY TRIGGER ALERT SERVICE
 * 
 * ONE JOB: Monitor watchlist stocks for entry trigger conditions
 * Sends alerts when BUY setups meet entry criteria
 * NO BULLSHIT. NO POSITION MONITORING. ENTRY TRIGGERS ONLY.
 */

const { PrismaClient } = require('@prisma/client');
const EmailAlertService = require('./EmailAlertService');
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
            return;
        }

        console.log(`📊 Monitoring ${watchlistStocks.length} BUY signals for entry triggers`);

        for (const stock of watchlistStocks) {
            try {
                await this.checkStockEntryTriggers(stock);
            } catch (error) {
                console.error(`❌ Error checking triggers for ${stock.symbol}:`, error.message);
            }
        }

        console.log('✅ ENTRY TRIGGER CHECK COMPLETE');
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
        }
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

            const triggerDetails = newlyMetTriggers.map(trigger => 
                `• ${trigger.type}: ${trigger.current} (threshold: ${trigger.threshold}) ✅`
            ).join('\n');

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
                    newlyMetTriggers: triggerDetails,
                    totalProgress: `${totalMetTriggers}/${totalTriggers} triggers met`,
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
}

module.exports = EntryTriggerService;
