/**
 * Trade Calculations Utility
 * Basic calculations for trade metrics and P&L
 */

/**
 * Calculate unrealized P&L for a trade
 * @param {Object} trade - Trade object with entryPrice, quantity, etc.
 * @param {number} currentPrice - Current market price
 * @returns {number} Unrealized P&L in dollars
 */
function calculateUnrealizedPnL(trade, currentPrice) {
  if (!trade.entryPrice || !trade.quantity || !currentPrice) {
    return 0;
  }
  
  const entryValue = trade.entryPrice * trade.quantity;
  const currentValue = currentPrice * trade.quantity;
  
  // For long positions: current value - entry value
  // For short positions: entry value - current value (flip the calculation)
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  return isShort ? entryValue - currentValue : currentValue - entryValue;
}

/**
 * Calculate percentage return for a trade
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current market price
 * @returns {number} Percentage return
 */
function calculatePercentageReturn(trade, currentPrice) {
  if (!trade.entryPrice || !currentPrice) {
    return 0;
  }
  
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  if (isShort) {
    return ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
  } else {
    return ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
  }
}

/**
 * Calculate current risk-reward ratio for a trade
 * @param {Object} trade - Trade object
 * @param {number} currentPrice - Current market price
 * @returns {number} Risk-reward ratio
 */
function calculateRiskReward(trade, currentPrice) {
  if (!trade.stopLoss || !trade.takeProfit || !currentPrice) {
    return 0;
  }
  
  const risk = Math.abs(currentPrice - trade.stopLoss);
  const reward = Math.abs(trade.takeProfit - currentPrice);
  
  return risk > 0 ? reward / risk : 0;
}

/**
 * Calculate position size in dollars
 * @param {Object} trade - Trade object
 * @returns {number} Position size in dollars
 */
function calculatePositionSize(trade) {
  if (!trade.entryPrice || !trade.quantity) {
    return 0;
  }
  
  return trade.entryPrice * trade.quantity;
}

/**
 * Calculate days held for a trade
 * @param {Object} trade - Trade object with entryDate
 * @returns {number} Number of days held
 */
function calculateDaysHeld(trade) {
  if (!trade.entryDate) {
    return 0;
  }
  
  const entryDate = new Date(trade.entryDate);
  const now = new Date();
  const diffTime = Math.abs(now - entryDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate maximum adverse excursion (MAE) if available
 * @param {Object} trade - Trade object
 * @returns {number} MAE in dollars
 */
function calculateMAE(trade) {
  if (!trade.lowPrice || !trade.entryPrice || !trade.quantity) {
    return 0;
  }
  
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  if (isShort) {
    // For short positions, adverse move is price going up
    const adversePrice = trade.highPrice || trade.entryPrice;
    return (adversePrice - trade.entryPrice) * trade.quantity;
  } else {
    // For long positions, adverse move is price going down
    const adversePrice = trade.lowPrice;
    return (trade.entryPrice - adversePrice) * trade.quantity;
  }
}

/**
 * Calculate maximum favorable excursion (MFE) if available
 * @param {Object} trade - Trade object
 * @returns {number} MFE in dollars
 */
function calculateMFE(trade) {
  if (!trade.highPrice || !trade.entryPrice || !trade.quantity) {
    return 0;
  }
  
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  if (isShort) {
    // For short positions, favorable move is price going down
    const favorablePrice = trade.lowPrice || trade.entryPrice;
    return (trade.entryPrice - favorablePrice) * trade.quantity;
  } else {
    // For long positions, favorable move is price going up
    const favorablePrice = trade.highPrice;
    return (favorablePrice - trade.entryPrice) * trade.quantity;
  }
}

module.exports = {
  calculateUnrealizedPnL,
  calculatePercentageReturn,
  calculateRiskReward,
  calculatePositionSize,
  calculateDaysHeld,
  calculateMAE,
  calculateMFE
};
