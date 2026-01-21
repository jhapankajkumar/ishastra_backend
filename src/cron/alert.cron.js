/**
 * 🚨 ALERT CRON - CLEAN & SIMPLE
 * 
 * Handles Entry Trigger Alerts and Position Alerts
 * Runs during trading hours and sends email notifications
 * 
 * SCHEDULE: Every 15 minutes during market hours
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const WatchlistTriggerService = require('../services/watchlist.trigger.service');
const AlertService = require('../services/alert.service');
const { getTickerAnalysis } = require('../services/comom.service');
const { PrismaClient } = require('@prisma/client');
const EmailAlertService = require('../services/email.service');

const prisma = new PrismaClient();

class AlertCron {
    constructor() {
        this.watchlistTriggerService = new WatchlistTriggerService();
        this.alertService = new AlertService();
        this.isRunning = false;
        this.emailAlertService = new EmailAlertService();
    }

    /**
     * START ALERT MONITORING
     */
    start() {
        console.log('🚨 Starting Alert Cron...');

        const alertJob = cron.schedule(
            '*/30 * * * 1-6',  // every 30 min, Mon–Sat
            async () => {
                const now = moment().tz('Asia/Singapore');
                const day = now.day(); // Sunday=0, Monday=1 ... Saturday=6
                const hour = now.hour();
                const minute = now.minute();

                // Monday: skip before 11:00
                if (day === 1 && hour < 11) return;

                // Saturday: skip after 09:00
                if (day === 6 && (hour > 9 || (hour === 9 && minute > 0))) return;

                // Otherwise run the job
                await this.runAlertCheck();
            },
            {
                timezone: 'Asia/Singapore',
                scheduled: true
            }
        );

        alertJob.start();
    }

    /**
     * RUN ALERT CHECK WITH TIME VALIDATION
     */
    async runAlertCheck() {
        if (this.isRunning) {
            console.log('⏳ Alert check already running, skipping...');
            return;
        }

        try {
            this.isRunning = true;

            const now = moment().tz('Asia/Singapore');
            const currentHour = now.hour();
            const currentMinute = now.minute();

            // Skip weekends
            // if (now.day() === 0 || now.day() === 6) {
            //     console.log('📅 Weekend - skipping alert check');
            //     return;
            // }

            console.log(`🔍 Alert check started at ${now.format('YYYY-MM-DD HH:mm')} SGT`);
            await this.checkPositionAlerts();
            // await this.checkWatchlistTriggers();

            console.log('✅ Alert check completed');

        } catch (error) {
            console.error('❌ Alert cron error:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * CHECK WATCHLIST ENTRY TRIGGERS AND SEND EMAILS
     */
    async checkWatchlistTriggers() {
        console.log('📊 Checking watchlist entry triggers...');

        // Get triggered stocks (no emails sent yet)
        const watchlistResult = await this.watchlistTriggerService.getBuyWatchList();
        const alerts = [];
        if (watchlistResult && watchlistResult.length > 0) {
            // Send individual emails for each triggered stock
            for (const stock of watchlistResult) {
                try {
                    const { triggers, currentAnalysis } = await this.watchlistTriggerService.getUpdatedTriggers(stock, true);
                    // Ensure triggers is always an array
                    const safeTriggers = Array.isArray(triggers) ? triggers : [];
                    // Get stock data and current analysis for email
                    if (currentAnalysis && safeTriggers.length > 0) {
                        stock.currentPrice = currentAnalysis.currentPrice;
                        const alert = await this.watchlistTriggerService.getEntryTriggerAlert(stock, safeTriggers);
                        alerts.push(alert);
                    }
                } catch (emailError) {
                    console.error(`❌ Failed to send email for ${stock.symbol}:`, emailError.message);
                }
            }
            if (alerts.length > 0) {
                const batchAlert = {
                    symbol: "MULTIPLE",
                    type: "BATCHED_ALERTS",
                    message: "Enhanced trading alerts with detailed trigger analysis",
                    priority: "MEDIUM",
                    timestamp: new Date(),
                    batchedAlerts: alerts
                };
                await this.alertService.emailService.sendAlert(batchAlert);
            }
        } else {
            console.log('📋 No entry triggers found');
        }
    }

    /**
     * CHECK POSITION ALERTS AND SEND EMAILS
     */
    async checkPositionAlerts() {
        console.log('📊 Checking position alerts...');

        // Get position alerts (no emails sent yet)
        const positionResult = await this.alertService.checkPositionAlerts();

        if (positionResult.alerts && positionResult.alerts.length > 0) {
            console.log(`📧 Processing ${positionResult.alerts.length} position alerts for emails`);

            // Send individual emails for each position alert
            for (const alert of positionResult.alerts) {
                try {
                    // Format position alert for email service
                    const alertData = {
                        type: 'POSITION_ALERT',
                        priority: alert.priority || 'HIGH',
                        symbol: alert.ticker,
                        currentPrice: alert.trade?.currentPrice,
                        action: alert.action,
                        message: alert.message,
                        timestamp: new Date()
                    };

                    await this.alertService.emailService.sendAlert(alertData);
                    console.log(`📧 Position alert email sent for ${alert.ticker}`);
                } catch (emailError) {
                    console.error(`❌ Failed to send position email for ${alert.ticker}:`, emailError.message);
                }
            }
        } else {
            console.log('📋 No position alerts found');
        }
    }

    /**
     * Helper: Get stock data from symbol
     */
    async getStockFromSymbol(symbol) {
        try {
            return await prisma.watchlistStock.findFirst({
                where: { symbol }
            });
        } catch (error) {
            console.error(`❌ Error fetching stock ${symbol}:`, error.message);
            return null;
        }
    }

    /**
     * Check if within watchlist monitoring time (9:30 AM - 4:00 PM SGT)
     */
    isWatchlistTime(hour, minute) {
        const isAfter930 = hour > 9 || (hour === 9 && minute >= 30);
        const isBefore1600 = hour < 16;
        return isAfter930 && isBefore1600;
    }

    /**
     * Check if within position monitoring time (11:30 AM - 6:30 PM SGT)
     */
    isPositionTime(hour, minute) {
        const isAfter1130 = hour > 11 || (hour === 11 && minute >= 30);
        const isBefore1830 = hour < 18 || (hour === 18 && minute <= 30);
        return isAfter1130 && isBefore1830;
    }

    /**
     * Manual trigger for testing
     */
    async triggerManual() {
        console.log('🔧 Manual alert check triggered');
        await this.runAlertCheck();
    }

    /**
     * Stop the cron job
     */
    stop() {
        console.log('🛑 Stopping Alert Cron');
    }
}

module.exports = AlertCron;
