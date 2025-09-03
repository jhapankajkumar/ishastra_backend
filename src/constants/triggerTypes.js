/**
 * Trading System Trigger Types
 * Consolidated trigger types used across all trading systems
 */

const TRIGGER_TYPES = {
  // Volume triggers
  VOLUME: 'VOLUME',
  
  // Price action triggers  
  BREAKOUT_LEVEL: 'BREAKOUT_LEVEL',
  CANDLE_STRENGTH: 'CANDLE_STRENGTH',
  
  // Momentum triggers
  MOMENTUM_ACCELERATION: 'MOMENTUM_ACCELERATION',
  
  // System grade triggers
  CASCADE_GRADE: 'CASCADE_GRADE'
};

const VALID_TRIGGER_TYPES = Object.values(TRIGGER_TYPES);

module.exports = {
  TRIGGER_TYPES,
  VALID_TRIGGER_TYPES
};
