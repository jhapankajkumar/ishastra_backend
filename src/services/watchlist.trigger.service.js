/**
 * 🎯 ENTRY TRIGGER ALERT SERVICE
 * 
 * ONE JOB: Monitor watchlist stocks for entry trigger conditions
 * Sends alerts when BUY setups meet entry criteria
 * NO BULLSHIT. NO POSITION MONITORING. ENTRY TRIGGERS ONLY.
 */

const { PrismaClient } = require('@prisma/client');
const EmailAlertService = require('./email.service');
const { TRIGGER_TYPES } = require('../utils/systemConstants');
const { getTickerAnalysis } = require('./comom.service');
const prisma = new PrismaClient();

class WatchlistTriggerService {
    constructor() {
        this.emailAlertService = new EmailAlertService();
        // Track trigger states to avoid duplicate alerts
        this.triggerStates = new Map();
    }

    /**
     * MONITOR ENTRY TRIGGERS FOR WATCHLIST STOCKS
     * Checks current trigger conditions vs stored trigger states
     */
    async getWatchlistTriggers() {
        console.log('🔍 CHECKING ENTRY TRIGGERS FOR WATCHLIST STOCKS...');

        const watchlistStocks = await this.getBuyWatchList();

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
                const result = await this.getUpdatedTriggers(stock);
                if (result.newlyMet.length > 0) {
                    triggeredCount++;
                    alertsSent.push({
                        symbol: stock.symbol,
                        triggers: result.newlyMet,
                        stock: stock
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

    async getBuyWatchList() {
        const watchlistStocks = await prisma.watchlistStock.findMany({
            where: {
                OR: [
                    { decision: { contains: '"action":"BUY"', }, },
                    { decision: { contains: '"action":"STRONG_BUY"', }, },
                ],
            }
        });

        return watchlistStocks;
    }

    /**
     * CHECK INDIVIDUAL STOCK FOR ENTRY TRIGGER CHANGES
     */
    async getUpdatedTriggers(stock, isCronjob = false) {
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
        const currentAnalysis = await getTickerAnalysis(stock.symbol);
        if (!currentAnalysis?.execution?.entryStrategy?.triggerConditions) {
            return;
        }
        const oldTriggers = execution.entryStrategy.triggerConditions;
        const newTriggers = currentAnalysis.execution.entryStrategy.triggerConditions;
        // Find newly met triggers and update old in place
        const newlyMet = [];
        let changed = false;

        newTriggers.forEach(newT => {
            const old = oldTriggers.find(o => o.type === newT.type);
            if (old) {
                if (old.alerted != null && old.alerted == true) { return; }  
                if (old.current !== old.threshold && newT.current >= old.threshold) {
                    changed = true; // mark if any field differs
                    // Update only fields you care about
                    old.current = newT.current;
                    old.met = true;
                    if (isCronjob) {
                        old.alerted = true;
                    } 
                    newlyMet.push(old);
                }
            }
        });

        console.log("Newly met:", newlyMet);
        console.log("Old triggers (mutated):", oldTriggers);

        if (changed && !isCronjob) {
            await prisma.watchlistStock.update({
                where: { id: stock.id },
                data: {
                    execution: JSON.stringify({
                        ...execution,
                        entryStrategy: {
                            ...execution.entryStrategy,
                            triggerConditions: oldTriggers
                        }
                    })
                }
            });
        } else {
            console.log(`ℹ️ No trigger changes for ${stock.symbol}, skipping DB update`);
        }

        if (isCronjob) {
            return {
                newlyMet,
                currentAnalysis
            };
        } else {
            return {
                newlyMet
            };
        }

    }


    /**
     * SEND ENTRY TRIGGER ALERT EMAIL
     */
    async sendEntryTriggerAlert(stock, newlyMetTriggers) {
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
            const allTriggerDetails = stock.execution.entryStrategy.triggerConditions.map(trigger => {
                const status = trigger.met ? '✅' : '❌';
                const isNew = newlyMetTriggers.some(newTrigger =>
                    newTrigger.type === trigger.type && newTrigger.current === trigger.current
                );
                const newLabel = isNew ? ' NEW' : '';
                return `• ${trigger.type}: ${this.formatTriggerValue(trigger)} ${status}${newLabel}`;
            });

            const totalMetTriggers = stock.execution.entryStrategy.triggerConditions.filter(t => t.met).length;
            const totalTriggers = stock.execution.entryStrategy.triggerConditions.length;

            const alertData = {
                type: 'ENTRY_TRIGGER',
                priority: 'HIGH',
                symbol: stock.symbol,
                currentPrice: stock.currentPrice,
                action: decision?.action || 'BUY',
                confidence: decision?.confidence || 0,
                grade: decision?.grade || 'N/A',
                message: `Entry triggers activated for ${stock.symbol}`,
                details: {
                    newlyMetTriggers: newlyMetTriggerDetails,
                    allTriggers: allTriggerDetails,
                    totalProgress: `${totalMetTriggers}/${totalTriggers} triggers met`,
                    newlyActivated: `${newlyMetTriggers.length} new trigger(s) activated`,
                    entryZone: stock.execution?.entryStrategy?.entryZone || {},
                    stopLoss: stock.execution?.exitStrategy?.stopLoss?.initial || 'N/A'
                }
            };

            await this.emailAlertService.sendAlert(alertData);
            console.log(`📧 Entry trigger alert sent for ${stock.symbol} (${newlyMetTriggers.length} new triggers)`);

        } catch (error) {
            console.error(`❌ Error sending entry trigger alert for ${stock.symbol}:`, error.message);
        }
    }

    /**
     * 🎯 SIMPLE TRIGGER FORMATTING - No Over-Engineering
     * Market makers don't respect decimal precision, neither should we
     */
    formatTriggerValue(trigger) {
        const { type, current, threshold } = trigger;

        switch (type) {
            // Volume trigger (rounded to thousands)
            case TRIGGER_TYPES.VOLUME:
                const currentVol = Math.round(current / 1000) * 1000;
                const thresholdVol = Math.round(threshold / 1000) * 1000;
                return `${currentVol.toLocaleString()} (threshold: ${thresholdVol.toLocaleString()})`;

            // Price breakout trigger (rounded to nearest 0.5% or ₹5)
            case TRIGGER_TYPES.BREAKOUT_LEVEL:
                const priceRounding = current > 1000 ? 5 : (current > 100 ? 1 : 0.5);
                const roundedCurrent = Math.round(current / priceRounding) * priceRounding;
                const roundedThreshold = Math.round(threshold / priceRounding) * priceRounding;
                return `₹${roundedCurrent.toFixed(priceRounding >= 1 ? 0 : 1)} (breakout: ₹${roundedThreshold.toFixed(priceRounding >= 1 ? 0 : 1)})`;

            // Candle strength (rounded to 0.5%)
            case TRIGGER_TYPES.CANDLE_STRENGTH:
                const currentPct = Math.round(current * 200) / 2; // Round to nearest 0.5%
                const thresholdPct = Math.round(threshold * 200) / 2;
                return `${currentPct}% (threshold: ${thresholdPct}%)`;

            // Momentum acceleration (rounded to 0.1%)
            case TRIGGER_TYPES.MOMENTUM_ACCELERATION:
                const currentMom = Math.round(current * 1000) / 10; // Round to nearest 0.1%
                const thresholdMom = Math.round(threshold * 1000) / 10;
                return `${currentMom}% (threshold: ${thresholdMom}%)`;

            // System grade (no decimals needed)
            case TRIGGER_TYPES.CASCADE_GRADE:
                return `${current} (threshold: ${threshold})`;

            default:
                // Default: round to 2 significant figures
                const formatNumber = (num) => {
                    if (num > 100) return Math.round(num).toString();
                    if (num > 10) return num.toFixed(1);
                    return num.toFixed(2);
                };
                return `${formatNumber(current)} (threshold: ${formatNumber(threshold)})`;
        }
    }
}

module.exports = WatchlistTriggerService;
