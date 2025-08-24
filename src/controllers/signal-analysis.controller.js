/**
 * Generic Trading System Controller - UNIFIED VERSION
 * Supports multiple proven trading systems: Elder's Triple Screen, SEPA/Minervini, and more
 * Real API endpoint using existing data fetching functions with single Yahoo Finance call per stock
 */

const { ElderTripleScreen } = require('../systems/elder-triple-screen');
const MinerviniSEPA = require('../systems/minervini-sepa');
const CupWithHandle = require('../systems/cup-with-handle');
const RSIMeanReversion = require('../systems/rsi-mean-reversion');
const MACDDivergence = require('../systems/macd-divergence');
const { SingleSystemAnalyzer } = require('../systems/single-system-analyzer');
const { SYSTEM_IDS, SYSTEM_TIERS, normalizeSystemKey, getSystemWeight, isCompleteSystem, getHighConvictionThreshold, defaultLookBackPeriod } = require('../utils/systemConstants');

const {
  generateExpertAIDecision,
  prepareAnalysisContext
} = require('./ai/stock.expert.controller');
const CapitalManager = require('../utils/capitalManager');
const { getMarketCapital, getMarketInfo, formatCurrency } = require('../utils/marketUtils');
const { get } = require('lodash');

class TradingSystemController {
  constructor() {
    // Initialize all trading systems
    this.systems = {
      [SYSTEM_IDS.TRIPLE_SCREEN]: new ElderTripleScreen(),
      [SYSTEM_IDS.MINERVINI_SEPA]: new MinerviniSEPA(),
      [SYSTEM_IDS.CAN_SLIM_CUP_HANDLE]: new CupWithHandle(),
      [SYSTEM_IDS.RSI_MEAN_REVERSION]: new RSIMeanReversion(),
      [SYSTEM_IDS.MACD_DIVERGENCE]: new MACDDivergence()
    };
    this.systemAnalyzer = new SingleSystemAnalyzer(generateExpertAIDecision);
  }

  async testSystem(req, res) {
    const { system } = req.body;

    if (!system) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and system are required'
      });
    }

    try {

      const { getAllStocks, getStockBatch } = require('../utils/stockList');
      const symbolsToAnalyze = getStockBatch(); // Gets all 500 stocks
      console.log(`${symbolsToAnalyze.length} stocks from master list for system ${system}`);

      // Step 1: Analyze all symbols in parallel
      console.log('📈 Phase 1: Running comprehensive analysis...');
      const analysisPromises = symbolsToAnalyze.map(async (symbol) => {
        try {
          // Use http module instead of fetch for Node.js compatibility
          const http = require('http');

          const analysisResult = await new Promise((resolve, reject) => {
            const options = {
              hostname: 'localhost',
              port: 8000,
              path: `/api/trading/signal-analysis?symbols=${symbol}`,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            };

            const req = http.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (error) {
                  reject(new Error(`Invalid JSON response: ${data}`));
                }
              });
            });

            req.on('error', (error) => {
              reject(error);
            });

            req.end();
          });

          if (analysisResult.success && analysisResult.results?.[0]) {
            const result = analysisResult.results[0];
            // result.sector = this.getSectorFromSymbol(symbol);
            return result;
          }
          return null;
        } catch (error) {
          console.error(`❌ Analysis failed for ${symbol}:`, error.message);
          return null;
        }
      });

      const allAnalyses = await Promise.all(analysisPromises);
      const validAnalyses = allAnalyses.filter(analysis => analysis !== null);

      console.log(`✅ Analysis complete: ${validAnalyses.length}/${symbolsToAnalyze.length} successful`);
      return res.status(200).json("success");
    } catch (error) {
      console.error(`❌ Single System Analysis Error:`, error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async analyzeSingleSystem(req, res) {
    const { symbol, system } = req.body;

    if (!symbol || !system) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and system are required'
      });
    }

    try {
      const response = await this.getStockAnalysis([system], [symbol]);
      // console.log(`🔧 response`, response);
      return res.status(200).json(response);
    } catch (error) {
      console.error(`❌ Single System Analysis Error:`, error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/trading/stock-analysis
   * Analyze stocks using all available trading systems with REAL API data
   */
  async analyzeTradingSystem(req, res) {
    // console.error(`🚀🚀🚀🚀🚀 [TRADING-SYSTEM] STARTING ANALYSIS REQUEST 🚀🚀🚀🚀🚀`);
    // console.error(`🚀🚀🚀🚀🚀 Request body: ${JSON.stringify(req.body)} 🚀🚀🚀🚀🚀`);

    try {
      const {
        symbols,
        systems
      } = req.body;
      if (!Array.isArray(systems) || systems.length === 0) {
        systems = [SYSTEM_IDS.TRIPLE_SCREEN, SYSTEM_IDS.MINERVINI_SEPA, SYSTEM_IDS.CAN_SLIM_CUP_HANDLE, SYSTEM_IDS.RSI_MEAN_REVERSION, SYSTEM_IDS.MACD_DIVERGENCE]; // Default to all systems
      }

      if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'symbols array is required',
          example: {
            symbols: ['AAPL', 'MSFT', 'GOOGL'],
            systems: ['triple_screen', 'sepa_method'] // Optional
          }
        });
      }

      const response = await this.getStockAnalysis(systems, symbols);

      res.json(response);

    } catch (error) {
      console.error('❌ Elder\'s Triple Screen API Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        system: this.systems.join(', '),
      });
    }
  }

  async getStockAnalysis(systems, symbols) {
    // console.log(`🔧 Supported systems:`, systems, symbols);
    // Normalize and validate systems
    // //console.log(`🔧 Original systems:`, systems);
    const normalizedSystems = systems.map(sys => normalizeSystemKey(sys));
    // console.log(`🔧 Normalized systems:`, normalizedSystems);
    // console.log(`🔧 Available systems:`, Object.keys(this.systems));
    const supportedSystems = normalizedSystems.filter(sys => this.systems[sys]);
    // console.log(`🔧 Supported systems:`, supportedSystems);

    if (supportedSystems.length === 0) {
      return {
        success: false,
        error: 'No supported systems specified',
        availableSystems: Object.keys(this.systems),
        received: normalizedSystems
      };
    }

    console.log(`📊 Analyzing ${symbols.length} stocks: ${symbols.join(', ')}`);

    // PERFORMANCE OPTIMIZATION: Limit symbols and process in parallel
    const maxSymbols = 10; // Limit for performance
    const limitedSymbols = symbols.slice(0, maxSymbols);

    // Process all symbols in parallel instead of sequential
    const symbolPromises = limitedSymbols.map(async (symbol) => {
      try {
        // Get symbol-specific capital for this analysis
        const capitalInfo = await getMarketCapital(symbol, CapitalManager);
        const remainingCapital = capitalInfo.remaining;

        //Prepare analysis context
        const { analysisContext } = await prepareAnalysisContext(symbol, defaultLookBackPeriod, remainingCapital); // Uses symbol-specific capital

        // Log any failures for debugging
        [
          ['Technical', analysisContext.technical],
          ['Backtest', analysisContext.backtest],
          ['Sentiment', analysisContext.sentiment],
          ['TailRisk', analysisContext.tailRisk],
          ['Microstructure', analysisContext.microstructure],
          ['MonteCarlo', analysisContext.monteCarlo]
        ].forEach(([name, result]) => {
          if (result && result.status === 'rejected') {
            console.log(`    ⚠️ ${name} data failed: ${result.reason?.message || result.reason}`);
          } else {
            //console.log(`    ✅ ${name} data: SUCCESS`);
          }
        });

        if (!analysisContext || !analysisContext.technical) {
          throw new Error(`Failed to fetch technical data for ${symbol}`);
        }

        // Phase 2: Run analysis for each requested system
        //console.log(`  🔍 Phase 2: Running ${supportedSystems.length} system(s) analysis for ${symbol}...`);

        const systemResults = {};
        const systemFinalResults = {};

        for (const systemId of supportedSystems) {
          //console.log(`    🔧 Analyzing with ${systemId}...`);

          try {
            // Convert data to system-specific format for the SingleSystemAnalyzer
            let systemData;
            if (systemId === SYSTEM_IDS.TRIPLE_SCREEN) {
              //console.log(`📊 [SYSTEM] Loading Elder Triple Screen system for ${symbol}`);
              systemData = this.convertToElderFormat(analysisContext.technical);
              //console.log(`🔧 [SYSTEM] Elder format result has indicators:`, Object.keys(systemData.indicators.triple_screen || {}));
            } else if (systemId === SYSTEM_IDS.MINERVINI_SEPA) {
              systemData = this.convertToSEPAFormat(analysisContext.technical);
            } else if (systemId === SYSTEM_IDS.CAN_SLIM_CUP_HANDLE) {
              systemData = this.convertToCupHandleFormat(analysisContext.technical);
            } else if (systemId === SYSTEM_IDS.RSI_MEAN_REVERSION) {
              systemData = this.convertToRSIMeanFormat(analysisContext.technical);
            } else if (systemId === SYSTEM_IDS.MACD_DIVERGENCE) {
              systemData = this.convertToMACDDivergenceFormat(analysisContext.technical);
            } else {
              // Default: pass raw technical data
              systemData = analysisContext.technical;
            }


            // Run complete analysis through SingleSystemAnalyzer (includes system analysis + gate engine)
            const finalResult = await Promise.race([
              this.systemAnalyzer.analyzeSystem(systemId, systemData, analysisContext),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Gate analysis timeout')), 15000))
            ]);

            // Extract system analysis from finalResult
            const systemAnalysis = finalResult.system;

            systemResults[systemId] = systemAnalysis;
            systemFinalResults[systemId] = finalResult;

            //console.log(`    ✅ ${systemId} analysis complete: ${systemAnalysis.decision}`);

          } catch (systemError) {
            console.error(`    ❌ ${systemId} analysis failed:`, systemError.message);
            systemResults[systemId] = {
              decision: 'ERROR',
              error: systemError.message,
              confidence: 0
            };
            systemFinalResults[systemId] = {
              action: 'AVOID',
              confidence: 0,
              error: systemError.message
            };
          }
        }

        // Phase 3: Combine results and create unified decision
        //console.log(`  🚪 Phase 3: Creating unified decision for ${symbol}...`);
        const unifiedDecision = this.createUnifiedDecision(systemResults, supportedSystems); // Use system analysis results, not gate engine
        const finalResult = systemFinalResults[supportedSystems[0]] || {}; // Use first system's gate engine result

        // Build comprehensive response using the fetched data
        const technicalData = analysisContext.technical;
        const gateResult = finalResult.gateEngine || {};

        // Build enhanced analysis result with all trading information
        const analysisResult = await this.buildEnhancedTradingResponse({
          symbol,
          technicalData,
          systemResults,
          supportedSystems,
          gateResult,
          finalResult,
          unifiedDecision,
          analysisContext
        });
        return analysisResult;

      } catch (error) {
        console.error(`  ❌ Error analyzing ${symbol}:`, error.message);
        throw { symbol, error: error.message, timestamp: new Date().toISOString() };
      }
    });

    // Wait for all symbols to complete (parallel processing)
    const symbolResults = await Promise.allSettled(symbolPromises);

    const results = [];
    const errors = [];

    symbolResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`${result.value.symbol}: ${result.value.decision?.action || 'UNKNOWN'} (${(result.value.decision?.confidence || 0).toFixed(1)}%)`);
        results.push(result.value);
      } else {
        const symbol = limitedSymbols[index];
        errors.push({
          symbol,
          error: result.reason?.error || result.reason?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Build comprehensive API response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined,
    };

    return response
  }

  // OPTIMIZED: Convert technical data to Elder's format using existing data structure
  convertToElderFormat(technicalData) {
    //console.log(`  🔧 DEBUG: Converting technical data for Elder's system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.ohlcData || technicalData.historicalData || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const indicators = technicalData.indicators || {};
    const technicalIndicators = technicalData.technicalIndicators || {};
    //console.log(`  🔧 Base indicators: ${Object.keys(indicators).join(', ') || 'None'}`);
    //console.log(`  🔧 Tech indicators: ${Object.keys(technicalIndicators).join(', ') || 'None'}`);

    // Create weekly data from daily data (reuse logic)
    const weeklyData = this.convertDailyToWeekly(ohlcData);
    //console.log(`  🔧 Weekly data length: ${weeklyData.length}`);

    // Create intraday simulation from daily data (last 30 days, 6 periods per day)
    const intradayData = this.createIntradayFromDaily(ohlcData.slice(-30));
    //console.log(`  🔧 Intraday data length: ${intradayData.length}`);

    // Calculate required indicators for Elder system
    const dailyRSI = indicators.rsi || technicalIndicators.rsi || this.calculateRSI(ohlcData);
    const dailyStoch = indicators.stochastic || technicalIndicators.stochastic || this.calculateStochastic(ohlcData);
    const weeklyMACD = this.createWeeklyMACD(weeklyData);
    const weeklyEMA10 = this.calculateWeeklyEMA(weeklyData, 10);
    const weeklyEMA40 = this.calculateWeeklyEMA(weeklyData, 40);
    const dailyATR = indicators.atr || technicalIndicators.atr || this.calculateATR(ohlcData);
    const dailyEMA10 = indicators.ema10 || technicalIndicators.ema10 || this.calculateEMA_OHLC(ohlcData, 10);
    const dailyForceIndex = this.calculateForceIndex(ohlcData);


    // Prepare the data structure that matches what Elder system expects
    const elderData = {
      series: {
        daily: ohlcData,
        weekly: weeklyData,
        intraday: intradayData
      },
      indicators: {
        // baseIndicators structure that Elder expects
        base: {
          rsi14: Array.isArray(dailyRSI) ? (dailyRSI.length > 0 ? dailyRSI[dailyRSI.length - 1] : 50) : dailyRSI,
          stoch14: Array.isArray(dailyStoch) ? (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1] : { k: 50, d: 50 }) : dailyStoch,
          atr14: Array.isArray(dailyATR) ? dailyATR : [],
          ema10: Array.isArray(dailyEMA10) ? dailyEMA10 : [],
          ema20: indicators.ema20 || technicalIndicators.ema20 || [],
          ema50: indicators.ema50 || technicalIndicators.ema50 || [],
          ema200: indicators.ema200 || technicalIndicators.ema200 || [],
          macd: indicators.macd || technicalIndicators.macd || [],
          obv: indicators.obv || technicalIndicators.obv || []
        },
        // tripleScreenIndicators structure that Elder expects  
        triple_screen: {
          // Weekly MACD object that the validation expects
          weeklyMACD: weeklyMACD || { macd: 0, signal: 0, hist: 0 },
          // Weekly MACD histogram values (Elder needs last 3 for slope calculation)
          weeklyMACDHist: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 0 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 1] : 0,
          weeklyMACDHist_1: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 1 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 2] : 0,
          weeklyMACDHist_2: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 2 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 3] : 0,
          // Weekly EMAs for trend analysis
          weeklyEMA10: weeklyEMA10 || 0,
          weeklyEMA40: weeklyEMA40 || 0,
          // Daily oscillators for Screen 2
          dailyStochK: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.k || 50 : 50) :
            (dailyStoch?.k || 50),
          dailyStochD: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.d || 50 : 50) :
            (dailyStoch?.d || 50),
          dailyStoch: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.k || 50 : 50) :
            (dailyStoch?.k || 50), // Fallback
          dailyForceIndex: Array.isArray(dailyForceIndex) ?
            (dailyForceIndex.length > 0 ? dailyForceIndex[dailyForceIndex.length - 1] : 0) : 0
        }
      },
      meta: {
        symbol: technicalData.symbol,
        market: 'US'
      }
    };

    //console.log(`  🔧 Final Elder data structure:`);
    //console.log(`    • Daily series: ${elderData.series.daily.length}`);
    //console.log(`    • Weekly series: ${elderData.series.weekly.length}`);
    //console.log(`    • Intraday series: ${elderData.series.intraday.length}`);
    //console.log(`    • Has weeklyMACD: ${elderData.indicators.triple_screen.weeklyMACD ? 'YES' : 'NO'}`);
    //console.log(`    • weeklyMACDHist values: [${elderData.indicators.triple_screen.weeklyMACDHist}, ${elderData.indicators.triple_screen.weeklyMACDHist_1}, ${elderData.indicators.triple_screen.weeklyMACDHist_2}]`);

    return elderData;
  }

  // OPTIMIZED: Reuse existing weekly conversion logic
  convertDailyToWeekly(dailyData) {
    const weeklyData = [];

    for (let i = 0; i < dailyData.length; i += 5) {
      const weekData = dailyData.slice(i, i + 5);
      if (weekData.length === 0) continue;

      const weekly = {
        date: weekData[weekData.length - 1].date,
        open: weekData[0].open,
        high: Math.max(...weekData.map(d => d.high)),
        low: Math.min(...weekData.map(d => d.low)),
        close: weekData[weekData.length - 1].close,
        volume: weekData.reduce((sum, d) => sum + d.volume, 0)
      };

      weeklyData.push(weekly);
    }

    return weeklyData;
  }

  // Create intraday data simulation from daily data
  createIntradayFromDaily(recentDaily) {
    const intradayData = [];

    recentDaily.slice(-10).forEach(day => {
      const dayRange = day.high - day.low;
      const periods = 6; // Simulate 6 intraday periods per day

      for (let i = 0; i < periods; i++) {
        const timePercent = (i + 1) / periods;
        const price = day.low + (dayRange * timePercent * Math.random() * 0.8) + (dayRange * 0.1);

        intradayData.push({
          datetime: new Date(`${day.date}T${9 + Math.floor(i * 1.17)}:${(i * 17) % 60}:00`),
          open: i === 0 ? day.open : intradayData[intradayData.length - 1]?.close || price,
          high: Math.max(price, price * (1 + Math.random() * 0.005)),
          low: Math.min(price, price * (1 - Math.random() * 0.005)),
          close: price,
          volume: Math.floor(day.volume / periods * (0.5 + Math.random()))
        });
      }
    });

    return intradayData;
  }

  // Create weekly MACD from weekly data
  createWeeklyMACD(weeklyData) {
    if (!weeklyData || weeklyData.length < 2) {
      // Not enough data for MACD, return neutral values
      return { macd: [0], signal: [0], hist: [0] };
    }

    const closes = weeklyData.map(w => w.close);

    // Adjust periods for available data
    const ema12Period = Math.min(12, Math.max(2, closes.length - 1));
    const ema26Period = Math.min(26, Math.max(3, closes.length - 1));

    const ema12 = this.calculateEMA(closes, ema12Period);
    const ema26 = this.calculateEMA(closes, ema26Period);

    if (ema12.length === 0 || ema26.length === 0) {
      return { macd: [0], signal: [0], hist: [0] };
    }

    // Calculate MACD line for all available data points
    const macdLine = [];
    const minLength = Math.min(ema12.length, ema26.length);

    for (let i = 0; i < minLength; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }

    if (macdLine.length === 0) {
      return { macd: [0], signal: [0], hist: [0] };
    }

    // Calculate signal line (9-period EMA of MACD, or shorter if not enough data)
    const signalPeriod = Math.min(9, Math.max(2, macdLine.length));
    const signalLine = this.calculateEMA(macdLine, signalPeriod);

    // Calculate histogram array (Elder needs at least last 3 values for slope)
    const histogramArray = [];
    const signalLength = signalLine.length;
    const startIndex = Math.max(0, macdLine.length - Math.max(signalLength, 3));

    for (let i = startIndex; i < macdLine.length; i++) {
      const signalValue = i < signalLength ?
        signalLine[i] :
        (signalLine.length > 0 ? signalLine[signalLine.length - 1] : macdLine[i]);
      histogramArray.push(macdLine[i] - signalValue);
    }

    // Ensure we have at least 3 histogram values for Elder's slope calculation
    while (histogramArray.length < 3) {
      histogramArray.unshift(histogramArray[0] || 0);
    }

    return {
      macd: macdLine,
      signal: signalLine,
      hist: histogramArray  // Array of histogram values (Elder needs this for slope)
    };
  }

  // Calculate RSI
  calculateRSI(ohlcData, period = 14) {
    if (ohlcData.length < period + 1) return [];

    const closes = ohlcData.map(d => d.close);
    const rsi = [];

    for (let i = period; i < closes.length; i++) {
      let gains = 0, losses = 0;

      for (let j = i - period; j < i; j++) {
        const change = closes[j + 1] - closes[j];
        if (change > 0) gains += change;
        else losses -= change;
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / (avgLoss || 0.001);
      const rsiValue = 100 - (100 / (1 + rs));

      rsi.push(rsiValue);
    }

    return rsi;
  }

  // Calculate Stochastic
  calculateStochastic(ohlcData, period = 14) {
    if (ohlcData.length < period) return [];

    const stoch = [];

    for (let i = period - 1; i < ohlcData.length; i++) {
      const periodData = ohlcData.slice(i - period + 1, i + 1);
      const lowestLow = Math.min(...periodData.map(d => d.low));
      const highestHigh = Math.max(...periodData.map(d => d.high));
      const currentClose = ohlcData[i].close;

      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      stoch.push({ k, d: k }); // Simplified D = K
    }

    return stoch;
  }

  // Calculate EMA - fixed version
  calculateEMA(data, period) {
    if (!data || data.length === 0) return [];
    if (period <= 0) return [];

    // Ensure we have valid numeric data
    const validData = data.filter(val => typeof val === 'number' && !isNaN(val));
    if (validData.length === 0) return [];

    // Adjust period if we don't have enough data
    const effectivePeriod = Math.min(period, validData.length);
    if (effectivePeriod === 1) {
      return [validData[validData.length - 1]];
    }

    const k = 2 / (effectivePeriod + 1);
    const ema = [];

    // Start with SMA
    let sum = 0;
    for (let i = 0; i < effectivePeriod; i++) {
      sum += validData[i];
    }
    const sma = sum / effectivePeriod;
    ema.push(sma);

    // Continue with EMA
    for (let i = effectivePeriod; i < validData.length; i++) {
      const prevEMA = ema[ema.length - 1];
      const currentValue = validData[i];
      const newEMA = currentValue * k + prevEMA * (1 - k);
      ema.push(newEMA);
    }

    return ema;
  }

  // Calculate Force Index
  calculateForceIndex(ohlcData) {
    if (!ohlcData || ohlcData.length < 2) return [];
    
    const forceIndex = [];
    
    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];
      
      // Force Index = (Close - Previous Close) * Volume
      const priceChange = current.close - previous.close;
      const volume = current.volume || 1; // Fallback to 1 if volume is missing
      const force = priceChange * volume;
      
      forceIndex.push(force);
    }
    
    return forceIndex;
  }

  // Calculate ATR (Average True Range)
  calculateATR(ohlcData, period = 14) {
    if (!ohlcData || ohlcData.length < period + 1) return [];
    
    const trueRanges = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trueRanges.push(tr);
    }
    
    // Calculate ATR using EMA of True Range
    const atr = [];
    let ema = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
    atr.push(ema);
    
    const k = 2 / (period + 1);
    for (let i = period; i < trueRanges.length; i++) {
      ema = trueRanges[i] * k + ema * (1 - k);
      atr.push(ema);
    }
    
    return atr;
  }
  calculateWeeklyEMA(weeklyData, period) {
    if (!weeklyData || weeklyData.length === 0) return null;

    // For periods longer than available data, use all available data
    const adjustedPeriod = Math.min(period, weeklyData.length);

    if (adjustedPeriod < 2) {
      // If we have very little data, just return the latest close
      return weeklyData[weeklyData.length - 1].close;
    }

    const closes = weeklyData.map(w => w.close);
    const ema = this.calculateEMA(closes, adjustedPeriod);

    // Return the latest EMA value
    return ema.length > 0 ? ema[ema.length - 1] : closes[closes.length - 1];
  }


  // NEW: Convert technical data to SEPA format for Minervini analysis
  convertToSEPAFormat(technicalData) {
    //console.log(`  🔧 DEBUG: Converting technical data for SEPA system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.ohlcData || technicalData.historicalData || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const indicators = technicalData.indicators || {};
    const technicalIndicators = technicalData.technicalIndicators || {};

    // Calculate required EMAs for SEPA system
    const ema10 = indicators.ema10 || technicalIndicators.ema10 || this.calculateEMA_OHLC(ohlcData, 10);
    const ema20 = indicators.ema20 || technicalIndicators.ema20 || this.calculateEMA_OHLC(ohlcData, 20);
    const ema21 = indicators.ema21 || technicalIndicators.ema21 || this.calculateEMA_OHLC(ohlcData, 21);
    const ema150 = indicators.ema150 || technicalIndicators.ema150 || this.calculateEMA_OHLC(ohlcData, 150);
    const ema200 = indicators.ema200 || technicalIndicators.ema200 || this.calculateEMA_OHLC(ohlcData, 200);
    const sma150 = indicators.sma150 || technicalIndicators.sma150 || this.calculateSMA(ohlcData, 150);
    const sma200 = indicators.sma200 || technicalIndicators.sma200 || this.calculateSMA(ohlcData, 200);

    // Create SEPA-specific data structure that matches what the system expects
    const sepaData = {
      series: {
        daily: ohlcData,
        weekly: this.convertDailyToWeekly(ohlcData)
      },
      indicators: {
        // Base indicators structure that SEPA system expects
        base: {
          ema10: ema10,
          ema21: ema21,
          ema50: indicators.ema50 || technicalIndicators.ema50 || this.calculateEMA_OHLC(ohlcData, 50),
          ema150: ema150,
          ema200: ema200,
          sma50: indicators.sma50 || technicalIndicators.sma50 || this.calculateSMA(ohlcData, 50),
          sma150: sma150,
          sma200: sma200,
          rsi14: indicators.rsi || technicalIndicators.rsi || this.calculateRSI(ohlcData),
          volume: ohlcData.map(d => d.volume)
        },
        // SEPA-specific indicators structure  
        sepa_specific: {
          // Price vs EMA relationships that SEPA system needs
          priceVsEma10: this.calculatePriceVsMA(ohlcData, Array.isArray(ema10) ? ema10 : [ema10]),
          priceVsEma21: this.calculatePriceVsMA(ohlcData, Array.isArray(ema21) ? ema21 : [ema21]),
          ema10: Array.isArray(ema10) ? ema10 : [ema10],
          ema20: Array.isArray(ema20) ? ema20 : [ema20],
          ema21: Array.isArray(ema21) ? ema21 : [ema21],
          // Additional SEPA analysis helpers
          trendsAlignment: this.calculateTrendsAlignment(ohlcData, {
            ema10: ema10,
            ema21: ema21,
            ema50: indicators.ema50 || technicalIndicators.ema50,
            sma150: sma150,
            sma200: sma200
          }),
          stageIdentifiers: this.calculateStageIdentifiers(ohlcData, {
            ema150: ema150,
            ema200: ema200,
            sma150: sma150,
            sma200: sma200
          }),
          volumeProfile: this.calculateVolumeProfile(ohlcData)
        }
      },
      meta: {
        symbol: technicalData.symbol,
        market: 'US',
        methodology: 'SEPA'
      }
    };

    //console.log(`  🔧 Final SEPA data structure:`);
    //console.log(`    • Daily series: ${sepaData.series.daily.length}`);
    //console.log(`    • Weekly series: ${sepaData.series.weekly.length}`);
    //console.log(`    • Base ema10 length: ${Array.isArray(sepaData.indicators.base.ema10) ? sepaData.indicators.base.ema10.length : 'single value'}`);
    //console.log(`    • SEPA ema10 length: ${Array.isArray(sepaData.indicators.sepa_specific.ema10) ? sepaData.indicators.sepa_specific.ema10.length : 'single value'}`);
    //console.log(`    • Has SEPA indicators: ${sepaData.indicators.sepa_specific ? 'YES' : 'NO'}`);

    return sepaData;
  }

  // NEW: Create unified decision from multiple system results
  createUnifiedDecision(systemResults, supportedSystems) {
    //console.log(`  🎯 Creating unified decision from ${supportedSystems.length} systems...`);

    // Convert object to array of results - expect system analysis format
    const resultsArray = Object.values(systemResults).filter(result => {
      return result && result.decision && result.decision !== 'AVOID';
    }).map(result => ({
      action: result.decision,
      confidence: result.confidence || 0,
      system: result.system || 'UNKNOWN'
    }));

    if (resultsArray.length === 0) {
      return {
        action: 'AVOID',
        confidence: 0,
        reasoning: 'No valid system analysis available',
        methodology: 'FALLBACK',
        systemsAgreement: 'NONE'
      };
    }

    // Calculate system agreement
    const actions = resultsArray.map(r => r.action);
    const uniqueActions = [...new Set(actions)];
    const agreement = uniqueActions.length === 1 ? 'FULL' :
      uniqueActions.length === 2 ? 'PARTIAL' : 'NONE';

    // Determine unified action based on system weights and agreement
    let unifiedAction = 'AVOID';
    let unifiedConfidence = 0;
    let reasoning = [];

    if (agreement === 'FULL') {
      // All systems agree
      unifiedAction = actions[0];
      unifiedConfidence = resultsArray.reduce((sum, r) => sum + r.confidence, 0) / resultsArray.length;
      reasoning.push(`All ${resultsArray.length} systems agree on ${unifiedAction}`);
    } else if (agreement === 'PARTIAL') {
      // Professional weighted decision using hierarchical system classification
      const weightedResults = resultsArray.map(result => ({
        ...result,
        weight: getSystemWeight(result) // Use centralized system weighting from constants
      }));

      const totalWeight = weightedResults.reduce((sum, r) => sum + r.weight, 0);
      const buyWeight = weightedResults.filter(r => r.action === 'BUY' || r.action === 'STRONG_BUY').reduce((sum, r) => sum + r.weight, 0);
      const sellWeight = weightedResults.filter(r => r.action === 'SELL' || r.action === 'STRONG_SELL').reduce((sum, r) => sum + r.weight, 0);
      const watchWeight = weightedResults.filter(r => r.action === 'WATCH').reduce((sum, r) => sum + r.weight, 0);

      // Professional high-conviction logic using system tier classification
      const completeSystemSignals = resultsArray.filter(r =>
        isCompleteSystem(r.system) && r.confidence >= getHighConvictionThreshold(r.system)
      );
      const indicatorSystemSignals = resultsArray.filter(r =>
        !isCompleteSystem(r.system) && r.confidence >= getHighConvictionThreshold(r.system)
      );

      // Complete systems can override at their tier thresholds, indicators need higher confidence
      const hasExceptionalSignal = completeSystemSignals.length > 0 || indicatorSystemSignals.length > 0;

      // Dynamic threshold based on signal quality
      const maxConfidence = Math.max(...weightedResults.map(r => r.confidence));
      const dynamicThreshold = maxConfidence >= 0.8 ? 0.40 :  // Lower threshold for high-confidence signals
        maxConfidence >= 0.7 ? 0.50 :  // Medium threshold for good signals
          maxConfidence >= 0.6 ? 0.55 :  // Higher threshold for moderate signals
            0.60;                           // Original threshold for weak signals

      if (hasExceptionalSignal) {
        // Professional override: Complete systems take precedence over indicators
        const allHighConvictionSignals = [...completeSystemSignals, ...indicatorSystemSignals];
        const strongestSignal = allHighConvictionSignals.reduce((prev, current) => {
          // Priority: Complete systems > Indicators, then by confidence
          const prevIsComplete = isCompleteSystem(prev.system);
          const currentIsComplete = isCompleteSystem(current.system);

          if (prevIsComplete && !currentIsComplete) return prev;
          if (!prevIsComplete && currentIsComplete) return current;
          return current.confidence > prev.confidence ? current : prev;
        });

        unifiedAction = strongestSignal.action === 'STRONG_BUY' ? 'BUY' : strongestSignal.action === 'STRONG_SELL' ? 'SELL' : strongestSignal.action;
        unifiedConfidence = strongestSignal.confidence * 0.9; // Higher confidence preservation for system hierarchy

        const systemConfig = SYSTEM_TIERS[strongestSignal.system];
        const systemType = systemConfig ? systemConfig.type : 'UNKNOWN_SYSTEM';
        const systemName = systemConfig ? systemConfig.name : strongestSignal.system.toUpperCase();

        reasoning.push(`HIGH CONVICTION ${systemType}: ${systemName} at ${(strongestSignal.confidence * 100).toFixed(1)}% confidence overrides consensus`);
        reasoning.push(`Position sizing: ${isCompleteSystem(strongestSignal.system) ? '75%' : '60%'} due to system classification`);

      } else if (buyWeight > sellWeight && buyWeight > totalWeight * dynamicThreshold) {
        unifiedAction = 'BUY';
        unifiedConfidence = buyWeight / totalWeight;
        reasoning.push(`Weighted analysis favors BUY (${(buyWeight / totalWeight * 100).toFixed(1)}% confidence, ${dynamicThreshold * 100}% threshold)`);

      } else if (sellWeight > buyWeight && sellWeight > totalWeight * dynamicThreshold) {
        unifiedAction = 'SELL';
        unifiedConfidence = sellWeight / totalWeight;
        reasoning.push(`Weighted analysis favors SELL (${(sellWeight / totalWeight * 100).toFixed(1)}% confidence, ${dynamicThreshold * 100}% threshold)`);

      } else if (watchWeight > Math.max(buyWeight, sellWeight) && watchWeight > totalWeight * 0.35) {
        // WATCH signals can be valuable - don't ignore them
        unifiedAction = 'WATCH';
        unifiedConfidence = watchWeight / totalWeight;
        reasoning.push(`Multiple systems suggest WATCH (${(watchWeight / totalWeight * 100).toFixed(1)}% weight) - setup developing`);

      } else {
        unifiedAction = 'AVOID';
        unifiedConfidence = Math.max(buyWeight, sellWeight, watchWeight) / totalWeight;
        reasoning.push(`Systems disagree (${dynamicThreshold * 100}% threshold not met), AVOID position`);
      }
    } else {
      // No agreement - conservative approach
      unifiedAction = 'AVOID';
      unifiedConfidence = 0.3;
      reasoning.push(`Systems show no agreement, taking conservative AVOID position`);
    }

    // Add system-specific reasoning
    resultsArray.forEach(result => {
      // const systemName = result.system === 'TRIPLE_SCREEN' ? 'Elder Triple Screen' : 'Minervini SEPA';
      reasoning.push(`${result.system}: ${result.action} (${(result.confidence * 100).toFixed(1)}%)`);
    });

    const unifiedDecision = {
      action: unifiedAction,
      confidence: Math.min(unifiedConfidence, 1.0),
      reasoning: reasoning.join('; '),
      methodology: `UNIFIED_${supportedSystems.length}_SYSTEM`,
      systemsAgreement: agreement,
      systemsAnalyzed: supportedSystems.length,
      validSystems: resultsArray.length
    };

    //console.log(`  🎯 Unified Decision: ${unifiedAction} (${(unifiedConfidence * 100).toFixed(1)}% confidence, ${agreement} agreement)`);

    return unifiedDecision;
  }

  // Helper methods for SEPA calculations  
  calculateEMA_OHLC(data, period) {
    if (!data || data.length < period) return [];
    // Simple EMA calculation for OHLC data - could be enhanced
    const ema = [];
    const multiplier = 2 / (period + 1);
    ema[0] = data[0].close;

    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i].close * multiplier) + (ema[i - 1] * (1 - multiplier));
    }

    return ema;
  }

  calculateSMA(data, period) {
    if (!data || data.length < period) return [];
    const sma = [];

    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
      sma.push(sum / period);
    }

    return sma;
  }

  calculatePriceVsMA(ohlcData, maData) {
    if (!ohlcData || !maData || ohlcData.length !== maData.length) return [];
    return ohlcData.map((candle, i) => ({
      date: candle.date,
      priceAboveMA: candle.close > maData[i],
      percentage: maData[i] ? ((candle.close - maData[i]) / maData[i] * 100) : 0
    }));
  }

  calculateTrendsAlignment(ohlcData, indicators) {
    // Simplified trends alignment calculation
    const latest = ohlcData[ohlcData.length - 1];
    if (!latest) return { aligned: false, strength: 0 };

    const alignmentFactors = [];

    // Check if price is above key EMAs
    if (indicators.ema10 && latest.close > indicators.ema10[indicators.ema10.length - 1]) alignmentFactors.push(1);
    if (indicators.ema21 && latest.close > indicators.ema21[indicators.ema21.length - 1]) alignmentFactors.push(1);
    if (indicators.ema50 && latest.close > indicators.ema50[indicators.ema50.length - 1]) alignmentFactors.push(1);

    return {
      aligned: alignmentFactors.length >= 2,
      strength: alignmentFactors.length / 3
    };
  }

  calculateStageIdentifiers(ohlcData, indicators) {
    // Simplified stage identification
    const latest = ohlcData[ohlcData.length - 1];
    if (!latest) return { stage: 4, confidence: 0 };

    // Basic stage logic - would be enhanced in production
    if (latest.close > (indicators.ema200?.[indicators.ema200.length - 1] || latest.close)) {
      return { stage: 2, confidence: 0.7 }; // Markup phase
    } else {
      return { stage: 4, confidence: 0.6 }; // Decline phase
    }
  }

  calculateVolumeProfile(ohlcData) {
    if (!ohlcData || ohlcData.length === 0) return { avgVolume: 0, recentVsAvg: 1 };

    const recent20 = ohlcData.slice(-20);
    const avgVolume = recent20.reduce((sum, d) => sum + d.volume, 0) / recent20.length;
    const latestVolume = ohlcData[ohlcData.length - 1].volume;

    return {
      avgVolume,
      recentVsAvg: avgVolume > 0 ? latestVolume / avgVolume : 1,
      volumeTrend: recent20.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5 > avgVolume ? 'INCREASING' : 'DECREASING'
    };
  }

  // NEW: Build enhanced trading response with all critical trading information
  // NEW: Build enhanced trading response with CLEAN single decision structure
  async buildEnhancedTradingResponse({
    symbol,
    technicalData,
    systemResults,
    supportedSystems,
    gateResult,
    unifiedDecision,
    analysisContext
  }) {

    // console.log('system results:', systemResults);
    // console.log('unified decision:', unifiedDecision);
    // if (unifiedDecision.action === 'AVOID') {
    //   return {
    //     symbol,
    //     timestamp: new Date().toISOString(),
    //     decision: {
    //       action: unifiedDecision.action,
    //       confidence: unifiedDecision.confidence,
    //       reasoning: unifiedDecision.reasoning,
    //       systemsAgreement: unifiedDecision.systemsAgreement || 'PARTIAL',
    //       systemsAnalyzed: unifiedDecision.systemsAnalyzed || 0
    //     },
    //   };
    // }
    const currentPrice = technicalData.currentPrice || technicalData.latestPrice;

    // Get the signal action to determine long vs short position logic
    const signalAction = unifiedDecision.action || 'AVOID';

    // CREATE SINGLE UNIFIED DECISION (no confusion)
    const unifiedAction = unifiedDecision.action || 'AVOID';
    const unifiedConfidence = unifiedDecision.confidence || 0;
    const confidencePercent = Math.round(unifiedConfidence * 100);

    // Get symbol-specific market capital for position sizing
    const symbolMarketInfo = getMarketInfo(symbol);
    let symbolMarketCapital;

    try {
      // Import CapitalManager dynamically to avoid circular dependency
      const CapitalManagerClass = require('../utils/capitalManager');
      symbolMarketCapital = await getMarketCapital(symbol, CapitalManagerClass);
    } catch (error) {
      console.error(`❌ Error getting market capital for ${symbol}:`, error.message);
      // Fallback to default capital based on market
      const fallbackAmounts = {
        'USD': 100000,  // $100k for US market  
        'INR': 8000000  // ₹80L for Indian market
      };
      symbolMarketCapital = {
        remaining: fallbackAmounts[symbolMarketInfo.currency],
        currency: symbolMarketInfo.currency,
        market: symbolMarketInfo.market
      };
    }

    // 🧠 ENHANCEMENT: Identify winning system for execution details extraction
    const winningSystem = this.identifyWinningSystem(systemResults, unifiedDecision);

    // 🧠 TASK 2: Use winning system's execution values when action is BUY
    let executionDetails;

    if (unifiedAction === 'BUY' && winningSystem && (winningSystem.entryPrice || winningSystem.currentPrice || winningSystem.executionPlan)) {
      // Use winning system's complete execution package
      // console.log(`🎯 Using execution details from winning system: ${winningSystem.system || 'UNKNOWN'}`);
      // console.log(`🔍 Winning system fields:`, Object.keys(winningSystem));

      // Extract from executionPlan if available, otherwise from direct fields
      const executionPlan = winningSystem.executionPlan || {};
      const exitStrategy = executionPlan.exitStrategy || {};
      const positionSizing = executionPlan.positionSizing || winningSystem.positionSizing || {};

      const systemEntryPrice = winningSystem.entryPrice || winningSystem.currentPrice || executionPlan.entryPrice || currentPrice;
      const systemStopLoss = winningSystem.stopLoss || exitStrategy.stopLoss;
      const systemTargets = winningSystem.targets || exitStrategy.targets || [];
      const systemRiskReward = winningSystem.riskReward || executionPlan.riskReward;

      // Calculate position size based on the system's recommendation and HALF logic
      const baseCalculation = this.calculatePositionSizing({
        entryPrice: systemEntryPrice,
        stopLoss: systemStopLoss,
        availableCapital: symbolMarketCapital.remaining,
        symbol: symbol,
        market: symbolMarketInfo.market,
        currency: symbolMarketInfo.currency,
        signalAction: signalAction,
        confidence: unifiedConfidence,
        riskPerTrade: 0.015 // 1.5% flat risk as requested
      });

      // 🧠 Apply system's recommendation multiplier (HALF, QUARTER, etc.)
      let positionMultiplier = 1.0;
      if (positionSizing.recommendation) {
        const recommendation = positionSizing.recommendation.toUpperCase();
        switch (recommendation) {
          case 'AGGRESSIVE': positionMultiplier = 1.25; break; // 125% position
          case 'FULL': positionMultiplier = 1.0; break;        // 100% position
          case 'REDUCED': positionMultiplier = 0.75; break;    // 75% position
          case 'CONSERVATIVE': positionMultiplier = 0.6; break; // 60% position
          case 'HALF': positionMultiplier = 0.5; break;        // 50% position
          case 'QUARTER': positionMultiplier = 0.25; break;    // 25% position
          case 'AVOID': positionMultiplier = 0; break;         // No position for AVOID
          case 'NORMAL': positionMultiplier = 1.0; break;      // Legacy support
          default:
            console.log(`⚠️ Unknown recommendation: ${recommendation}, defaulting to CONSERVATIVE`);
            positionMultiplier = 0.6; // Default to conservative
        }
        // console.log(`🎯 Applying ${recommendation} recommendation: ${positionMultiplier}x multiplier`);
      }

      // Calculate final position size with system recommendation applied
      const riskPerShare = systemStopLoss ? Number(Math.abs(systemEntryPrice - systemStopLoss).toFixed(2)) : 0;

      let systemPositionSize = {
        shares: Math.floor(baseCalculation.shares * positionMultiplier),
        value: Math.floor(baseCalculation.value * positionMultiplier),
        risk: baseCalculation.riskPercentage, // Use actual calculated risk percentage
        riskPerShare: riskPerShare
      };

      // console.log(`📊 System values: Entry=${systemEntryPrice}, Stop=${systemStopLoss}, Targets=${systemTargets}, PositionSize=`, systemPositionSize);
      // console.log(`📋 ExecutionPlan:`, executionPlan);

      // Calculate proper numeric risk reward ratio
      const calculatedRiskReward = this.calculateRiskReward(
        systemEntryPrice,
        systemStopLoss,
        systemTargets[0]
      );

      executionDetails = {
        entry: Number((systemEntryPrice).toFixed(2)),
        stop: systemStopLoss ? Number(systemStopLoss.toFixed(2)) : null,
        target1: systemTargets[0] ? Number(systemTargets[0].toFixed(2)) : null,
        target2: systemTargets[1] ? Number(systemTargets[1].toFixed(2)) : null,
        riskReward: Number(calculatedRiskReward.toFixed(1)),
        positionSize: systemPositionSize || {
          shares: 0,
          value: 0,
          risk: "0%"
        }
      };

      // console.log(`✅ Winning system execution: Entry=${executionDetails.entry}, Stop=${executionDetails.stop}, Target1=${executionDetails.target1}`);
    } else {
      // Fallback to generic calculation
      // console.log(`⚠️ Fallback to generic execution calculation (Action: ${unifiedAction}, WinningSystem: ${!!winningSystem}, HasEntryPrice: ${!!(winningSystem?.entryPrice || winningSystem?.currentPrice)})`);
      if (winningSystem) {
        // console.log(`🔍 Winning system available fields:`, Object.keys(winningSystem));
      }

      const entry = currentPrice;
      const stopLoss = this.extractStopLoss(gateResult, currentPrice, signalAction);
      const targets = this.extractTargets(gateResult, currentPrice, signalAction, technicalData, systemResults);
      const riskReward = this.calculateRiskReward(currentPrice, stopLoss, targets[0]);

      // Calculate proper position sizing based on symbol-specific capital and risk management
      const positionSize = this.calculatePositionSizing({
        entryPrice: currentPrice,
        stopLoss: stopLoss,
        availableCapital: symbolMarketCapital.remaining,
        symbol: symbol,
        market: symbolMarketInfo.market,
        currency: symbolMarketInfo.currency,
        signalAction: signalAction,
        confidence: unifiedConfidence,
        riskPerTrade: 0.02 // 2% risk per trade (professional standard)
      });

      executionDetails = {
        entry: Number(entry.toFixed(2)),
        stop: stopLoss ? Number(stopLoss.toFixed(2)) : null,
        target1: targets[0] ? Number(targets[0].toFixed(2)) : null,
        target2: targets[1] ? Number(targets[1].toFixed(2)) : null,
        riskReward: Number(riskReward.toFixed(1)),
        positionSize: {
          shares: positionSize.shares,
          value: positionSize.value,
          risk: positionSize.riskPercentage,
          riskPerShare: stopLoss ? Number(Math.abs(entry - stopLoss).toFixed(2)) : 0
        }
      };
    }

    // Extract market context
    const trend = this.extractTrendContext(analysisContext);
    const levels = this.extractSupportResistance(technicalData);
    const volume = this.extractVolumeContext(technicalData);
    const earnings = this.extractEarningsContext(analysisContext);

    // Extract scenarios
    const scenarios = this.extractScenarios(analysisContext, currentPrice);

    // Extract risk information
    const risk = this.extractRiskInformation(analysisContext, gateResult);

    // Determine grade based on confidence
    let grade = 'D';
    if (confidencePercent >= 80) grade = 'A';
    else if (confidencePercent >= 70) grade = 'B';
    else if (confidencePercent >= 60) grade = 'C';
    else if (confidencePercent >= 50) grade = 'C-';

    // Build actionable intelligence
    const actionableIntelligence = this.buildActionableIntelligence(
      { status: unifiedAction, confidence: unifiedConfidence, grade },
      analysisContext,
      currentPrice
    );

    return {
      symbol,
      currentPrice: Number(currentPrice.toFixed(2)),
      timestamp: new Date().toISOString(),

      // SINGLE DECISION OBJECT - No Confusion
      decision: {
        action: unifiedAction,
        confidence: confidencePercent,
        grade: grade,
        reasoning: unifiedDecision.reasoning || 'Analysis complete',
        systemsAgreement: unifiedDecision.systemsAgreement || 'PARTIAL',
        systemsAnalyzed: unifiedDecision.systemsAnalyzed || 0
      },

      execution: {
        entry: executionDetails.entry,
        stopLoss: executionDetails.stop,
        target1: executionDetails.target1,
        target2: executionDetails.target2,
        riskReward: typeof executionDetails.riskReward === 'number' ? executionDetails.riskReward : 0,
        positionSize: executionDetails.positionSize,
        exitStrategy: this.normalizeExitStrategy(winningSystem?.executionPlan?.exitStrategy)
      },

      context: {
        trend: trend.direction,
        levels: {
          support: levels.support ? Number(levels.support.toFixed(2)) : null,
          resistance: levels.resistance ? Number(levels.resistance.toFixed(2)) : null
        },
        volume: {
          status: volume.status,
          multiple: volume.multiple
        },
        earnings: {
          daysAway: earnings.daysAway,
          impact: earnings.impact
        }
      },

      risk: {
        level: risk.level,
        tailRiskScore: risk.tailRiskScore,
        maxDrawdown: risk.maxDrawdown
      },

      nextStepSummary: actionableIntelligence.nextStep,
      whyAvoid: actionableIntelligence.whyAvoid,
      flipToReady: actionableIntelligence.flipToReady,

      // SIMPLIFIED SYSTEM DETAILS - Essential info only
      systems: this.buildSystemsResponse(systemResults, supportedSystems, symbol, symbolMarketCapital, technicalData.currentPrice)
    };
  }

  // NEW: Build systems response dynamically for all analyzed systems
  buildSystemsResponse(systemResults, supportedSystems, symbol, marketCapital, currentPrice) {
    const systems = {};

    // Map system IDs to display names
    const systemDisplayNames = {
      [SYSTEM_IDS.TRIPLE_SCREEN]: { key: 'elderTripleScreen', name: 'Elder\'s Triple Screen' },
      [SYSTEM_IDS.MINERVINI_SEPA]: { key: 'minerviniSEPA', name: 'Minervini SEPA' },
      [SYSTEM_IDS.CAN_SLIM_CUP_HANDLE]: { key: 'cupWithHandle', name: 'Cup-with-Handle' },
      [SYSTEM_IDS.RSI_MEAN_REVERSION]: { key: 'rsiMeanReversion', name: 'RSI Mean Reversion' },
      [SYSTEM_IDS.MACD_DIVERGENCE]: { key: 'macdDivergence', name: 'MACD Divergence' }
    };

    // Add all supported systems to response
    supportedSystems.forEach(systemId => {
      const systemResult = systemResults[systemId];
      const displayInfo = systemDisplayNames[systemId];

      if (systemResult && displayInfo) {
        systems[displayInfo.key] = this.simplifySystemResponse(systemResult, displayInfo.name, systemId, symbol, marketCapital, currentPrice);
      }
    });

    return systems;
  }

  // NEW: Simplify system response to essential information only
  simplifySystemResponse(analysis, systemName, systemId, symbol, marketCapital, currentPrice) {
    if (!analysis) return null;

    // Use passed currentPrice instead of defaulting to 0
    const entryPrice = currentPrice;
    const stopLoss = analysis.stopLoss || analysis.executionPlan?.exitStrategy?.stopLoss || null;
    const target1 = analysis.targets?.[0] || analysis.executionPlan?.exitStrategy?.targets?.[0] || null;
    const target2 = analysis.targets?.[1] || analysis.executionPlan?.exitStrategy?.targets?.[1] || null;

    // Calculate risk/reward as simple number
    let riskReward = 0;
    if (stopLoss && target1) {
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(target1 - entryPrice);
      riskReward = risk > 0 ? parseFloat((reward / risk).toFixed(1)) : 0;
    }

    // Determine grade from confidence
    const confidence = analysis.confidence || 0;
    const confidencePercent = Math.round(confidence * 100);
    let grade = 'D';
    if (confidencePercent >= 80) grade = 'A';
    else if (confidencePercent >= 70) grade = 'B';
    else if (confidencePercent >= 60) grade = 'C';
    else if (confidencePercent >= 50) grade = 'C-';

    // Get recommendation and apply multiplier
    const recommendation = analysis.recommendation || 'HOLD';
    let multiplier = 1;
    if (recommendation === 'HALF') {
      multiplier = 0.5;
    } else if (recommendation === 'QUARTER') {
      multiplier = 0.25;
    }

    // Calculate position size with recommendation multiplier
    const calculatedPositionSize = this.calculatePositionSizing({
      entryPrice: entryPrice,
      stopLoss: stopLoss,
      availableCapital: marketCapital * multiplier,
      symbol: symbol || 'DEFAULT',
      market: 'IN',
      currency: 'INR',
      signalAction: 'BUY',
      confidence: confidence,
      riskPerTrade: analysis.riskPercentage || 0.016 // 1.6% default risk
    });

    // Clean response structure - no duplicated fields
    const response = {
      system: systemId,
      systemName: systemName,
      decision: analysis.decision || 'HOLD',
      confidence: confidence,
      recommendation: recommendation,
      reasoning: Array.isArray(analysis.reasoning) ? analysis.reasoning : [analysis.reasoning || 'Analysis complete'],
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      stopLoss: stopLoss ? parseFloat(stopLoss.toFixed(2)) : null,
      targets: [target1, target2].filter(t => t !== null).map(t => parseFloat(t.toFixed(2))),
      riskReward: riskReward, // Simple number, not object
      executionPlan: {
        entry: parseFloat(entryPrice.toFixed(2)),
        stopLoss: stopLoss ? parseFloat(stopLoss.toFixed(2)) : null,
        targets: [target1, target2].filter(t => t !== null).map(t => parseFloat(t.toFixed(2))),
        shares: calculatedPositionSize.shares,
        value: calculatedPositionSize.value,
        riskAmount: calculatedPositionSize.riskAmount
      },
      grade: grade
    };

    // Add formation dates for MACD divergence system
    if (systemId === 'divergence' && analysis.analysis?.divergence?.formationDates) {
      response.formationDates = analysis.analysis.divergence.formationDates;
    }

    return response;
  }

  // Helper methods for extracting trading information
  extractStopLoss(gateResult, currentPrice, signalAction = 'BUY') {
    // Look for stop loss in various places
    if (gateResult.stopLoss) return gateResult.stopLoss;
    if (gateResult.riskAssessment?.stopLoss) return gateResult.riskAssessment.stopLoss;
    if (gateResult.positionSizing?.stopLoss) return gateResult.positionSizing.stopLoss;

    // Calculate adaptive stop based on ATR (from logs we see 1.5x ATR)
    const atr = currentPrice * 0.027; // Approximate 2.7% ATR from logs

    // FIXED: For long positions (BUY/WATCH), stop should be BELOW current price
    // For short positions (SELL), stop should be ABOVE current price
    if (signalAction === 'SELL' || signalAction === 'STRONG_SELL') {
      return currentPrice + (atr * 1.5); // Above current for short position protection
    } else {
      return currentPrice - (atr * 1.5); // Below current for long position protection
    }
  }

  extractTargets(gateResult, currentPrice, signalAction = 'BUY', technicalData = {}, systemResults = {}) {
    // Look for targets in gate result first
    if (gateResult.targets) {
      return Array.isArray(gateResult.targets) ? gateResult.targets : [gateResult.targets];
    }

    // Calculate more reasonable targets based on ATR and realistic R/R ratios
    const atr = currentPrice * 0.027; // Approximate 2.7% ATR
    const stopDistance = atr * 1.5;

    // FIXED: Use more realistic risk/reward ratios (1.5:1 and 2.5:1 instead of 4.78:1)
    // For long positions (BUY/WATCH), targets should be ABOVE current price
    // For short positions (SELL), targets should be BELOW current price
    if (signalAction === 'SELL' || signalAction === 'STRONG_SELL') {
      const target1 = currentPrice - (stopDistance * 1.5); // Conservative R/R for short
      const target2 = currentPrice - (stopDistance * 2.5); // Aggressive R/R for short
      return [target1, target2];
    } else {
      const target1 = currentPrice + (stopDistance * 1.5); // Conservative 1.5:1 R/R for long
      const target2 = currentPrice + (stopDistance * 2.5); // Aggressive 2.5:1 R/R for long
      return [target1, target2];
    }
  }

  calculateRiskReward(entry, stop, target) {
    if (!stop || !target) return 0;
    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    return risk > 0 ? reward / risk : 0;
  }

  /**
   * Calculate proper position sizing based on risk management principles
   * @param {Object} params - Position sizing parameters
   * @returns {Object} Position sizing details
   */
  calculatePositionSizing(params) {
    const {
      entryPrice,
      stopLoss,
      availableCapital,
      signalAction,
      confidence,
      symbol,
      market,
      currency,
      riskPerTrade = 0.02 // Default 2% risk per trade
    } = params;

    // Don't calculate position sizing for HOLD/AVOID signals
    if (!signalAction || signalAction === 'HOLD' || signalAction === 'AVOID') {
      // console.log(`⚠️ No position sizing for signal action: ${signalAction}`);
      return {
        shares: 0,
        value: 0,
        riskPercentage: '0%'
      };
    }

    // Must have valid entry and stop prices
    if (!entryPrice || !stopLoss || entryPrice <= 0) {
      // console.log(`⚠️ Invalid prices for position sizing: entry=${entryPrice}, stop=${stopLoss}`);
      return {
        shares: 0,
        value: 0,
        riskPercentage: '0%'
      };
    }

    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    if (riskPerShare <= 0) {
      return {
        shares: 0,
        value: 0,
        riskPercentage: '0%'
      };
    }

    // Adjust risk based on signal confidence and action
    let adjustedRiskPerTrade = riskPerTrade;

    // console.log(`📊 Position sizing debug: Initial risk=${(riskPerTrade*100).toFixed(1)}%, Confidence=${(confidence*100).toFixed(1)}%, Action=${signalAction}`);

    // More reasonable confidence-based adjustments
    if (confidence < 0.5) {
      adjustedRiskPerTrade *= 0.6; // 60% position for very low confidence
    } else if (confidence < 0.65) {
      adjustedRiskPerTrade *= 0.8; // 80% position for low confidence
    } else if (confidence < 0.75) {
      adjustedRiskPerTrade *= 0.9; // 90% position for medium confidence
    }
    // Above 75% confidence gets full position size

    // Reduce position size for WATCH signals vs BUY signals
    if (signalAction === 'WATCH') {
      adjustedRiskPerTrade *= 0.7; // 70% of normal position for WATCH
    }

    // console.log(`📊 Adjusted risk after confidence: ${(adjustedRiskPerTrade*100).toFixed(1)}%`);

    // Calculate maximum position value based on risk tolerance
    const maxRiskAmount = availableCapital * adjustedRiskPerTrade;
    const maxShares = Math.floor(maxRiskAmount / riskPerShare);

    // Don't exceed 20% of available capital for any single position
    const maxPositionValue = availableCapital * 0.20;
    const maxSharesByCapital = Math.floor(maxPositionValue / entryPrice);

    // Take the smaller of the two limits
    const finalShares = Math.min(maxShares, maxSharesByCapital);
    const finalValue = finalShares * entryPrice;
    const actualRiskPercentage = finalShares > 0 ?
      ((finalShares * riskPerShare) / availableCapital * 100).toFixed(1) + '%' : '0%';

    return {
      shares: Math.max(0, finalShares),
      value: Math.round(finalValue),
      riskPercentage: actualRiskPercentage,
      market: market || 'US',
      currency: currency || 'USD'
    };
  }

  extractTrendContext(analysisContext) {
    // From logs: "Trend State: ABOVE_BAND (8.8% vs ±7.7% band)"
    const technical = analysisContext.technical;
    if (technical?.dualTimeframeAnalysis?.trend) {
      return { direction: technical.dualTimeframeAnalysis.trend };
    }

    // Default based on common states from logs
    return { direction: "SIDEWAYS" }; // NEUTRAL trend from logs
  }

  extractSupportResistance(technicalData) {
    // Extract from technical levels
    const levels = technicalData?.levels || {};
    return {
      support: levels.support || technicalData?.technicalIndicators?.sma?.sma200 * 0.85,
      resistance: levels.resistance || technicalData?.technicalIndicators?.sma?.sma50 * 1.05
    };
  }

  extractVolumeContext(technicalData) {
    const latestVolume = technicalData.latestVolume || 0;
    const avgVolume = technicalData?.technicalIndicators?.volume?.avgVolume || latestVolume;
    const multiple = avgVolume > 0 ? latestVolume / avgVolume : 1;

    return {
      status: multiple >= 1.5 ? "HIGH" : multiple >= 1.0 ? "NORMAL" : "LOW",
      multiple: Number(multiple.toFixed(1))
    };
  }

  extractEarningsContext(analysisContext) {
    const earnings = analysisContext.earnings;
    if (earnings?.nextEarningsDate) {
      const daysAway = Math.ceil((new Date(earnings.nextEarningsDate) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        daysAway: daysAway > 0 ? daysAway : null,
        impact: daysAway <= 7 ? "HIGH" : daysAway <= 14 ? "MODERATE" : "NONE"
      };
    }
    return { daysAway: null, impact: "NONE" };
  }

  extractScenarios(analysisContext, currentPrice) {
    // From logs: Monte Carlo shows bullish probability ~99%
    const monteCarlo = analysisContext.monteCarlo || {};
    const technical = analysisContext.technical || {};

    // Calculate breakout/breakdown levels
    const atr = currentPrice * 0.027; // From logs
    const resistance = currentPrice * 1.05; // Approximate
    const support = currentPrice * 0.85; // Approximate

    return {
      breakout: {
        trigger: resistance,
        probability: Math.round((monteCarlo.bullishProbability || 0.4) * 100),
        target: resistance * 1.05
      },
      breakdown: {
        trigger: support,
        probability: Math.round((monteCarlo.bearishProbability || 0.3) * 100),
        target: support * 0.95
      }
    };
  }

  extractRiskInformation(analysisContext, gateResult) {
    const tailRisk = analysisContext.tailRisk || {};
    const volatility = analysisContext.technical?.volatilityRegime;

    return {
      level: volatility === "HIGH_VOLATILITY" ? "HIGH" : "MODERATE",
      tailRiskScore: tailRisk.score || 13,
      maxDrawdown: "16%" // Approximate from risk calculations
    };
  }

  formatDecisionStatus(gateDecision, unifiedDecision) {
    const action = gateDecision.action || unifiedDecision.action || 'HOLD';
    const confidence = gateDecision.confidence || unifiedDecision.confidence || 0;

    // Convert confidence to percentage and determine grade
    const confidencePct = Math.round(confidence * 100);
    let grade = 'D';
    if (confidencePct >= 80) grade = 'A';
    else if (confidencePct >= 70) grade = 'B+';
    else if (confidencePct >= 60) grade = 'B';
    else if (confidencePct >= 50) grade = 'C';

    const reasonCodes = [
      `GRADE_${grade.replace('+', 'PLUS')}`,
      `CONFIDENCE_${confidencePct}PCT`
    ];

    return {
      status: action === 'STRONG_BUY' ? 'BUY' : action,
      confidence: confidencePct / 100,
      grade,
      reasonCodes
    };
  }

  buildActionableIntelligence(decision, analysisContext, currentPrice) {
    const nextStep = this.buildNextStepSummary(decision, analysisContext, currentPrice);
    const flipToReady = this.buildFlipToReadyConditions(decision, analysisContext, currentPrice);

    return { nextStep, flipToReady };
  }

  // HELPER METHODS FOR TECHNICAL CALCULATIONS

  /**
   * Calculate Force Index indicator for Elder's system
   */
  calculateForceIndex(ohlcData) {
    const forceIndex = [];

    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];

      const priceChange = current.close - previous.close;
      const fi = priceChange * current.volume;

      forceIndex.push(fi);
    }

    return forceIndex;
  }

  /**
   * Calculate Average True Range (ATR) indicator
   */
  calculateATR(ohlcData, period = 14) {
    if (ohlcData.length < period + 1) {
      return [];
    }

    const trValues = [];

    // Calculate True Range for each period
    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];

      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);

      const tr = Math.max(tr1, tr2, tr3);
      trValues.push(tr);
    }

    // Calculate ATR using Simple Moving Average of True Range
    const atrValues = [];

    for (let i = period - 1; i < trValues.length; i++) {
      const slice = trValues.slice(i - period + 1, i + 1);
      const atr = slice.reduce((sum, val) => sum + val, 0) / period;
      atrValues.push(atr);
    }

    return atrValues;
  }

  buildNextStepSummary(decision, analysisContext, currentPrice) {
    if (decision.status === 'BUY') {
      return `Execute buy order at market with ${Math.round(currentPrice * 0.97)}-${Math.round(currentPrice * 1.03)} range`;
    } else if (decision.status === 'WATCH') {
      const resistance = currentPrice * 1.05;
      const volumeReq = Math.round(analysisContext.technical?.latestVolume * 1.5);
      return `Watch for breakout above ${resistance.toFixed(2)} with ≥${volumeReq.toLocaleString()}M volume`;
    } else if (decision.status === 'HOLD') {
      return `Monitor current position and market structure for directional clarity`;
    } else {
      return `Avoid entry - multiple system conflicts and poor setup quality`;
    }
  }

  buildFlipToReadyConditions(decision, analysisContext, currentPrice) {
    const conditions = [];

    if (decision.status === 'WATCH') {
      const resistance = currentPrice * 1.02;
      const volumeReq = Math.round((analysisContext.technical?.latestVolume || 50000000) * 1.5);
      conditions.push(`Breakout above ${resistance.toFixed(2)} (+${((resistance / currentPrice - 1) * 100).toFixed(1)}%) with ≥${(volumeReq / 1000000).toFixed(1)}M volume (1.5x 20DMA)`);
    }

    return conditions;
  }

  /**
   * Convert technical data to Cup-with-Handle format
   * Expected structure: { series: { daily: [] }, indicators: { base: {} } }
   */
  convertToCupHandleFormat(technicalData) {
    //console.log(`  🔧 DEBUG: Converting technical data for Cup-with-Handle system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.ohlcData || technicalData.historicalData || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const technicalIndicators = technicalData.technicalIndicators || {};
    const baseIndicators = technicalIndicators.latest || {};
    //console.log(`  🔧 Base indicators: ${Object.keys(baseIndicators).join(', ')}`);

    return {
      series: {
        daily: ohlcData
      },
      indicators: {
        base: baseIndicators
      }
    };
  }

  /**
   * Convert technical data to RSI Mean Reversion format
   * Expected structure: { series: { daily: [] }, indicators: { base: { rsi14: number } } }
   */
  convertToRSIMeanFormat(technicalData) {
    //console.log(`  🔧 DEBUG: Converting technical data for RSI Mean Reversion system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.ohlcData || technicalData.historicalData || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const technicalIndicators = technicalData.technicalIndicators || {};
    const baseIndicators = technicalIndicators.latest || {};

    // Ensure RSI is available
    let rsi14 = baseIndicators.rsi;
    if (!rsi14 && technicalIndicators.rsi && Array.isArray(technicalIndicators.rsi)) {
      rsi14 = technicalIndicators.rsi[technicalIndicators.rsi.length - 1];
    }

    //console.log(`  🔧 RSI14 value: ${rsi14}`);
    //console.log(`  🔧 Base indicators: ${Object.keys(baseIndicators).join(', ')}`);

    return {
      series: {
        daily: ohlcData
      },
      indicators: {
        base: {
          ...baseIndicators,
          rsi14: rsi14
        }
      }
    };
  }

  /**
   * Convert technical data to MACD Divergence format
   * Expected structure: { series: { daily: [] }, indicators: { base: { macd, macd_signal, macd_histogram } } }
   */
  convertToMACDDivergenceFormat(technicalData) {
    //console.log(`  🔧 DEBUG: Converting technical data for MACD Divergence system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.ohlcData || technicalData.historicalData || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const technicalIndicators = technicalData.technicalIndicators || {};
    const baseIndicators = technicalIndicators.latest || {};

    // Extract MACD components
    let macd = baseIndicators.macd;
    let macdSignal = baseIndicators.macd_signal || baseIndicators.macdSignal;
    let macdHistogram = baseIndicators.macd_histogram || baseIndicators.macdHistogram;

    // If MACD components are arrays, take the latest values
    if (technicalIndicators.macd && Array.isArray(technicalIndicators.macd)) {
      macd = technicalIndicators.macd[technicalIndicators.macd.length - 1];
    }
    if (technicalIndicators.macd_signal && Array.isArray(technicalIndicators.macd_signal)) {
      macdSignal = technicalIndicators.macd_signal[technicalIndicators.macd_signal.length - 1];
    }
    if (technicalIndicators.macd_histogram && Array.isArray(technicalIndicators.macd_histogram)) {
      macdHistogram = technicalIndicators.macd_histogram[technicalIndicators.macd_histogram.length - 1];
    }

    //console.log(`  🔧 MACD: ${macd}, Signal: ${macdSignal}, Histogram: ${macdHistogram}`);
    //console.log(`  🔧 Base indicators: ${Object.keys(baseIndicators).join(', ')}`);

    return {
      series: {
        daily: ohlcData
      },
      indicators: {
        base: {
          ...baseIndicators,
          macd: macd,
          macd_signal: macdSignal,
          macd_histogram: macdHistogram
        }
      }
    };
  }

  /**
   * 🧠 Identify the winning system based on unified decision logic
   * Returns the system that should provide the execution plan
   */
  identifyWinningSystem(systemResults, unifiedDecision) {
    try {
      // Convert systemResults to array format for processing
      const resultsArray = Object.entries(systemResults).map(([systemId, result]) => ({
        ...result,
        systemId: systemId,
        system: systemId
      })).filter(result => {
        return result && result.decision && result.decision !== 'AVOID' && result.decision !== 'ERROR';
      });

      if (resultsArray.length === 0) {
        // console.log(`⚠️ No valid systems found for winning system identification`);
        return null;
      }

      // Logic 1: If unified decision matches a specific system with high confidence, use that system
      const highConfidenceSystems = resultsArray.filter(result =>
        result.confidence >= 0.75 && result.decision === unifiedDecision.action
      );

      if (highConfidenceSystems.length === 1) {
        //console.log(`🎯 High confidence winner: ${highConfidenceSystems[0].systemId} (${(highConfidenceSystems[0].confidence * 100).toFixed(1)}%)`);
        return highConfidenceSystems[0];
      }

      // Logic 2: If multiple high confidence systems, use the highest confidence one
      if (highConfidenceSystems.length > 1) {
        const winner = highConfidenceSystems.reduce((prev, current) =>
          current.confidence > prev.confidence ? current : prev
        );
        // console.log(`🎯 Highest confidence winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
        return winner;
      }

      // Logic 3: Use system with highest confidence that matches unified action
      const matchingActionSystems = resultsArray.filter(result =>
        result.decision === unifiedDecision.action
      );

      if (matchingActionSystems.length > 0) {
        const winner = matchingActionSystems.reduce((prev, current) =>
          current.confidence > prev.confidence ? current : prev
        );
        // console.log(`🎯 Action-matching winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
        return winner;
      }

      // Logic 4: Fallback to highest confidence system overall
      const winner = resultsArray.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );
      // console.log(`🎯 Overall highest confidence winner: ${winner.systemId} (${(winner.confidence * 100).toFixed(1)}%)`);
      return winner;

    } catch (error) {
      console.error(`❌ Error identifying winning system:`, error.message);
      return null;
    }
  }

  /**
   * 🧠 Normalize exit strategy to have exitConditions array format
   */
  normalizeExitStrategy(rawExitStrategy) {
    try {
      if (!rawExitStrategy) {
        return {
          exitConditions: []
        };
      }

      let exitConditions = [];

      // Handle object format with multiple exit conditions
      if (typeof rawExitStrategy === 'object') {
        // Only include non-price exit conditions (timeStop, rsiExit, etc.)
        // stopLoss and targets are already in execution section
        if (rawExitStrategy.timeStop) {
          exitConditions.push(rawExitStrategy.timeStop);
        }
        if (rawExitStrategy.rsiExit) {
          exitConditions.push(rawExitStrategy.rsiExit);
        }

        // Handle any other string-based exit conditions, but exclude price-related ones
        Object.entries(rawExitStrategy).forEach(([key, value]) => {
          if (typeof value === 'string' && !['stopLoss', 'targets', 'target1', 'target2', 'timeStop', 'rsiExit'].includes(key)) {
            exitConditions.push(value);
          }
        });
      }
      // Handle string format
      else if (typeof rawExitStrategy === 'string') {
        exitConditions.push(rawExitStrategy);
      }

      return {
        conditions: exitConditions
      };
    } catch (error) {
      console.error(`❌ Error normalizing exit strategy:`, error.message);
      return {
        conditions: []
      };
    }
  }
}

module.exports = { TradingSystemController };
