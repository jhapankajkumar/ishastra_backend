const prisma = require('../db');

/**
 * Capital Management Utility for USD and INR currencies.
 * Every method now takes `userId` first — Capital rows are keyed by
 * (userId, currency), not currency alone, since multi-tenancy means two
 * different users can each hold their own USD capital record.
 */
class CapitalManager {

  /**
   * Get current capital information for a specific user + currency
   * @param {number} userId
   * @param {string} currency - 'USD' or 'INR'
   * @returns {Promise<Object|null>} Capital object or null if not found
   */
  static async getCapital(userId, currency) {
    try {
      const capital = await prisma.capital.findUnique({
        where: { userId_currency: { userId, currency: currency.toUpperCase() } }
      });
      return capital;
    } catch (error) {
      console.error(`Error fetching capital for user ${userId} / ${currency}:`, error);
      throw new Error(`Failed to fetch capital for ${currency}`);
    }
  }

  /**
   * Get capital information for all currencies belonging to a user
   * @param {number} userId
   * @returns {Promise<Array>} Array of capital objects
   */
  static async getAllCapital(userId) {
    try {
      const capitals = await prisma.capital.findMany({
        where: { userId },
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
   * @param {number} userId
   * @param {string} currency - 'USD' or 'INR'
   * @param {number} amount - Amount to allocate
   * @returns {Promise<Object>} Updated capital object
   */
  static async allocateCapital(userId, currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      if (currentCapital.remaining < amount) {
        throw new Error(
          `Insufficient capital. Available: ${currentCapital.remaining} ${upperCurrency}, Required: ${amount} ${upperCurrency}`
        );
      }

      // IMPORTANT:
      // amount must be ONLY position cost (price * quantity)
      // commissions must NEVER be passed here

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          remaining: currentCapital.remaining - amount,
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error allocating capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Release capital when closing a trade or investment
   */
  static async releaseCapital(userId, currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      // IMPORTANT:
      // amount must be ONLY the original allocated cost basis
      // NEVER pass exit proceeds or net-of-commission values here

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          remaining: currentCapital.remaining + amount,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Released ${amount} ${upperCurrency}. Remaining: ${updatedCapital.remaining} ${upperCurrency}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error releasing capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Deduct commission as an expense
   */
  static async deductCommission(userId, currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!amount || amount <= 0) return;

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          total: currentCapital.total - amount,
          remaining: currentCapital.remaining - amount,
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error deducting commission for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Add new capital without changing allocated funds
   */
  static async addCapital(userId, currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          total: currentCapital.total + amount,
          remaining: currentCapital.remaining + amount,
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error adding capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Remove capital ensuring allocated funds remain untouched
   */
  static async removeCapital(userId, currency, amount) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      if (amount > currentCapital.remaining) {
        throw new Error(
          `Cannot remove more than available remaining capital. Available: ${currentCapital.remaining} ${upperCurrency}`
        );
      }

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          total: currentCapital.total - amount,
          remaining: currentCapital.remaining - amount,
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error removing capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Update total capital for a currency
   */
  static async updateTotalCapital(userId, currency, newTotal) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!newTotal || newTotal <= 0) {
        throw new Error('New total must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      const allocated = currentCapital.total - currentCapital.remaining;
      const newRemaining = Math.max(0, newTotal - allocated);

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          total: newTotal,
          remaining: newRemaining,
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error updating total capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Get portfolio-equity style view for a currency
   * Equity here excludes trade PnL, which must be added separately
   */
  static async getCapitalView(userId, currency) {
    const cap = await this.getCapital(userId, currency);
    if (!cap) return null;

    const allocated = cap.total - cap.remaining;

    return {
      currency: cap.currency,
      principal: cap.total,
      idle: cap.remaining,
      underTrade: allocated
    };
  }

  /**
   * Get capital utilization summary for a user
   */
  static async getCapitalSummary(userId) {
    try {
      const capitals = await this.getAllCapital(userId);

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
   */
  static async hasSufficientCapital(userId, currency, amount) {
    try {
      const capital = await this.getCapital(userId, currency);
      if (!capital) return false;

      return capital.remaining >= amount;
    } catch (error) {
      console.error(`Error checking capital sufficiency for ${currency}:`, error);
      return false;
    }
  }

  /**
   * Reset total capital for a currency (admin function)
   */
  static async resetCapital(userId, currency, newTotal, adjustRemaining = false) {
    try {
      const upperCurrency = currency.toUpperCase();

      if (!newTotal || newTotal <= 0) {
        throw new Error('New total must be greater than 0');
      }

      const currentCapital = await this.getCapital(userId, upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      let newRemaining = newTotal;

      if (adjustRemaining && currentCapital.total > 0) {
        const usedRatio = (currentCapital.total - currentCapital.remaining) / currentCapital.total;
        newRemaining = newTotal * (1 - usedRatio);
      }

      console.log(`🔄 Resetting ${upperCurrency} capital. New Total: ${newTotal}, Adjust Remaining: ${adjustRemaining}, New Remaining: ${newRemaining}`);

      const updatedCapital = await prisma.capital.update({
        where: { userId_currency: { userId, currency: upperCurrency } },
        data: {
          total: newTotal,
          remaining: Math.max(0, newRemaining),
          updatedAt: new Date()
        }
      });

      return updatedCapital;
    } catch (error) {
      console.error(`Error resetting capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Calculate trade amount for capital allocation
   */
  static calculateTradeAmount(price, quantity) {
    if (!price || !quantity || price <= 0 || quantity <= 0) {
      throw new Error('Price and quantity must be greater than 0');
    }
    return parseFloat((price * quantity).toFixed(2));
  }

  /**
   * Initialize capital records for a user if they don't exist
   * @param {number} userId
   * @param {Array} initialCapitals - Array of {currency, total} objects
   */
  static async initializeCapital(userId, initialCapitals = []) {
    try {
      const defaultCapitals = initialCapitals.length > 0 ? initialCapitals : [
        { currency: 'USD', total: 20000 },
        { currency: 'INR', total: 2000000 }
      ];

      for (const capitalData of defaultCapitals) {
        const existing = await this.getCapital(userId, capitalData.currency);

        if (!existing) {
          await prisma.capital.create({
            data: {
              userId,
              currency: capitalData.currency.toUpperCase(),
              total: capitalData.total,
              remaining: capitalData.total
            }
          });
        } else {
          await prisma.capital.update({
            where: { userId_currency: { userId, currency: capitalData.currency.toUpperCase() } },
            data: {
              total: capitalData.total,
              remaining: capitalData.total
            }
          });
        }
      }
    } catch (error) {
      console.error('Error initializing capital:', error);
      throw error;
    }
  }
}

module.exports = CapitalManager;
