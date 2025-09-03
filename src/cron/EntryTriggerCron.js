/**
 * 🎯 ENTRY TRIGGER MONITORING CRON
 * 
 * RUNS: Every 15 minutes during Singapore trading hours (9:30 AM - 4:00 PM)
 * PURPOSE: Monitor watchlist BUY signals for entry trigger conditions
 * ALERTS: Email notifications when entry conditions are met
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const EntryTriggerService = require('../services/EntryTriggerService');

class EntryTriggerCron {
    constructor() {
        this.entryTriggerService = new EntryTriggerService();
        this.isRunning = false;
    }

    /**
     * START ENTRY TRIGGER MONITORING CRON
     * Runs every 15 minutes during market hours
     */
    start() {
        // Run every 15 minutes: */15 * * * *
        const cronExpression = '*/15 * * * *';
        
        cron.schedule(cronExpression, async () => {
            await this.runEntryTriggerCheck();
        }, {
            timezone: 'Asia/Singapore'
        });

        console.log('🔔 Entry Trigger Monitoring Cron started (every 15 minutes during market hours)');
    }

    /**
     * RUN ENTRY TRIGGER CHECK WITH TIME VALIDATION
     */
    async runEntryTriggerCheck() {
        try {
            // Check if within Singapore trading hours (9:30 AM - 4:00 PM)
            const now = moment().tz('Asia/Singapore');
            const currentHour = now.hour();
            const currentMinute = now.minute();
            
            // Market hours: 9:30 AM to 4:00 PM Singapore time
            const isMarketHours = (
                (currentHour > 9 || (currentHour === 9 && currentMinute >= 30)) &&
                currentHour < 16
            );

            // Skip on weekends
            const isWeekend = now.day() === 0 || now.day() === 6;

            if (isWeekend) {
                console.log('📅 Weekend - skipping entry trigger check');
                return;
            }

            if (!isMarketHours) {
                console.log(`⏰ Outside market hours (${now.format('HH:mm')} SGT) - skipping entry trigger check`);
                return;
            }

            if (this.isRunning) {
                console.log('⚠️ Entry trigger check already running - skipping');
                return;
            }

            this.isRunning = true;
            console.log(`🔍 Entry trigger check started at ${now.format('YYYY-MM-DD HH:mm')} SGT`);

            await this.entryTriggerService.checkEntryTriggers();

        } catch (error) {
            console.error('❌ Entry trigger cron error:', error.message);
        } finally {
            this.isRunning = false;
        }
    }
}

module.exports = EntryTriggerCron;
