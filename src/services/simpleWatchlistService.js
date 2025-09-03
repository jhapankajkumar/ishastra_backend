/**
 * 🎯 SIMPLE WATCHLIST SERVICE - BRUTAL SIMPLICITY
 * 
 * ONE JOB: Scan 500 stocks daily, save top 20 BUY/WATCH signals to watchlist
 * PRIORITY: BUY signals first (sorted by confidence & grade), then WATCH signals
 * NO BULLSHIT. NO CONFUSION. NO OVER-ENGINEERING.
 */

const { PrismaClient } = require('@prisma/client');
const { fetchCurrentPrice } = require('./comom.service');
const prisma = new PrismaClient();

class SimpleWatchlistService {
    constructor() {
        // Indian stock universe - 500 most liquid stocks (NIFTY 500)
        this.STOCK_UNIVERSE = [
            // NIFTY 50 - Top tier
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
            "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
            "ASIANPAINT.NS", "LT.NS", "AXISBANK.NS", "MARUTI.NS", "TITAN.NS",
            "NESTLEIND.NS", "ULTRACEMCO.NS", "BAJFINANCE.NS", "SUNPHARMA.NS", "TECHM.NS",
            "WIPRO.NS", "ONGC.NS", "TATAMOTORS.NS", "COALINDIA.NS", "NTPC.NS",
            "POWERGRID.NS", "HCLTECH.NS", "BAJAJFINSV.NS", "DRREDDY.NS", "GRASIM.NS",
            "CIPLA.NS", "EICHERMOT.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS",
            "ADANIPORTS.NS", "INDUSINDBK.NS", "BRITANNIA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS",
            "HEROMOTOCO.NS", "BPCL.NS", "IOC.NS", "GAIL.NS", "TATACONSUM.NS",
            "MUTHOOTFIN.NS", "GODREJCP.NS", "BAJAJ-AUTO.NS", "ADANIENT.NS", "MARICO.NS",
            "M&M.NS", "SHREECEM.NS", "PIDILITIND.NS", "DABUR.NS",

            // NIFTY Next 50 + Mid Cap 150 + Small Cap 250
            "360ONE.NS", "3MINDIA.NS", "ABB.NS", "ACC.NS", "AIAENG.NS", "APLAPOLLO.NS",
            "AUBANK.NS", "AWL.NS", "AADHARHFC.NS", "AARTIIND.NS", "AAVAS.NS", "ABBOTINDIA.NS",
            "ACE.NS", "ADANIENSOL.NS", "ADANIGREEN.NS", "ADANIPOWER.NS", "ATGL.NS", "ABCAPITAL.NS",
            "ABFRL.NS", "AEGISLOG.NS", "AFFLE.NS", "AJANTPHARM.NS", "ALKEM.NS", "ALKYLAMINE.NS",
            "AMBER.NS", "AMBUJACEM.NS", "ANGELONE.NS", "APARINDS.NS", "APOLLOTYRE.NS", "APTUS.NS",
            "ASHOKLEY.NS", "ASTERDM.NS", "ASTRAZEN.NS", "ASTRAL.NS", "ATUL.NS", "AUROFIN.NS",
            "BASF.NS", "BATAINDIA.NS", "BEL.NS", "BERGEPAINT.NS", "BDL.NS", "BLS.NS",
            "BSE.NS", "BALKRISIND.NS", "BALRAMCHIN.NS", "BANDHANBNK.NS", "BANKBARODA.NS",
            "BANKINDIA.NS", "MAHABANK.NS", "CENTRALBK.NS", "CANBK.NS", "BHARATFORG.NS",
            "BHEL.NS", "BIOCON.NS", "BIRLACORPN.NS", "BSOFT.NS",
            "BLUEDART.NS", "BLUESTARCO.NS", "BBTC.NS", "BOSCHLTD.NS",
            "CCL.NS", "CESC.NS", "CGPOWER.NS", "CUB.NS",
            "COCHINSHIP.NS", "CADILAHC.NS", "CHOLAFIN.NS", "CROMPTON.NS", "CUMMINSIND.NS",
            "DALBHARAT.NS", "DEEPAKNTR.NS", "DIXON.NS", "LALPATHLAB.NS",
            "EIDPARRY.NS", "EIHOTEL.NS", "EPL.NS", "ESCORTS.NS", "EXIDEIND.NS", "FDC.NS", "NYKAA.NS",
            "FEDERALBNK.NS", "FORTIS.NS", "GLENMARK.NS", "GMRINFRA.NS", "GODREJPROP.NS", "GRANULES.NS", "GSPL.NS",
            "HEG.NS", "HDFCAMC.NS", "HDFCLIFE.NS", "HAVELLS.NS", "HEXAWARE.NS", "HINDCOPPER.NS", "HINDPETRO.NS", "HINDZINC.NS", "POWERINDIA.NS", "HONAUT.NS", "HUDCO.NS",
            "ICICIGI.NS", "ICICIPRULI.NS", "IDFCFIRSTB.NS", "IEX.NS", "INDHOTEL.NS", "IOB.NS", "IRCTC.NS", "ITI.NS",
            "INDIACEM.NS", "INDIANB.NS", "INDIAMART.NS", "INDIGO.NS", "INDUSTOWER.NS",
            "INGERRAND.NS", "INOXLEISUR.NS", "INTELLECT.NS", "ISEC.NS", "IPCALAB.NS",
            "JKCEMENT.NS", "JKLAKSHMI.NS", "JMFINANCIL.NS",
            "JINDALSTEL.NS", "JUBLFOOD.NS", "JUBILANT.NS", "JUSTDIAL.NS", "JYOTHYLAB.NS",
            "KPITTECH.NS", "KEI.NS", "KNRCON.NS", "KRBL.NS",
            "L&TFH.NS", "LAXMIMACH.NS", "LICHSGFIN.NS", "LTIM.NS", "LTTS.NS", "LAURUSLABS.NS", "LEMONTREE.NS", "LUPIN.NS", "MRF.NS",
            "LSC.NS", "MFSL.NS", "MAXHEALTH.NS", "MAZDOCK.NS", "METROPOLIS.NS", "MINDACORP.NS", "MINDTREE.NS", "MPHASIS.NS", "MCX.NS",
            "NATIONALUM.NS", "NBCC.NS", "NCC.NS", "NEOGEN.NS", "NETWORK18.NS", "NMDC.NS",
            "NAVINFLUOR.NS", "NAZARA.NS", "NIACL.NS", "NIITLTD.NS", "NLCINDIA.NS",
            "NOCIL.NS", "NUVOCO.NS", "OBEROIRLTY.NS", "OFSS.NS", "OIL.NS", "PAYTM.NS", "PAGEIND.NS", "PERSISTENT.NS", "PETRONET.NS",
            "PFIZER.NS", "PEL.NS", "POLYCAB.NS", "POLYMED.NS", "POONAWALLA.NS", "PFC.NS", "PRAJIND.NS", "PRESTIGE.NS",
            "PGHH.NS", "PURVA.NS", "QUESS.NS", "RBLBANK.NS", "RECLTD.NS", "ROUTE.NS", "RPOWER.NS", "RVNL.NS", "SAIL.NS",
            "SBICARD.NS", "SBILIFE.NS", "SHRIRAMFIN.NS", "SIEMENS.NS", "SRF.NS", "MOTHERSON.NS", "SOLARINDS.NS", "SONACOMS.NS",
            "SOUTHBANK.NS", "STARHEALTH.NS", "SUNTV.NS", "SYNGENE.NS", "TVSMOTOR.NS", "TMB.NS", "TANLA.NS", "TATACOMM.NS", "TATAPOWER.NS",
            "RAMCOCEM.NS", "THERMAX.NS", "THYROCARE.NS", "TIINDIA.NS", "TORNTPHARM.NS", "TORNTPOWER.NS", "TRENT.NS", "TRIDENT.NS", "TRIVENI.NS", "UJJIVAN.NS",
            "UPL.NS", "UTIAMC.NS", "VOLTAS.NS", "WOCKPHARMA.NS", "YESBANK.NS", "ZEEL.NS", "ZENSARTECH.NS", "ZENTEC.NS", "ZYDUSLIFE.NS", "ECLERX.NS"
        ];
    }

    /**
     * DAILY WATCHLIST SCAN - THE ONLY METHOD THAT MATTERS
     * Scans all stocks, picks top 20 BUY/WATCH signals, saves to DB
     */
    async runDailyScan() {
        console.log('🔍 DAILY WATCHLIST SCAN STARTING...');
        console.log(`📊 Scanning ${this.STOCK_UNIVERSE.length} stocks for BUY/WATCH signals`);

        // Step 1: Clear old watchlist
        await prisma.watchlistStock.deleteMany({});
        console.log('🗑️ Cleared old watchlist');

        // Step 2: Analyze all stocks in batches
        const buySignals = [];
        const strongBuySignals = [];
        const watchSignals = [];
        const batchSize = 10;

        for (let i = 0; i < this.STOCK_UNIVERSE.length; i += batchSize) {
            const batch = this.STOCK_UNIVERSE.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(this.STOCK_UNIVERSE.length / batchSize)}`);

            // Analyze batch in parallel
            const batchPromises = batch.map(symbol => this.analyzeStock(symbol));
            const batchResults = await Promise.allSettled(batchPromises);

            // Collect BUY and WATCH signals separately
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const signal = result.value;
                    if (signal.decision.action === 'STRONG_BUY') {
                        strongBuySignals.push(signal);
                        console.log(`🚀 ${signal.symbol}: ${signal.decision.action} (${(signal.decision.confidence)}%)`);
                    }
                    if (signal.decision.action === 'BUY') {
                        buySignals.push(signal);
                        console.log(`🚀 ${signal.symbol}: ${signal.decision.action} (${(signal.decision.confidence)}%)`);
                    } else if (signal.decision.action === 'WATCH') {
                        watchSignals.push(signal);
                        console.log(`👀 ${signal.symbol}: ${signal.decision.action} (${(signal.decision.confidence)}%)`);
                    }
                }
            });

            // Brief pause between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 3: Sort BUY signals by confidence and grade, then WATCH signals
        const sortByQuality = (a, b) => {
            // First by confidence (higher is better)
            if (b.decision.confidence !== a.decision.confidence) {
                return b.decision.confidence - a.decision.confidence;
            }
            // Then by grade using your grading system: A+ > A > B+ > B  > C > D
            const gradeValue = (grade) => {
                if (grade === 'A+') return 6;      // 90%+ Excellent
                if (grade === 'A') return 5;       // 85-89% Very Good
                if (grade === 'B+') return 4;       // 75-84% Good
                if (grade === 'B') return 3;       // 75-84% Good
                if (grade === 'C') return 2;       // 65-74% Average
                if (grade === 'D') return 1;       // 55-64% Below Average
                return 0;                          // Below 55% or unknown
            };
            return gradeValue(b.decision.grade) - gradeValue(a.decision.grade);
        };
        const sortedStrongBuySignals = strongBuySignals.sort(sortByQuality);
        const sortedBuySignals = buySignals.sort(sortByQuality);
        const sortedWatchSignals = watchSignals.sort(sortByQuality);

        // Step 4: Combine signals - BUY first, then WATCH, max 20 total
        const combinedSignals = [
            ...sortedStrongBuySignals,
            ...sortedBuySignals,
            ...sortedWatchSignals
        ].slice(0, 20);

        console.log(`🎯 Found ${buySignals.length} BUY signals, ${watchSignals.length} WATCH signals`);
        console.log(`📝 Saving top ${combinedSignals.length} signals to watchlist`);

        // Step 5: Save to database with COMPLETE signal analysis data
        for (const signal of combinedSignals) {
            try {
                const watchlistData = {
                    symbol: signal.symbol,
                    currentPrice: signal.price || 0,
                    currency: signal.symbol.includes('.NS') ? 'INR' : 'USD',
                    market: signal.symbol.includes('.NS') ? 'IN' : 'US',

                    // Store COMPLETE decision data as JSON strings - SAFELY
                    decision: signal.decision ? JSON.stringify(signal.decision) : null,
                    // Store COMPLETE analysis data as JSON strings - SAFELY
                    execution: signal.execution ? JSON.stringify(signal.execution) : null,
                    createdAt: new Date()
                };

                await prisma.watchlistStock.upsert({
                    where: { symbol: signal.symbol },
                    update: watchlistData,
                    create: watchlistData
                });
                console.log(`💾 Saved ${signal.symbol} (${signal.decision.action}) to watchlist`);

            } catch (error) {
                console.error(`❌ Error saving ${signal.symbol} to watchlist:`, error);
            }
        }

        console.log('✅ DAILY WATCHLIST SCAN COMPLETE');
        return {
            scanned: this.STOCK_UNIVERSE.length,
            buySignals: buySignals.length,
            watchSignals: watchSignals.length,
            watchlistSize: combinedSignals.length,
            breakdown: {
                strongBuy:combinedSignals.filter(s => s.decision?.action === 'STRONG_BUY').length, 
                buy: combinedSignals.filter(s => s.decision?.action === 'BUY').length,
                watch: combinedSignals.filter(s => s.decision?.action === 'WATCH').length
            },
            avgConfidence: combinedSignals.length > 0 ?
                combinedSignals.reduce((sum, s) => sum + (s.decision?.confidence || 0), 0) / combinedSignals.length : 0
        };
    }

    /**
     * ANALYZE SINGLE STOCK - SIMPLE & FAST
     * Gets complete signal analysis data from signal-analysis.controller.js
     */
    async analyzeStock(symbol) {
        try {
            // Use fetch to call the signal analysis API with GET method
            const response = await fetch(`http://localhost:8000/api/trading/signal-analysis?symbols=${symbol}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const result = data.results?.[0];

            // Debug logging
            if (result) {
                console.log(`📊 ${symbol}: ${result.decision?.action} (${(result.decision?.confidence * 100).toFixed(1)}%)`);
            }

            // CAPTURE BUY and WATCH signals only
            if (!result || !['BUY', 'WATCH'].includes(result.decision?.action)) {
                return null;
            }

            // Return COMPLETE signal analysis data with proper validation
            return result

        } catch (error) {
            console.error(`❌ Error analyzing ${symbol}:`, error.message);
            return null;
        }
    }

    /**
     * GET CURRENT WATCHLIST - DISPLAY COMPLETE DATA
     */
    async getWatchlist() {
        const stocks = await prisma.watchlistStock.findMany({});

        // Process all stocks with async operations
        const processedStocks = await Promise.all(stocks.map(async (stock) => {
            // Parse JSON data safely
            let decision = null;
            let execution = null;

            try {
                decision = stock.decision ? JSON.parse(stock.decision) : null;
                execution = stock.execution ? JSON.parse(stock.execution) : null;
            } catch (error) {
                console.error(`❌ Error parsing JSON for ${stock.symbol}:`, error);
            }

            // Fetch current price if not available or is zero
            let currentPrice = stock.currentPrice;
            if (currentPrice == null || currentPrice === 0) {
                try {
                    currentPrice = await fetchCurrentPrice(stock.symbol);
                    // Optionally update the database with the new price
                    await prisma.watchlistStock.update({
                        where: { symbol: stock.symbol },
                        data: { currentPrice: currentPrice }
                    });
                } catch (error) {
                    console.error(`❌ Error fetching price for ${stock.symbol}:`, error);
                    currentPrice = stock.currentPrice || 0; // Fallback to stored price
                }
            }

            return {
                symbol: stock.symbol,
                price: currentPrice,
                market: stock.market,
                currency: stock.currency,
                // Parsed JSON data for frontend display
                decision,
                execution,
                createdAt: stock.createdAt,
            };
        }));

        return processedStocks;
    }
}

module.exports = SimpleWatchlistService;
