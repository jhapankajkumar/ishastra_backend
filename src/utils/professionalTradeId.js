/**
 * Professional Trade ID Generator (Virtual Implementation)
 * 
 * This utility generates professional-looking trade IDs from existing numeric IDs
 * without requiring database changes. Perfect for production deployment.
 */

class ProfessionalTradeId {
  
  /**
   * Generate professional ID from existing numeric ID
   * @param {number} id - Existing trade ID (1, 2, 3, etc.)
   * @param {Date} createdAt - Trade creation date (optional)
   * @returns {string} - Professional ID (ISH-2025-000001)
   */
  static generateFromId(id, createdAt = new Date()) {
    const year = createdAt.getFullYear();
    const paddedId = String(id).padStart(6, '0');
    return `ISH-${year}-${paddedId}`;
  }
  
  /**
   * Extract numeric ID from professional ID
   * @param {string} professionalId - Professional ID (ISH-2025-000001)
   * @returns {number|null} - Original numeric ID or null if invalid format
   */
  static extractNumericId(professionalId) {
    if (!professionalId || typeof professionalId !== 'string') {
      return null;
    }
    
    const match = professionalId.match(/ISH-\d{4}-(\d{6})/);
    return match ? parseInt(match[1], 10) : null;
  }
  
  /**
   * Generate short format ID
   * @param {number} id - Existing trade ID
   * @param {Date} createdAt - Trade creation date (optional)
   * @returns {string} - Short ID (T25-000001)
   */
  static generateShortId(id, createdAt = new Date()) {
    const year = String(createdAt.getFullYear()).slice(-2);
    const paddedId = String(id).padStart(6, '0');
    return `T${year}-${paddedId}`;
  }
  
  /**
   * Generate UUID-style ID (for reference)
   * @param {number} id - Existing trade ID
   * @returns {string} - UUID-style ID
   */
  static generateUuidStyle(id) {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).slice(-4);
    const paddedId = String(id).padStart(4, '0');
    return `TRD_${timestamp}${paddedId}_${year}`.toUpperCase();
  }
  
  /**
   * Validate professional trade ID format
   * @param {string} professionalId - Professional ID to validate
   * @returns {boolean} - True if valid format
   */
  static isValidFormat(professionalId) {
    if (!professionalId || typeof professionalId !== 'string') {
      return false;
    }
    return /^ISH-\d{4}-\d{6}$/.test(professionalId);
  }
  
  /**
   * Get all format variations for a trade
   * @param {number} id - Existing trade ID
   * @param {Date} createdAt - Trade creation date (optional)
   * @returns {object} - All format variations
   */
  static getAllFormats(id, createdAt = new Date()) {
    return {
      professional: this.generateFromId(id, createdAt),
      short: this.generateShortId(id, createdAt),
      uuid: this.generateUuidStyle(id),
      numeric: id
    };
  }
}

module.exports = ProfessionalTradeId;
