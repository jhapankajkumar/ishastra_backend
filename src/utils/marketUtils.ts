/**
 * Market and Currency Detection Utilities
 * Determines market and currency based on stock symbol/ticker
 */

export interface MarketInfo {
  market: 'US' | 'IN' | 'CA' | 'UK';
  currency: 'USD' | 'INR' | 'CAD' | 'GBP';
  exchange?: string;
}

export interface CapitalInfo {
  amount: number;
  currency: string;
  market: string;
}

export interface CapitalManager {
  getCapital(currency: string): Promise<CapitalInfo>;
}

/**
 * Determine market and currency based on stock symbol
 * @param symbol - Stock ticker symbol
 * @returns Market information object
 */
export function getMarketInfo(symbol: string): MarketInfo {
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
 * @param symbol - Stock symbol to determine market
 * @param capitalManager - Capital manager instance
 * @returns Capital information with currency
 */
export async function getMarketCapital(symbol: string, capitalManager: CapitalManager): Promise<CapitalInfo> {
  const { market, currency } = getMarketInfo(symbol);
  
  try {
    const capital = await capitalManager.getCapital(currency);
    return {
      ...capital,
      market
    };
  } catch (error) {
    console.error('Error getting market capital:', error);
    
    // Return default capital structure
    return {
      amount: 0,
      currency,
      market
    };
  }
}

/**
 * Format currency amount based on currency type
 * @param amount - Amount to format
 * @param currency - Currency code (USD, INR, etc.)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
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
 * @param symbol - Stock symbol
 * @returns True if Indian market stock
 */
export function isIndianMarket(symbol: string): boolean {
  const { market } = getMarketInfo(symbol);
  return market === 'IN';
}

/**
 * Check if symbol belongs to US market
 * @param symbol - Stock symbol
 * @returns True if US market stock
 */
export function isUSMarket(symbol: string): boolean {
  const { market } = getMarketInfo(symbol);
  return market === 'US';
}

// CommonJS compatibility
module.exports = {
  getMarketInfo,
  getMarketCapital,
  formatCurrency,
  isIndianMarket,
  isUSMarket
};
