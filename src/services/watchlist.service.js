/**
 * 🎯 SIMPLE WATCHLIST SERVICE - BRUTAL SIMPLICITY
 * 
 * ONE JOB: Scan 500 stocks daily, save top 20 BUY/WATCH signals to watchlist
 * PRIORITY: BUY signals first (sorted by confidence & grade), then WATCH signals
 * NO BULLSHIT. NO CONFUSION. NO OVER-ENGINEERING.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchCurrentPrice, getTickerAnalysis } = require('./comom.service');
const { get } = require('lodash');
const { getSimpleTechnicalData, detectBreakoutPullbackSetup } = require('../utils/simpleTechnicalDataFetcher');


class WatchlistService {
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

            // // NIFTY Next 50 + Mid Cap 150 + Small Cap 250
            "360ONE.NS", "3MINDIA.NS", "ABB.NS", "ACC.NS", "AIAENG.NS", "APLAPOLLO.NS",
            "AUBANK.NS", "AWL.NS", "AADHARHFC.NS", "AARTIIND.NS", "AAVAS.NS", "ABBOTINDIA.NS",
            "ACE.NS", "ADANIENSOL.NS", "ADANIGREEN.NS", "ADANIPOWER.NS", "ATGL.NS", "ABCAPITAL.NS",
            "ABFRL.NS", "AEGISLOG.NS", "AFFLE.NS", "AJANTPHARM.NS", "ALKEM.NS", "ALKYLAMINE.NS",
            "AMBER.NS", "AMBUJACEM.NS", "ANGELONE.NS", "APARINDS.NS", "APOLLOTYRE.NS", "APTUS.NS",
            "ASHOKLEY.NS", "ASTERDM.NS", "ASTRAZEN.NS", "ASTRAL.NS", "ATUL.NS",
            "BASF.NS", "BATAINDIA.NS", "BEL.NS", "BERGEPAINT.NS", "BDL.NS", "BLS.NS",
            "BSE.NS", "BALKRISIND.NS", "BALRAMCHIN.NS", "BANDHANBNK.NS", "BANKBARODA.NS",
            "BANKINDIA.NS", "MAHABANK.NS", "CENTRALBK.NS", "CANBK.NS", "BHARATFORG.NS",
            "BHEL.NS", "BIOCON.NS", "BIRLACORPN.NS", "BSOFT.NS",
            "BLUEDART.NS", "BLUESTARCO.NS", "BBTC.NS", "BOSCHLTD.NS",
            "CCL.NS", "CESC.NS", "CGPOWER.NS", "CUB.NS",
            "COCHINSHIP.NS", "CHOLAFIN.NS", "CROMPTON.NS", "CUMMINSIND.NS",
            "DALBHARAT.NS", "DEEPAKNTR.NS", "DIXON.NS", "LALPATHLAB.NS",
            "EIDPARRY.NS", "EIHOTEL.NS", "EPL.NS", "ESCORTS.NS", "EXIDEIND.NS", "FDC.NS", "NYKAA.NS",
            "FEDERALBNK.NS", "FORTIS.NS", "GLENMARK.NS", "GODREJPROP.NS", "GRANULES.NS", "GSPL.NS",
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
            "UPL.NS", "UTIAMC.NS", "VOLTAS.NS", "WOCKPHARMA.NS", "YESBANK.NS", "ZEEL.NS", "ZENSARTECH.NS", "ZENTEC.NS", "ZYDUSLIFE.NS", "ECLERX.NS",

            // S&P 500 Stocks

                        "MMM","AOS","ABT","ABBV","ACN","ADBE","AMD","AES","AFL","A","APD","AKAM","ALK","ALL","GOOGL","GOOG","MO","AMZN","AMCR","AEE",
              "AAL","AEP","AXP","AIG","AMT","AWK","AMP","ABC","AME","AMGN","APH","ADI","ANSS","ANTM","AON","APA","AAPL","AMAT","APTV",
              "ADM","ARNC","ANET","AJG","AIZ","T","ATO","ADSK","ADP","AZO","AVB","AVY","BKR","BLL","BAC","BK","BAX","BDX","BRK.B",
              "BBY","BIO","BIIB","BLK","BA","BKNG","AVGO","BWA","BXP","BSX","BMY","AVY","COG","CDNS","CPB","COF","CAH","KMX","CCL","CARR",
              "CTLT","CAT","CBOE","CBRE","CDW","CE","CNC","CNP","CDAY","CERN","CF","SCHW","CHTR","CVX","CMG","CB","CHD","CI","CINF",
              "CTAS","CSCO","C","CFG","CTXS","CLX","CME","CMS","KO","CTSH","CL","CMCSA","CMA","CAG","COP","ED","STZ","COO","CPRT","GLW",
              "CTVA","COST","COTY","CCI","CSX","CMI","CVS","DHI","DHR","DRI","DVA","DE","DAL","XRAY","DVN","DXCM","FANG","DLR","DFS",
              "DISCA","DISCK","DISH","DG","DLTR","D","DPZ","DOV","DOW","DTE","DUK","DRE","DD","DXC","EMN","ETN","EBAY","ECL","EIX","EW",
              "EA","ETR","EOG","EFX","EQIX","EQR","ESS","EL","ETSY","RE","EXC","EXPE","EXPD","EXR","XOM","FFIV","FB","FAST","FRT","FDX",
              "FIS","FITB","FRC","FE","FISV","FLT","FMC","F","FTNT","FTV","FBHS","FOXA","FOXA","BEN","FCX","GPS","GRMN","IT","GD",
              "GE","GIS","GM","GPC","GILD","GL","GPN","GS","GWW","HAL","HBI","HOG","HIG","HAS","HCA","PEAK","HSIC","HSY","HES","HPE",
              "HLT","HOLX","HD","HON","HRL","HST","HPQ","HUM","HBAN","HII","IEX","IDXX","INFO","ITW","ILMN","INCY","IR","INTC","ICE",
              "IBM","IP","IPG","IFF","INTU","ISRG","IVZ","IPGP","IQV","IRM","JKHY","J","JBHT","JNJ","JCI","JPM","JNPR","KSU","K","KEY",
              "KEYS","KMB","KIM","KMI","KLAC","KHC","KR","LHX","LH","LRCX","LW","LLY","LNC","LIN","LYV","LKQ","LMT","L","LULU","LH",
              "MRO","MPC","MKTX","MCHP","MCD","MCK","MDT","MRK","MET","MTD","MGM","MCHP","MU","MSFT","MA","MHK","TAP","MDLZ","MNST",
              "MCO","MS","MOS","MSI","MSCI","NDAQ","NTAP","NFLX","NWL","NEM","NWS","NWSA","NEE","NLSN","NKE","NCLH","NTRS","NOC","NLOK",
              "NCLH","NOV","NRG","NUE","NVDA","NVR","ORLY","OXY","ODFL","OMC","OKE","ORCL","OGN","PCAR","PKG","PH","PAYX","PAYC","PYPL","PNR",
              "PBCT","PEP","PKI","PRGO","PFE","PM","PSX","PNW","PXD","PNC","PNR","PRU","PG","PGR","PLD","PRU","PEG","PSA","PHM","PVH",
              "QRVO","PWR","QCOM","DGX","RL","RTX","O","REG","REGN","RF","RSG","RMD","RHI","ROK","COL","ROP","ROST","RCL","CRM","SBAC",
              "SLB","STX","SEE","SRE","NOW","SHW","SPG","SWKS","SLG","SNA","SO","LUV","SPGI","SWK","SBUX","STT","STE","SYK","SIVB",
              "SYMC","SYY","TMUS","TROW","TTWO","TPR","TGT","TEL","TDY","TFX","TER","TSLA","TXN","TXT","TMO","TJX","TSCO","TT","TDG","TRV",
              "TRMB","TFC","TWTR","TYL","TSN","UDR","ULTA","USB","UAA","UA","UNP","UAL","UNH","UPS","URI","UHS","VAR","VFC","VLO","VTR",
              "VRSN","VRSK","VZ","VRTX","VIAC","V","VNO","VMC","WAB","WMT","WBA","DIS","WM","WAT","WEC","WFC","WELL","WDC","WU","WRK",
              "WY","WHR","WMB","WLTW","WYNN","XEL","XLNX","XOM","XRAY","XYL","YUM","ZBRA","ZBH","ZION","ZTS",


            // // Technology
            "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "TSLA", "META", "NVDA", "ORCL", "CRM",
            "ADBE", "NFLX", "INTC", "CSCO", "IBM", "QCOM", "TXN", "AVGO", "AMAT", "LRCX",
            "KLAC", "MRVL", "SNPS", "CDNS", "FTNT", "PANW", "CRWD", "ZS", "OKTA", "DDOG",

            // Financial Services
            "BRK.A", "BRK.B", "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "BLK",
            "SCHW", "USB", "PNC", "TFC", "COF", "DFS", "SYF", "PYPL", "V", "MA",

            // Healthcare & Pharma
            "JNJ", "PFE", "UNH", "ABBV", "MRK", "TMO", "ABT", "MDT", "ISRG", "DHR",
            "BMY", "AMGN", "GILD", "VRTX", "REGN", "BIIB", "ILMN", "MRNA", "BNTX", "ZTS",

            // Consumer & Retail
            "HD", "MCD", "NKE", "SBUX", "LOW", "TGT", "WMT",
            "COST", "KO", "PEP", "PG", "UL", "CL", "KMB", "GIS", "K", "CPB",

            // Industrial & Manufacturing
            "BA", "CAT", "DE", "MMM", "GE", "HON", "UPS", "FDX", "LMT", "RTX",
            "NOC", "LHX", "GD", "TDG", "CTAS", "EMR", "ETN", "ITW", "CMI", "PCAR",

            // Energy & Utilities
            "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "VLO", "PSX", "KMI", "OKE",
            "WMB", "EPD", "ET", "MPLX", "NEE", "SO", "DUK", "AEP", "EXC", "XEL",

            // Materials & Chemicals
            "LIN", "APD", "ECL", "SHW", "DD", "DOW", "LYB", "CF", "MOS", "FMC",
            "ALB", "VMC", "MLM", "EMN", "PPG", "RPM", "CC", "PKG", "IP", "WRK",

            // REITs & Real Estate
            "AMT", "CCI", "EQIX", "PLD", "WELL", "PSA", "EXR", "AVB", "EQR", "MAA",
            "UDR", "CPT", "ESS", "AIV", "BXP", "VTR", "PEAK", "O", "STOR", "WPC",

            // Communication Services
            "T", "VZ", "TMUS", "CHTR", "CMCSA", "TWTR",
            "SNAP", "PINS", "MTCH", "ROKU", "SPOT", "ZM", "DOCU", "WORK", "TEAM", "PTON",

            // Growth & Emerging Stocks
            "SHOP", "SQ", "UBER", "LYFT", "ABNB", "COIN", "HOOD", "PLTR", "SNOW", "UNITY",
            "RBLX", "ZI", "CPNG", "BABA", "JD", "PDD", "BIDU", "BILI", "NIO", "XPEV",
            "LI", "RIVN", "LCID", "CCIV", "SPCE", "ARKK", "ARKG", "ARKQ", "ARKW", "PRNT"
        ];

        this.DELISTED_STOCKS = [
  "HEXAWARE.NS",
  "INOXLEISUR.NS",
  "ISEC.NS",
  "JUBILANT.NS",
  "L&TFH.NS",
  "LAXMIMACH.NS",
  "LSC.NS",
  "MINDTREE.NS",
  "UJJIVAN.NS",
  "ABC",
  "ANTM",
  "ARNC",
  "BLL",
  "BRK.B",
  "COG",
  "CTLT",
  "CDAY",
  "CERN",
  "CTXS",
  "DFS",
  "DISCA",
  "DISCK",
  "DISH",
  "DRE",
  "RE",
  "FRC",
  "FISV",
  "FLT",
  "FBHS",
  "GPS",
  "PEAK",
  "JNPR",
  "KSU",
  "MRO",
  "NLSN",
  "NLOK",
  "PBCT",
  "PKI",
  "PXD",
  "COL",
  "SIVB",
  "SYMC",
  "TWTR",
  "VAR",
  "VIAC",
  "WRK",
  "WLTW",
  "XLNX",
  "BRK.A",
  "STOR",
  "WORK",
  "SQ",
  "UNITY",
  "ZI",
  "CCIV"
];
        this.STOCK_UNIVERSE = this.STOCK_UNIVERSE.filter(s => !this.DELISTED_STOCKS.includes(s));

        console.log(`🧮 WatchlistService initialized with ${this.STOCK_UNIVERSE.length} stocks`);
    }

    /**
     * DAILY WATCHLIST SCAN - THE ONLY METHOD THAT MATTERS
     * Scans all stocks, picks top 20 BUY/WATCH signals, saves to DB
     */
    async runDailyScan() {
        console.log('🔍 DAILY WATCHLIST SCAN STARTING...');
        const distinctSymbols = Array.from(new Set(this.STOCK_UNIVERSE));
        console.log(`📊 Scanning ${distinctSymbols.length} stocks for BUY/WATCH signals`);
        // Get the symbols you want to keep
        const trades = await prisma.trade.findMany({
            where: {
                status: {
                    not: "Closed"   // or whatever your field/value is for closed trades
                }
            },
            select: { ticker: true }   // only fetch the ticker column
        });

        const symbolsToKeep = trades.map(t => t.ticker);

        // Step 1: Delete everything EXCEPT symbolsToKeep
        await prisma.watchlistStock.deleteMany({
            where: {
                symbol: {
                    notIn: symbolsToKeep
                }
            }
        });
        console.log('🗑️ Cleared old watchlist');

        // Step 2: Analyze all stocks in batches
        const buySignals = [];
        const strongBuySignals = [];
        const watchSignals = [];
        const batchSize = 10;

        for (let i = 0; i < distinctSymbols.length; i += batchSize) {
            const batch = distinctSymbols.slice(i, i + batchSize);
            console.log(
                `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(distinctSymbols.length / batchSize)}`
            );

            // ✅ Remove symbols that are already in active trades
            const filteredBatch = batch.filter(symbol => {
                if (symbolsToKeep.includes(symbol)) {
                    console.log(`Skipping ${symbol} - already in active trades`);
                    return false; // exclude this symbol
                }
                return true; // keep it
            });

            if (filteredBatch.length === 0) {
                console.log("No valid symbols in this batch, moving on...");
                continue;
            }
            const batchPromises = filteredBatch.map(symbol => getTickerAnalysis(symbol)); // no await here

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, idx) => {
                if (result.status !== 'fulfilled' || !result.value) return;

                const signal = result.value; // expect { symbol, decision: { action, confidence }, ... }
                const pct = signal.decision.confidence

                if (signal.decision.action === 'STRONG_BUY') {
                    strongBuySignals.push(signal);
                    return; 
                }

                if (signal.decision.action === 'BUY') {
                    buySignals.push(signal);
                } else if (signal.decision.action === 'WATCH') {
                    watchSignals.push(signal);
                }
            });

            // brief pause between batches to be nice to APIs
            await new Promise(r => setTimeout(r, 1000));
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
            ...sortedWatchSignals.slice(0, 10)
        ]

        console.log(`🎯 Found ${buySignals.length} BUY signals, ${watchSignals.length} WATCH signals`);
        console.log(`📝 Saving top ${combinedSignals.length} signals to watchlist`);

        // Step 5: Save to database with COMPLETE signal analysis data
        for (const signal of combinedSignals) {
            try {
                const watchlistData = {
                    symbol: signal.symbol,
                    currentPrice: signal.currentPrice || 0,
                    entryPrice: signal.currentPrice || 0,
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
                strongBuy: combinedSignals.filter(s => s.decision?.action === 'STRONG_BUY').length,
                buy: combinedSignals.filter(s => s.decision?.action === 'BUY').length,
                watch: combinedSignals.filter(s => s.decision?.action === 'WATCH').length
            },
            avgConfidence: combinedSignals.length > 0 ?
                combinedSignals.reduce((sum, s) => sum + (s.decision?.confidence || 0), 0) / combinedSignals.length : 0
        };
    }

    /**
     * GET CURRENT WATCHLIST - DISPLAY COMPLETE DATA
     */
    async getWatchlist() {
        const stocks = await prisma.watchlistStock.findMany({});
        const symbolsToKeep = stocks.map(s => s.symbol);
        const trades = await prisma.trade.findMany({
            where: { ticker: { in: symbolsToKeep } },
            select: { ticker: true },
            distinct: ['ticker']
        });
        
        const symbolsInTrades = trades.map(t => t.ticker);
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

            // // Fetch current price if not available or is zero
            // let currentPrice = stock.currentPrice;
            // currentPrice = await fetchCurrentPrice(stock.symbol);
            // // Optionally update the database with the new price
            // await prisma.watchlistStock.update({
            //     where: { symbol: stock.symbol },
            //     data: { currentPrice: currentPrice }
            // });
            return {
                symbol: stock.symbol,
                price: stock.currentPrice,
                entryPrice: stock.entryPrice,
                market: stock.market,
                currency: stock.currency,
                inTrade: symbolsInTrades.includes(stock.symbol) ? true : false,
                // Parsed JSON data for frontend display
                decision,
                execution,
                createdAt: stock.createdAt,
            };
        }));

        return processedStocks;
    }

    async runBreakoutScan() {

        console.log('🔍 DAILY BREAKOUT SCAN STARTING...');
        const distinctSymbols = Array.from(new Set(this.STOCK_UNIVERSE));
        console.log(`📊 Scanning ${distinctSymbols.length} stocks for Breakout signals`);


        // Step 2: Analyze all stocks in batches
        const breakOutSignals = [];
        const batchSize = 10;

        for (let i = 0; i < distinctSymbols.length; i += batchSize) {
            const batch = distinctSymbols.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(distinctSymbols.length / batchSize)}`);

            const batchPromises = batch.map(symbol => getSimpleTechnicalData(symbol)); // no await here

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, idx) => {
                if (result.status !== 'fulfilled' || !result.value) return;

                const technicalData = result.value; // expect { symbol, decision: { action, confidence }, ... }
                const isBreakout = detectBreakoutPullbackSetup(technicalData.indicators);
                console.log(technicalData.symbol, isBreakout);
                if (isBreakout) {
                    breakOutSignals.push({
                        symbol: technicalData.symbol,
                        isBreakout,
                    });
                    return;
                }
            });

            // brief pause between batches to be nice to APIs
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log('✅ DAILY BREAKOUT SCAN COMPLETE');
        return {
            breakouts: breakOutSignals
        };
    }

}

module.exports = WatchlistService;
