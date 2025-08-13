/**
 * REALISTIC Microstructure Analysis Engine
 * 
 * 🚨 HONEST DISCLAIMER: This is NOT dark pool detection or HFT analysis
 * Individual traders cannot access Level 2 order book data or institutional order flow.
 * 
 * What this engine ACTUALLY provides:
 * - Volume-based market structure analysis using public data
 * - VWAP deviation analysis 
 * - Price action heuristics
 * - Realistic volume pattern recognition
 * 
 * What this engine CANNOT do (requires institutional data feeds):
 * - Detect dark pools (need proprietary trade data)
 * - Reconstruct order book from Level 1 data
 * - Identify specific HFT strategies
 * - Predict institutional order flow
 */

const { calculateVWAP, calculateATR, analyzeVolumeMetrics } = require('./technicalCalculators');

class RealisticMicrostructureEngine {
    constructor() {
        this.name = 'Realistic Microstructure Analysis';
        this.disclaimer = 'Uses only publicly available data - no dark pool detection claims';
    }

    /**
     * Analyze market microstructure using realistic public data methods
     */
    async analyzeMarketStructure(priceData, volumeData) {
        try {
            // Calculate VWAP - this is achievable with public data
            const vwap = calculateVWAP(priceData, volumeData);
            
            // Analyze volume patterns - realistic analysis
            const volumeAnalysis = this.analyzeVolumePatterns(volumeData);
            
            // Price action analysis - achievable with OHLCV data
            const priceAction = this.analyzePriceAction(priceData);
            
            // Market regime detection - statistical approach
            const regime = this.detectMarketRegime(priceData, volumeData);

            return {
                timestamp: new Date().toISOString(),
                disclaimer: this.disclaimer,
                analysis: {
                    vwap: vwap,
                    volumePattern: volumeAnalysis,
                    priceAction: priceAction,
                    marketRegime: regime,
                    microstructureScore: this.calculateMicrostructureScore(vwap, volumeAnalysis, priceAction)
                }
            };
        } catch (error) {
            console.error('Microstructure analysis error:', error);
            return {
                error: 'Analysis failed',
                disclaimer: 'Individual trader limitations - no institutional data access'
            };
        }
    }

    /**
     * Analyze volume patterns using public data only
     */
    analyzeVolumePatterns(volumeData) {
        const recentVolume = volumeData.slice(-20);
        const avgVolume = recentVolume.reduce((a, b) => a + b, 0) / recentVolume.length;
        const currentVolume = volumeData[volumeData.length - 1];
        
        const volumeRatio = currentVolume / avgVolume;
        const volumeTrend = this.calculateVolumeTrend(recentVolume);
        
        return {
            currentVsAverage: volumeRatio,
            trend: volumeTrend,
            interpretation: this.interpretVolumePattern(volumeRatio, volumeTrend),
            disclaimer: 'Based on public volume data only'
        };
    }

    /**
     * Analyze price action patterns
     */
    analyzePriceAction(priceData) {
        const recentPrices = priceData.slice(-10);
        const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
        const volatility = this.calculateRecentVolatility(recentPrices);
        
        return {
            recentChange: priceChange,
            volatility: volatility,
            momentum: this.calculateMomentum(recentPrices),
            pattern: this.identifySimplePattern(recentPrices)
        };
    }

    /**
     * Detect market regime using statistical methods
     */
    detectMarketRegime(priceData, volumeData) {
        const returns = this.calculateReturns(priceData.slice(-50));
        const volatility = this.calculateVolatility(returns);
        const averageVolume = volumeData.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const currentVolume = volumeData[volumeData.length - 1];
        
        let regime = 'normal';
        if (volatility > 0.02 && currentVolume > averageVolume * 1.5) {
            regime = 'high_activity';
        } else if (volatility < 0.005 && currentVolume < averageVolume * 0.7) {
            regime = 'low_activity';
        }
        
        return {
            regime: regime,
            volatility: volatility,
            volumeRatio: currentVolume / averageVolume,
            confidence: this.calculateRegimeConfidence(volatility, currentVolume, averageVolume)
        };
    }

    /**
     * Calculate microstructure score (0-100)
     */
    calculateMicrostructureScore(vwap, volumeAnalysis, priceAction) {
        let score = 50; // Base score
        
        // VWAP deviation impact - handle both number and object formats
        let vwapDeviation = 0;
        if (typeof vwap === 'number') {
            // If vwap is just a number, we can't calculate deviation without current price
            vwapDeviation = 0;
        } else if (vwap && typeof vwap.deviation === 'number') {
            vwapDeviation = Math.abs(vwap.deviation);
        }
        
        if (vwapDeviation < 0.005) score += 10;
        else if (vwapDeviation > 0.02) score -= 15;
        
        // Volume pattern impact
        if (volumeAnalysis && volumeAnalysis.currentVsAverage > 1.2) score += 10;
        if (volumeAnalysis && volumeAnalysis.trend === 'increasing') score += 5;
        
        // Price action impact
        if (priceAction && Math.abs(priceAction.momentum || 0) > 0.01) score += 8;
        if (priceAction && priceAction.volatility > 0.02) score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }

    // Helper methods
    calculateVolumeTrend(volumeData) {
        const firstHalf = volumeData.slice(0, volumeData.length / 2);
        const secondHalf = volumeData.slice(volumeData.length / 2);
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }

    interpretVolumePattern(ratio, trend) {
        if (ratio > 1.5 && trend === 'increasing') {
            return 'High interest - potential breakout';
        } else if (ratio < 0.7 && trend === 'decreasing') {
            return 'Low interest - consolidation likely';
        } else if (ratio > 1.2) {
            return 'Above average activity';
        }
        return 'Normal trading activity';
    }

    calculateRecentVolatility(prices) {
        const returns = this.calculateReturns(prices);
        return this.calculateVolatility(returns);
    }

    calculateReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
        return returns;
    }

    calculateVolatility(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    calculateMomentum(prices) {
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        return (lastPrice - firstPrice) / firstPrice;
    }

    identifySimplePattern(prices) {
        const trend = this.calculateMomentum(prices);
        if (trend > 0.02) return 'uptrend';
        if (trend < -0.02) return 'downtrend';
        return 'sideways';
    }

    calculateRegimeConfidence(volatility, currentVol, avgVol) {
        const volRatio = currentVol / avgVol;
        let confidence = 0.5;
        
        if (volatility > 0.02 || volRatio > 1.5) confidence = 0.8;
        else if (volatility < 0.005 && volRatio < 0.8) confidence = 0.7;
        
        return Math.min(0.95, confidence); // Cap at 95% - honest limitations
    }
}

module.exports = { RealisticMicrostructureEngine };