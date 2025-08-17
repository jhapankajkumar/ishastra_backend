const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Capital Management Utility for USD and INR currencies
 * Handles allocation and release of capital for trades and investments
 */
class CapitalManager {
  
  /**
   * Get current capital information for a specific currency
   * @param {string} currency - 'USD' or 'INR'
   * @returns {Object|null} Capital object or null if not found
   */
  static async getCapital(currency) {
    try {
      const capital = await prisma.capital.findUnique({
        where: { currency: currency.toUpperCase() }
      });
      return capital;
    } catch (error) {
      console.error(`Error fetching capital for ${currency}:`, error);
      throw new Error(`Failed to fetch capital for ${currency}`);
    }
  }

  /**
   * Get capital information for all currencies
   * @returns {Array} Array of capital objects
   */
  static async getAllCapital() {
    try {
      const capitals = await prisma.capital.findMany({
        orderBy: { currency: 'asc' }
      });
      return capitals;
    } catch (error) {
      console.error('Error fetching all capital:', error);
      throw new Error('Failed to fetch capital information');
    }
  }

  /**
   * Allocate capital when opening a trade or investment
   * @param {string} currency - 'USD' or 'INR'
   * @param {number} amount - Amount to allocate
   * @returns {Object} Updated capital object
   */
  static async allocateCapital(currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();
      
      // Validate input
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get current capital
      const currentCapital = await this.getCapital(upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      // Check if sufficient capital is available
      if (currentCapital.remaining < amount) {
        throw new Error(
          `Insufficient capital. Available: ${currentCapital.remaining} ${upperCurrency}, Required: ${amount} ${upperCurrency}`
        );
      }

      // Update capital atomically
      const updatedCapital = await prisma.capital.update({
        where: { currency: upperCurrency },
        data: { 
          remaining: currentCapital.remaining - amount,
          updatedAt: new Date()
        }
      });

      //console.log(`✅ Allocated ${amount} ${upperCurrency}. Remaining: ${updatedCapital.remaining} ${upperCurrency}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error allocating capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Release capital when closing a trade or investment
   * @param {string} currency - 'USD' or 'INR'
   * @param {number} amount - Amount to release
   * @returns {Object} Updated capital object
   */
  static async releaseCapital(currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();
      
      // Validate input
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Get current capital
      const currentCapital = await this.getCapital(upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      // Update capital atomically
      const updatedCapital = await prisma.capital.update({
        where: { currency: upperCurrency },
        data: { 
          remaining: currentCapital.remaining + amount,
          updatedAt: new Date()
        }
      });

      // Ensure remaining doesn't exceed total (safety check)
      if (updatedCapital.remaining > updatedCapital.total) {
        console.warn(`⚠️  Warning: Remaining capital (${updatedCapital.remaining}) exceeds total (${updatedCapital.total}) for ${upperCurrency}`);
        
        // Correct the remaining to match total
        const correctedCapital = await prisma.capital.update({
          where: { currency: upperCurrency },
          data: { remaining: updatedCapital.total }
        });
        
        //console.log(`✅ Corrected remaining capital to ${correctedCapital.total} ${upperCurrency}`);
        return correctedCapital;
      }

      //console.log(`✅ Released ${amount} ${upperCurrency}. Remaining: ${updatedCapital.remaining} ${upperCurrency}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error releasing capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Reset total capital for a currency (admin function)
   * @param {string} currency - 'USD' or 'INR'
   * @param {number} newTotal - New total amount
   * @param {boolean} adjustRemaining - Whether to adjust remaining proportionally
   * @returns {Object} Updated capital object
   */
  static async resetCapital(currency, newTotal, adjustRemaining = false) {
    try {
      const upperCurrency = currency.toUpperCase();
      
      // Validate input
      if (!newTotal || newTotal <= 0) {
        throw new Error('New total must be greater than 0');
      }

      // Get current capital
      const currentCapital = await this.getCapital(upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      let newRemaining = newTotal; // Default: all capital is available

      if (adjustRemaining && currentCapital.total > 0) {
        // Maintain the same ratio of used capital
        const usedRatio = (currentCapital.total - currentCapital.remaining) / currentCapital.total;
        newRemaining = newTotal * (1 - usedRatio);
      }

      console.log(`🔄 Resetting ${upperCurrency} capital. New Total: ${newTotal}, Adjust Remaining: ${adjustRemaining}, New Remaining: ${newRemaining}`);
      // Update capital
      const updatedCapital = await prisma.capital.update({
        where: { currency: upperCurrency },
        data: { 
          total: newTotal,
          remaining: Math.max(0, newRemaining), // Ensure remaining is not negative
          updatedAt: new Date()
        }
      });

      //console.log(`✅ Reset capital for ${upperCurrency}. Total: ${updatedCapital.total}, Remaining: ${updatedCapital.remaining}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error resetting capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Calculate trade amount for capital allocation
   * @param {number} price - Price per share/unit
   * @param {number} quantity - Number of shares/units
   * @returns {number} Total trade amount
   */
  static calculateTradeAmount(price, quantity) {
    if (!price || !quantity || price <= 0 || quantity <= 0) {
      throw new Error('Price and quantity must be greater than 0');
    }
    return parseFloat((price * quantity).toFixed(2));
  }

  /**
   * Get capital utilization summary
   * @returns {Object} Summary of capital usage across all currencies
   */
  static async getCapitalSummary() {
    try {
      const capitals = await this.getAllCapital();
      
      const summary = capitals.map(capital => {
        const allocated = capital.total - capital.remaining;
        const utilizationRate = capital.total > 0 ? (allocated / capital.total) * 100 : 0;
        
        return {
          currency: capital.currency,
          total: capital.total,
          remaining: capital.remaining,
          allocated: allocated,
          utilizationRate: parseFloat(utilizationRate.toFixed(2)),
          updatedAt: capital.updatedAt
        };
      });

      return {
        success: true,
        data: summary,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating capital summary:', error);
      throw error;
    }
  }

  /**
   * Check if sufficient capital is available for a trade
   * @param {string} currency - 'USD' or 'INR'
   * @param {number} amount - Required amount
   * @returns {boolean} True if sufficient capital is available
   */
  static async hasSufficientCapital(currency, amount) {
    try {
      const capital = await this.getCapital(currency);
      if (!capital) return false;
      
      return capital.remaining >= amount;
    } catch (error) {
      console.error(`Error checking capital sufficiency for ${currency}:`, error);
      return false;
    }
  }

  /**
   * Initialize capital records if they don't exist
   * @param {Array} initialCapitals - Array of {currency, total} objects
   */
  static async initializeCapital(initialCapitals = []) {
    try {
      const defaultCapitals = initialCapitals.length > 0 ? initialCapitals : [
        { currency: 'USD', total: 20000 },
        { currency: 'INR', total: 2000000 }
      ];

      for (const capitalData of defaultCapitals) {
        const existing = await this.getCapital(capitalData.currency);
        
        if (!existing) {
          await prisma.capital.create({
            data: {
              currency: capitalData.currency.toUpperCase(),
              total: capitalData.total,
              remaining: capitalData.total
            }
          });
          //console.log(`✅ Initialized ${capitalData.currency} capital with ${capitalData.total}`);
        } else {
          //console.log(`ℹ️  ${capitalData.currency} capital already exists`);
        }
      }
    } catch (error) {
      console.error('Error initializing capital:', error);
      throw error;
    }
  }
}

module.exports = CapitalManager;
