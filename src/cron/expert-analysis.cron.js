const cron = require('node-cron');
const WatchlistManager = require('../services/watchlistManager');

class ExpertAnalysisCron {
  constructor() {
    this.watchlistManager = new WatchlistManager();
    this.isRunning = false;
  }

  // Start all scheduled tasks
  start() {
    console.log('🚀 Starting Expert Analysis Cron Jobs...');

    // NIFTY 200 Core Analysis: Tuesday-Friday at 9:00 AM Singapore Time
    this.scheduleNiftyCore();

    // NIFTY Satellite Analysis: Saturday at 9:00 AM Singapore Time
    this.scheduleNiftySatellite();
  }

  // Schedule NIFTY 200 Core analysis (Tuesday-Friday 9 AM SG time)
  scheduleNiftyCore() {
    // Cron: 0 9 * * 2-5 (9 AM, Tuesday to Friday, Singapore timezone)
    const coreJob = cron.schedule('0 9 * * 2-5', async () => {
      if (this.isRunning) {
        console.log('⏳ Expert analysis already running, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        console.log('📊 Starting NIFTY 200 CORE Analysis at', new Date().toISOString());
        
        await this.runCoreAnalysis();
        
        console.log('✅ NIFTY 200 CORE Analysis completed successfully');
      } catch (error) {
        console.error('❌ NIFTY 200 CORE Analysis failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false,
      timezone: "Asia/Singapore"
    });

    coreJob.start();
    console.log('📅 Scheduled NIFTY 200 CORE: Tuesday-Friday 9:00 AM SG Time');
  }

  // Schedule NIFTY Satellite analysis (Saturday 9 AM SG time)
  scheduleNiftySatellite() {
    // Cron: 0 9 * * 6 (9 AM, Saturday, Singapore timezone)
    const satelliteJob = cron.schedule('0 9 * * 6', async () => {
      if (this.isRunning) {
        console.log('⏳ Expert analysis already running, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        console.log('🛰️ Starting NIFTY SATELLITE Analysis at', new Date().toISOString());
        
        await this.runSatelliteAnalysis();
        
        console.log('✅ NIFTY SATELLITE Analysis completed successfully');
      } catch (error) {
        console.error('❌ NIFTY SATELLITE Analysis failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: false,
      timezone: "Asia/Singapore"
    });

    satelliteJob.start();
    console.log('📅 Scheduled NIFTY SATELLITE: Saturday 9:00 AM SG Time');
  }

  // Run NIFTY 200 Core analysis
  async runCoreAnalysis() {
    const analysisOptions = {
      universe: 'NIFTY_200_CORE',
      priorityFilters: {
        liquidityTier: ['TIER_1', 'TIER_2'], // Focus on most liquid
        minMarketCap: 5000, // 50B+ market cap
        sectors: ['FINANCE', 'IT', 'CONSUMER', 'PHARMA'] // Core sectors
      },
      signals: {
        strengthening: true,
        degrading: true,
        breaking: false, // Skip breaking signals on weekdays
        recovering: true
      }
    };

    const result = await this.watchlistManager.runExpertAnalysis(analysisOptions);
    
    // Log summary
    console.log(`📈 Core Analysis Results:
    - Total Analyzed: ${result.summary.totalAnalyzed}
    - Strengthening: ${result.summary.signalCounts.STRENGTHENING}
    - Degrading: ${result.summary.signalCounts.DEGRADING}
    - Recovering: ${result.summary.signalCounts.RECOVERING}
    - High Priority: ${result.recommendations.high.length}
    - Medium Priority: ${result.recommendations.medium.length}`);

    return result;
  }

  // Run NIFTY Satellite analysis (broader weekend analysis)
  async runSatelliteAnalysis() {
    const analysisOptions = {
      universe: 'NIFTY_SATELLITE',
      priorityFilters: {
        liquidityTier: ['TIER_1', 'TIER_2', 'TIER_3'], // Include tier 3 on weekends
        minMarketCap: 1000, // 10B+ market cap (lower for satellite)
        sectors: 'ALL' // All sectors on weekend
      },
      signals: {
        strengthening: true,
        degrading: true,
        breaking: true, // Include breaking signals on weekend
        recovering: true
      }
    };

    const result = await this.watchlistManager.runExpertAnalysis(analysisOptions);
    
    // Log summary
    console.log(`🛰️ Satellite Analysis Results:
    - Total Analyzed: ${result.summary.totalAnalyzed}
    - Strengthening: ${result.summary.signalCounts.STRENGTHENING}
    - Degrading: ${result.summary.signalCounts.DEGRADING}
    - Breaking: ${result.summary.signalCounts.BREAKING}
    - Recovering: ${result.summary.signalCounts.RECOVERING}
    - High Priority: ${result.recommendations.high.length}
    - Medium Priority: ${result.recommendations.medium.length}
    - Low Priority: ${result.recommendations.low.length}`);

    return result;
  }

  // Manual trigger for testing
  async runManualAnalysis(universe = 'NIFTY_200_CORE') {
    if (this.isRunning) {
      throw new Error('Analysis already running');
    }

    try {
      this.isRunning = true;
      console.log(`🔧 Manual ${universe} analysis started...`);
      
      if (universe === 'NIFTY_200_CORE') {
        return await this.runCoreAnalysis();
      } else {
        return await this.runSatelliteAnalysis();
      }
    } finally {
      this.isRunning = false;
    }
  }

  // Stop all cron jobs
  stop() {
    cron.getTasks().forEach(task => task.stop());
    console.log('🛑 Expert Analysis Cron Jobs stopped');
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: cron.getTasks().size,
      timezone: 'Asia/Singapore',
      schedule: {
        core: 'Tuesday-Friday 9:00 AM SG Time',
        satellite: 'Saturday 9:00 AM SG Time'
      }
    };
  }
}

module.exports = ExpertAnalysisCron;
