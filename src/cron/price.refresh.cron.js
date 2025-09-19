const { refreshPrices } = require('../services/comom.service');
const cron = require('node-cron');
const moment = require('moment-timezone');

class PriceRefreshCron {
    constructor() { }

    /**
     * START PRICE REFRESH CRON JOB
     */
    start() {
        console.log('🚨 Starting Price Refresh Cron...');

        // Run every 15 minutes always Mon–Sat
        const refreshJob = cron.schedule(
            '*/15 * * * 1-6',
            async () => {
                const now = moment().tz('Asia/Singapore');

                const day = now.day(); // Sunday=0 ... Saturday=6
                const hour = now.hour();
                const minute = now.minute();

                // ✅ Conditions:
                // Mon: only from 11:00 onwards
                if (day === 1 && (hour < 11)) return;

                // Sat: only until 09:00
                if (day === 6 && (hour > 9 || (hour === 9 && minute > 0))) return;

                // Tue–Fri: run anytime (covered by schedule)
                await refreshPrices();
            },
            {
                timezone: 'Asia/Singapore',
                scheduled: true,
            }
        );

        refreshJob.start();
    }
}


module.exports = PriceRefreshCron; 