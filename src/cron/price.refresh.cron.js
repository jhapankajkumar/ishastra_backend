const { refreshTradePrices, refreshOtherPrices } = require('../services/comom.service');
const cron = require('node-cron');
const moment = require('moment-timezone');

class PriceRefreshCron {
    constructor() { }

    /**
     * START PRICE REFRESH CRON JOB
     */
    start() {
        console.log('🚨 Starting Price Refresh Cron...');

        // Run every 15 seconds
        const refreshTradeJob = cron.schedule(
            '*/30 * * * * 1-6',
            async () => {
                const now = moment().tz('America/New_York');
                const hour = now.hour();
                const minute = now.minute();

                // const minutes = hour * 60 + minute;
                // const openMin = 4 * 60;          // 04:00
                // const closeMin = 20 * 60;        // 20:00
                // if (minutes < openMin || minutes > closeMin) return;
                await refreshTradePrices();
            },
            {
                timezone: 'America/New_York',
                scheduled: true,
            }
        );

        refreshTradeJob.start();

        // Run every 30 minutes always Mon–Fri
        const refreshInvestmentJob = cron.schedule(
            '*/30 * * * 1-5',
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
                await refreshOtherPrices();
            },
            {
                timezone: 'Asia/Singapore',
                scheduled: true,
            }
        );

        refreshInvestmentJob.start();


    }
}


module.exports = PriceRefreshCron; 