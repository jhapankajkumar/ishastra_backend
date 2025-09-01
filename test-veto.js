const { SingleSystemAnalyzer } = require('./src/systems/single-system-analyzer');

console.log('🚫 TESTING BRUTAL VETO SYSTEM');

const analyzer = new SingleSystemAnalyzer();

// Test earnings veto
const earningsContext = {
  riskAssessment: { 
    earningsProximity: { 
      daysUntilEarnings: 1 
    } 
  }
};

console.log('Testing earnings context:', JSON.stringify(earningsContext, null, 2));

const result = analyzer.checkAIVeto(earningsContext, 'test_system');
console.log('Veto result:', result);

// Test actual values step by step
const days = earningsContext.riskAssessment?.earningsProximity?.daysUntilEarnings;
console.log('Days until earnings:', days);
console.log('Is undefined?', days === undefined);
console.log('Is <= 2?', days <= 2);
console.log('Should veto?', days !== undefined && days <= 2);
