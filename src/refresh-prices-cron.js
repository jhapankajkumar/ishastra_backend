// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');


// Run at midnight every day
cron.schedule('0 0 * * *', () => {
  // Call with dummy req/res
  refreshAllInvestmentPrices({}, { json: (msg) => console.log('[CRON] Price refresh:', msg) });
  refreshAllRecommendationPrices({}, { json: (msg) => console.log('[CRON] Price refresh:', msg) });
});

// Optionally, run once on startup as well
refreshAllInvestmentPrices({}, { json: (msg) => console.log('[STARTUP] Price refresh:', msg) });
refreshAllRecommendationPrices({}, { json: (msg) => console.log('[STARTUP] Price refresh:', msg) });
