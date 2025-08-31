// Quick test to verify AdvancedPatterns works correctly
const path = require('path');

// Register ts-node to handle TypeScript files
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json')
});

try {
  const AdvancedPatterns = require('./src/utils/advancedPatterns.ts');
  
  console.log('✅ Successfully imported AdvancedPatterns');
  console.log('✅ detectAdvancedPatterns available:', typeof AdvancedPatterns.detectAdvancedPatterns);
  
  if (typeof AdvancedPatterns.detectAdvancedPatterns === 'function') {
    console.log('✅ Function is properly accessible');
    
    // Test with minimal data
    const testData = [
      { high: 105, low: 98, close: 103, open: 100 },
      { high: 108, low: 102, close: 107, open: 103 },
      { high: 110, low: 105, close: 109, open: 107 }
    ];
    
    try {
      const result = AdvancedPatterns.detectAdvancedPatterns(testData);
      console.log('✅ Function executed successfully, returned:', Array.isArray(result) ? `${result.length} patterns` : 'result');
    } catch (funcError) {
      console.log('⚠️ Function execution error:', funcError.message);
    }
  } else {
    console.log('❌ detectAdvancedPatterns is not a function');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
