// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');
const { refreshAllTradePrices } = require('./controllers/trade.controller');
const WatchlistController = require('./controllers/watchlist.controller');
const controller = new WatchlistController();

console.log('📈 Setting up price refresh cron jobs...');

//Fetch all investments and recommendations prices every 15 minutes
cron.schedule('*/15 * * * 1-5', runPriceRefresh, { timezone: "Asia/Singapore" });

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
      controller.refreshAllWatchlistPrices({}, {
        json: (msg) => console.log(`[CRON] Price refresh (watchlist):`, msg)
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
    console.log('🔄 Running startup price refresh...');
    refreshAllInvestmentPrices({}, {
      json: (msg) => console.log(`[STARTUP] Price refresh (investments):`, msg?.message || 'completed')
    });
    refreshAllTradePrices({}, {
      json: (msg) => console.log(`[STARTUP] Price refresh (trades):`, msg?.message || 'completed')
    });

    controller.refreshAllWatchlistPrices({}, {
      json: (msg) => console.log(`[STARTUP] Price refresh (watchlist):`, msg?.message || 'completed')
    });
  } catch (err) {
    console.error('[STARTUP] Error refreshing investment prices:', err.message);
  }
}, 5000); // Delay 5 seconds to let server fully start

