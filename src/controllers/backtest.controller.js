/**
 * 🎯 BACKTEST API CONTROLLER
 * 
 * REST API endpoints for running and managing backtests
 * Integrates with the main Ishastra backend
 */

const { result } = require('lodash');
const { IshastraBacktest } = require('../../backtest/runBacktest');
const { PrismaClient } = require('@prisma/client');

class BacktestController {
    constructor() {
        this.backtest = new IshastraBacktest();
        this.prisma = new PrismaClient();
        this.runningBacktests = new Map(); // Track running backtests
    }

    /**
     * POST /api/backtest/run
     * Start a new backtest
     */
    async runBacktest(req, res) {
        try {
            const { symbol } = req.body;

            // Validate input
            if (!symbol) {
                return res.status(400).json({
                    success: false,
                    error: 'symbol is required',
                    example: {
                        symbol: 'AAPL'
                    }
                });
            }

            // Generate backtest ID
            const backtestId = `backtest_${Date.now()}`;
            this.runningBacktests.set(backtestId, { status: 'RUNNING', startTime: new Date() });

            // Run backtest asynchronously
            const result = await this.backtest.runBacktest(symbol);
            const backtestResult = {
                trades: result.trades,
                summary: result.summary,
            }
            // Update status when complete
            res.json({
                result: backtestResult,
                symbol,
            });



        } catch (error) {
            console.error('❌ Backtest API Error:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * GET /api/backtest/status/:id
     * Check backtest status
     */
    async getBacktestStatus(req, res) {
        try {
            const { id } = req.params;

            const backtestStatus = this.runningBacktests.get(id);

            if (!backtestStatus) {
                return res.status(404).json({
                    success: false,
                    error: 'Backtest not found',
                    backtestId: id
                });
            }

            res.json({
                success: true,
                backtestId: id,
                ...backtestStatus
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/backtest/results/:id
     * Get backtest results
     */
    async getBacktestResults(req, res) {
        try {
            const { id } = req.params;

            const backtestStatus = this.runningBacktests.get(id);

            if (!backtestStatus) {
                return res.status(404).json({
                    success: false,
                    error: 'Backtest not found'
                });
            }

            if (backtestStatus.status !== 'COMPLETED') {
                return res.status(400).json({
                    success: false,
                    error: `Backtest is ${backtestStatus.status}`,
                    status: backtestStatus.status
                });
            }

            res.json({
                success: true,
                backtestId: id,
                results: backtestStatus.result
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/backtest/history
     * Get historical backtest trades from database
     */
    async getBacktestHistory(req, res) {
        try {
            const {
                symbol,
                system,
                startDate,
                endDate,
                limit = 100,
                offset = 0
            } = req.query;

            const where = {};

            if (symbol) where.symbol = symbol;
            if (system) where.system = system;
            if (startDate) where.entryDate = { ...where.entryDate, gte: new Date(startDate) };
            if (endDate) where.entryDate = { ...where.entryDate, lte: new Date(endDate) };

            const trades = await this.prisma.backtestTrade.findMany({
                where,
                orderBy: { entryDate: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            });

            const total = await this.prisma.backtestTrade.count({ where });

            res.json({
                success: true,
                trades,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + trades.length) < total
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * GET /api/backtest/analytics
     * Get backtest analytics and summary statistics
     */
    async getBacktestAnalytics(req, res) {
        try {
            const { system, symbol, startDate, endDate } = req.query;

            const where = {};
            if (system) where.system = system;
            if (symbol) where.symbol = symbol;
            if (startDate) where.entryDate = { ...where.entryDate, gte: new Date(startDate) };
            if (endDate) where.entryDate = { ...where.entryDate, lte: new Date(endDate) };

            // Basic statistics
            const totalTrades = await this.prisma.backtestTrade.count({ where });
            const winningTrades = await this.prisma.backtestTrade.count({
                where: { ...where, RMultiple: { gt: 0 } }
            });

            // R-multiple statistics
            const rMultiples = await this.prisma.backtestTrade.findMany({
                where,
                select: { RMultiple: true }
            });

            const rValues = rMultiples.map(r => r.RMultiple);
            const avgRMultiple = rValues.length > 0 ? (rValues.reduce((sum, r) => sum + r, 0) / rValues.length) : 0;
            const maxRMultiple = rValues.length > 0 ? Math.max(...rValues) : 0;
            const minRMultiple = rValues.length > 0 ? Math.min(...rValues) : 0;

            // Exit reason breakdown
            const exitReasons = await this.prisma.backtestTrade.groupBy({
                by: ['reason'],
                where,
                _count: { reason: true }
            });

            // System breakdown
            const systemStats = await this.prisma.backtestTrade.groupBy({
                by: ['system'],
                where,
                _count: { system: true },
                _avg: { RMultiple: true }
            });

            res.json({
                success: true,
                analytics: {
                    totalTrades,
                    winningTrades,
                    winRate: totalTrades > 0 ? ((winningTrades / totalTrades) * 100) : 0,
                    avgRMultiple: Number(avgRMultiple.toFixed(2)),
                    maxRMultiple: Number(maxRMultiple.toFixed(2)),
                    minRMultiple: Number(minRMultiple.toFixed(2)),
                    exitReasons: exitReasons.map(r => ({
                        reason: r.reason,
                        count: r._count.reason,
                        percentage: totalTrades > 0 ? ((r._count.reason / totalTrades) * 100) : 0
                    })),
                    systemStats: systemStats.map(s => ({
                        system: s.system,
                        trades: s._count.system,
                        avgRMultiple: Number((s._avg.RMultiple || 0).toFixed(2))
                    }))
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * DELETE /api/backtest/clear
     * Clear backtest history (admin only)
     */
    async clearBacktestHistory(req, res) {
        try {
            const { confirm } = req.body;

            if (confirm !== 'DELETE_ALL_BACKTEST_DATA') {
                return res.status(400).json({
                    success: false,
                    error: 'Please confirm deletion by sending { "confirm": "DELETE_ALL_BACKTEST_DATA" }'
                });
            }

            const deleted = await this.prisma.backtestTrade.deleteMany({});

            res.json({
                success: true,
                message: `Deleted ${deleted.count} backtest records`,
                deletedCount: deleted.count
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = { BacktestController };
