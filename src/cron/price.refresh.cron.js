const { refreshPrices } = require('../services/comom.service');
const cron = require('node-cron');
const moment = require('moment-timezone');

class PriceRefreshCron {
    constructor() {}   

    /**
     * START PRICE REFRESH CRON JOB
     */
    start() {
        console.log('🚨 Starting Price Refresh Cron...');
        // Run every 15 minutes during market hours
        const refreshJob = cron.schedule('*/15 * * * 1-5', async () => {
            await refreshPrices();
        }, {
            timezone: 'Asia/Singapore',
            scheduled: true // <-- Start automatically!
        });

        refreshJob.start();
    }
}


module.exports = PriceRefreshCron; 