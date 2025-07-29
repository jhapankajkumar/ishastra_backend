const { PrismaClient } = require('@prisma/client');
const TradeIdGenerator = require('../src/utils/tradeIdGenerator');
const prisma = new PrismaClient();

async function populateTradeIds() {
  console.log('🔄 Populating professional trade IDs for existing trades...\n');
  
  try {
    // Get all trades that don't have a trade_id set
    const tradesWithoutIds = await prisma.trade.findMany({
      where: { 
        OR: [
          { trade_id: null },
          { trade_id: "" }
        ]
      },
      orderBy: { created_at: 'asc' }
    });
    
    console.log(`📊 Found ${tradesWithoutIds.length} trades without professional IDs\n`);
    
    if (tradesWithoutIds.length === 0) {
      console.log('✅ All trades already have professional IDs!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const trade of tradesWithoutIds) {
      try {
        // Generate professional ID based on the trade's creation date
        const professionalId = await TradeIdGenerator.generateTradeId();
        
        await prisma.trade.update({
          where: { id: trade.id },
          data: { trade_id: professionalId }
        });
        
        console.log(`✅ Updated trade ${trade.id} (${trade.ticker}) → ${professionalId}`);
        successCount++;
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Failed to update trade ${trade.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount} trades`);
    console.log(`   ❌ Failed to update: ${errorCount} trades`);
    console.log(`   📊 Total processed: ${tradesWithoutIds.length} trades`);
    
    if (successCount === tradesWithoutIds.length) {
      console.log('\n🎉 All existing trades now have professional IDs!');
      console.log('💡 Next step: Run the migration to make trade_id required');
      console.log('   Command: npx prisma migrate dev --name make-trade-id-required');
    }
    
  } catch (error) {
    console.error('💥 Critical error during trade ID population:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population script
populateTradeIds();
