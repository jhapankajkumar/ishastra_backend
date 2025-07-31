const yahoo = require('../yahoo');

// Helper function to fetch current price
const fetchCurrentPrice = async (ticker) => {
  try {
    const price = await yahoo.getCurrentPrice(ticker);
    console.log(`Current price for ${ticker}: ${price}`);
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${ticker}:`, error.message);
    return null;
  }
};


module.exports = { fetchCurrentPrice };