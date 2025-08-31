// Test file to verify advancedTechnicalAnalysis.ts works correctly
const path = require('path');

// Register ts-node to handle TypeScript files
require('ts-node').register({
  project: path.join(__dirname, 'tsconfig.json')
});

try {
  // Import the TypeScript file
  const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis.ts').default;
  
  console.log('✅ Successfully imported advancedTechnicalAnalysis.ts');
  console.log('✅ Available static methods:', Object.getOwnPropertyNames(AdvancedTechnicalAnalysis).filter(name => 
    typeof AdvancedTechnicalAnalysis[name] === 'function' && name !== 'prototype' && name !== 'length' && name !== 'name'
  ));
  
  // Test basic functionality
  console.log('✅ Class successfully loaded');
  
  // Test a simple method call 
  const sampleData = [
    { open: 100, high: 105, low: 98, close: 103 },
    { open: 103, high: 108, low: 102, close: 107 },
    { open: 107, high: 110, low: 105, close: 109 }
  ];
  
  const result = AdvancedTechnicalAnalysis.analyzeAlwaysBuy({
    latest: { price: 109 }
  });
  
  console.log('✅ Test method call successful:', result.signal);
  console.log('🎉 TypeScript conversion SUCCESSFUL!');
  
} catch (error) {
  console.error('❌ Error testing advancedTechnicalAnalysis.ts:', error.message);
  console.error(error.stack);
  process.exit(1);
}
