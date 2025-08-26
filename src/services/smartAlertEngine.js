/**
 * SMART ALERT ENGINE - Elite Trader Approach
 * Generates contextual, portfolio-aware alerts with intelligent filtering
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SmartAlertEngine {
    constructor() {
        this.alertHierarchy = {
            CRITICAL: { priority: 1, channels: ['push', 'sms', 'email'], maxPerDay: 3 },
            URGENT: { priority: 2, channels: ['push', 'email'], maxPerDay: 5 },
            IMPORTANT: { priority: 3, channels: ['push'], maxPerDay: 8 },
            INFO: { priority: 4, channels: ['email'], maxPerDay: 2 }
        };

        this.alertCooldowns = new Map(); // Prevent alert spam
        this.userPreferences = new Map(); // User-specific settings
        this.dailyAlertCount = new Map(); // Track daily limits
    }

    /**
     * MAIN ALERT PROCESSING ENGINE
     * Called whenever signals change or positions update
     */
    async processSignalChanges(currentSignals, previousSignals, userPortfolio) {
        console.log('🚨 Processing signal changes for smart alerts...');
        
        const alerts = [];
        
        // 1. CRITICAL ALERTS: Position Risk Management
        const criticalAlerts = await this.generateCriticalAlerts(currentSignals, previousSignals, userPortfolio);
        alerts.push(...criticalAlerts);
        
        // 2. URGENT ALERTS: High-Grade Opportunities
        const urgentAlerts = await this.generateUrgentAlerts(currentSignals, previousSignals, userPortfolio);
        alerts.push(...urgentAlerts);
        
        // 3. IMPORTANT ALERTS: Signal Evolution
        const importantAlerts = await this.generateImportantAlerts(currentSignals, previousSignals, userPortfolio);
        alerts.push(...importantAlerts);
        
        // 4. FILTER AND SEND ALERTS
        const filteredAlerts = this.applySmartFiltering(alerts, userPortfolio.userId);
        
        for (const alert of filteredAlerts) {
            await this.sendAlert(alert);
        }
        
        return {
            total_generated: alerts.length,
            sent_after_filtering: filteredAlerts.length,
            by_priority: this.groupAlertsByPriority(filteredAlerts)
        };
    }

    /**
     * 🚨 CRITICAL ALERTS - Immediate Action Required
     */
    async generateCriticalAlerts(currentSignals, previousSignals, userPortfolio) {
        const criticalAlerts = [];
        
        // Check each position for critical risk
        for (const position of userPortfolio.positions) {
            const currentSignal = currentSignals.find(s => s.symbol === position.ticker);
            const previousSignal = previousSignals[position.ticker];
            
            if (!currentSignal || !previousSignal) continue;
            
            // CRITICAL: BUY signal degraded to AVOID with position
            if (previousSignal.action === 'BUY' && currentSignal.decision.action === 'AVOID') {
                criticalAlerts.push({
                    type: 'CRITICAL',
                    category: 'POSITION_RISK',
                    symbol: position.ticker,
                    title: `🚨 CRITICAL: ${position.ticker} Signal Breakdown`,
                    message: `${position.ticker} signal degraded from BUY to AVOID. Position at risk.`,
                    actionRequired: 'REVIEW_POSITION_IMMEDIATELY',
                    positionData: {
                        currentValue: position.currentValue,
                        unrealizedPnL: position.unrealizedPnL,
                        unrealizedPnLPct: position.unrealizedPnLPct
                    },
                    timestamp: new Date(),
                    urgencyLevel: 'IMMEDIATE'
                });
            }
            
            // CRITICAL: Large position decline with signal degradation
            if (position.unrealizedPnLPct < -0.15 && 
                this.isSignalDegrading(previousSignal, currentSignal)) {
                criticalAlerts.push({
                    type: 'CRITICAL',
                    category: 'POSITION_LOSS',
                    symbol: position.ticker,
                    title: `🚨 CRITICAL: ${position.ticker} Major Decline + Signal Weak`,
                    message: `${position.ticker} down ${(position.unrealizedPnLPct * 100).toFixed(1)}% with weakening signal.`,
                    actionRequired: 'CONSIDER_STOP_LOSS',
                    positionData: position,
                    timestamp: new Date(),
                    urgencyLevel: 'IMMEDIATE'
                });
            }
        }
        
        // CRITICAL: Market structure alerts
        const marketAlerts = await this.generateMarketStructureAlerts(userPortfolio);
        criticalAlerts.push(...marketAlerts);
        
        return criticalAlerts;
    }

    /**
     * ⚡ URGENT ALERTS - High-Probability Opportunities
     */
    async generateUrgentAlerts(currentSignals, previousSignals, userPortfolio) {
        const urgentAlerts = [];
        
        // Find institutional-grade new opportunities
        const institutionalOpportunities = currentSignals.filter(signal => 
            signal.decision.action === 'BUY' &&
            signal.signal_quality === 'INSTITUTIONAL_GRADE' &&
            signal.decision.confidence >= 0.8 &&
            !userPortfolio.positions.find(p => p.ticker === signal.symbol) // No existing position
        );
        
        for (const opportunity of institutionalOpportunities) {
            // Only alert if we have sufficient capital
            if (userPortfolio.availableCapital >= userPortfolio.minPositionSize) {
                urgentAlerts.push({
                    type: 'URGENT',
                    category: 'INSTITUTIONAL_OPPORTUNITY',
                    symbol: opportunity.symbol,
                    title: `⚡ URGENT: ${opportunity.symbol} Institutional-Grade Setup`,
                    message: `${opportunity.symbol}: ${opportunity.decision.grade} grade, ${(opportunity.decision.confidence * 100).toFixed(0)}% confidence BUY signal.`,
                    actionRequired: 'CONSIDER_ENTRY',
                    signalData: {
                        grade: opportunity.decision.grade,
                        confidence: opportunity.decision.confidence,
                        universe: opportunity.universe,
                        signal_quality: opportunity.signal_quality
                    },
                    recommendedAllocation: this.calculateRecommendedAllocation(opportunity, userPortfolio),
                    timestamp: new Date(),
                    urgencyLevel: 'WITHIN_1_HOUR'
                });
            }
        }
        
        // Capital reallocation opportunities
        const reallocationAlerts = this.generateCapitalReallocationAlerts(currentSignals, userPortfolio);
        urgentAlerts.push(...reallocationAlerts);
        
        return urgentAlerts;
    }

    /**
     * 📈 IMPORTANT ALERTS - Signal Evolution & Updates
     */
    async generateImportantAlerts(currentSignals, previousSignals, userPortfolio) {
        const importantAlerts = [];
        
        // Signal strengthening for current positions
        for (const position of userPortfolio.positions) {
            const currentSignal = currentSignals.find(s => s.symbol === position.ticker);
            const previousSignal = previousSignals[position.ticker];
            
            if (currentSignal && previousSignal) {
                if (this.isSignalStrengthening(previousSignal, currentSignal)) {
                    importantAlerts.push({
                        type: 'IMPORTANT',
                        category: 'SIGNAL_STRENGTHENING',
                        symbol: position.ticker,
                        title: `📈 ${position.ticker} Signal Strengthening`,
                        message: `${position.ticker} signal improving: ${previousSignal.action} → ${currentSignal.decision.action}`,
                        actionRequired: 'MONITOR_FOR_ADDITION',
                        signalChange: {
                            from: { action: previousSignal.action, confidence: previousSignal.confidence },
                            to: { action: currentSignal.decision.action, confidence: currentSignal.decision.confidence }
                        },
                        timestamp: new Date(),
                        urgencyLevel: 'WITHIN_4_HOURS'
                    });
                }
            }
        }
        
        // New WATCH signals in tracked universe
        const newWatchSignals = currentSignals.filter(signal =>
            signal.decision.action === 'WATCH' &&
            signal.universe === 'CORE' && // Focus on core universe
            !previousSignals[signal.symbol] // New signal
        );
        
        for (const watchSignal of newWatchSignals.slice(0, 3)) { // Limit to top 3
            importantAlerts.push({
                type: 'IMPORTANT',
                category: 'NEW_WATCH_SIGNAL',
                symbol: watchSignal.symbol,
                title: `👁️ New WATCH: ${watchSignal.symbol}`,
                message: `${watchSignal.symbol} new WATCH signal in core universe (${watchSignal.decision.grade} grade)`,
                actionRequired: 'ADD_TO_WATCHLIST',
                signalData: watchSignal,
                timestamp: new Date(),
                urgencyLevel: 'WITHIN_4_HOURS'
            });
        }
        
        return importantAlerts;
    }

    /**
     * 🎯 SMART FILTERING - Prevent Alert Fatigue
     */
    applySmartFiltering(alerts, userId) {
        const filtered = [];
        const today = new Date().toDateString();
        
        // Initialize daily count if needed
        if (!this.dailyAlertCount.has(userId)) {
            this.dailyAlertCount.set(userId, { date: today, counts: {} });
        }
        
        const userDailyCount = this.dailyAlertCount.get(userId);
        if (userDailyCount.date !== today) {
            // Reset for new day
            userDailyCount.date = today;
            userDailyCount.counts = {};
        }
        
        for (const alert of alerts) {
            const alertType = alert.type;
            const maxPerDay = this.alertHierarchy[alertType].maxPerDay;
            const currentCount = userDailyCount.counts[alertType] || 0;
            
            // Check daily limits
            if (currentCount >= maxPerDay) {
                console.log(`⚠️ Daily limit reached for ${alertType} alerts (${maxPerDay})`);
                continue;
            }
            
            // Check cooldown for same symbol
            const cooldownKey = `${userId}_${alert.symbol}_${alertType}`;
            const lastAlert = this.alertCooldowns.get(cooldownKey);
            const cooldownPeriod = this.getCooldownPeriod(alertType);
            
            if (lastAlert && (Date.now() - lastAlert) < cooldownPeriod) {
                console.log(`⏱️ Cooldown active for ${alert.symbol} ${alertType} alert`);
                continue;
            }
            
            // Alert passes filters
            filtered.push(alert);
            
            // Update counters
            userDailyCount.counts[alertType] = currentCount + 1;
            this.alertCooldowns.set(cooldownKey, Date.now());
        }
        
        return filtered.sort((a, b) => this.alertHierarchy[a.type].priority - this.alertHierarchy[b.type].priority);
    }

    /**
     * 📱 SEND ALERT TO APPROPRIATE CHANNELS
     */
    async sendAlert(alert) {
        const channels = this.alertHierarchy[alert.type].channels;
        
        console.log(`📢 Sending ${alert.type} alert: ${alert.title}`);
        
        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'push':
                        await this.sendPushNotification(alert);
                        break;
                    case 'sms':
                        await this.sendSMS(alert);
                        break;
                    case 'email':
                        await this.sendEmail(alert);
                        break;
                }
            } catch (error) {
                console.error(`Failed to send ${channel} alert:`, error.message);
            }
        }
        
        // Store alert in database
        await this.storeAlert(alert);
    }

    /**
     * 📊 DAILY DIGEST GENERATION
     */
    async generateDailyDigest(userId, timeOfDay = 'MORNING') {
        const userPortfolio = await this.getUserPortfolio(userId);
        const signals = await this.getCurrentSignals();
        
        if (timeOfDay === 'MORNING') {
            return this.generateMorningBrief(userPortfolio, signals);
        } else {
            return this.generateEveningWrap(userPortfolio, signals);
        }
    }

    async generateMorningBrief(userPortfolio, signals) {
        return {
            type: 'INFO',
            category: 'MORNING_BRIEF',
            title: '🌅 Morning Brief',
            content: {
                marketOutlook: await this.getMarketOutlook(),
                portfolioSummary: this.getPortfolioSummary(userPortfolio),
                todaysOpportunities: this.getTodaysOpportunities(signals),
                keyLevels: this.getKeyLevels(userPortfolio),
                earnings: await this.getTodaysEarnings(userPortfolio)
            },
            timestamp: new Date()
        };
    }

    async generateEveningWrap(userPortfolio, signals) {
        return {
            type: 'INFO',
            category: 'EVENING_WRAP',
            title: '🌆 Evening Wrap',
            content: {
                dailyPerformance: this.getDailyPerformance(userPortfolio),
                signalChanges: this.getSignalChanges(signals),
                tomorrowsCalendar: await this.getTomorrowsCalendar(),
                weekendPreview: this.isWeekend() ? this.getWeekendPreview() : null
            },
            timestamp: new Date()
        };
    }

    // ===== HELPER METHODS =====

    isSignalDegrading(previous, current) {
        const prevRank = this.getSignalRank(previous.action);
        const currRank = this.getSignalRank(current.decision.action);
        return currRank < prevRank || 
               (currRank === prevRank && current.decision.confidence < previous.confidence - 0.1);
    }

    isSignalStrengthening(previous, current) {
        const prevRank = this.getSignalRank(previous.action);
        const currRank = this.getSignalRank(current.decision.action);
        return currRank > prevRank || 
               (currRank === prevRank && current.decision.confidence > previous.confidence + 0.1);
    }

    getSignalRank(action) {
        const ranks = { 'STRONG_BUY': 5, 'BUY': 4, 'WATCH': 3, 'HOLD': 2, 'AVOID': 1, 'SELL': 0 };
        return ranks[action] || 0;
    }

    getCooldownPeriod(alertType) {
        const cooldowns = {
            CRITICAL: 2 * 60 * 60 * 1000,  // 2 hours
            URGENT: 4 * 60 * 60 * 1000,    // 4 hours
            IMPORTANT: 6 * 60 * 60 * 1000, // 6 hours
            INFO: 24 * 60 * 60 * 1000      // 24 hours
        };
        return cooldowns[alertType] || 4 * 60 * 60 * 1000;
    }

    async sendPushNotification(alert) {
        // Implementation for push notifications
        console.log(`📱 Push: ${alert.title}`);
    }

    async sendSMS(alert) {
        // Implementation for SMS via Twilio
        console.log(`💬 SMS: ${alert.title}`);
    }

    async sendEmail(alert) {
        // Implementation for email alerts
        console.log(`📧 Email: ${alert.title}`);
    }

    async storeAlert(alert) {
        // Store alert in database for history
        console.log(`💾 Stored: ${alert.title}`);
    }

    groupAlertsByPriority(alerts) {
        return alerts.reduce((groups, alert) => {
            groups[alert.type] = (groups[alert.type] || 0) + 1;
            return groups;
        }, {});
    }

    calculateRecommendedAllocation(signal, portfolio) {
        const baseAllocation = 0.05; // 5%
        const confidenceMultiplier = signal.decision.confidence;
        const qualityMultiplier = signal.signal_quality === 'INSTITUTIONAL_GRADE' ? 1.5 : 1.0;
        
        return Math.min(baseAllocation * confidenceMultiplier * qualityMultiplier, 0.15); // Max 15%
    }

    generateCapitalReallocationAlerts(signals, portfolio) {
        // Logic to suggest moving capital from weak to strong positions
        return [];
    }

    async generateMarketStructureAlerts(portfolio) {
        // Logic to generate market-wide alerts
        return [];
    }

    async getUserPortfolio(userId) {
        // Mock implementation - get real portfolio data
        return {
            userId,
            positions: [],
            availableCapital: 100000,
            minPositionSize: 5000
        };
    }

    async getCurrentSignals() {
        // Get current signal data
        return [];
    }
}

module.exports = SmartAlertEngine;
