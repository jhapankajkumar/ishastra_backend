import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Capital {
  id?: string;
  currency: string;
  total: number;
  remaining: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CapitalSummaryItem {
  currency: string;
  total: number;
  remaining: number;
  allocated: number;
  utilizationRate: number;
  updatedAt?: Date;
}

export interface CapitalSummaryResponse {
  success: boolean;
  data: CapitalSummaryItem[];
  timestamp: Date;
}

export interface InitialCapital {
  currency: string;
  total: number;
}

/**
 * Capital Management Utility for USD and INR currencies
 * Handles allocation and release of capital for trades and investments
 */
export class CapitalManager {
  
  /**
   * Get current capital information for a specific currency
   * @param currency - 'USD' or 'INR'
   * @returns Capital object or null if not found
   */
  static async getCapital(currency: string): Promise<Capital | null> {
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
   * @returns Array of capital objects
   */
  static async getAllCapital(): Promise<Capital[]> {
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
   * @param currency - 'USD' or 'INR'
   * @param amount - Amount to allocate
   * @returns Updated capital object
   */
  static async allocateCapital(currency: string, amount: number): Promise<Capital> {
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
   * @param currency - 'USD' or 'INR'
   * @param amount - Amount to release
   * @returns Updated capital object
   */
  static async releaseCapital(currency: string, amount: number): Promise<Capital> {
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

      //console.log(`✅ Released ${amount} ${upperCurrency}. Remaining: ${updatedCapital.remaining} ${upperCurrency}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error releasing capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Update total capital for a currency
   * @param currency - 'USD' or 'INR'
   * @param newTotal - New total amount
   * @returns Updated capital object
   */
  static async updateTotalCapital(currency: string, newTotal: number): Promise<Capital> {
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

      // Calculate new remaining amount (proportional to change in total)
      const allocated = currentCapital.total - currentCapital.remaining;
      const newRemaining = Math.max(0, newTotal - allocated);

      // Update capital
      const updatedCapital = await prisma.capital.update({
        where: { currency: upperCurrency },
        data: { 
          total: newTotal,
          remaining: newRemaining,
          updatedAt: new Date()
        }
      });

      //console.log(`✅ Updated ${upperCurrency} total capital to ${newTotal}. Remaining: ${updatedCapital.remaining}`);
      return updatedCapital;
    } catch (error) {
      console.error(`Error updating total capital for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Get capital utilization summary
   * @returns Summary of capital usage across all currencies
   */
  static async getCapitalSummary(): Promise<CapitalSummaryResponse> {
    try {
      const capitals = await this.getAllCapital();
      
      const summary: CapitalSummaryItem[] = capitals.map(capital => {
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
   * @param currency - 'USD' or 'INR'
   * @param amount - Required amount
   * @returns True if sufficient capital is available
   */
  static async hasSufficientCapital(currency: string, amount: number): Promise<boolean> {
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
   * Reset total capital for a currency (admin function)
   * @param currency - 'USD' or 'INR'
   * @param newTotal - New total amount
   * @param adjustRemaining - Whether to adjust remaining proportionally
   * @returns Updated capital object
   */
  static async resetCapital(
    currency: string, 
    newTotal: number, 
    adjustRemaining: boolean = false
  ): Promise<Capital> {
    try {
      const upperCurrency: string = currency.toUpperCase();
      
      // Validate input
      if (!newTotal || newTotal <= 0) {
        throw new Error('New total must be greater than 0');
      }

      // Get current capital
      const currentCapital: Capital | null = await this.getCapital(upperCurrency);
      if (!currentCapital) {
        throw new Error(`Capital record not found for currency: ${upperCurrency}`);
      }

      let newRemaining: number = newTotal; // Default: all capital is available

      if (adjustRemaining && currentCapital.total > 0) {
        // Maintain the same ratio of used capital
        const usedRatio: number = (currentCapital.total - currentCapital.remaining) / currentCapital.total;
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
   * @param price - Price per share/unit
   * @param quantity - Number of shares/units
   * @returns Total trade amount
   */
  static calculateTradeAmount(price: number, quantity: number): number {
    if (!price || !quantity || price <= 0 || quantity <= 0) {
      throw new Error('Price and quantity must be greater than 0');
    }
    return parseFloat((price * quantity).toFixed(2));
  }

  /**
   * Initialize capital records if they don't exist
   * @param initialCapitals - Array of {currency, total} objects
   */
  static async initializeCapital(initialCapitals: InitialCapital[] = []): Promise<void> {
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

export default CapitalManager;

// CommonJS compatibility
module.exports = CapitalManager;
module.exports.default = CapitalManager;

