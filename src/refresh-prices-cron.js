// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');
const { refreshAllTradePrices } = require('./controllers/trade.controller');

console.log('📈 Setting up price refresh cron jobs...');

//Fetch all investments and recommendations prices every 15 minutes
// Every 15 min from 11:30–11:59 Mon–Fri
cron.schedule('30-59/15 11 * * 1-5', runPriceRefresh, { timezone: "Asia/Singapore" });

// Every 15 min from 12:00–17:59 Mon–Fri
cron.schedule('*/15 12-17 * * 1-5', runPriceRefresh, { timezone: "Asia/Singapore" });

// Every 15 min from 18:00–18:30 Mon–Fri
cron.schedule('0-30/15 18 * * 1-5', runPriceRefresh, { timezone: "Asia/Singapore" });

function runPriceRefresh() {
  setImmediate(() => {
    try {
      refreshAllInvestmentPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (investments):`, msg)
      });
      refreshAllRecommendationPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (recommendations):`, msg)
      });
      refreshAllTradePrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (trades):`, msg)
      });
    } catch (err) {
      console.error('[CRON] Error refreshing prices:', err.message);
    }
  });
}

console.log('✅ Price refresh cron jobs scheduled successfully');

// Run once on startup (with error handling to prevent server crash)
setTimeout(() => {
  try {
    // console.log('🔄 Running startup price refresh...');
    // refreshAllInvestmentPrices({}, { 
    //   json: (msg) => console.log(`[STARTUP] Price refresh (investments):`, msg?.message || 'completed') 
    // });
  } catch (err) {
    console.error('[STARTUP] Error refreshing investment prices:', err.message);
  }
}, 5000); // Delay 5 seconds to let server fully start
