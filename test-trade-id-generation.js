const TradeIdGenerator = require('./src/utils/tradeIdGenerator');

async function testTradeIdGeneration() {
  console.log('🔢 Testing Trade ID Generation Systems\n');
  
  try {
    // Test 1: Professional format (ISH-YYYY-NNNNNN)
    console.log('1️⃣ Professional Format (ISH-YYYY-NNNNNN):');
    for (let i = 0; i < 3; i++) {
      const id = await TradeIdGenerator.generateTradeId();
      console.log(`   ${id}`);
    }
    
    // Test 2: UUID-style format
    console.log('\n2️⃣ UUID-style Format (TRD_xxxxx_YYYY):');
    for (let i = 0; i < 3; i++) {
      const id = TradeIdGenerator.generateUuidTradeId();
      console.log(`   ${id}`);
    }
    
    // Test 3: Short format
    console.log('\n3️⃣ Short Format (T25-NNNNNN):');
    for (let i = 0; i < 3; i++) {
      const id = await TradeIdGenerator.generateShortTradeId();
      console.log(`   ${id}`);
    }
    
    console.log('\n✅ All trade ID generation methods working!');
    
  } catch (error) {
    console.error('❌ Error testing trade ID generation:', error);
  }
}

testTradeIdGeneration();
