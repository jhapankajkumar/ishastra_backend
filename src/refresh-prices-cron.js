// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');
const { refreshAllTradePrices } = require('./controllers/trade.controller');

console.log('📈 Setting up price refresh cron jobs...');

//Fetch all investments and recommendations prices every 15 minutes
cron.schedule('*/15 * * * *', () => {
  setImmediate(() => {
    try {
      refreshAllInvestmentPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (investments):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing investment prices:', err.message);
    }
  });

  setImmediate(() => {
    try {
      refreshAllRecommendationPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (recommendations):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing recommendation prices:', err.message);
    }
  });

  setImmediate(() => {
    try {
      refreshAllTradePrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (trades):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing trade prices:', err.message);
    }
  });
});

console.log('✅ Price refresh cron jobs scheduled successfully');

// Run once on startup (with error handling to prevent server crash)
setTimeout(() => {
  try {
    console.log('🔄 Running startup price refresh...');
    refreshAllInvestmentPrices({}, { 
      json: (msg) => console.log(`[STARTUP] Price refresh (investments):`, msg?.message || 'completed') 
    });
  } catch (err) {
    console.error('[STARTUP] Error refreshing investment prices:', err.message);
  }
}, 5000); // Delay 5 seconds to let server fully start
