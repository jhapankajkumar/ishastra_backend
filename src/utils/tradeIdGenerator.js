const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Trade ID Generation Utility
class TradeIdGenerator {
  
  /**
   * Generate a professional trade ID in format: ISH-YYYY-NNNNNN
   * Example: ISH-2025-000001, ISH-2025-000002
   */
  static async generateTradeId() {
    const year = new Date().getFullYear();
    const prefix = `ISH-${year}-`;
    
    try {
      // Get the count of trades created this year
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      
      const yearlyTradeCount = await prisma.trade.count({
        where: {
          created_at: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      });
      
      // Generate sequential number (6 digits, zero-padded)
      const sequentialNumber = String(yearlyTradeCount + 1).padStart(6, '0');
      
      return `${prefix}${sequentialNumber}`;
    } catch (error) {
      console.error('Error generating trade ID:', error);
      // Fallback to timestamp-based ID
      return `ISH-${year}-${Date.now().toString().slice(-6)}`;
    }
  }
  
  /**
   * Generate UUID-style trade ID (more modern approach)
   * Example: TRD_clkv123abc_2025
   */
  static generateUuidTradeId() {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36); // Base36 encoding
    const random = Math.random().toString(36).substring(2, 8); // 6 random chars
    
    return `TRD_${timestamp}${random}_${year}`.toUpperCase();
  }
  
  /**
   * Generate short professional ID
   * Example: T25-001234
   */
  static async generateShortTradeId() {
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

module.exports = TradeIdGenerator;
