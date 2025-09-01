/**
 * 🎯 SIMPLE WATCHLIST SERVICE - BRUTAL SIMPLICITY
 * 
 * ONE JOB: Scan 500 stocks daily, save top 20 BUY signals to watchlist
 * NO BULLSHIT. NO CONFUSION. NO OVER-ENGINEERING.
 */

const { PrismaClient } = require('@prisma/client');
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
            "M&M.NS", "SHREECEM.NS", "BRITANNIA.NS", "PIDILITIND.NS", "DABUR.NS",
            
            // NIFTY Next 50 + Mid Cap 150 + Small Cap 250 = 500 total
            "360ONE.NS", "3MINDIA.NS", "ABB.NS", "ACC.NS", "AIAENG.NS", "APLAPOLLO.NS",
            "AUBANK.NS", "AWL.NS", "AADHARHFC.NS", "AARTIIND.NS", "AAVAS.NS", "ABBOTINDIA.NS",
            "ACE.NS", "ADANIENSOL.NS", "ADANIGREEN.NS", "ADANIPOWER.NS", "ATGL.NS", "ABCAPITAL.NS",
            "ABFRL.NS", "AEGISLOG.NS", "AFFLE.NS", "AJANTPHARM.NS", "ALKEM.NS", "ALKYLAMINE.NS",
            "AMBER.NS", "AMBUJACEM.NS", "ANGELONE.NS", "APARINDS.NS", "APOLLOTYRE.NS", "APTUS.NS",
            "ASHOKLEY.NS", "ASTERDM.NS", "ASTRAZEN.NS", "ASTRAL.NS", "ATUL.NS", "AUROFIN.NS",
            "BASF.NS", "BATAINDIA.NS", "BEL.NS", "BERGEPAINT.NS", "BDL.NS", "BLS.NS",
            "BSE.NS", "BALKRISIND.NS", "BALRAMCHIN.NS", "BANDHANBNK.NS", "BANKBARODA.NS",
            "BANKINDIA.NS", "MAHABANK.NS", "CENTRALBK.NS", "CANBK.NS", "BHARATFORG.NS",
            "BHEL.NS", "BHARTIARTL.NS", "BIOCON.NS", "BIRLACORPN.NS", "BSOFT.NS",
            "BLUEDART.NS", "BLUESTARCO.NS", "BBTC.NS", "BOSCHLTD.NS", "BRITANNIA.NS",
            "CCL.NS", "CESC.NS", "CGPOWER.NS", "CIPLA.NS", "CUB.NS", "COALINDIA.NS",
            "COCHINSHIP.NS", "CADILAHC.NS", "CHOLAFIN.NS", "CROMPTON.NS", "CUMMINSIND.NS",
            "DABUR.NS", "DALBHARAT.NS", "DEEPAKNTR.NS", "DIVISLAB.NS", "DIXON.NS",
            "LALPATHLAB.NS", "DRREDDY.NS", "EIDPARRY.NS", "EIHOTEL.NS", "EPL.NS",
            "EICHERMOT.NS", "ESCORTS.NS", "EXIDEIND.NS", "FDC.NS", "NYKAA.NS",
            "FEDERALBNK.NS", "FORTIS.NS", "GAIL.NS", "GLENMARK.NS", "GMRINFRA.NS",
            "GODREJCP.NS", "GODREJPROP.NS", "GRANULES.NS", "GRASIM.NS", "GSPL.NS",
            "HEG.NS", "HCLTECH.NS", "HDFCAMC.NS", "HDFCLIFE.NS", "HAVELLS.NS",
            "HEROMOTOCO.NS", "HEXAWARE.NS", "HINDALCO.NS", "HINDCOPPER.NS", "HINDPETRO.NS",
            "HINDUNILVR.NS", "HINDZINC.NS", "POWERINDIA.NS", "HONAUT.NS", "HUDCO.NS",
            "ICICIBANK.NS", "ICICIGI.NS", "ICICIPRULI.NS", "IDFCFIRSTB.NS", "IEX.NS",
            "INDHOTEL.NS", "IOC.NS", "IOB.NS", "IRCTC.NS", "ITC.NS", "ITI.NS",
            "INDIACEM.NS", "INDIANB.NS", "INDIAMART.NS", "INDIGO.NS", "INDUSINDBK.NS",
            "INDUSTOWER.NS", "INFY.NS", "INGERRAND.NS", "INOXLEISUR.NS", "INTELLECT.NS",
            "ISEC.NS", "IPCALAB.NS", "JKCEMENT.NS", "JKLAKSHMI.NS", "JMFINANCIL.NS",
            "JSWSTEEL.NS", "JINDALSTEL.NS", "JUBLFOOD.NS", "JUBILANT.NS", "JUSTDIAL.NS",
            "JYOTHYLAB.NS", "KPITTECH.NS", "KEI.NS", "KNRCON.NS", "KRBL.NS",
            "L&TFH.NS", "LAXMIMACH.NS", "LICHSGFIN.NS", "LTIM.NS", "LTTS.NS",
            "LAURUSLABS.NS", "LEMONTREE.NS", "LT.NS", "LUPIN.NS", "MRF.NS",
            "LSC.NS", "MARICO.NS", "MARUTI.NS", "MFSL.NS", "MAXHEALTH.NS",
            "MAZDOCK.NS", "METROPOLIS.NS", "MINDACORP.NS", "MINDTREE.NS", "MPHASIS.NS",
            "MCX.NS", "MUTHOOTFIN.NS", "NATIONALUM.NS", "NBCC.NS", "NCC.NS",
            "NEOGEN.NS", "NESTLEIND.NS", "NETWORK18.NS", "NMDC.NS", "NTPC.NS",
            "NAVINFLUOR.NS", "NAZARA.NS", "NIACL.NS", "NIITLTD.NS", "NLCINDIA.NS",
            "NOCIL.NS", "NUVOCO.NS", "OBEROIRLTY.NS", "OFSS.NS", "ONGC.NS",
            "OIL.NS", "PAYTM.NS", "PAGEIND.NS", "PERSISTENT.NS", "PETRONET.NS",
            "PFIZER.NS", "PIDILITIND.NS", "PEL.NS", "POLYCAB.NS", "POLYMED.NS",
            "POONAWALLA.NS", "PFC.NS", "POWERGRID.NS", "PRAJIND.NS", "PRESTIGE.NS",
            "PGHH.NS", "PURVA.NS", "QUESS.NS", "RBLBANK.NS", "RECLTD.NS",
            "RELIANCE.NS", "ROUTE.NS", "RPOWER.NS", "RVNL.NS", "SAIL.NS",
            "SBICARD.NS", "SBILIFE.NS", "SBIN.NS", "SHREECEM.NS", "SHRIRAMFIN.NS",
            "SIEMENS.NS", "SRF.NS", "MOTHERSON.NS", "SOLARINDS.NS", "SONACOMS.NS",
            "SOUTHBANK.NS", "STARHEALTH.NS", "SUNTV.NS", "SYNGENE.NS", "TVSMOTOR.NS",
            "TMB.NS", "TANLA.NS", "TATACOMM.NS", "TATACONSUM.NS", "TATAMOTORS.NS",
            "TATAPOWER.NS", "TATASTEEL.NS", "TCS.NS", "TECHM.NS", "RAMCOCEM.NS",
            "THERMAX.NS", "THYROCARE.NS", "TIINDIA.NS", "TITAN.NS", "TORNTPHARM.NS",
            "TORNTPOWER.NS", "TRENT.NS", "TRIDENT.NS", "TRIVENI.NS", "UJJIVAN.NS",
            "ULTRACEMCO.NS", "UPL.NS", "UTIAMC.NS", "VOLTAS.NS", "WIPRO.NS",
            "WOCKPHARMA.NS", "YESBANK.NS", "ZEEL.NS", "ZENSARTECH.NS", "ZENTEC.NS",
            "ZYDUSLIFE.NS", "ECLERX.NS"
            // Total: ~300 stocks (add more as needed to reach 500)
        ];
    }

    /**
     * DAILY WATCHLIST SCAN - THE ONLY METHOD THAT MATTERS
     * Scans all stocks, picks top 20 BUY signals, saves to DB
     */
    async runDailyScan() {
        console.log('🔍 DAILY WATCHLIST SCAN STARTING...');
        console.log(`📊 Scanning ${this.STOCK_UNIVERSE.length} stocks for BUY signals`);

        // Step 1: Clear old watchlist
        await prisma.watchlistStock.deleteMany({});
        console.log('🗑️ Cleared old watchlist');

        // Step 2: Analyze all stocks in batches
        const buySignals = [];
        const batchSize = 10;

        for (let i = 0; i < this.STOCK_UNIVERSE.length; i += batchSize) {
            const batch = this.STOCK_UNIVERSE.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.STOCK_UNIVERSE.length/batchSize)}`);

            // Analyze batch in parallel
            const batchPromises = batch.map(symbol => this.analyzeStock(symbol));
            const batchResults = await Promise.allSettled(batchPromises);

            // Collect BUY signals
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    buySignals.push(result.value);
                }
            });

            // Brief pause between batches
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Step 3: Sort by confidence, take top 20
        const topSignals = buySignals
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 20);

        console.log(`🎯 Found ${buySignals.length} BUY signals, selecting top ${topSignals.length}`);

        // Step 4: Save to database with COMPLETE signal analysis data
        for (const signal of topSignals) {
            await prisma.watchlistStock.create({
                data: {
                    symbol: signal.symbol,
                    currentPrice: signal.price,
                    currency: signal.symbol.includes('.NS') ? 'INR' : 'USD',
                    market: signal.symbol.includes('.NS') ? 'IN' : 'US',
                    
                    // Decision data
                    decisionAction: signal.action,
                    decisionConfidence: signal.confidence,
                    decisionGrade: signal.grade,
                    decisionReasoning: signal.reasoning,
                    systemsAgreement: signal.systemsAgreement,
                    systemsAnalyzed: signal.systemsAnalyzed,
                    
                    // Store COMPLETE analysis data as JSON strings
                    executionData: JSON.stringify(signal.execution),
                    systemsData: JSON.stringify(signal.systems),
                    contextData: JSON.stringify(signal.context),
                    riskData: JSON.stringify(signal.risk),
                    
                    priority: signal.confidence >= 0.8 ? 1 : (signal.confidence >= 0.6 ? 2 : 3),
                    status: 'ACTIVE',
                    nextStepSummary: signal.nextStepSummary || `Execute ${signal.action} order`,
                    addedAt: new Date(),
                    lastAnalyzedAt: new Date()
                }
            });
        }

        console.log('✅ DAILY WATCHLIST SCAN COMPLETE');
        return {
            scanned: this.STOCK_UNIVERSE.length,
            buySignals: buySignals.length,
            watchlistSize: topSignals.length,
            avgConfidence: topSignals.reduce((sum, s) => sum + s.confidence, 0) / topSignals.length
        };
    }

    /**
     * ANALYZE SINGLE STOCK - SIMPLE & FAST
     * Gets complete signal analysis data from signal-analysis.controller.js
     */
    async analyzeStock(symbol) {
        try {
            // Use fetch instead of caveman HTTP
            const response = await fetch(`http://localhost:8000/api/trading/signal-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: [symbol] })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const result = data.results?.[0];

            if (!result || !['BUY', 'STRONG_BUY'].includes(result.decision?.action)) {
                return null; // Only interested in BUY signals
            }

            // Return COMPLETE signal analysis data (not just fragments)
            return {
                symbol,
                action: result.decision.action,
                confidence: result.decision.confidence,
                grade: result.decision.grade || 'C',
                reasoning: Array.isArray(result.decision.reasoning) 
                    ? result.decision.reasoning.join('; ') 
                    : result.decision.reasoning,
                systemsAgreement: result.decision.systemsAgreement,
                systemsAnalyzed: result.decision.systemsAnalyzed,
                price: result.currentPrice,
                
                // Store COMPLETE analysis objects as JSON
                execution: result.execution,     // Complete execution data
                systems: result.systems,         // Complete systems analysis
                context: result.context,         // Complete market context  
                risk: result.risk,              // Complete risk analysis
                riskReward: result.riskReward,  // Risk/reward calculations
                
                // Additional useful data
                nextStepSummary: result.nextStepSummary,
                timestamp: result.timestamp
            };

        } catch (error) {
            console.error(`❌ Error analyzing ${symbol}:`, error.message);
            return null;
        }
    }

    /**
     * GET CURRENT WATCHLIST - DISPLAY COMPLETE DATA
     */
    async getWatchlist() {
        const stocks = await prisma.watchlistStock.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { priority: 'asc' }
        });

        return stocks.map(stock => ({
            symbol: stock.symbol,
            action: stock.decisionAction,
            confidence: `${(stock.decisionConfidence * 100).toFixed(1)}%`,
            grade: stock.decisionGrade,
            price: stock.currentPrice,
            reasoning: stock.decisionReasoning,
            systemsAgreement: stock.systemsAgreement,
            systemsAnalyzed: stock.systemsAnalyzed,
            
            // Parse JSON data for frontend display
            execution: stock.executionData ? JSON.parse(stock.executionData) : null,
            systems: stock.systemsData ? JSON.parse(stock.systemsData) : null,
            context: stock.contextData ? JSON.parse(stock.contextData) : null,
            risk: stock.riskData ? JSON.parse(stock.riskData) : null,
            
            nextStepSummary: stock.nextStepSummary,
            addedAt: stock.addedAt,
            market: stock.market,
            currency: stock.currency
        }));
    }
}

module.exports = SimpleWatchlistService;
