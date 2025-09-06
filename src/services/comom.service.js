const yahoo = require('../yahoo');
// Helper function to fetch current price
const fetchCurrentPrice = async (ticker) => {
  try {
    const price = await yahoo.getCurrentPrice(ticker);
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${ticker}:`, error.message);
    return null;
  }
};

/**
     * GET CURRENT ANALYSIS FOR STOCK
*/
const getTickerAnalysis = async (symbol) => {
    try {
        const response = await fetch(`http://localhost:8000/api/trading/signal-analysis?symbols=${symbol}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.results?.[0];
    } catch (error) {
        console.error(`❌ Error fetching current analysis for ${symbol}:`, error.message);
        return null;
    }
};


module.exports = { fetchCurrentPrice, getTickerAnalysis };