/**
 * Test script to understand the data structure required by trading systems
 * This will test Cup-with-Handle, RSI Mean Reversion, and MACD Divergence systems
 */

const CupWithHandle = require('./src/systems/cup-with-handle');
const RSIMeanReversion = require('./src/systems/rsi-mean-reversion');
const MACDDivergence = require('./src/systems/macd-divergence');

const { prepareAnalysisContext } = require('./src/controllers/ai/stock.expert.controller');

async function testSystemsDataStructure() {
    console.log('🔍 TESTING TRADING SYSTEMS DATA STRUCTURE');
    console.log('='.repeat(80));
    
    // Initialize systems
    const cupHandle = new CupWithHandle();
    const rsiMean = new RSIMeanReversion();
    const macdDiv = new MACDDivergence();
    
    // Test with a common stock - AAPL
    const testSymbol = 'AAPL';
    const testPeriod = '6mo';
    const testCapital = 100000;
    
    console.log(`\n📊 Fetching data for ${testSymbol} (${testPeriod})...`);
    
    try {
        const { analysisContext } = await prepareAnalysisContext(testSymbol, testPeriod, testCapital);
        
        console.log('\n📊 DATA STRUCTURE ANALYSIS:');
        console.log('='.repeat(50));
        
        // Log the structure
        console.log('\n🏗️ Analysis Context Structure:');
        console.log('Keys:', Object.keys(analysisContext));
        
        if (analysisContext.technical) {
            console.log('\n🔧 Technical Analysis Structure:');
            console.log('Technical keys:', Object.keys(analysisContext.technical));
            
            if (analysisContext.technical.ohlcData) {
                console.log('\n📈 OHLC Data:');
                console.log('- Length:', analysisContext.technical.ohlcData.length);
                console.log('- Sample record:', analysisContext.technical.ohlcData[0]);
            }
            
            if (analysisContext.technical.technicalIndicators) {
                console.log('\n📊 Technical Indicators:');
                console.log('Indicator keys:', Object.keys(analysisContext.technical.technicalIndicators));
                
                if (analysisContext.technical.technicalIndicators.latest) {
                    console.log('Latest indicators keys:', Object.keys(analysisContext.technical.technicalIndicators.latest));
                }
            }
        }
        
        // Prepare data for systems (following the pattern from trading system controller)
        const technicalData = analysisContext.technical;
        
        // Create data structure expected by systems
        const systemData = {
            series: {
                daily: technicalData.ohlcData || technicalData.historicalData
            },
            indicators: {
                base: technicalData.technicalIndicators?.latest || {}
            }
        };
        
        console.log('\n🎯 SYSTEM DATA STRUCTURE:');
        console.log('System data keys:', Object.keys(systemData));
        console.log('Series keys:', Object.keys(systemData.series));
        console.log('Daily data length:', systemData.series.daily?.length || 0);
        console.log('Indicators keys:', Object.keys(systemData.indicators));
        console.log('Base indicators keys:', Object.keys(systemData.indicators.base));
        
        console.log('\n🧪 TESTING EACH SYSTEM:');
        console.log('='.repeat(50));
        
        // Test Cup-with-Handle
        console.log('\n🏆 Testing Cup-with-Handle System:');
        try {
            const cupResult = cupHandle.analyze(systemData);
            console.log('✅ Cup-with-Handle analysis successful');
            console.log('Decision:', cupResult.decision);
            console.log('Confidence:', cupResult.confidence);
            console.log('Reasoning:', cupResult.reasoning);
        } catch (error) {
            console.error('❌ Cup-with-Handle analysis failed:', error.message);
            console.error('Stack:', error.stack);
        }
        
        // Test RSI Mean Reversion
        console.log('\n📈 Testing RSI Mean Reversion System:');
        try {
            const rsiResult = rsiMean.analyze(systemData);
            console.log('✅ RSI Mean Reversion analysis successful');
            console.log('Decision:', rsiResult.decision);
            console.log('Confidence:', rsiResult.confidence);
            console.log('Reasoning:', rsiResult.reasoning);
        } catch (error) {
            console.error('❌ RSI Mean Reversion analysis failed:', error.message);
            console.error('Stack:', error.stack);
        }
        
        // Test MACD Divergence
        console.log('\n📊 Testing MACD Divergence System:');
        try {
            const macdResult = macdDiv.analyze(systemData);
            console.log('✅ MACD Divergence analysis successful');
            console.log('Decision:', macdResult.decision);
            console.log('Confidence:', macdResult.confidence);
            console.log('Reasoning:', macdResult.reasoning);
        } catch (error) {
            console.error('❌ MACD Divergence analysis failed:', error.message);
            console.error('Stack:', error.stack);
        }
        
        console.log('\n🎉 TESTING COMPLETE');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Failed to prepare analysis context:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testSystemsDataStructure().then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
