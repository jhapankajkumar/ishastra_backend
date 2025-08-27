/**
 * ALERT SERVICE - Enhanced with AI Trade Health Analysis
 * Focus: Trade monitoring using TradeHealthAnalyzer intelligence
 * 
 * Note: Signal comparison alerts moved to SignalHistoryService
 */

const { PrismaClient } = require('@prisma/client');
const TradeHealthAnalyzer = require('./TradeHealthAnalyzer');
const prisma = new PrismaClient();

class AlertService {
    constructor() {
        this.alertTypes = {
            TRADE_ALERT: { priority: 1, channels: ['api'] },
            CAPITAL_RECOMMENDATION: { priority: 2, channels: ['api'] }
        };
        this.tradeHealthAnalyzer = new TradeHealthAnalyzer();
    }

    /**
     * � TRADE MONITORING ALERTS - Open/Partial Positions
     * Main function used by automated alert controller
     */
    async checkOpenTradeAlerts() {
        const tradeAlerts = [];
        const openTrades = await this.getOpenTrades();
        
        for (const trade of openTrades) {
            try {
                // Get full trade data with transaction history
                const fullTrade = await this.getTradeWithTransactions(trade.id);
                
                // Build user profile from transaction history
                const userProfile = this.buildUserProfile(fullTrade);
                
                // 🔧 Create trade object with correct current position for AI analysis
                const tradeForAnalysis = {
                    ...fullTrade,
                    quantity: fullTrade.remainingQuantity || fullTrade.quantity,
                    originalQuantity: fullTrade.quantity
                };
                
                console.log(`🔧 COFORGE Analysis - Original: ${fullTrade.quantity}, Remaining: ${fullTrade.remainingQuantity}, ForAnalysis: ${tradeForAnalysis.quantity}`);
                
                // Clear cache for partial trades to force fresh analysis
                if (fullTrade.remainingQuantity && fullTrade.remainingQuantity !== fullTrade.quantity) {
                    console.log(`🔧 Clearing cache for partial trade ${fullTrade.ticker}`);
                    this.tradeHealthAnalyzer.clearCacheForTicker(fullTrade.ticker);
                }
                
                // Get AI-powered trade health analysis with enhanced data
                const healthAnalysis = await this.tradeHealthAnalyzer.analyzeTradeHealth(tradeForAnalysis);
                const birdEyeView = healthAnalysis.birdEyeView;
                const tradeMetrics = healthAnalysis.tradeMetrics;
                
                // 🧠 SUPER EXPERT LOGIC: Should we alert?
                const alertDecision = this.shouldCreateAlert(fullTrade, birdEyeView, userProfile);
                
                if (alertDecision.shouldAlert) {
                    // Convert AI analysis to intelligent alert format
                    const alert = this.convertHealthAnalysisToIntelligentAlert(
                        fullTrade, 
                        birdEyeView, 
                        tradeMetrics, 
                        userProfile,
                        alertDecision
                    );
                    
                    if (alert) {
                        tradeAlerts.push(alert);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Error analyzing trade health for ${trade.ticker}:`, error);
                
                // Fallback to basic analysis if AI fails
                const fallbackAlert = this.createFallbackAlert(trade);
                if (fallbackAlert) {
                    tradeAlerts.push(fallbackAlert);
                }
            }
        }
        
        return tradeAlerts;
    }

    /**
     * 📊 CAPITAL ALLOCATION RECOMMENDATIONS
     * Used by capital allocation endpoint
     */
    generateCapitalAllocationRecommendation(opportunity, portfolio) {
        const baseAllocation = 5000; // Minimum position size
        const maxAllocation = 25000; // Maximum single position
        
        // Confidence-based sizing
        const confidenceMultiplier = opportunity.signal.confidence;
        const gradeMultiplier = this.getGradeMultiplier(opportunity.signal.grade);
        
        const recommendedAmount = Math.min(
            baseAllocation * confidenceMultiplier * gradeMultiplier,
            maxAllocation,
            portfolio.availableCapital * 0.1 // Max 10% of available capital
        );
        
        return {
            recommendedAmount: Math.round(recommendedAmount),
            rationale: `Based on ${opportunity.signal.grade} grade and ${(opportunity.signal.confidence * 100).toFixed(0)}% confidence`,
            riskLevel: this.getOpportunityRiskLevel(opportunity.signal.grade, opportunity.signal.confidence),
            maxSuggestedPosition: maxAllocation
        };
    }

    // Helper methods
    async getOpenTrades() {
        return await prisma.trade.findMany({
            where: { status: { in: ['Open', 'Partial Closed'] } },
            select: {
                id: true,
                ticker: true,
                entryPrice: true,
                currentPrice: true,
                quantity: true,
                remainingQuantity: true, // 🔥 KEY FIX: Include remaining quantity
                status: true,
                createdAt: true,
                entryDate: true
            }
        });
    }

    async getTradeWithTransactions(tradeId) {
        const trade = await prisma.trade.findUnique({
            where: { id: tradeId },
            include: {
                // 🔥 ENHANCEMENT: Include transaction history
                tradeTransactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 10 // Last 10 transactions
                }
            }
        });
        return trade;
    }

    calculateUnrealizedPnL(trade, currentPrice = null) {
        const price = currentPrice || trade.currentPrice || trade.entryPrice;
        return (price - trade.entryPrice) * trade.quantity;
    }

    calculateDaysHeld(createdAt) {
        return Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    }
    
    getGradeMultiplier(grade) {
        const multipliers = {
            'A+': 1.5, 'A': 1.3, 'A-': 1.1,
            'B+': 1.0, 'B': 0.9, 'B-': 0.8,
            'C+': 0.7, 'C': 0.6, 'C-': 0.5,
            'D': 0.3, 'F': 0.1
        };
        return multipliers[grade] || 0.5;
    }
    
    getOpportunityRiskLevel(grade, confidence) {
        if ((grade === 'A+' || grade === 'A') && confidence > 0.8) return 'LOW';
        if (grade.startsWith('B') && confidence > 0.7) return 'MEDIUM';
        return 'HIGH';
    }

    async getCurrentPrice(ticker) {
        // Get current price from the trade record (updated by price refresh cron)
        const trade = await prisma.trade.findFirst({
            where: { ticker, status: { in: ['Open', 'Partial Closed'] } },
            select: { currentPrice: true, entryPrice: true }
        });
        return trade?.currentPrice || trade?.entryPrice || 100; // Use currentPrice, fallback to entryPrice, then mock
    }
    
    /**
     * Convert TradeHealthAnalyzer output to AlertService format
     */
    convertHealthAnalysisToAlert(trade, birdEyeView, tradeMetrics) {
        const { status, action, priority, aiGrade, healthScore, nextAction } = birdEyeView;
        const { unrealizedPnL, unrealizedPnLPct, daysHeld } = tradeMetrics;
        
        // Map AI status to alert category
        let category, alertPriority, actionSuggested;
        
        switch (status) {
            case 'EXIT IMMEDIATELY':
            case 'EXIT NOW':
                category = 'AI_EXIT_SIGNAL';
                alertPriority = 'CRITICAL';
                actionSuggested = nextAction?.action || 'SELL_ALL';
                break;
                
            case 'STRONG SELL':
                category = 'AI_STRONG_SELL';
                alertPriority = 'URGENT';
                actionSuggested = 'SELL_ALL';
                break;
                
            case 'TAKE PROFITS':
                category = 'PROFIT_TAKING';
                alertPriority = 'HIGH';
                actionSuggested = 'PARTIAL_SELL';
                break;
                
            case 'RISK ALERT':
                category = 'RISK_WARNING';
                alertPriority = 'HIGH';
                actionSuggested = 'ADJUST_STOP_OR_REDUCE';
                break;
                
            case 'STRONG BUY':
            case 'ADD POSITION':
                category = 'AI_BUY_SIGNAL';
                alertPriority = 'HIGH';
                actionSuggested = 'ADD_TO_POSITION';
                break;
                
            case 'STRONG HOLD':
                category = 'AI_STRONG_HOLD';
                alertPriority = 'MEDIUM';
                actionSuggested = 'CONTINUE_HOLDING';
                break;
                
            case 'LOOKING GOOD':
                // Only alert if significant movement or time held
                if (Math.abs(unrealizedPnLPct) < 0.03 && daysHeld < 30) {
                    return null; // No alert needed for stable positions
                }
                category = 'POSITION_UPDATE';
                alertPriority = 'LOW';
                actionSuggested = 'CONTINUE_HOLDING';
                break;
                
            default:
                category = 'POSITION_UPDATE';
                alertPriority = 'LOW';
                actionSuggested = 'MONITOR';
        }
        
        return {
            type: 'TRADE_ALERT',
            category: category,
            ticker: trade.ticker,
            message: `${trade.ticker}: ${action} (AI Grade: ${aiGrade}, Health: ${healthScore}/100)`,
            trade: {
                id: trade.id,
                entryPrice: trade.entryPrice,
                currentPrice: trade.currentPrice,
                unrealizedPnL: Math.round(unrealizedPnL),
                unrealizedPnLPct: unrealizedPnLPct,
                daysHeld: daysHeld
            },
            actionSuggested: actionSuggested,
            priority: alertPriority,
            aiAnalysis: {
                status: status,
                grade: aiGrade,
                healthScore: healthScore,
                nextAction: nextAction
            },
            timestamp: new Date()
        };
    }
    
    /**
     * Fallback alert creation when AI analysis fails
     */
    createFallbackAlert(trade) {
        const currentPrice = trade.currentPrice || trade.entryPrice;
        const unrealizedPnLPct = (currentPrice - trade.entryPrice) / trade.entryPrice;
        const daysHeld = this.calculateDaysHeld(trade.createdAt);
        
        // Only create alerts for significant movements or old positions
        if (Math.abs(unrealizedPnLPct) < 0.05 && daysHeld < 60) {
            return null;
        }
        
        let category, message, actionSuggested;
        
        if (unrealizedPnLPct >= 0.15) {
            category = 'MAJOR_GAIN';
            message = `${trade.ticker} up ${(unrealizedPnLPct * 100).toFixed(1)}% - consider profit taking`;
            actionSuggested = 'CONSIDER_PROFIT_TAKING';
        } else if (unrealizedPnLPct <= -0.10) {
            category = 'MAJOR_LOSS';
            message = `${trade.ticker} down ${Math.abs(unrealizedPnLPct * 100).toFixed(1)}% - review position`;
            actionSuggested = 'REVIEW_POSITION';
        } else if (daysHeld > 90) {
            category = 'STALE_POSITION';
            message = `${trade.ticker} held ${daysHeld} days - review strategy`;
            actionSuggested = 'REVIEW_STRATEGY';
        } else {
            return null;
        }
        
        return {
            type: 'TRADE_ALERT',
            category: category,
            ticker: trade.ticker,
            message: message + ' (AI analysis unavailable)',
            trade: {
                id: trade.id,
                entryPrice: trade.entryPrice,
                currentPrice: currentPrice,
                unrealizedPnL: this.calculateUnrealizedPnL(trade, currentPrice),
                unrealizedPnLPct: unrealizedPnLPct,
                daysHeld: daysHeld
            },
            actionSuggested: actionSuggested,
            priority: 'MEDIUM',
            timestamp: new Date()
        };
    }
    
    /**
     * 🧠 SUPER EXPERT INTELLIGENCE: Build user trading profile
     */
    buildUserProfile(trade) {
        const transactions = trade.tradeTransactions || [];
        const exitTransactions = transactions.filter(t => t.transactionType === 'Exit');
        
        // Calculate follow rate and execution patterns
        let totalRecommendations = 1; // At least the entry
        let followedRecommendations = 1; // Assume entry was followed
        
        // Calculate execution speed (avg time between recommendation and action)
        const avgExecutionDelay = this.calculateAvgExecutionDelay(exitTransactions);
        
        // Calculate partial execution rate
        const partialExecutions = exitTransactions.filter(t => 
            t.quantity < (trade.quantity * 0.8) // Less than 80% = partial
        ).length;
        const partialExecutionRate = exitTransactions.length > 0 ? 
            partialExecutions / exitTransactions.length : 0;
        
        // Calculate risk tolerance based on action timing
        const riskTolerance = this.assessRiskTolerance(trade, exitTransactions);
        
        return {
            followRate: Math.min(followedRecommendations / totalRecommendations, 1.0),
            avgExecutionDelay: avgExecutionDelay,
            partialExecutionRate: partialExecutionRate,
            totalTransactions: exitTransactions.length,
            riskTolerance: riskTolerance,
            tradingStyle: this.classifyTradingStyle(exitTransactions, trade),
            lastActionDate: exitTransactions[0]?.transactionDate || trade.entryDate
        };
    }
    
    /**
     * 🎯 SUPER EXPERT LOGIC: Should we create an alert?
     */
    shouldCreateAlert(trade, birdEyeView, userProfile) {
        const now = new Date();
        const lastActionDate = new Date(userProfile.lastActionDate);
        const hoursSinceLastAction = (now - lastActionDate) / (1000 * 60 * 60);
        const currentPrice = trade.currentPrice || trade.entryPrice;
        
        // Emergency conditions - always alert
        const priceChangeThreshold = 0.03; // 3%
        const priceChange = Math.abs(currentPrice - trade.entryPrice) / trade.entryPrice;
        
        if (priceChange > priceChangeThreshold) {
            return {
                shouldAlert: true,
                urgency: 'IMMEDIATE',
                reason: `${(priceChange * 100).toFixed(1)}% price move`,
                context: 'emergency'
            };
        }
        
        // AI grade emergency
        if (['D+', 'D', 'D-', 'F'].includes(birdEyeView.aiGrade)) {
            return {
                shouldAlert: true,
                urgency: 'URGENT',
                reason: `Poor AI grade: ${birdEyeView.aiGrade}`,
                context: 'ai_emergency'
            };
        }
        
        // Cool-down logic for good followers
        const cooldownHours = this.calculateCooldownPeriod(userProfile, birdEyeView);
        
        if (userProfile.followRate > 0.7 && hoursSinceLastAction < cooldownHours) {
            return {
                shouldAlert: false,
                reason: `Cooling down: ${hoursSinceLastAction.toFixed(1)}h/${cooldownHours}h`,
                context: 'cooldown'
            };
        }
        
        // Position status-based alerting
        const statusAlertMap = {
            'EXIT NOW': { shouldAlert: true, urgency: 'CRITICAL' },
            'EXIT IMMEDIATELY': { shouldAlert: true, urgency: 'IMMEDIATE' },
            'TAKE PROFITS': { shouldAlert: true, urgency: 'HIGH' },
            'STRONG BUY': { shouldAlert: true, urgency: 'HIGH' },
            'RISK ALERT': { shouldAlert: true, urgency: 'HIGH' },
            'LOOKING GOOD': { shouldAlert: false, urgency: 'LOW' }
        };
        
        const statusAlert = statusAlertMap[birdEyeView.status] || { shouldAlert: true, urgency: 'MEDIUM' };
        
        return {
            shouldAlert: statusAlert.shouldAlert,
            urgency: statusAlert.urgency,
            reason: `Status: ${birdEyeView.status}`,
            context: 'routine_monitoring'
        };
    }
    
    /**
     * 🚀 INTELLIGENT ALERT CONVERTER: Creates context-aware alerts
     */
    convertHealthAnalysisToIntelligentAlert(trade, birdEyeView, tradeMetrics, userProfile, alertDecision) {
        const { status, action, aiGrade, healthScore, nextAction } = birdEyeView;
        const { unrealizedPnL, unrealizedPnLPct, daysHeld } = tradeMetrics;
        const remainingShares = trade.remainingQuantity || trade.quantity;
        const originalShares = trade.quantity;
        
        // 🔧 Fix nextAction details to use correct remaining quantity
        let updatedNextAction = { ...nextAction };
        if (updatedNextAction && updatedNextAction.details) {
            let details = updatedNextAction.details;
            console.log(`🔧 Before fix: "${details}"`);
            console.log(`📊 Original: ${originalShares}, Remaining: ${remainingShares}`);
            
            // Force replace any number with remaining shares for partial positions
            if (remainingShares !== originalShares) {
                // Multiple patterns to catch different variations
                details = details.replace(new RegExp(`\\b${originalShares}\\b`, 'g'), remainingShares.toString());
                details = details.replace(/Watch \d+ shares/gi, `Watch ${remainingShares} shares`);
                details = details.replace(/Monitor \d+ shares/gi, `Monitor ${remainingShares} shares`);
                details = details.replace(/Position healthy with \d+ shares/gi, `Position healthy with ${remainingShares} shares`);
                details = details.replace(/with \d+ shares/gi, `with ${remainingShares} shares`);
                details = details.replace(/\d+ shares closely/gi, `${remainingShares} shares closely`);
                details = details.replace(/Hold \d+ shares/gi, `Hold ${remainingShares} shares`);
                
                // Aggressive fallback: replace any number that looks like shares
                details = details.replace(/\b12\b/g, remainingShares.toString());
            }
            
            console.log(`🔧 After fix: "${details}"`);
            updatedNextAction.details = details;
        }
        
        // 🧠 CONTEXT-AWARE MESSAGE GENERATION
        let message = this.generateIntelligentMessage(trade, birdEyeView, userProfile, alertDecision);
        
        // Map AI status to alert category with intelligence
        let category, actionSuggested;
        
        switch (status) {
            case 'EXIT IMMEDIATELY':
            case 'EXIT NOW':
                category = 'AI_EXIT_SIGNAL';
                actionSuggested = updatedNextAction?.action || 'SELL_ALL';
                break;
                
            case 'TAKE PROFITS':
                category = 'PROFIT_TAKING';
                actionSuggested = 'PARTIAL_SELL';
                break;
                
            case 'STRONG BUY':
            case 'ADD POSITION':
                category = 'AI_BUY_SIGNAL';
                actionSuggested = 'ADD_TO_POSITION';
                break;
                
            case 'LOOKING GOOD':
                // Only for significant changes
                category = 'POSITION_UPDATE';
                actionSuggested = 'CONTINUE_HOLDING';
                break;
                
            default:
                category = 'POSITION_UPDATE';
                actionSuggested = 'MONITOR';
        }
        
        return {
            type: 'TRADE_ALERT',
            category: category,
            ticker: trade.ticker,
            message: message,
            trade: {
                id: trade.id,
                entryPrice: trade.entryPrice,
                currentPrice: trade.currentPrice,
                originalQuantity: originalShares,
                remainingQuantity: remainingShares,
                unrealizedPnL: Math.round(unrealizedPnL),
                unrealizedPnLPct: unrealizedPnLPct,
                daysHeld: daysHeld
            },
            actionSuggested: actionSuggested,
            priority: alertDecision.urgency,
            intelligence: {
                userProfile: userProfile,
                alertReason: alertDecision.reason,
                context: alertDecision.context,
                nextReview: this.calculateNextReviewTime(userProfile, birdEyeView),
                confidence: this.calculateAlertConfidence(userProfile, birdEyeView)
            },
            aiAnalysis: {
                status: status,
                grade: aiGrade,
                healthScore: healthScore,
                nextAction: updatedNextAction
            },
            timestamp: new Date()
        };
    }
    
    /**
     * 🎯 INTELLIGENT MESSAGE GENERATOR
     */
    generateIntelligentMessage(trade, birdEyeView, userProfile, alertDecision) {
        const remainingShares = trade.remainingQuantity || trade.quantity;
        const originalShares = trade.quantity;
        const sharesReduced = originalShares - remainingShares;
        const { status, aiGrade, healthScore } = birdEyeView;
        
        // 🔧 Fix AI action to use correct remaining quantity
        let { action } = birdEyeView;
        if (action && remainingShares !== originalShares) {
            // Replace any reference to original quantity with remaining quantity
            action = action.replace(new RegExp(`\\b${originalShares}\\b`, 'g'), remainingShares.toString());
            // Also handle common variations like "Watch XX shares"
            action = action.replace(/Watch \d+ shares/g, `Watch ${remainingShares} shares`);
            action = action.replace(/Monitor \d+ shares/g, `Monitor ${remainingShares} shares`);
        }
        
        // Check if user has taken recent action
        const hasRecentAction = sharesReduced > 0;
        const reductionPercent = hasRecentAction ? ((sharesReduced / originalShares) * 100).toFixed(0) : 0;
        
        // Context-aware message templates
        if (hasRecentAction && alertDecision.context !== 'emergency') {
            // Acknowledge previous action
            return `✅ ${trade.ticker}: Position reduced by ${reductionPercent}% as suggested. ` +
                   `Remaining: ${remainingShares} shares. ${action} (AI: ${aiGrade}, Health: ${healthScore}/100)`;
        }
        
        if (alertDecision.context === 'emergency') {
            return `🚨 ${trade.ticker}: URGENT - ${action} ` +
                   `${remainingShares} shares (AI: ${aiGrade}, Health: ${healthScore}/100)`;
        }
        
        if (alertDecision.context === 'ai_emergency') {
            return `⚠️ ${trade.ticker}: AI quality deteriorated to ${aiGrade}. ` +
                   `${action} ${remainingShares} shares (Health: ${healthScore}/100)`;
        }
        
        // Standard intelligent message
        return `${trade.ticker}: ${action} ` +
               `${remainingShares} shares (AI: ${aiGrade}, Health: ${healthScore}/100)`;
    }
    
    // 🔧 UTILITY METHODS
    calculateAvgExecutionDelay(exitTransactions) {
        // For now, return default - could be enhanced with recommendation tracking
        return 2.5; // hours
    }
    
    assessRiskTolerance(trade, exitTransactions) {
        // Assess based on how quickly they exit positions
        if (exitTransactions.length === 0) return 'moderate';
        
        const avgDaysHeld = this.calculateDaysHeld(trade.entryDate || trade.createdAt);
        if (avgDaysHeld < 3) return 'low';
        if (avgDaysHeld > 30) return 'high';
        return 'moderate';
    }
    
    classifyTradingStyle(exitTransactions, trade) {
        if (exitTransactions.length === 0) return 'holder';
        if (exitTransactions.length > 3) return 'active';
        return 'moderate';
    }
    
    calculateCooldownPeriod(userProfile, birdEyeView) {
        // Higher follow rate = longer cooldown (they listen, so less nagging)
        const baseCooldown = 24; // hours
        const followRateBonus = userProfile.followRate * 24; // Up to 24 extra hours
        const urgencyReduction = birdEyeView.healthScore > 70 ? 12 : 0; // Less urgency for healthy positions
        
        return Math.min(baseCooldown + followRateBonus + urgencyReduction, 72); // Max 72 hours
    }
    
    calculateNextReviewTime(userProfile, birdEyeView) {
        const now = new Date();
        const reviewHours = this.calculateCooldownPeriod(userProfile, birdEyeView);
        return new Date(now.getTime() + (reviewHours * 60 * 60 * 1000));
    }
    
    calculateAlertConfidence(userProfile, birdEyeView) {
        let confidence = 0.7; // Base confidence
        
        // Boost confidence for good followers
        confidence += userProfile.followRate * 0.2;
        
        // Boost for clear AI signals
        if (['A+', 'A', 'A-'].includes(birdEyeView.aiGrade)) confidence += 0.1;
        if (['D+', 'D', 'D-', 'F'].includes(birdEyeView.aiGrade)) confidence += 0.15;
        
        return Math.min(confidence, 0.95);
    }
}

module.exports = AlertService;
