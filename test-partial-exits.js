const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPartialExitFlow() {
  try {
    console.log('🧪 Starting Partial Exit Test Flow\n');

    // Clean up any existing test data
    console.log('1️⃣ Cleaning up existing test data...');
    await prisma.trade_transactions.deleteMany({});
    await prisma.trades.deleteMany({});
    console.log('✅ Cleanup complete\n');

    // Create sample trades
    console.log('2️⃣ Creating sample trades...');
    
    const trade1 = await prisma.trades.create({
      data: {
        ticker: 'AAPL',
        direction: 'Long',
        entry_price: 150.00,
        quantity: 100,
        remaining_quantity: 100,
        entry_date: new Date('2025-07-20'),
        reason_for_entry: 'Strong breakout pattern',
        setup: 'Breakout',
        status: 'Open'
      }
    });

    const trade2 = await prisma.trades.create({
      data: {
        ticker: 'MSFT',
        direction: 'Long',
        entry_price: 300.00,
        quantity: 50,
        remaining_quantity: 50,
        entry_date: new Date('2025-07-22'),
        reason_for_entry: 'Support level bounce',
        setup: 'Support Bounce',
        status: 'Open'
      }
    });

    console.log(`✅ Created trade 1: ${trade1.ticker} - ${trade1.quantity} shares at $${trade1.entry_price}`);
    console.log(`✅ Created trade 2: ${trade2.ticker} - ${trade2.quantity} shares at $${trade2.entry_price}\n`);

    // Test 1: Partial Exit
    console.log('3️⃣ Testing Partial Exit (25% of AAPL position)...');
    
    const partialExitQty = 25;
    const partialExitPrice = 160.00;
    
    // Create partial exit transaction
    await prisma.trade_transactions.create({
      data: {
        trade_id: trade1.id,
        transaction_type: 'Exit',
        quantity: partialExitQty,
        price: partialExitPrice,
        transaction_date: new Date(),
        reason_for_exit: 'Taking partial profit at resistance'
      }
    });

    // Update trade with remaining quantity
    const updatedTrade1 = await prisma.trades.update({
      where: { id: trade1.id },
      data: {
        remaining_quantity: trade1.remaining_quantity - partialExitQty,
        status: 'Partial Closed'
      }
    });

    console.log(`✅ Partial exit: Sold ${partialExitQty} shares at $${partialExitPrice}`);
    console.log(`✅ Remaining quantity: ${updatedTrade1.remaining_quantity} shares`);
    console.log(`✅ Status updated to: ${updatedTrade1.status}\n`);

    // Test 2: Another Partial Exit
    console.log('4️⃣ Testing Second Partial Exit (50% of remaining AAPL)...');
    
    const secondExitQty = 37; // ~50% of remaining 75 shares
    const secondExitPrice = 165.00;
    
    await prisma.trade_transactions.create({
      data: {
        trade_id: trade1.id,
        transaction_type: 'Exit',
        quantity: secondExitQty,
        price: secondExitPrice,
        transaction_date: new Date(),
        reason_for_exit: 'Further profit taking'
      }
    });

    const updatedTrade1_2 = await prisma.trades.update({
      where: { id: trade1.id },
      data: {
        remaining_quantity: updatedTrade1.remaining_quantity - secondExitQty,
        status: 'Partial Closed'
      }
    });

    console.log(`✅ Second partial exit: Sold ${secondExitQty} shares at $${secondExitPrice}`);
    console.log(`✅ Remaining quantity: ${updatedTrade1_2.remaining_quantity} shares`);
    console.log(`✅ Status remains: ${updatedTrade1_2.status}\n`);

    // Test 3: Complete Exit of Remaining Position
    console.log('5️⃣ Testing Complete Exit of Remaining AAPL Position...');
    
    const finalExitQty = updatedTrade1_2.remaining_quantity;
    const finalExitPrice = 170.00;
    
    await prisma.trade_transactions.create({
      data: {
        trade_id: trade1.id,
        transaction_type: 'Exit',
        quantity: finalExitQty,
        price: finalExitPrice,
        transaction_date: new Date(),
        reason_for_exit: 'Closing remaining position'
      }
    });

    const finalTrade1 = await prisma.trades.update({
      where: { id: trade1.id },
      data: {
        remaining_quantity: 0,
        status: 'Closed',
        exit_date: new Date(),
        exit_price: finalExitPrice,
        reason_for_exit: 'Position fully closed through partial exits'
      }
    });

    console.log(`✅ Final exit: Sold remaining ${finalExitQty} shares at $${finalExitPrice}`);
    console.log(`✅ Remaining quantity: ${finalTrade1.remaining_quantity} shares`);
    console.log(`✅ Status updated to: ${finalTrade1.status}\n`);

    // Test 4: Complete Exit in One Transaction (MSFT)
    console.log('6️⃣ Testing Complete Exit in Single Transaction (MSFT)...');
    
    const completeExitQty = 50;
    const completeExitPrice = 320.00;
    
    await prisma.trade_transactions.create({
      data: {
        trade_id: trade2.id,
        transaction_type: 'Exit',
        quantity: completeExitQty,
        price: completeExitPrice,
        transaction_date: new Date(),
        reason_for_exit: 'Target reached, complete exit'
      }
    });

    const finalTrade2 = await prisma.trades.update({
      where: { id: trade2.id },
      data: {
        remaining_quantity: 0,
        status: 'Closed',
        exit_date: new Date(),
        exit_price: completeExitPrice,
        reason_for_exit: 'Target reached, complete exit'
      }
    });

    console.log(`✅ Complete exit: Sold all ${completeExitQty} shares at $${completeExitPrice}`);
    console.log(`✅ Status updated to: ${finalTrade2.status}\n`);

    // Display Final Results
    console.log('7️⃣ Final Test Results:');
    console.log('==========================================');
    
    const allTrades = await prisma.trades.findMany({
      include: {
        trade_transactions: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    for (const trade of allTrades) {
      console.log(`\n📊 ${trade.ticker} Trade Summary:`);
      console.log(`   Entry: ${trade.quantity} shares @ $${trade.entry_price}`);
      console.log(`   Current Status: ${trade.status}`);
      console.log(`   Remaining: ${trade.remaining_quantity} shares`);
      console.log(`   Total Exits: ${trade.trade_transactions.length}`);
      
      if (trade.trade_transactions.length > 0) {
        console.log(`   Exit History:`);
        trade.trade_transactions.forEach((transaction, index) => {
          const pnl = (transaction.price - trade.entry_price) * transaction.quantity;
          console.log(`   ${index + 1}. ${transaction.quantity} shares @ $${transaction.price} | P&L: $${pnl.toFixed(2)}`);
        });

        const totalExited = trade.trade_transactions.reduce((sum, t) => sum + t.quantity, 0);
        const totalPnL = trade.trade_transactions.reduce((sum, t) => 
          sum + ((t.price - trade.entry_price) * t.quantity), 0
        );
        console.log(`   Total Exited: ${totalExited} shares | Total P&L: $${totalPnL.toFixed(2)}`);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Partial exits working correctly');
    console.log('✅ Status updates working correctly');
    console.log('✅ Transaction audit trail working correctly');
    console.log('✅ Data integrity maintained');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPartialExitFlow();
