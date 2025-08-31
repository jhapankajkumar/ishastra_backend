/**
 * Professional Trade ID Generator (Virtual Implementation)
 * 
 * This utility generates professional-looking trade IDs from existing numeric IDs
 * without requiring database changes. Perfect for production deployment.
 */

export interface TradeIdFormats {
  professional: string;
  short: string;
  uuid: string;
  numeric: number;
}

export class ProfessionalTradeId {
  
  /**
   * Generate professional ID from existing numeric ID
   * @param id - Existing trade ID (1, 2, 3, etc.)
   * @param createdAt - Trade creation date (optional)
   * @returns Professional ID (ISH-2025-000001)
   */
  static generateFromId(id: number, createdAt: Date = new Date()): string {
    const year = createdAt.getFullYear();
    const paddedId = String(id).padStart(6, '0');
    return `ISH-${year}-${paddedId}`;
  }
  
  /**
   * Extract numeric ID from professional ID
   * @param professionalId - Professional ID (ISH-2025-000001)
   * @returns Original numeric ID or null if invalid format
   */
  static extractNumericId(professionalId: string): number | null {
    if (!professionalId || typeof professionalId !== 'string') {
      return null;
    }
    
    const match = professionalId.match(/ISH-\d{4}-(\d{6})/);
    return match ? parseInt(match[1], 10) : null;
  }
  
  /**
   * Generate short format ID
   * @param id - Existing trade ID
   * @param createdAt - Trade creation date (optional)
   * @returns Short ID (T25-000001)
   */
  static generateShortId(id: number, createdAt: Date = new Date()): string {
    const year = String(createdAt.getFullYear()).slice(-2);
    const paddedId = String(id).padStart(6, '0');
    return `T${year}-${paddedId}`;
  }
  
  /**
   * Generate UUID-style ID (for reference)
   * @param id - Existing trade ID
   * @returns UUID-style ID
   */
  static generateUuidStyle(id: number): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).slice(-4);
    const paddedId = String(id).padStart(4, '0');
    return `TRD_${timestamp}${paddedId}_${year}`.toUpperCase();
  }
  
  /**
   * Validate professional trade ID format
   * @param professionalId - Professional ID to validate
   * @returns True if valid format
   */
  static isValidFormat(professionalId: string): boolean {
    if (!professionalId || typeof professionalId !== 'string') {
      return false;
    }
    return /^ISH-\d{4}-\d{6}$/.test(professionalId);
  }
  
  /**
   * Get all format variations for a trade
   * @param id - Existing trade ID
   * @param createdAt - Trade creation date (optional)
   * @returns All format variations
   */
  static getAllFormats(id: number, createdAt: Date = new Date()): TradeIdFormats {
    return {
      professional: this.generateFromId(id, createdAt),
      short: this.generateShortId(id, createdAt),
      uuid: this.generateUuidStyle(id),
      numeric: id
    };
  }
}

export default ProfessionalTradeId;

// CommonJS compatibility
module.exports = ProfessionalTradeId;
module.exports.default = ProfessionalTradeId;
