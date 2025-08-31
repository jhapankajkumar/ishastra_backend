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

import { calculateVWAP, calculateATR, analyzeVolumeMetrics } from './technicalCalculators';
import { OHLCData } from '../types/technical-analysis';

export interface VolumePattern {
  type: 'accumulation' | 'distribution' | 'neutral';
  strength: number;
  confidence: number;
}

export interface PriceAction {
  momentum: number;
  pattern: 'uptrend' | 'downtrend' | 'sideways';
  support: number | null;
  resistance: number | null;
}

export interface MarketRegime {
  type: 'trending' | 'ranging' | 'volatile';
  confidence: number;
  characteristics: string[];
}

export interface MicrostructureAnalysis {
  timestamp: string;
  disclaimer: string;
  analysis: {
    vwap: number | null;
    volumePattern: VolumePattern;
    priceAction: PriceAction;
    marketRegime: MarketRegime;
    vwapDeviation: number;
    liquidityScore: number;
    overallAssessment: string;
  };
  limitations: string[];
  reliability: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class RealisticMicrostructureEngine {
    public readonly name: string;
    public readonly disclaimer: string;

    constructor() {
        this.name = 'Realistic Microstructure Analysis';
        this.disclaimer = 'Uses only publicly available data - no dark pool detection claims';
    }

    /**
     * Analyze market microstructure using realistic public data methods
     */
    async analyzeMarketStructure(priceData: OHLCData[], volumeData?: number[]): Promise<MicrostructureAnalysis> {
        try {
            // Calculate VWAP - this is achievable with public data
            const vwap = calculateVWAP(priceData);
            
            // Analyze volume patterns - realistic analysis
            const volumeAnalysis = this.analyzeVolumePatterns(priceData);
            
            // Price action analysis - achievable with OHLCV data
            const priceAction = this.analyzePriceAction(priceData);
            
            // Market regime detection - statistical approach
            const regime = this.detectMarketRegime(priceData);

            // Calculate VWAP deviation
            const currentPrice = priceData[priceData.length - 1].close;
            const vwapDeviation = vwap ? ((currentPrice - vwap) / vwap) * 100 : 0;

            // Simple liquidity score based on volume
            const liquidityScore = this.calculateLiquidityScore(priceData);

            return {
                timestamp: new Date().toISOString(),
                disclaimer: this.disclaimer,
                analysis: {
                    vwap: vwap,
                    volumePattern: volumeAnalysis,
                    priceAction: priceAction,
                    marketRegime: regime,
                    vwapDeviation: vwapDeviation,
                    liquidityScore: liquidityScore,
                    overallAssessment: this.generateOverallAssessment(volumeAnalysis, priceAction, regime)
                },
                limitations: [
                    'No Level 2 order book data available',
                    'Cannot detect dark pool activity',
                    'Limited to public price/volume data',
                    'Heuristic-based analysis only'
                ],
                reliability: this.assessReliability(priceData.length, regime.confidence)
            };
        } catch (error) {
            console.error('Error in microstructure analysis:', error);
            throw new Error(`Microstructure analysis failed: ${error}`);
        }
    }

    /**
     * Analyze volume patterns using public data
     */
    private analyzeVolumePatterns(priceData: OHLCData[]): VolumePattern {
        if (!priceData || priceData.length < 10) {
            return { type: 'neutral', strength: 0, confidence: 0.3 };
        }

        const volumeMetrics = analyzeVolumeMetrics(priceData);
        const recentVolumes = priceData.slice(-10).map(d => d.volume || 0);
        const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
        
        // Simple volume pattern detection
        const currentVolume = priceData[priceData.length - 1].volume || 0;
        const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
        
        const recentPrices = priceData.slice(-5).map(d => d.close);
        const priceDirection = recentPrices[recentPrices.length - 1] - recentPrices[0];
        
        let type: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
        let strength = 0;
        let confidence = 0.5;
        
        if (volumeRatio > 1.5 && priceDirection > 0) {
            type = 'accumulation';
            strength = Math.min(volumeRatio / 2, 1.0);
            confidence = 0.7;
        } else if (volumeRatio > 1.5 && priceDirection < 0) {
            type = 'distribution';
            strength = Math.min(volumeRatio / 2, 1.0);
            confidence = 0.7;
        }
        
        return { type, strength, confidence };
    }

    /**
     * Analyze price action patterns
     */
    private analyzePriceAction(priceData: OHLCData[]): PriceAction {
        if (!priceData || priceData.length < 20) {
            return {
                momentum: 0,
                pattern: 'sideways',
                support: null,
                resistance: null
            };
        }

        const prices = priceData.map(d => d.close);
        const momentum = this.calculateMomentum(prices);
        const pattern = this.identifySimplePattern(prices);
        
        // Simple support/resistance calculation
        const recent20 = priceData.slice(-20);
        const highs = recent20.map(d => d.high);
        const lows = recent20.map(d => d.low);
        
        const resistance = Math.max(...highs);
        const support = Math.min(...lows);
        
        return {
            momentum,
            pattern,
            support,
            resistance
        };
    }

    /**
     * Detect market regime using statistical methods
     */
    private detectMarketRegime(priceData: OHLCData[]): MarketRegime {
        if (!priceData || priceData.length < 30) {
            return {
                type: 'ranging',
                confidence: 0.3,
                characteristics: ['Insufficient data for analysis']
            };
        }

        const prices = priceData.map(d => d.close);
        const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
        
        // Calculate volatility
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const volatility = Math.sqrt(
            returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
        );
        
        // Simple regime classification
        const momentum = this.calculateMomentum(prices);
        const avgVolume = priceData.reduce((sum, d) => sum + (d.volume || 0), 0) / priceData.length;
        const currentVolume = priceData[priceData.length - 1].volume || 0;
        
        let type: 'trending' | 'ranging' | 'volatile' = 'ranging';
        let characteristics: string[] = [];
        
        if (Math.abs(momentum) > 0.05) {
            type = 'trending';
            characteristics = ['Strong directional movement', 'Persistent trend'];
        } else if (volatility > 0.02) {
            type = 'volatile';
            characteristics = ['High volatility', 'Choppy price action'];
        } else {
            characteristics = ['Sideways movement', 'Range-bound trading'];
        }
        
        const confidence = this.calculateRegimeConfidence(volatility, currentVolume, avgVolume);
        
        return { type, confidence, characteristics };
    }

    /**
     * Calculate simple liquidity score
     */
    private calculateLiquidityScore(priceData: OHLCData[]): number {
        if (!priceData || priceData.length < 10) return 0.3;
        
        const volumes = priceData.slice(-10).map(d => d.volume || 0);
        const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const currentVolume = priceData[priceData.length - 1].volume || 0;
        
        // Simple liquidity score based on volume consistency
        const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
        return Math.min(1.0, volumeRatio / 2 + 0.3);
    }

    /**
     * Generate overall assessment
     */
    private generateOverallAssessment(
        volume: VolumePattern, 
        price: PriceAction, 
        regime: MarketRegime
    ): string {
        const conditions = [
            `${regime.type} market`,
            `${volume.type} volume pattern`,
            `${price.pattern} price action`
        ];
        
        return `Market showing ${conditions.join(' with ')}`;
    }

    /**
     * Assess analysis reliability
     */
    private assessReliability(dataPoints: number, regimeConfidence: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        if (dataPoints < 20 || regimeConfidence < 0.4) return 'LOW';
        if (dataPoints < 50 || regimeConfidence < 0.7) return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * Calculate price momentum
     */
    private calculateMomentum(prices: number[]): number {
        if (prices.length < 2) return 0;
        
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        return (lastPrice - firstPrice) / firstPrice;
    }

    /**
     * Identify simple price patterns
     */
    private identifySimplePattern(prices: number[]): 'uptrend' | 'downtrend' | 'sideways' {
        const trend = this.calculateMomentum(prices);
        if (trend > 0.02) return 'uptrend';
        if (trend < -0.02) return 'downtrend';
        return 'sideways';
    }

    /**
     * Calculate regime confidence
     */
    private calculateRegimeConfidence(volatility: number, currentVol: number, avgVol: number): number {
        const volRatio = avgVol > 0 ? currentVol / avgVol : 1;
        let confidence = 0.5;
        
        if (volatility > 0.02 || volRatio > 1.5) confidence = 0.8;
        else if (volatility < 0.005 && volRatio < 0.8) confidence = 0.7;
        
        return Math.min(0.95, confidence); // Cap at 95% - honest limitations
    }
}
