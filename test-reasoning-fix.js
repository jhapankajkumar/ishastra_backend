#!/usr/bin/env node

const { SingleSystemAnalyzer } = require('./src/systems/single-system-analyzer');

console.log('🧪 Testing reasoning normalization fix...');

const analyzer = new SingleSystemAnalyzer();

// Test case 1: reasoning as array (should work)
const systemAnalysisArray = {
  systemName: 'Test System',
  reasoning: ['Reason 1', 'Reason 2'],
  system: 'test_system'
};

const gateResultArray = {
  finalDecision: {
    reasoning: ['Gate reason 1', 'Gate reason 2']
  }
};

// Test case 2: reasoning as string (this was causing the error)
const systemAnalysisString = {
  systemName: 'Test System',
  reasoning: 'Single reason string',
  system: 'test_system'
};

const gateResultString = {
  finalDecision: {
    reasoning: 'Single gate reason'
  }
};

// Test case 3: reasoning as undefined/null
const systemAnalysisUndefined = {
  systemName: 'Test System',
  reasoning: undefined,
  system: 'test_system'
};

const gateResultUndefined = {
  finalDecision: {
    reasoning: null
  }
};

try {
  console.log('\n1️⃣ Testing with array reasoning:');
  const result1 = analyzer.combineReasoning(systemAnalysisArray, gateResultArray);
  console.log('✅ Success!');
  console.log(result1.join('\n'));

  console.log('\n2️⃣ Testing with string reasoning (this was the bug):');
  const result2 = analyzer.combineReasoning(systemAnalysisString, gateResultString);
  console.log('✅ Success! Fixed!');
  console.log(result2.join('\n'));

  console.log('\n3️⃣ Testing with undefined/null reasoning:');
  const result3 = analyzer.combineReasoning(systemAnalysisUndefined, gateResultUndefined);
  console.log('✅ Success!');
  console.log(result3.join('\n'));

  console.log('\n🎉 All tests passed! The fix is working correctly.');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
}
