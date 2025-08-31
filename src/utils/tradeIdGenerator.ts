import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Trade ID Generation Utility
export class TradeIdGenerator {
  
  /**
   * Generate a professional trade ID in format: ISH-YYYY-NNNNNN
   * Example: ISH-2025-000001, ISH-2025-000002
   */
  static async generateTradeId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ISH-${year}-`;
    
    // Helper to generate a random 5-character alphanumeric hash
    function randomHash(length: number = 5): string {
      return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    }
    
    try {
      // Get the count of trades created this year
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      const yearlyTradeCount = await prisma.trade.count({
        where: {
          entryDate: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      });
      
      // Generate sequential number (6 digits, zero-padded)
      const sequentialNumber = String(yearlyTradeCount + 1).padStart(6, '0');
      
      // Append random hash for extra uniqueness
      return `${prefix}${sequentialNumber}-${randomHash()}`;
    } catch (error) {
      console.error('Error generating trade ID:', error);
      // Fallback to timestamp-based ID with random hash
      return `ISH-${year}-${Date.now().toString().slice(-6)}-${randomHash()}`;
    }
  }
  
  /**
   * Generate UUID-style trade ID (more modern approach)
   * Example: TRD_clkv123abc_2025
   */
  static generateUuidTradeId(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36); // Base36 encoding
    const random = Math.random().toString(36).substring(2, 8); // 6 random chars
    
    return `TRD_${timestamp}${random}_${year}`.toUpperCase();
  }
  
  /**
   * Generate short professional ID
   * Example: T25-001234
   */
  static async generateShortTradeId(): Promise<string> {
    const year = String(new Date().getFullYear()).slice(-2); // Last 2 digits of year
    
    try {
      const totalTrades = await prisma.trade.count();
      const sequentialNumber = String(totalTrades + 1).padStart(6, '0');
      
      return `T${year}-${sequentialNumber}`;
    } catch (error) {
      console.error('Error generating short trade ID:', error);
      return `T${year}-${Date.now().toString().slice(-6)}`;
    }
  }
}

export default TradeIdGenerator;

// CommonJS compatibility
module.exports = TradeIdGenerator;
module.exports.default = TradeIdGenerator;
