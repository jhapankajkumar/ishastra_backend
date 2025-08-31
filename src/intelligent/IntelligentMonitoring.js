/**
 * Intelligent Monitoring
 * AI vs baseline performance tracking and comparison
 * 
 * Monitors AI enhancement effectiveness against your base expert system
 * Provides detailed metrics and ROI analysis
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const { PrismaClient } = require('@prisma/client');

class IntelligentMonitoring {
    constructor() {
        this.prisma = new PrismaClient();
        
        this.metrics = {
            aiEnhanced: new Map(),
            baseline: new Map(),
            comparison: new Map()
        };
        
        this.config = {
            trackingPeriodDays: 30,
            comparisonThreshold: 0.05, // 5% minimum difference to be significant
            confidenceLevel: 0.7
        };
        
        console.log('📊 Intelligent Monitoring initialized');
    }

    /**
     * Get comprehensive performance report
     * Compares AI-enhanced vs baseline performance
     */
    async getPerformanceReport(options = {}) {
        try {
            const {
                symbol = null,
                userId = null,
                days = this.config.trackingPeriodDays,
                includeDetailed = false
            } = options;

            console.log(`📊 Generating performance report (${days} days)`);

            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

            // Get AI-enhanced trades
            const aiTrades = await this.getTradesForPeriod({
                startDate,
                endDate,
                symbol,
                userId,
                aiEnhanced: true
            });

            // Get baseline trades (non-AI)
            const baselineTrades = await this.getTradesForPeriod({
                startDate,
                endDate,
                symbol,
                userId,
                aiEnhanced: false
            });

            // Calculate metrics for both groups
            const aiMetrics = this.calculateMetrics(aiTrades, 'AI_ENHANCED');
            const baselineMetrics = this.calculateMetrics(baselineTrades, 'BASELINE');

            // Compare performance
            const comparison = this.comparePerformance(aiMetrics, baselineMetrics);

            // Calculate ROI and effectiveness
            const roiAnalysis = this.calculateROI(aiTrades, baselineTrades);

            // Generate insights and recommendations
            const insights = this.generatePerformanceInsights(comparison, roiAnalysis);

            const report = {
                period: {
                    days,
                    startDate,
                    endDate
                },
                filters: { symbol, userId },
                aiEnhanced: {
                    ...aiMetrics,
                    sampleSize: aiTrades.length
                },
                baseline: {
                    ...baselineMetrics,
                    sampleSize: baselineTrades.length
                },
                comparison,
                roiAnalysis,
                insights,
                summary: this.generateSummary(comparison, roiAnalysis),
                reportGenerated: new Date()
            };

            // Include detailed trades if requested
            if (includeDetailed) {
                report.detailed = {
                    aiTrades: aiTrades.slice(0, 20), // Last 20 AI trades
                    baselineTrades: baselineTrades.slice(0, 20) // Last 20 baseline trades
                };
            }

            return report;

        } catch (error) {
            console.error('❌ Performance report generation failed:', error);
            return this.createErrorReport(error.message);
        }
    }

    /**
     * Get trades for a specific period
     */
    async getTradesForPeriod({ startDate, endDate, symbol, userId, aiEnhanced }) {
        try {
            // Check if Prisma is properly initialized
            if (!this.prisma || !this.prisma.tradeOutcome) {
                console.warn('⚠️ Database not properly initialized - returning empty trades list');
                return [];
            }

            const whereClause = {
                entryDate: {
                    gte: startDate,
                    lte: endDate
                },
                exitDate: { not: null }, // Only completed trades
                outcome: { not: null },
                aiEnhanced
            };

            if (symbol) whereClause.symbol = symbol;
            if (userId) whereClause.userId = userId;

            const trades = await this.prisma.tradeOutcome.findMany({
                where: whereClause,
                orderBy: { entryDate: 'desc' }
            });

            return trades;

        } catch (error) {
            console.error('❌ Failed to get trades for period:', error);
            // Return empty array so the system can continue working
            return [];
        }
    }

    /**
     * Calculate performance metrics for a group of trades
     */
    calculateMetrics(trades, groupType) {
        if (!trades || trades.length === 0) {
            return this.getEmptyMetrics(groupType);
        }

        const winners = trades.filter(t => t.outcome === 'WIN');
        const losers = trades.filter(t => t.outcome === 'LOSS');

        // Basic metrics
        const winRate = (winners.length / trades.length) * 100;
        const lossRate = (losers.length / trades.length) * 100;

        // Return metrics
        const returns = trades.filter(t => t.pnlPercent !== null).map(t => t.pnlPercent);
        const avgReturn = returns.length > 0 ? 
            returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
        
        const winningReturns = winners.filter(t => t.pnlPercent !== null).map(t => t.pnlPercent);
        const avgWinReturn = winningReturns.length > 0 ?
            winningReturns.reduce((sum, ret) => sum + ret, 0) / winningReturns.length : 0;

        const losingReturns = losers.filter(t => t.pnlPercent !== null).map(t => t.pnlPercent);
        const avgLossReturn = losingReturns.length > 0 ?
            losingReturns.reduce((sum, ret) => sum + ret, 0) / losingReturns.length : 0;

        // Risk metrics
        const maxWin = returns.length > 0 ? Math.max(...returns) : 0;
        const maxLoss = returns.length > 0 ? Math.min(...returns) : 0;
        const profitFactor = avgWinReturn !== 0 && avgLossReturn !== 0 ? 
            Math.abs(avgWinReturn / avgLossReturn) : 0;

        // Duration metrics
        const durations = trades.filter(t => t.daysHeld !== null).map(t => t.daysHeld);
        const avgDuration = durations.length > 0 ?
            durations.reduce((sum, dur) => sum + dur, 0) / durations.length : 0;

        // Consistency metrics
        const volatility = this.calculateVolatility(returns);
        const sharpeRatio = this.calculateSharpeRatio(returns);
        const maxDrawdown = this.calculateMaxDrawdown(trades);

        // Grade improvements (for AI-enhanced trades)
        let gradeImprovement = null;
        if (groupType === 'AI_ENHANCED') {
            gradeImprovement = this.calculateGradeImprovement(trades);
        }

        return {
            groupType,
            totalTrades: trades.length,
            winRate,
            lossRate,
            avgReturn,
            avgWinReturn,
            avgLossReturn,
            maxWin,
            maxLoss,
            profitFactor,
            avgDuration,
            volatility,
            sharpeRatio,
            maxDrawdown,
            gradeImprovement,
            lastUpdated: new Date()
        };
    }

    /**
     * Compare AI vs baseline performance
     */
    comparePerformance(aiMetrics, baselineMetrics) {
        const comparison = {};

        // Key performance indicators to compare
        const kpis = [
            'winRate', 'avgReturn', 'avgWinReturn', 'avgLossReturn', 
            'profitFactor', 'avgDuration', 'volatility', 'sharpeRatio', 'maxDrawdown'
        ];

        kpis.forEach(kpi => {
            const aiValue = aiMetrics[kpi] || 0;
            const baselineValue = baselineMetrics[kpi] || 0;
            
            let improvement = 0;
            let improvementPercent = 0;
            let significance = 'NONE';

            if (baselineValue !== 0) {
                improvement = aiValue - baselineValue;
                improvementPercent = (improvement / Math.abs(baselineValue)) * 100;
                
                // Determine significance
                if (Math.abs(improvementPercent) >= this.config.comparisonThreshold * 100) {
                    if (this.isPositiveImprovement(kpi, improvement)) {
                        significance = improvementPercent > 20 ? 'MAJOR_POSITIVE' : 'POSITIVE';
                    } else {
                        significance = improvementPercent < -20 ? 'MAJOR_NEGATIVE' : 'NEGATIVE';
                    }
                }
            }

            comparison[kpi] = {
                ai: aiValue,
                baseline: baselineValue,
                improvement,
                improvementPercent,
                significance,
                betterThan: this.isPositiveImprovement(kpi, improvement) ? 'BASELINE' : 'AI'
            };
        });

        // Overall assessment
        const positiveCount = Object.values(comparison).filter(c => 
            c.significance === 'POSITIVE' || c.significance === 'MAJOR_POSITIVE'
        ).length;

        const negativeCount = Object.values(comparison).filter(c => 
            c.significance === 'NEGATIVE' || c.significance === 'MAJOR_NEGATIVE'
        ).length;

        comparison.overall = {
            positiveImprovements: positiveCount,
            negativeImprovements: negativeCount,
            neutralMetrics: kpis.length - positiveCount - negativeCount,
            overallAssessment: this.getOverallAssessment(positiveCount, negativeCount, kpis.length)
        };

        return comparison;
    }

    /**
     * Calculate ROI of AI enhancement
     */
    calculateROI(aiTrades, baselineTrades) {
        // Calculate total returns for each group
        const aiTotalReturn = aiTrades
            .filter(t => t.pnlPercent !== null)
            .reduce((sum, t) => sum + t.pnlPercent, 0);

        const baselineTotalReturn = baselineTrades
            .filter(t => t.pnlPercent !== null)
            .reduce((sum, t) => sum + t.pnlPercent, 0);

        // Estimate AI implementation costs (placeholder)
        const estimatedAICost = aiTrades.length * 0.02; // $0.02 per AI call

        // Calculate theoretical baseline return for AI trade count
        const baselineAvgReturn = baselineTrades.length > 0 ? 
            baselineTotalReturn / baselineTrades.length : 0;
        const theoreticalBaselineReturn = baselineAvgReturn * aiTrades.length;

        // ROI calculation
        const additionalReturn = aiTotalReturn - theoreticalBaselineReturn;
        const roi = estimatedAICost > 0 ? (additionalReturn / estimatedAICost) * 100 : 0;

        return {
            aiTotalReturn,
            baselineTotalReturn,
            theoreticalBaselineReturn,
            additionalReturn,
            estimatedCost: estimatedAICost,
            roi,
            costPerTrade: aiTrades.length > 0 ? estimatedAICost / aiTrades.length : 0,
            returnPerDollar: estimatedAICost > 0 ? additionalReturn / estimatedAICost : 0,
            isPositiveROI: roi > 0
        };
    }

    /**
     * Generate performance insights
     */
    generatePerformanceInsights(comparison, roiAnalysis) {
        const insights = [];

        // ROI insights
        if (roiAnalysis.isPositiveROI) {
            insights.push({
                type: 'POSITIVE',
                category: 'ROI',
                message: `AI enhancement shows positive ROI of ${roiAnalysis.roi.toFixed(1)}%`,
                impact: roiAnalysis.roi > 100 ? 'HIGH' : 'MEDIUM',
                confidence: 0.8
            });
        } else {
            insights.push({
                type: 'NEGATIVE',
                category: 'ROI',
                message: `AI enhancement showing negative ROI - review implementation`,
                impact: 'HIGH',
                confidence: 0.9
            });
        }

        // Performance insights
        Object.entries(comparison).forEach(([metric, data]) => {
            if (metric === 'overall') return;

            if (data.significance === 'MAJOR_POSITIVE') {
                insights.push({
                    type: 'POSITIVE',
                    category: 'PERFORMANCE',
                    message: `AI significantly improves ${metric} by ${data.improvementPercent.toFixed(1)}%`,
                    impact: 'HIGH',
                    confidence: 0.9
                });
            } else if (data.significance === 'MAJOR_NEGATIVE') {
                insights.push({
                    type: 'WARNING',
                    category: 'PERFORMANCE',
                    message: `AI significantly reduces ${metric} by ${Math.abs(data.improvementPercent).toFixed(1)}%`,
                    impact: 'HIGH',
                    confidence: 0.9
                });
            }
        });

        // Overall assessment insights
        const overall = comparison.overall;
        if (overall.positiveImprovements > overall.negativeImprovements) {
            insights.push({
                type: 'POSITIVE',
                category: 'OVERALL',
                message: `AI shows net positive impact across ${overall.positiveImprovements} key metrics`,
                impact: 'MEDIUM',
                confidence: 0.7
            });
        } else if (overall.negativeImprovements > overall.positiveImprovements) {
            insights.push({
                type: 'WARNING',
                category: 'OVERALL',
                message: `AI shows concerning performance decline across ${overall.negativeImprovements} metrics`,
                impact: 'HIGH',
                confidence: 0.8
            });
        }

        return insights.slice(0, 10); // Limit to top 10 insights
    }

    /**
     * Generate executive summary
     */
    generateSummary(comparison, roiAnalysis) {
        const overall = comparison.overall;
        
        let performance = 'neutral';
        if (overall.overallAssessment === 'AI_SUPERIOR') performance = 'excellent';
        else if (overall.overallAssessment === 'AI_BETTER') performance = 'good';
        else if (overall.overallAssessment === 'BASELINE_BETTER') performance = 'concerning';

        let roiStatus = roiAnalysis.isPositiveROI ? 'positive' : 'negative';
        
        return {
            oneLineSummary: `AI enhancement showing ${performance} performance with ${roiStatus} ROI of ${roiAnalysis.roi.toFixed(1)}%`,
            recommendation: this.getRecommendation(overall.overallAssessment, roiAnalysis.isPositiveROI),
            keyMetric: this.getKeyMetric(comparison),
            confidence: this.getOverallConfidence(comparison, roiAnalysis)
        };
    }

    /**
     * Real-time performance tracking
     */
    async trackRealTimePerformance(tradeResult) {
        try {
            const { symbol, outcome, pnlPercent, aiEnhanced } = tradeResult;
            
            // Update running metrics
            const key = `${symbol}_${aiEnhanced ? 'ai' : 'baseline'}`;
            const currentMetrics = this.metrics[aiEnhanced ? 'aiEnhanced' : 'baseline'].get(key) || {
                trades: 0,
                wins: 0,
                totalReturn: 0
            };

            currentMetrics.trades += 1;
            if (outcome === 'WIN') currentMetrics.wins += 1;
            if (pnlPercent) currentMetrics.totalReturn += pnlPercent;

            this.metrics[aiEnhanced ? 'aiEnhanced' : 'baseline'].set(key, currentMetrics);

            // Log significant performance changes
            const winRate = (currentMetrics.wins / currentMetrics.trades) * 100;
            if (currentMetrics.trades >= 10 && currentMetrics.trades % 5 === 0) {
                console.log(`📊 ${key}: ${currentMetrics.trades} trades, ${winRate.toFixed(1)}% win rate`);
            }

            return {
                symbol,
                aiEnhanced,
                currentWinRate: winRate,
                totalTrades: currentMetrics.trades,
                totalReturn: currentMetrics.totalReturn
            };

        } catch (error) {
            console.error('❌ Real-time tracking failed:', error);
            return null;
        }
    }

    /**
     * Health check for monitoring service
     */
    async healthCheck() {
        try {
            let databaseStatus = 'Unknown';
            let recentTrades = 0;
            let aiTrades = 0;
            
            // Test database connection more gracefully
            try {
                await this.prisma.$connect();
                databaseStatus = 'Connected';
                
                // Try to get trade counts - handle if table doesn't exist
                try {
                    recentTrades = await this.prisma.tradeOutcome.count({
                        where: {
                            entryDate: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                            }
                        }
                    });

                    aiTrades = await this.prisma.tradeOutcome.count({
                        where: {
                            aiEnhanced: true,
                            entryDate: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        }
                    });
                } catch (tableError) {
                    console.warn('⚠️ TradeOutcome table not found - this is normal for new installations');
                    databaseStatus = 'Connected (Tables not initialized)';
                    recentTrades = 0;
                    aiTrades = 0;
                }
                
            } catch (dbError) {
                console.warn('⚠️ Database connection failed:', dbError.message);
                databaseStatus = `Connection Failed: ${dbError.message}`;
            }

            return {
                status: databaseStatus === 'Connected' ? 'HEALTHY' : 'DEGRADED',
                database: databaseStatus,
                recentTrades,
                aiTrades,
                baseline: recentTrades - aiTrades,
                metricsCache: `${this.metrics.aiEnhanced.size + this.metrics.baseline.size} symbols tracked`,
                lastCheck: new Date()
            };

        } catch (error) {
            return {
                status: 'ERROR',
                error: error.message,
                database: 'Health check failed',
                lastCheck: new Date()
            };
        }
    }

    // Helper methods
    getEmptyMetrics(groupType) {
        return {
            groupType,
            totalTrades: 0,
            winRate: 0,
            lossRate: 0,
            avgReturn: 0,
            avgWinReturn: 0,
            avgLossReturn: 0,
            maxWin: 0,
            maxLoss: 0,
            profitFactor: 0,
            avgDuration: 0,
            volatility: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            gradeImprovement: null,
            lastUpdated: new Date()
        };
    }

    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance);
    }

    calculateSharpeRatio(returns) {
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const volatility = this.calculateVolatility(returns);
        
        return volatility > 0 ? avgReturn / volatility : 0;
    }

    calculateMaxDrawdown(trades) {
        if (trades.length === 0) return 0;

        let maxDrawdown = 0;
        let peak = 0;
        let cumulative = 0;

        trades.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

        trades.forEach(trade => {
            if (trade.pnlPercent !== null) {
                cumulative += trade.pnlPercent;
                if (cumulative > peak) peak = cumulative;
                const drawdown = peak - cumulative;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }
        });

        return maxDrawdown;
    }

    calculateGradeImprovement(trades) {
        const gradesWithImprovement = trades.filter(t => 
            t.originalGrade && t.enhancedGrade && t.originalGrade !== t.enhancedGrade
        );

        if (gradesWithImprovement.length === 0) return null;

        // Convert grades to numeric values for comparison
        const gradeToNumber = (grade) => {
            const gradeMap = { 'F': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4 };
            const baseLetter = grade.charAt(0);
            const modifier = grade.includes('+') ? 0.3 : grade.includes('-') ? -0.3 : 0;
            return (gradeMap[baseLetter] || 2) + modifier;
        };

        const improvements = gradesWithImprovement.map(t => 
            gradeToNumber(t.enhancedGrade) - gradeToNumber(t.originalGrade)
        );

        const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
        const positiveImprovements = improvements.filter(imp => imp > 0).length;

        return {
            totalGraded: gradesWithImprovement.length,
            avgImprovement,
            positiveImprovements,
            improvementRate: (positiveImprovements / gradesWithImprovement.length) * 100
        };
    }

    isPositiveImprovement(metric, improvement) {
        // Metrics where higher is better
        const higherIsBetter = ['winRate', 'avgReturn', 'avgWinReturn', 'profitFactor', 'sharpeRatio'];
        // Metrics where lower is better
        const lowerIsBetter = ['avgLossReturn', 'maxLoss', 'volatility', 'maxDrawdown', 'avgDuration'];
        
        if (higherIsBetter.includes(metric)) return improvement > 0;
        if (lowerIsBetter.includes(metric)) return improvement < 0;
        
        return improvement > 0; // Default assumption
    }

    getOverallAssessment(positiveCount, negativeCount, totalMetrics) {
        const positiveRatio = positiveCount / totalMetrics;
        const negativeRatio = negativeCount / totalMetrics;
        
        if (positiveRatio >= 0.6) return 'AI_SUPERIOR';
        if (positiveRatio >= 0.4) return 'AI_BETTER';
        if (negativeRatio >= 0.6) return 'BASELINE_SUPERIOR';
        if (negativeRatio >= 0.4) return 'BASELINE_BETTER';
        
        return 'NEUTRAL';
    }

    getRecommendation(assessment, positiveROI) {
        if (assessment === 'AI_SUPERIOR' && positiveROI) {
            return 'Continue and expand AI enhancement usage';
        }
        if (assessment === 'AI_BETTER' && positiveROI) {
            return 'Maintain current AI enhancement approach';
        }
        if (!positiveROI) {
            return 'Review AI enhancement costs and optimize implementation';
        }
        if (assessment.includes('BASELINE')) {
            return 'Analyze AI enhancement issues and consider adjustments';
        }
        
        return 'Monitor performance and gather more data';
    }

    getKeyMetric(comparison) {
        // Find the metric with the highest absolute improvement
        let keyMetric = { name: 'winRate', improvement: 0 };
        
        Object.entries(comparison).forEach(([metric, data]) => {
            if (metric !== 'overall' && Math.abs(data.improvementPercent) > Math.abs(keyMetric.improvement)) {
                keyMetric = { name: metric, improvement: data.improvementPercent };
            }
        });
        
        return keyMetric;
    }

    getOverallConfidence(comparison, roiAnalysis) {
        // Calculate confidence based on sample sizes and consistency
        const aiSampleSize = comparison.winRate?.ai || 0;
        const baselineSampleSize = comparison.winRate?.baseline || 0;
        
        let confidence = 0.5; // Base confidence
        
        // Adjust for sample sizes
        if (aiSampleSize >= 20 && baselineSampleSize >= 20) confidence += 0.2;
        if (aiSampleSize >= 50 && baselineSampleSize >= 50) confidence += 0.1;
        
        // Adjust for consistency across metrics
        const positiveCount = comparison.overall.positiveImprovements;
        const negativeCount = comparison.overall.negativeImprovements;
        const consistency = Math.abs(positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
        confidence += consistency * 0.2;
        
        return Math.min(confidence, 0.95);
    }

    createErrorReport(error) {
        return {
            period: { days: 0, startDate: null, endDate: null },
            filters: {},
            aiEnhanced: this.getEmptyMetrics('AI_ENHANCED'),
            baseline: this.getEmptyMetrics('BASELINE'),
            comparison: { overall: { overallAssessment: 'ERROR' } },
            roiAnalysis: { roi: 0, isPositiveROI: false },
            insights: [{
                type: 'ERROR',
                category: 'SYSTEM',
                message: 'Performance monitoring temporarily unavailable',
                impact: 'LOW',
                confidence: 0.1
            }],
            summary: {
                oneLineSummary: 'Performance report unavailable due to system error',
                recommendation: 'Contact support if issue persists',
                keyMetric: { name: 'none', improvement: 0 },
                confidence: 0.1
            },
            error,
            reportGenerated: new Date()
        };
    }
}

module.exports = IntelligentMonitoring;
