/**
 * Market and Currency Detection Utilities
 * Determines market and currency based on stock symbol/ticker
 */

/**
 * Determine market and currency based on stock symbol
 * @param {string} symbol - Stock ticker symbol
 * @returns {Object} - { market, currency, exchange }
 */
function getMarketInfo(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    return { market: 'US', currency: 'USD'}; // Default fallback
  }

  const upperSymbol = symbol.toUpperCase();

  // Indian market detection
  if (upperSymbol.includes('.NS') || upperSymbol.includes('.NSE')) {
    return { market: 'IN', currency: 'INR' };
  }
  
  if (upperSymbol.includes('.BO') || upperSymbol.includes('.BSE')) {
    return { market: 'IN', currency: 'INR' };
  }

  // Add more markets as needed in the future
  // if (upperSymbol.includes('.TO')) {
  //   return { market: 'CA', currency: 'CAD', exchange: 'TSX' };
  // }
  
  // if (upperSymbol.includes('.L')) {
  //   return { market: 'UK', currency: 'GBP', exchange: 'LSE' };
  // }

  // Default to US market
  return { market: 'US', currency: 'USD'};
}

/**
 * Get appropriate capital based on market
 * @param {string} symbol - Stock symbol to determine market
 * @param {Object} capitalManager - Capital manager instance
 * @returns {Promise<Object>} - Capital information with currency
 */
async function getMarketCapital(symbol, capitalManager) {
  const { market, currency } = getMarketInfo(symbol);
  
  try {
    const capital = await capitalManager.getCapital(currency);
    
    if (capital && capital.remaining > 0) {
      return {
        ...capital,
        currency,
        market,
        success: true
      };
    } else {
      // Fallback defaults based on market
      const fallbackAmounts = {
        'USD': 20000,  // $20k for US market
        'INR': 2000000  // ₹20L for Indian market (roughly equivalent)
      };

      return {
        total: fallbackAmounts[currency],
        remaining: fallbackAmounts[currency],
        allocated: 0,
        currency,
        market,
        success: false,
        fallback: true
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching ${currency} capital for ${symbol}:`, error.message);
    
    // Fallback defaults
    const fallbackAmounts = {
      'USD': 20000,
      'INR': 2000000
    };

    return {
      total: fallbackAmounts[currency],
      remaining: fallbackAmounts[currency],
      allocated: 0,
      currency,
      market,
      success: false,
      fallback: true,
      error: error.message
    };
  }
}

/**
 * Format currency amount with appropriate symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, INR, etc.)
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, currency) {
  const currencySymbols = {
    'USD': '$',
    'INR': '₹',
    'CAD': 'C$',
    'GBP': '£'
  };

  const symbol = currencySymbols[currency] || currency;
  
  if (currency === 'INR') {
    // Indian number formatting (lakhs and crores)
    if (amount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(1)}L`;
    } else {
      return `${symbol}${amount.toLocaleString('en-IN')}`;
    }
  } else {
    // Standard formatting for other currencies
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Check if symbol belongs to Indian market
 * @param {string} symbol - Stock symbol
 * @returns {boolean} - True if Indian market stock
 */
function isIndianMarket(symbol) {
  const { market } = getMarketInfo(symbol);
  return market === 'IN';
}

/**
 * Check if symbol belongs to US market
 * @param {string} symbol - Stock symbol
 * @returns {boolean} - True if US market stock
 */
function isUSMarket(symbol) {
  const { market } = getMarketInfo(symbol);
  return market === 'US';
}

module.exports = {
  getMarketInfo,
  getMarketCapital,
  formatCurrency,
  isIndianMarket,
  isUSMarket
};
