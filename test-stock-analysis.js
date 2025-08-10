#!/usr/bin/env node

const axios = require('axios');

// Test stocks
const indianStocks = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'LT.NS', 'ITC.NS', 'WIPRO.NS', 'MARUTI.NS'];
const usStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'CRM', 'ADBE'];

async function testStock(symbol) {
  try {
    const response = await axios.get(`http://localhost:8000/api/trading/analysis?symbol=${symbol}`, {
      timeout: 30000 // 30 second timeout
    });
    
    const data = response.data;
    const decision = data.decision || {};
    const execution = data.execution || {};
    
    return {
      symbol,
      status: decision.status || 'ERROR',
      grade: decision.grade || 'N/A',
      confidence: decision.confidence || 0,
      riskReward: execution.riskReward || 0,
      reasonCodes: decision.reasonCodes || []
    };
  } catch (error) {
    console.error(`❌ Error testing ${symbol}:`, error.message);
    return {
      symbol,
      status: 'ERROR',
      grade: 'ERROR',
      confidence: 0,
      riskReward: 0,
      reasonCodes: ['API_ERROR']
    };
  }
}

async function runTests() {
  console.log('🎯 Testing Stock Analysis System');
  console.log('==================================\n');
  
  console.log('📊 Indian Stocks (NSE):');
  console.log('------------------------');
  
  for (const symbol of indianStocks) {
    const result = await testStock(symbol);
    const confidenceColor = result.confidence >= 50 ? '✅' : result.confidence >= 30 ? '⚠️' : '❌';
    const gradeColor = ['A+', 'A', 'A-', 'B+', 'B', 'B-'].includes(result.grade) ? '✅' : '❌';
    
    console.log(`${confidenceColor} ${symbol.padEnd(15)} | ${result.status.padEnd(6)} | Grade: ${result.grade.padEnd(3)} ${gradeColor} | Confidence: ${result.confidence.toString().padEnd(3)}% | R/R: ${result.riskReward.toFixed(2)}`);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📈 US Stocks (NASDAQ/NYSE):');
  console.log('----------------------------');
  
  for (const symbol of usStocks) {
    const result = await testStock(symbol);
    const confidenceColor = result.confidence >= 50 ? '✅' : result.confidence >= 30 ? '⚠️' : '❌';
    const gradeColor = ['A+', 'A', 'A-', 'B+', 'B', 'B-'].includes(result.grade) ? '✅' : '❌';
    
    console.log(`${confidenceColor} ${symbol.padEnd(15)} | ${result.status.padEnd(6)} | Grade: ${result.grade.padEnd(3)} ${gradeColor} | Confidence: ${result.confidence.toString().padEnd(3)}% | R/R: ${result.riskReward.toFixed(2)}`);
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📋 Analysis Summary:');
  console.log('====================');
  console.log('✅ Good Confidence (≥50%) & Grade (≥B-) recommended');
  console.log('⚠️  Medium Confidence (30-49%) may need review');  
  console.log('❌ Low Confidence (<30%) or Poor Grade (C+, C, D, F) not recommended');
}

runTests().catch(console.error);
