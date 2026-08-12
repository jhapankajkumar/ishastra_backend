/**
 * 🎯 SIMPLE WATCHLIST SERVICE - BRUTAL SIMPLICITY
 * 
 * ONE JOB: Scan 500 stocks daily, save top 20 BUY/WATCH signals to watchlist
 * PRIORITY: BUY signals first (sorted by confidence & grade), then WATCH signals
 * NO BULLSHIT. NO CONFUSION. NO OVER-ENGINEERING.
 */

const prisma = require('../db');
const { fetchCurrentPrice, getTickerAnalysis } = require('./comom.service');
const { get } = require('lodash');
const { getSimpleTechnicalData, detectBreakoutPullbackSetup } = require('../utils/simpleTechnicalDataFetcher');


class WatchlistService {
    constructor() {
        // Indian stock universe - 500 most liquid stocks (NIFTY 500)
        this.STOCK_UNIVERSE = [
            // NIFTY 50 - Top tier
            // "360ONE.NS","3MINDIA.NS","ABB.NS","ACC.NS","ACMESOLAR.NS","AIAENG.NS","APLAPOLLO.NS","AUBANK.NS","AWL.NS","AADHARHFC.NS","AARTIIND.NS","AAVAS.NS","ABBOTINDIA.NS",
            // "ACE.NS","ADANIENSOL.NS","ADANIENT.NS","ADANIGREEN.NS","ADANIPORTS.NS","ADANIPOWER.NS","ATGL.NS","ABCAPITAL.NS","ABFRL.NS","ABREL.NS","ABSLAMC.NS","AEGISLOG.NS",
            // "AFCONS.NS","AFFLE.NS","AJANTPHARM.NS","AKUMS.NS","APLLTD.NS","ALIVUS.NS","ALKEM.NS","ALKYLAMINE.NS","ALOKINDS.NS","ARE&M.NS","AMBER.NS","AMBUJACEM.NS",
            // "ANANDRATHI.NS","ANANTRAJ.NS","ANGELONE.NS","APARINDS.NS","APOLLOHOSP.NS","APOLLOTYRE.NS","APTUS.NS","ASAHIINDIA.NS","ASHOKLEY.NS","ASIANPAINT.NS","ASTERDM.NS",
            // "ASTRAZEN.NS","ASTRAL.NS","ATUL.NS","AUROPHARMA.NS","AIIL.NS","DMART.NS","AXISBANK.NS","BASF.NS","BEML.NS","BLS.NS","BSE.NS","BAJAJ-AUTO.NS","BAJFINANCE.NS",
            // "BAJAJFINSV.NS","BAJAJHLDNG.NS","BAJAJHFL.NS","BALKRISIND.NS","BALRAMCHIN.NS","BANDHANBNK.NS","BANKBARODA.NS","BANKINDIA.NS","MAHABANK.NS","BATAINDIA.NS",
            // "BAYERCROP.NS","BERGEPAINT.NS","BDL.NS","BEL.NS","BHARATFORG.NS","BHEL.NS","BPCL.NS","BHARTIARTL.NS","BHARTIHEXA.NS","BIKAJI.NS","BIOCON.NS","BSOFT.NS",
            // "BLUEDART.NS","BLUESTARCO.NS","BBTC.NS","BOSCHLTD.NS","FIRSTCRY.NS","BRIGADE.NS","BRITANNIA.NS","MAPMYINDIA.NS","CCL.NS","CESC.NS","CGPOWER.NS","CRISIL.NS",
            // "CAMPUS.NS","CANFINHOME.NS","CANBK.NS","CAPLIPOINT.NS","CGCL.NS","CARBORUNIV.NS","CASTROLIND.NS","CEATLTD.NS","CENTRALBK.NS","CDSL.NS","CENTURYPLY.NS","CERA.NS",
            // "CHALET.NS","CHAMBLFERT.NS","CHENNPETRO.NS","CHOLAHLDNG.NS","CHOLAFIN.NS","CIPLA.NS","CUB.NS","CLEAN.NS","COALINDIA.NS","COCHINSHIP.NS","COFORGE.NS","COHANCE.NS",
            // "COLPAL.NS","CAMS.NS","CONCORDBIO.NS","CONCOR.NS","COROMANDEL.NS","CRAFTSMAN.NS","CREDITACC.NS","CROMPTON.NS","CUMMINSIND.NS","CYIENT.NS","DCMSHRIRAM.NS","DLF.NS",
            // "DOMS.NS","DABUR.NS","DALBHARAT.NS","DATAPATTNS.NS","DEEPAKFERT.NS","DEEPAKNTR.NS","DELHIVERY.NS","DEVYANI.NS","DIVISLAB.NS","DIXON.NS","LALPATHLAB.NS",
            // "DRREDDY.NS","DUMMYDBRLT.NS","EIDPARRY.NS","EIHOTEL.NS","EICHERMOT.NS","ELECON.NS","ELGIEQUIP.NS","EMAMILTD.NS","EMCURE.NS","ENDURANCE.NS","ENGINERSIN.NS",
            // "ERIS.NS","ESCORTS.NS","ETERNAL.NS","EXIDEIND.NS","NYKAA.NS","FEDERALBNK.NS","FACT.NS","FINCABLES.NS","FINPIPE.NS","FSL.NS","FIVESTAR.NS","FORTIS.NS","GAIL.NS",
            // "GVT&D.NS","GMRAIRPORT.NS","GRSE.NS","GICRE.NS","GILLETTE.NS","GLAND.NS","GLAXO.NS","GLENMARK.NS","MEDANTA.NS","GODIGIT.NS","GPIL.NS","GODFRYPHLP.NS","GODREJAGRO.NS",
            // "GODREJCP.NS","GODREJIND.NS","GODREJPROP.NS","GRANULES.NS","GRAPHITE.NS","GRASIM.NS","GRAVITA.NS","GESHIP.NS","FLUOROCHEM.NS","GUJGASLTD.NS","GMDCLTD.NS","GNFC.NS",
            // "GPPL.NS","GSPL.NS","HEG.NS","HBLENGINE.NS","HCLTECH.NS","HDFCAMC.NS","HDFCBANK.NS","HDFCLIFE.NS","HFCL.NS","HAPPSTMNDS.NS","HAVELLS.NS","HEROMOTOCO.NS","HSCL.NS",
            // "HINDALCO.NS","HAL.NS","HINDCOPPER.NS","HINDPETRO.NS","HINDUNILVR.NS","HINDZINC.NS","POWERINDIA.NS","HOMEFIRST.NS","HONASA.NS","HONAUT.NS","HUDCO.NS","HYUNDAI.NS",
            // "ICICIBANK.NS","ICICIGI.NS","ICICIPRULI.NS","IDBI.NS","IDFCFIRSTB.NS","IFCI.NS","IIFL.NS","INOXINDIA.NS","IRB.NS","IRCON.NS","ITC.NS","ITI.NS","INDGN.NS",
            // "INDIACEM.NS","INDIAMART.NS","INDIANB.NS","IEX.NS","INDHOTEL.NS","IOC.NS","IOB.NS","IRCTC.NS","IRFC.NS","IREDA.NS","IGL.NS","INDUSTOWER.NS","INDUSINDBK.NS",
            // "NAUKRI.NS","INFY.NS","INOXWIND.NS","INTELLECT.NS","INDIGO.NS","IGIL.NS","IKS.NS","IPCALAB.NS","JBCHEPHARM.NS","JKCEMENT.NS","JBMA.NS","JKTYRE.NS","JMFINANCIL.NS",
            // "JSWENERGY.NS","JSWHL.NS","JSWINFRA.NS","JSWSTEEL.NS","JPPOWER.NS","J&KBANK.NS","JINDALSAW.NS","JSL.NS","JINDALSTEL.NS","JIOFIN.NS","JUBLFOOD.NS","JUBLINGREA.NS",
            // "JUBLPHARMA.NS","JWL.NS","JUSTDIAL.NS","JYOTHYLAB.NS","JYOTICNC.NS","KPRMILL.NS","KEI.NS","KNRCON.NS","KPITTECH.NS","KAJARIACER.NS","KPIL.NS","KALYANKJIL.NS",
            // "KANSAINER.NS","KARURVYSYA.NS","KAYNES.NS","KEC.NS","KFINTECH.NS","KIRLOSBROS.NS","KIRLOSENG.NS","KOTAKBANK.NS","KIMS.NS","LTF.NS","LTTS.NS","LICHSGFIN.NS",
            // "LTFOODS.NS","LTIM.NS","LT.NS","LATENTVIEW.NS","LAURUSLABS.NS","LEMONTREE.NS","LICI.NS","LINDEINDIA.NS","LLOYDSME.NS","LODHA.NS","LUPIN.NS","MMTC.NS","MRF.NS",
            // "MGL.NS","MAHSEAMLES.NS","M&MFIN.NS","M&M.NS","MANAPPURAM.NS","MRPL.NS","MANKIND.NS","MARICO.NS","MARUTI.NS","MASTEK.NS","MFSL.NS","MAXHEALTH.NS","MAZDOCK.NS",
            // "METROPOLIS.NS","MINDACORP.NS","MSUMI.NS","MOTILALOFS.NS","MPHASIS.NS","MCX.NS","MUTHOOTFIN.NS","NATCOPHARM.NS","NBCC.NS","NCC.NS","NHPC.NS","NLCINDIA.NS","NMDC.NS",
            // "NSLNISP.NS","NTPCGREEN.NS","NTPC.NS","NH.NS","NATIONALUM.NS","NAVA.NS","NAVINFLUOR.NS","NESTLEIND.NS","NETWEB.NS","NETWORK18.NS","NEULANDLAB.NS","NEWGEN.NS",
            // "NAM-INDIA.NS","NIVABUPA.NS","NUVAMA.NS","OBEROIRLTY.NS","ONGC.NS","OIL.NS","OLAELEC.NS","OLECTRA.NS","PAYTM.NS","OFSS.NS","POLICYBZR.NS","PCBL.NS","PGEL.NS",
            // "PIIND.NS","PNBHOUSING.NS","PNCINFRA.NS","PTCIL.NS","PVRINOX.NS","PAGEIND.NS","PATANJALI.NS","PERSISTENT.NS","PETRONET.NS","PFIZER.NS","PHOENIXLTD.NS",
            // "PIDILITIND.NS","PEL.NS","PPLPHARMA.NS","POLYMED.NS","POLYCAB.NS","POONAWALLA.NS","PFC.NS","POWERGRID.NS","PRAJIND.NS","PREMIERENE.NS","PRESTIGE.NS","PNB.NS",
            // "RRKABEL.NS","RBLBANK.NS","RECLTD.NS","RHIM.NS","RITES.NS","RADICO.NS","RVNL.NS","RAILTEL.NS","RAINBOW.NS","RKFORGE.NS","RCF.NS","RTNINDIA.NS","RAYMONDLSL.NS",
            // "RAYMOND.NS","REDINGTON.NS","RELIANCE.NS","RPOWER.NS","ROUTE.NS","SBFC.NS","SBICARD.NS","SBILIFE.NS","SJVN.NS","SKFINDIA.NS","SRF.NS","SAGILITY.NS","SAILIFE.NS",
            // "SAMMAANCAP.NS","MOTHERSON.NS","SAPPHIRE.NS","SARDAEN.NS","SAREGAMA.NS","SCHAEFFLER.NS","SCHNEIDER.NS","SCI.NS","SHREECEM.NS","RENUKA.NS","SHRIRAMFIN.NS",
            // "SHYAMMETL.NS","SIEMENS.NS","SIGNATURE.NS","SOBHA.NS","SOLARINDS.NS","SONACOMS.NS","SONATSOFTW.NS","STARHEALTH.NS","SBIN.NS","SAIL.NS","SWSOLAR.NS","SUMICHEM.NS",
            // "SUNPHARMA.NS","SUNTV.NS","SUNDARMFIN.NS","SUNDRMFAST.NS","SUPREMEIND.NS","SUZLON.NS","SWANCORP.NS","SWIGGY.NS","SYNGENE.NS","SYRMA.NS","TBOTEK.NS","TVSMOTOR.NS",
            // "TANLA.NS","TATACHEM.NS","TATACOMM.NS","TCS.NS","TATACONSUM.NS","TATAELXSI.NS","TATAINVEST.NS","TATAMOTORS.NS","TATAPOWER.NS","TATASTEEL.NS","TATATECH.NS","TTML.NS",
            // "TECHM.NS","TECHNOE.NS","TEJASNET.NS","NIACL.NS","RAMCOCEM.NS","THERMAX.NS","TIMKEN.NS","TITAGARH.NS","TITAN.NS","TORNTPHARM.NS","TORNTPOWER.NS","TARIL.NS","TRENT.NS",
            // "TRIDENT.NS","TRIVENI.NS","TRITURBINE.NS","TIINDIA.NS","UCOBANK.NS","UNOMINDA.NS","UPL.NS","UTIAMC.NS","ULTRACEMCO.NS","UNIONBANK.NS","UBL.NS","UNITDSPR.NS","USHAMART.NS",
            // "VGUARD.NS","DBREALTY.NS","VTL.NS","VBL.NS","MANYAVAR.NS","VEDL.NS","VIJAYA.NS","VMM.NS","IDEA.NS","VOLTAS.NS","WAAREEENER.NS","WELCORP.NS","WELSPUNLIV.NS",
            // "WESTLIFE.NS","WHIRLPOOL.NS","WIPRO.NS","WOCKPHARMA.NS","YESBANK.NS","ZFCVINDIA.NS","ZEEL.NS","ZENTEC.NS","ZENSARTECH.NS","ZYDUSLIFE.NS","ECLERX.NS"


            // Russel 1000 Stocks
            // "A", "AA", "AAL","AAON","AAPL","ABBV","ABNB","ABT","ACGL","ACHC","ACI","ACM","ACN","ADBE","ADC","ADI","ADM","ADP","ADSK","ADT","AEE","AEP","AES",
            // "AFG","AFL","AFRM","AGCO","AGNC","AGO","AIG","AIT","AIZ","AJG","AKAM","AL","ALAB","ALB","ALGM","ALGN","ALK","ALL","ALLE","ALLY","ALNY","ALSN","AM",
            // "AMAT","AMCR","AMD","AME","AMG","AMGN","AMH","AMKR","AMP","AMT","AMTM","AMZN","AN","ANET","AON","AOS","APA","APD","APG","APH","APLS","APO","APP",
            // "APPF","APTV","AR","ARE","ARES","ARMK","ARW","AS","ASH","ASTS","ATI","ATO","ATR","AU","AUR","AVB","AVGO","AVT","AVTR","AVY","AWI","AWK","AXON",
            // "AXP","AXS","AXTA","AYI","AZO","BA","BAC","BAH","BALL","BAM","BAX","BBWI","BBY","BC","BDX","BEN","BEPC","BF.A","BFAM","BG","BHF","BIIB",
            // "BILL","BIO","BIRK","BJ","BK","BKNG","BKR","BLD","BLDR","BLK","BLSH","BMRN","BMY","BOKF","BPOP","BR","BRBR","BRK.B","BRKR","BRO","BROS","BRX",
            // "BSX","BSY","BURL","BWA","BWXT","BX","BXP","BYD","C","CACC","CACI","CAG","CAH","CAI","CAR","CARR","CART","CASY","CAT","CAVA","CB","CBOE","CBRE",
            // "CBSH","CCC","CCI","CCK","CCL","CDNS","CDW","CE","CEG","CELH","CERT","CF","CFG","CFLT","CFR","CG","CGNX","CHD","CHDN","CHE","CHH","CHRD","CHRW",
            // "CHTR","CHWY","CI","CIEN","CINF","CIVI","CL","CLF","CLH","CLVT","CLX","CMA","CMCSA","CME","CMG","CMI","CMS","CNA","CNC","CNH","CNM","CNP","CNXC",
            // "COF","COHR","COIN","COKE","COLB","COLD","COLM","COO","COP","COR","CORT","COST","COTY","CPAY","CPB","CPNG","CPRT","CPT","CR","CRCL","CRH","CRL",
            // "CRM","CROX","CRS","CRUS","CRWD","CSCO","CSGP","CSL","CSX","CTAS","CTRA","CTSH","CTVA","CUBE","CUZ","CVNA","CVS","CVX","CW","CWEN","CWE.A","CXT",
            // "CZR","D","DAL","DAR","DASH","DAY","DBX","DCI","DD","DDOG","DDS","DE","DECK","DELL","DG","DGX","DHI","DHR","DINO","DIS","DJT","DKNG","DKS","DLB",
            // "DLR","DLTR","DOC","DOCS","DOCU","DOV","DOW","DOX","DPZ","DRI","DRS","DT","DTE","DTM","DUK","DUOL","DV","DVA","DVN","DXC","DXCM","EA","EBAY","ECG",
            // "ECL","ED","EEFT","EFX","EG","EGP","EHC","EIX","EL","ELAN","ELF","ELS","ELV","EME","EMN","EMR","ENPH","ENTG","EOG","EPAM","EPR","EQH","EQIX","EQR",
            // "EQT","ES","ESAB","ESI","ESS","ESTC","ETN","ETR","ETSY","EVR","EVRG","EW","EWBC","EXAS","EXC","EXE","EXEL","EXLS","EXP","EXPD","EXPE","EXR","F",
            // "FAF","FANG","FAST","FBIN","FCN","FCNCA","FCX","FDS","FDX","FE","FERG","FFIV","FG","FHB","FHN","FICO","FIGR","FIS","FISV","FITB","FIVE","FIX",
            // "FLEX","FLO","FLS","FLUT","FMC","FNB","FND","FNF","FOUR","FOX","FOXA","FR","FRHC","FRMI","FRPT","FRT","FSLR","FTAI","FTI","FTNT","FTV","FWONA",
            // "FWONK","FYBR","G","GAP","GD","GDDY","GE","GEHC","GEN","GEV","GFS","GGG","GILD","GIS","GL","GLIBA","GLIBK","GLOB","GLPI","GLW","GM","GME","GMED",
            // "GNRC","GNTX","GOOG","GOOGL","GPC","GPK","GPN","GRMN","GS","GTES","GTLB","GTM","GWRE","GWW","GXO","H","HAL","HALO","HAS","HAYW","HBAN","HCA","HD",
            // "HEI","HEI.A","HHH","HIG","HII","HIW","HLI","HLNE","HLT","HOG","HOLX","HON","HOOD","HPE","HPQ","HR","HRB","HRL","HSIC","HST","HSY","HUBB","HUBS",
            // "HUM","HUN","HWM","HXL","IAC","IBKR","IBM","ICE","IDA","IDXX","IEX","IFF","ILMN","INCY","INGM","INGR","INSM","INSP","INTC","INTU","INVH","IONS",
            // "IOT","IP","IPGP","IQV","IR","IRDM","IRM","ISRG","IT","ITT","ITW","IVZ","J","JAZZ","JBHT","JBL","JCI","JEF","JHG","JHX","JKHY","JLL","JNJ","JPM",
            // "KBR","KD","KDP","KEX","KEY","KEYS","KHC","KIM","KKR","KLAC","KMB","KMI","KMPR","KMX","KNSL","KNX","KO","KR","KRC","KRMN","KVUE","L","LAD","LAMR",
            // "LAZ","LBRDA","LBRDK","LBTYA","LBTYK","LCID","LDOS","LEA","LECO","LEN","LEN.B","LFUS","LH","LHX","LII","LIN","LINE","LITE","LKQ","LLY","LLYVA",
            // "LLYVK","LMT","LNC","LNG","LNT","LOAR","LOPE","LOW","LPLA","LPX","LRCX","LSCC","LSTR","LULU","LUV","LVS","LW","LYB","LYFT","LYV","M","MA","MAA",
            // "MAN","MANH","MAR","MAS","MASI","MAT","MCD","MCHP","MCK","MCO","MDB","MDLZ","MDT","MDU","MEDP","MET","META","MGM","MHK","MIDD","MKC","MKL","MKSI",
            // "MKTX","MLI","MLM","MMM","MNST","MO","MOH","MORN","MOS","MP","MPC","MPW","MPWR","MRK","MRNA","MRP","MRVL","MS","MSA","MSCI","MSFT","MSGS","MSI",
            // "MSM","MSTR","MTB","MTCH","MTD","MTDR","MTG","MTN","MTSI","MTZ","MU","MUSA","NBIX","NCLH","NCNO","NDAQ","NDSN","NEE","NEM","NET","NEU","NFG",
            // "NFLX","NI","NIQ","NKE","NLY","NNN","NOC","NOV","NOW","NRG","NSA","NSC","NTAP","NTNX","NTRA","NTRS","NU","NUE","NVDA","NVR","NVST","NVT","NWL",
            // "NWS","NWSA","NXST","NYT","O","OC","ODFL","OGE","OGN","OHI","OKE","OKTA","OLED","OLLI","OLN","OMC","OMF","ON","ONON","ONTO","ORCL","ORI","ORLY",
            // "OSK","OTIS","OVV","OWL","OXY","OZK","PAG","PANW","PATH","PAYC","PAYX","PB","PCAR","PCG","PCOR","PCTY","PEG","PEGA","PEN","PENN","PEP","PFE",
            // "PFG","PFGC","PG","PGR","PH","PHM","PINS","PK","PKG","PLD","PLNT","PLTR","PM","PNC","PNFP","PNR","PNW","PODD","POOL","POST","PPC","PPG","PPL",
            // "PR","PRGO","PRI","PRMB","PRU","PSA","PSN","PSTG","PSX","PTC","PVH","PWR","PYPL","Q","QCOM","QGEN","QRVO","QS","QSR","QXO","R","RAL","RARE","RBA",
            // "RBC","RBLX","RBRK","RCL","RDDT","REG","REGN","REXR","REYN","RF","RGA","RGEN","RGLD","RH","RHI","RITM","RIVN","RJF","RKLB","RKT","RL","RLI","RMD",
            // "RNG","RNR","ROIV","ROK","ROKU","ROL","ROP","ROST","RPM","RPRX","RRC","RRX","RS","RSG","RTX","RVMD","RVTY","RYAN","RYN","S","SAIA","SAIC","SAIL",
            // "SAM","SARO","SBAC","SBUX","SCCO","SCHW","SCI","SEB","SEE","SEIC","SF","SFD","SFM","SGI","SHC","SHW","SIRI","SITE","SJM","SLB","SLGN","SLM","SMCI",
            // "SMG","SMMT","SN","SNA","SNDK","SNDR","SNOW","SNPS","SNX","SO","SOFI","SOLS","SOLV","SON","SPG","SPGI","SPOT","SRE","SRPT","SSB","SSD","SSNC","ST",
            // "STAG","STE","STLD","STT","STWD","STZ","SUI","SW","SWK","SWKS","SYF","SYK","SYY","T","TAP","TDC","TDG","TDY","TEAM","TECH","TEM","TER","TFC","TFSL",
            // "TFX","TGT","THC","THG","THO","TIGO","TJX","TKO","TKR","TLN","TMO","TMUS","TNL","TOL","TOST","TPG","TPL","TPR","TREX","TRGP","TRMB","TROW","TRU",
            // "TRV","TSCO","TSLA","TSN","TT","TTC","TTD","TTEK","TTWO","TW","TWLO","TXN","TXRH","TXT","TYL","U","UA","UAA","UAL","UBER","UDR","UGI","UHAL","UHA.B",
            // "UHS","UI","ULTA","UNH","UNM","UNP","UPS","URI","USB","USFD","UTHR","UWMC","V","VEEV","VFC","VICI","VIK","VIRT","VKTX","VLO","VLTO","VMC","VMI","VNO",
            // "VNOM","VNT","VOYA","VRSK","VRSN","VRT","VRTX","VST","VTR","VTRS","VVV","VZ","W","WAB","WAL","WAT","WBD","WBS","WCC","WDAY","WDC","WEC","WELL","WEN",
            // "WEX","WFC","WFRD","WH","WHR","WING","WLK","WM","WMB","WMS","WMT","WPC","WRB","WSC","WSM","WSO","WST","WTFC","WTM","WTRG","WTW","WU","WWD","WY",
            // "WYNN","XEL","XOM","XP","XPO","XRAY","XYL","XYZ","YETI","YUM"

            //Trading View Filtered Stocks
            "DAL", "HEI", "HEI.A", "WAT", "UAL", "DXCM", "MDB", "ILMN", "IOT", "BBY", "NBIX", "GEN", "DOC", "RVTY", "LINE", "AAL", "CYTK", "QRVO", "ORA", "CLF", "LTH", "ZETA", "LIVN", "RUN", "VCYT", "YETI", "FLNC", "NSIT", "TDC", "GRAL", "PGNY", "AMRC", "RLJ", "SEPN", "BLFS", "OPK", "BJRI", "HNRG", "ESPR", "NXDR", "REPL", "OSPN", "AAOI", "ADV", "AFRM", "ASPI", "ASPN", "BLMN", "BRCC", "BRKR", "BRZE", "BTDR", "CCRN", "CIFR", "CLSK", "CORT", "CRCL", "CRNC", "CVI", "DAVE", "DSP", "ELVN", "EOLS", "FA", "FIVN", "FLY", "FORM", "FSLR", "FTRE", "GBTG", "GCO", "GH", "GRPN", "HOG", "HPQ", "HTFL", "HUM", "IART", "IBTA", "INBX", "MARA", "MGTX", "NET", "NEXT", "NRC", "OEC", "OMDA", "ORKA", "OSCR", "PRM", "PTEN", "PTON", "PUBM", "PVH", "QBTS", "RAL", "RAMP", "RBBN", "RBRK", "RDVT", "RGTI", "RMAX", "SABR", "SAIL", "SEZL", "SG", "SLP", "SNOW", "SOC", "STAA", "SWKS", "TDOC", "TENB", "TNC", "TNGX", "TSHA", "TVTX", "URGN", "USAR", "VOYG", "WLY", "WST", "XRX", "ZM", "AA", "AAMI", "AAON", "ABSI", "ACLS", "ACMR", "ADM", "ADTN", "AEHR", "AESI", "AEVA", "AGL", "AGX", "AIN", "AIP", "AIR", "AKAM", "ALAB", "ALGM", "ALKS", "ALNT", "ALRS", "AMAL", "AMBQ", "AMKR", "AMN", "AMPX", "AMSC", "ANAB", "AOSL", "APLD", "APPS", "ARCB", "ARKO", "ARMK", "ARW", "ARWR", "ASTH", "ASTS", "ATEN", "ATEX", "ATI", "ATNI", "ATRO", "AUR", "AVBP", "AVNS", "AVT", "AXGN", "AXSM", "BAND", "BE", "BEAM", "BELFB", "BEN", "BFH", "BFLY", "BHE", "BKSY", "BTSG", "BWA", "CAKE", "CARE", "CBL", "CBT", "CCSI", "CECO", "CELC", "CENX", "CERS", "CEVA", "CGEM", "CGNX", "CIEN", "CLDT", "CLFD", "CLMT", "CLOV", "CMI", "CMP", "CMPR", "CNC", "COCO", "CODI", "COHR", "COHU", "COLD", "CORZ", "CPRX", "CRDO", "CROX", "CRS", "CRSR", "CRUS", "CRWD", "CSTM", "CTOS", "CTS", "CVLG", "CW", "CYRX", "DAN", "DBI", "DBRG", "DCO", "DCOM", "DDD", "DDOG", "DFTX", "DGII", "DHC", "DINO", "DIOD", "DMRC", "DNTH", "DOCN", "DRS", "DRUG", "DVA", "DY", "EBAY", "ECG", "ECPG", "EDIT", "EGBN", "ENPH", "ENS", "ENTG", "EQIX", "ESI", "ETON", "EVC", "EVCM", "EWTX", "EXTR", "F", "FATE", "FCFS", "FCX", "FDX", "FFIV", "FIVE", "FIX", "FLEX", "FN", "FNKO", "FTAI", "FTNT", "GEO", "GFS", "GHM", "GLW", "GNRC", "GRC", "GRDN", "GSAT", "GTX", "GWW", "HELE", "HLIO", "HLIT", "HP", "HPE", "HTLD", "HUN", "HUT", "HYLN", "HZO", "IBKR", "ICHR", "IESC", "ILPT", "IMVT", "INDI", "INGM", "INOD", "IONQ", "IOVA", "IRDM", "IRM", "JAZZ", "JBHT", "JBL", "KALU", "KALV", "KELYA", "KEYS", "KFRC", "KGS", "KLIC", "KN", "KNX", "KOP", "KOPN", "KRYS", "LASR", "LEA", "LFUS", "LINC", "LIND", "LION", "LNTH", "LOCO", "LPG", "LQDA", "LSCC", "LSTR", "LUMN", "LUNR", "LXFR", "LYTS", "MAC", "MASS", "MATX", "MBIN", "MCHP", "MEI", "MIDD", "MIRM", "MITK", "MKSI", "MOD", "MOG.A", "MOV", "MPWR", "MRCY", "MRTN", "MRVI", "MRVL", "MRX", "MSBI", "MSGE", "MSGS", "MTRN", "MTSI", "MTX", "MTZ", "MXL", "MYRG", "NBN", "NBR", "NESR", "NEWT", "NGNE", "NHC", "NN", "NOV", "NOVT", "NPO", "NSA", "NTAP", "NTCT", "NUE", "NVAX", "NVCR", "NVEC", "NVT", "NVTS", "NWPX", "NXT", "OABI", "OBK", "ODC", "ODFL", "OGN", "OII", "OKTA", "OLPX", "ON", "OOMA", "OPLN", "OUST", "OUT", "PACK", "PAYS", "PBI", "PCT", "PDFS", "PEB", "PENG", "PGC", "PHIN", "PL", "PLOW", "PLPC", "PLSE", "PLUG", "PLXS", "POWI", "POWL", "PRAX", "PRLB", "PRMB", "PRSU", "PSMT", "PSTL", "PWR", "R", "RAPP", "RCAT", "RDW", "RELY", "REX", "RIOT", "RKLB", "RLAY", "RMBS", "RNG", "ROG", "ROIV", "ROKU", "ROST", "RPRX", "RRX", "RS", "RSI", "RUM", "RVMD", "RXO", "SAH", "SAIA", "SANM", "SATS", "SCCO", "SCHL", "SEI", "SHEN", "SHLS", "SIRI", "SITM", "SKYT", "SLAB", "SLB", "SLS", "SM", "SMCI", "SMTC", "SNDR", "SNEX", "SNX", "SPB", "SPHR", "SRTA", "SSRM", "ST", "STGW", "STLD", "STRL", "STRZ", "STT", "SWBI", "SXC", "SYNA", "SYRE", "TALK", "TE", "TECX", "TER", "TGT", "TH", "THR", "TIGO", "TKR", "TPR", "TRGP", "TRNS", "TTI", "TTMI", "TWLO", "TWST", "TXG", "UCTT", "UIS", "ULCC", "UNF", "UNFI", "UNIT", "UTI", "VAC", "VCTR", "VECO", "VIAV", "VICR", "VIK", "VIR", "VIRT", "VLO", "VMD", "VPG", "VRT", "VSAT", "VSCO", "VSH", "VSTS", "VTRS", "VVX", "WCC", "WDC", "WERN", "WEST", "WFRD", "WHD", "WSR", "WT", "WTI", "WTTR", "WULF", "XMTR", "XPER", "XPO", "YOU", "ZD", "ZVRA"
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
            "CCIV",

            // Indian Large-Cap Stocks
            // "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
            // "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS",
            // "ASIANPAINT.NS", "LT.NS", "AXISBANK.NS", "MARUTI.NS", "TITAN.NS",
            // "NESTLEIND.NS", "ULTRACEMCO.NS", "BAJFINANCE.NS", "SUNPHARMA.NS", "TECHM.NS",
            // "WIPRO.NS", "ONGC.NS", "TATAMOTORS.NS", "COALINDIA.NS", "NTPC.NS",
            // "POWERGRID.NS", "HCLTECH.NS", "BAJAJFINSV.NS", "DRREDDY.NS", "GRASIM.NS",
            // "CIPLA.NS", "EICHERMOT.NS", "TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS",
            // "ADANIPORTS.NS", "INDUSINDBK.NS", "BRITANNIA.NS", "DIVISLAB.NS", "APOLLOHOSP.NS",
            // "HEROMOTOCO.NS", "BPCL.NS", "IOC.NS", "GAIL.NS", "TATACONSUM.NS",
            // "MUTHOOTFIN.NS", "GODREJCP.NS", "BAJAJ-AUTO.NS", "ADANIENT.NS", "MARICO.NS",
            // "M&M.NS", "SHREECEM.NS", "PIDILITIND.NS", "DABUR.NS",

            //US Mega Cap Stocks
            "AAPL","ABBV", "AMAT", "AMD", "AMZN", "AVGO", "AXP",
            "BAC","BRK.B",
            "C", "CAT", "COST", "CRM", "CSCO", "CVX",
            "GE","GOOGL", "GOOG", "GS",
            "HD",
            "IBM", "INTC",
            "JNJ", "JPM",
            "KO",
            "LIN", "LLY", "LCRX",
            "MA", "MCD", "MDT", "META","MRK","MS", "MSFT","MU",
            "NFLX", "NVDA",
            "ORCL",

            "PG", "PLTR","PM",
            "RTX",
            "TMO", "TSLA", "TMUS",
            "UNH", "V",
            "WFC",
            "WNT",
            "XOM"
        ];
        this.STOCK_UNIVERSE = this.STOCK_UNIVERSE.filter(s => !this.DELISTED_STOCKS.includes(s));
    }

    /**
     * DAILY WATCHLIST SCAN - THE ONLY METHOD THAT MATTERS
     * Scans all stocks, picks top 20 BUY/WATCH signals, saves to DB
     */
    async runDailyScan(userId, stockUniverse) {
        console.log('🔍 DAILY WATCHLIST SCAN STARTING...');
        const distinctSymbols = stockUniverse === 'ALL' ? Array.from(new Set(this.STOCK_UNIVERSE)) : Array.from(new Set(stockUniverse));
        console.log(`📊 Scanning ${distinctSymbols.length} stocks for BUY/WATCH signals`);

        // Step 2: Analyze all stocks in batches
        const buySignals = [];
        const strongBuySignals = [];
        const watchSignals = [];
        const failedSymbols = [];
        const batchSize = 10;

        for (let i = 0; i < distinctSymbols.length; i += batchSize) {
            const batch = distinctSymbols.slice(i, i + batchSize);
            console.log(
                `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(distinctSymbols.length / batchSize)}`
            );

            // ✅ Remove symbols that are already in active trades
            const filteredBatch = batch.filter(symbol => {
                return true; // keep it
            });

            if (filteredBatch.length === 0) {
                console.log("No valid symbols in this batch, moving on...");
                continue;
            }
            const batchPromises = filteredBatch.map(symbol => getTickerAnalysis(symbol)); // no await here

            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, idx) => {
                if (result.status !== 'fulfilled' || !result.value) {
                    failedSymbols.push(filteredBatch[idx]);
                    return;
                }

                const signal = result.value; // expect { symbol, decision: { action, confidence }, ... }
                const pct = signal.decision.confidence

                if (signal.decision.action === 'STRONG_BUY') {
                    strongBuySignals.push(signal);
                    return;
                }

                if (signal.decision.action === 'BUY') {
                    buySignals.push(signal);
                }
                // else if (signal.decision.action === 'WATCH') {
                //     watchSignals.push(signal);
                // }
            });

            // brief pause between batches to be nice to APIs
            await new Promise(r => setTimeout(r, 1000));
        }

        // Step 3: Rank signals by PATTERN SCORE, not confidence.
        // BUY confidence is floored at ~90 for every BUY, so it cannot rank a
        // shortlist — 105 BUYs all "sorted" to the same place. patternScore
        // (unified VCP/Flag/BigBase score after the dirEff character gate) is
        // the number that actually discriminates within a prefiltered
        // momentum universe. dirEff breaks ties (smoother mover wins).
        const sortByQuality = (a, b) => {
            const scoreA = a.decision.patternScore ?? 0;
            const scoreB = b.decision.patternScore ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;
            const dirA = a.decision.dirEff ?? 0;
            const dirB = b.decision.dirEff ?? 0;
            if (dirB !== dirA) return dirB - dirA;
            return (b.decision.confidence ?? 0) - (a.decision.confidence ?? 0);
        };
        const sortedStrongBuySignals = strongBuySignals.sort(sortByQuality);
        const sortedBuySignals = buySignals.sort(sortByQuality);
        const sortedWatchSignals = watchSignals.sort(sortByQuality);

        // Step 4: Return ALL BUYs, ranked best-first by pattern score.
        // No cap — the trader reviews the full list manually; the ranking means
        // the strongest structures are at the top of the list.
        const totalBuyCandidates = strongBuySignals.length + buySignals.length;
        const rankedBuySignals = [
            ...sortedStrongBuySignals,
            ...sortedBuySignals
        ];

        let combinedSignals = [
            ...rankedBuySignals,
            ...sortedWatchSignals.slice(0, 10)
        ]

        console.log(`🎯 Found ${totalBuyCandidates} BUY signals (ranked by pattern score), ${watchSignals.length} WATCH signals`);
        console.log(`📝 Saving top ${combinedSignals.length} signals to watchlist`);


        // Step 1: Get this user's active trades (not closed)
        const trades = await prisma.trade.findMany({
            where: {
                userId,
                status: {
                    not: "Closed"
                }
            },
            select: { ticker: true }
        });
        const symbolsInTrades = trades.map(t => t.ticker);

        const validSignalSymbols = combinedSignals.map(s => s.symbol);

        // Step 5: Remove those from this user's watchlist only
        await prisma.watchlistStock.deleteMany({ where: { userId } });
        console.log('🗑️ Cleared old watchlist');

        combinedSignals = combinedSignals.filter(s => !symbolsInTrades.includes(s.symbol));
        console.log(`✅ ${combinedSignals.length} signals after removing active trades.`);

        // Step 5: Save to database with COMPLETE signal analysis data
        for (const signal of combinedSignals) {
            try {
                const watchlistData = {
                    userId,
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
                    where: { userId_symbol: { userId, symbol: signal.symbol } },
                    update: watchlistData,
                    create: watchlistData
                });
                console.log(`💾 Saved ${signal.symbol} (${signal.decision.action}) to watchlist`);

            } catch (error) {
                console.error(`❌ Error saving ${signal.symbol} to watchlist:`, error);
            }
        }

        // Ranked best-first — the order in this string is the review order.
        const buyStocks = rankedBuySignals.map(s => s.symbol).join(', ');
        const failedStocks = failedSymbols.join(', ');

        console.log('✅ DAILY WATCHLIST SCAN COMPLETE');
        return {
            scanned: distinctSymbols.length,
            buySignals: buyStocks,
            totalBuyCandidates,
            failedSymbols: failedStocks,
            failedCount: failedSymbols.length,
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
    async getWatchlist(userId) {
        const stocks = await prisma.watchlistStock.findMany({ where: { userId } });
        const symbolsToKeep = stocks.map(s => s.symbol);
        const trades = await prisma.trade.findMany({
            where: { userId, ticker: { in: symbolsToKeep } },
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

    async deleteFromWatchlist(userId, symbol) {
        try {
            await prisma.watchlistStock.delete({
                where: { userId_symbol: { userId, symbol } }
            });
            return { success: true, message: `Deleted ${symbol} from watchlist` };
        } catch (error) {
            console.error(`❌ Error deleting ${symbol} from watchlist:`, error);
            return { success: false, message: `Error deleting ${symbol} from watchlist` };
        }
    }

}

module.exports = WatchlistService;
