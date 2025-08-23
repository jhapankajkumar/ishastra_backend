// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');
const { refreshAllTradePrices } = require('./controllers/trade.controller');

//Fetch all investments and recommendations prices every 15 minutes
cron.schedule('*/15 * * * *', () => {
  setImmediate(() => {
    try {
      refreshAllInvestmentPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (investments):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing investment prices:', err);
    }
  });

  setImmediate(() => {
    try {
      refreshAllRecommendationPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (recommendations):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing recommendation prices:', err);
    }
  });

  setImmediate(() => {
    try {
      refreshAllTradePrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (trades):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing trade prices:', err);
    }
  });
});

// Optionally, run once on startup as well
refreshAllInvestmentPrices({}, { json: (msg) => console.log(`[STARTUP] Price refresh (investments):`, msg) });
refreshAllRecommendationPrices({}, { json: (msg) => console.log(`[STARTUP] Price refresh (recommendations):`, msg) });
refreshAllTradePrices({}, { json: (msg) => console.log(`[STARTUP] Price refresh (trades):`, msg) });
