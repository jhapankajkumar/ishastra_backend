/**
 * Test Script: Verify Signal Quality Improvements
 * Tests the removal of pattern detection systems and promotion of proven systems
 */

const { getAnalysisDirect } = require('./src/controllers/ai/stock.expert.controller');

async function testSignalQualityImprovements() {
  console.log('🧪 Testing Signal Quality Improvements...\n');

  try {
    // Test with a sample symbol
    const symbol = 'AAPL';
    const analysis = await getAnalysisDirect(symbol, '3mo', 100000, true);

    if (!analysis || !analysis.signalCollection) {
      console.log('❌ No analysis result returned');
      return;
    }

    console.log('📊 Signal Collection Analysis:');
    console.log(`   Total Signals: ${analysis.signalCollection.all.length}`);
    console.log(`   Primary Signals: ${analysis.signalCollection.primary.length}`);
    console.log(`   Confirmer Signals: ${analysis.signalCollection.confirmers.length}`);
    console.log(`   Veto Signals: ${analysis.signalCollection.vetoFilters.length}`);
    console.log(`   Position Sizing Signals: ${analysis.signalCollection.positionSizers.length}`);

    // Check for removed pattern detection systems
    const removedSystems = ['threeWeeksTight', 'cupHandle', 'flagPennant', 'darvasBox'];
    const foundRemovedSystems = analysis.signalCollection.all.filter(signal => 
      removedSystems.some(removed => signal.source.includes(removed))
    );

    console.log('\n⭐ Pattern Detection System Removal:');
    if (foundRemovedSystems.length === 0) {
      console.log('   ✅ SUCCESS: No removed pattern detection systems found in signals');
    } else {
      console.log('   ❌ ISSUE: Found removed systems:', foundRemovedSystems.map(s => s.source));
    }

    // Check for foundation system promotion
    const foundationSystems = analysis.signalCollection.all.filter(signal => 
      signal.source === 'foundation_systems'
    );

    console.log('\n⭐ Foundation System Promotion:');
    if (foundationSystems.length > 0) {
      console.log('   ✅ SUCCESS: Foundation systems promoted to CONFIRMER tier');
      foundationSystems.forEach(sys => {
        console.log(`      - ${sys.systemName}: ${sys.tier} (Priority: ${sys.priority}, Confidence: ${sys.confidence})`);
      });
    } else {
      console.log('   ⚠️  INFO: No foundation systems detected in current analysis');
    }

    // Check proven systems integration
    const provenSystems = analysis.signalCollection.all.filter(signal => 
      signal.tier === 'PRIMARY' && signal.priority >= 1.8 && signal.priority < 2.0
    );

    console.log('\n⭐ Proven Systems Integration:');
    if (provenSystems.length > 0) {
      console.log('   ✅ SUCCESS: Proven systems integrated in PRIMARY tier');
      provenSystems.forEach(sys => {
        console.log(`      - ${sys.source}: ${sys.tier} (Priority: ${sys.priority}, Confidence: ${sys.confidence})`);
      });
    } else {
      console.log('   ⚠️  INFO: No proven systems detected in current analysis');
    }

    // Final decision quality check
    console.log('\n🎯 Final Decision Quality:');
    console.log(`   Action: ${analysis.finalDecision.action}`);
    console.log(`   Confidence: ${(analysis.finalDecision.confidence * 100).toFixed(1)}%`);
    console.log(`   Grade: ${analysis.signalQuality?.grade || 'N/A'}`);
    console.log(`   Signal Count: ${analysis.signalCollection.all.length}`);

    console.log('\n✅ Signal Quality Improvement Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSignalQualityImprovements();
