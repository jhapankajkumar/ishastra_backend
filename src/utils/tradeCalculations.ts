/**
 * Trade Calculations Utility
 * Basic calculations for trade metrics and P&L
 */

export interface Trade {
  entryPrice: number;
  quantity: number;
  side: 'long' | 'short' | 'SELL' | 'BUY';
  stopLoss?: number;
  targetPrice?: number;
  timestamp?: Date | string;
}

export interface RiskRewardRatio {
  ratio: number;
  riskAmount: number;
  rewardAmount: number;
}

export interface TradeMetrics {
  unrealizedPnL: number;
  percentageReturn: number;
  riskRewardRatio: RiskRewardRatio | null;
}

/**
 * Calculate unrealized P&L for a trade
 * @param trade - Trade object with entryPrice, quantity, etc.
 * @param currentPrice - Current market price
 * @returns Unrealized P&L in dollars
 */
export function calculateUnrealizedPnL(trade: Trade, currentPrice: number): number {
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
 * @param trade - Trade object
 * @param currentPrice - Current market price
 * @returns Percentage return
 */
export function calculatePercentageReturn(trade: Trade, currentPrice: number): number {
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
 * @param trade - Trade object
 * @param currentPrice - Current market price
 * @returns Risk-reward ratio object
 */
export function calculateRiskRewardRatio(trade: Trade, currentPrice: number): RiskRewardRatio | null {
  if (!trade.entryPrice || !trade.stopLoss || !trade.targetPrice || !currentPrice) {
    return null;
  }
  
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  let riskAmount: number;
  let rewardAmount: number;
  
  if (isShort) {
    // For short positions
    riskAmount = Math.abs(trade.stopLoss - trade.entryPrice);
    rewardAmount = Math.abs(trade.entryPrice - trade.targetPrice);
  } else {
    // For long positions
    riskAmount = Math.abs(trade.entryPrice - trade.stopLoss);
    rewardAmount = Math.abs(trade.targetPrice - trade.entryPrice);
  }
  
  const ratio = riskAmount > 0 ? rewardAmount / riskAmount : 0;
  
  return {
    ratio,
    riskAmount,
    rewardAmount
  };
}

/**
 * Calculate position size based on risk percentage
 * @param accountBalance - Total account balance
 * @param riskPercentage - Percentage of account to risk (e.g., 2 for 2%)
 * @param entryPrice - Entry price of the trade
 * @param stopLoss - Stop loss price
 * @returns Position size (number of shares/units)
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number
): number {
  if (!accountBalance || !riskPercentage || !entryPrice || !stopLoss || entryPrice === stopLoss) {
    return 0;
  }
  
  const riskAmount = accountBalance * (riskPercentage / 100);
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  
  return Math.floor(riskAmount / riskPerShare);
}

/**
 * Calculate all trade metrics at once
 * @param trade - Trade object
 * @param currentPrice - Current market price
 * @returns Complete trade metrics
 */
export function calculateTradeMetrics(trade: Trade, currentPrice: number): TradeMetrics {
  const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
  const percentageReturn = calculatePercentageReturn(trade, currentPrice);
  const riskRewardRatio = calculateRiskRewardRatio(trade, currentPrice);
  
  return {
    unrealizedPnL,
    percentageReturn,
    riskRewardRatio
  };
}

/**
 * Check if a trade should be closed based on profit target or stop loss
 * @param trade - Trade object
 * @param currentPrice - Current market price
 * @returns Object indicating if trade should be closed and reason
 */
export function shouldCloseTrade(
  trade: Trade, 
  currentPrice: number
): { shouldClose: boolean; reason: string | null } {
  if (!trade.entryPrice || !currentPrice) {
    return { shouldClose: false, reason: null };
  }
  
  const isShort = trade.side === 'short' || trade.side === 'SELL';
  
  // Check stop loss
  if (trade.stopLoss) {
    if (isShort && currentPrice >= trade.stopLoss) {
      return { shouldClose: true, reason: 'stop_loss' };
    } else if (!isShort && currentPrice <= trade.stopLoss) {
      return { shouldClose: true, reason: 'stop_loss' };
    }
  }
  
  // Check target price
  if (trade.targetPrice) {
    if (isShort && currentPrice <= trade.targetPrice) {
      return { shouldClose: true, reason: 'profit_target' };
    } else if (!isShort && currentPrice >= trade.targetPrice) {
      return { shouldClose: true, reason: 'profit_target' };
    }
  }
  
  return { shouldClose: false, reason: null };
}

// CommonJS compatibility
module.exports = {
  calculateUnrealizedPnL,
  calculatePercentageReturn,
  calculateRiskRewardRatio,
  calculatePositionSize,
  calculateTradeMetrics,
  shouldCloseTrade
};
