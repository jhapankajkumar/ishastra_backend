// Cron job to refresh all investment prices at midnight
const cron = require('node-cron');
const { refreshAllInvestmentPrices } = require('./controllers/investment.controller');
const { refreshAllRecommendationPrices } = require('./controllers/recommendation.controller');

//Fetch all investments and recommendations prices every 15 minutes
cron.schedule('*/15 * * * *', () => {
  refreshAllInvestmentPrices({}, {
      json: (msg) => console.log(`[CRON ${now.toLocaleTimeString()}] Price refresh (investments):`, msg)
    });
    refreshAllRecommendationPrices({}, {
      json: (msg) => console.log(`[CRON ${now.toLocaleTimeString()}] Price refresh (recommendations):`, msg)
    });
});

// Optionally, run once on startup as well
refreshAllInvestmentPrices({}, { json: (msg) => console.log(`[STARTUP] Price refresh (investments):`, msg) });
refreshAllRecommendationPrices({}, { json: (msg) => console.log(`[STARTUP] Price refresh (recommendations):`, msg) });
