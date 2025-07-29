const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleTradingData() {
  try {
    console.log('🏗️  Creating Sample Trading Data for Frontend Testing\n');

    // Clean up existing data
    console.log('1️⃣ Cleaning existing data...');
    await prisma.trade_transactions.deleteMany({});
    await prisma.trade.deleteMany({});
    console.log('✅ Cleanup complete\n');

    // Create realistic trading scenarios
    console.log('2️⃣ Creating realistic trading scenarios...\n');

    // Scenario 1: Open position (for testing partial exits)
    const openTrade = await prisma.trade.create({
      data: {
        ticker: 'AAPL',
        direction: 'Long',
        instrument_type: 'Stocks',
        entry_price: 180.50,
        quantity: 150,
        remaining_quantity: 150,
        entry_date: new Date('2025-07-20T09:30:00Z'),
        reason_for_entry: 'Strong earnings beat, breaking above resistance at $180',
        setup: 'Earnings Breakout',
        status: 'Open',
        stop_loss: 175.00,
        target_1: 190.00,
        target_2: 200.00,
        target_3: 210.00,
        confidence_rating: 8,
        entry_commission: 1.00,
        timeframe_used: '1h',
        notes: 'Strong volume confirmation on breakout. Next earnings in Q4.',
        atr_value: 3.25,
        risk_per_trade: 825.00 // (180.50 - 175.00) * 150
      }
    });
    console.log(`✅ Created open position: ${openTrade.ticker} - ${openTrade.quantity} shares @ $${openTrade.entry_price}`);

    // Scenario 2: Partially closed position
    const partialTrade = await prisma.trade.create({
      data: {
        ticker: 'MSFT',
        direction: 'Long',
        instrument_type: 'Stocks',
        entry_price: 320.00,
        quantity: 100,
        remaining_quantity: 60, // 40 shares already exited
        entry_date: new Date('2025-07-18T10:15:00Z'),
        reason_for_entry: 'Azure growth acceleration, testing breakout above $320',
        setup: 'Cloud Growth Play',
        status: 'Partial Closed',
        stop_loss: 310.00,
        target_1: 335.00,
        target_2: 350.00,
        target_3: 370.00,
        confidence_rating: 7,
        entry_commission: 1.00,
        timeframe_used: '4h',
        notes: 'Cloud revenue growth of 30% YoY. Strong institutional buying.',
        atr_value: 8.50,
        risk_per_trade: 1000.00
      }
    });

    // Add transaction history for partial trade
    await prisma.trade_transactions.create({
      data: {
        trade_id: partialTrade.id,
        transaction_type: 'Exit',
        quantity: 40,
        price: 335.00,
        transaction_date: new Date('2025-07-24T14:30:00Z'),
        reason_for_exit: 'Taking partial profit at 4.7% gain, letting rest run'
      }
    });
    console.log(`✅ Created partial position: ${partialTrade.ticker} - ${partialTrade.remaining_quantity}/${partialTrade.quantity} shares remaining`);

    // Scenario 3: Completed profitable trade with multiple exits
    const completedWinTrade = await prisma.trade.create({
      data: {
        ticker: 'NVDA',
        direction: 'Long',
        entry_price: 450.00,
        exit_price: 485.33, // Weighted average exit price
        quantity: 80,
        remaining_quantity: 0,
        entry_date: new Date('2025-07-15T09:45:00Z'),
        exit_date: new Date('2025-07-25T15:45:00Z'),
        reason_for_entry: 'AI chip demand surge, technical breakout pattern',
        reason_for_exit: 'Target reached, scaled out in 3 tranches',
        setup: 'AI Momentum',
        status: 'Closed',
        stop_loss: 435.00,
        confidence_rating: 9,
        post_trade_analysis: 'Excellent execution. Entry timing was perfect on the breakout. Scaling out strategy worked well - captured most of the move while managing risk.'
      }
    });

    // Add multiple exit transactions for completed trade
    const exitTransactions = [
      { qty: 30, price: 475.00, date: new Date('2025-07-22T11:00:00Z'), reason: 'First tranche at 5.6% gain' },
      { qty: 25, price: 490.00, date: new Date('2025-07-24T13:15:00Z'), reason: 'Second tranche at 8.9% gain' },
      { qty: 25, price: 490.00, date: new Date('2025-07-25T15:45:00Z'), reason: 'Final exit at resistance' }
    ];

    for (const tx of exitTransactions) {
      await prisma.trade_transactions.create({
        data: {
          trade_id: completedWinTrade.id,
          transaction_type: 'Exit',
          quantity: tx.qty,
          price: tx.price,
          transaction_date: tx.date,
          reason_for_exit: tx.reason
        }
      });
    }
    console.log(`✅ Created completed winner: ${completedWinTrade.ticker} - Full position closed with ${exitTransactions.length} exits`);

    // Scenario 4: Completed loss trade
    const completedLossTrade = await prisma.trade.create({
      data: {
        ticker: 'TSLA',
        direction: 'Long',
        entry_price: 280.00,
        exit_price: 265.00,
        quantity: 50,
        remaining_quantity: 0,
        entry_date: new Date('2025-07-19T10:30:00Z'),
        exit_date: new Date('2025-07-23T09:15:00Z'),
        reason_for_entry: 'Oversold bounce expected after earnings dip',
        reason_for_exit: 'Stop loss hit, thesis invalidated',
        setup: 'Oversold Bounce',
        status: 'Closed',
        stop_loss: 265.00,
        confidence_rating: 6,
        post_trade_analysis: 'Stop loss worked as intended. Market sentiment was weaker than expected. Should have waited for more confirmation.'
      }
    });

    await prisma.trade_transactions.create({
      data: {
        trade_id: completedLossTrade.id,
        transaction_type: 'Exit',
        quantity: 50,
        price: 265.00,
        transaction_date: new Date('2025-07-23T09:15:00Z'),
        reason_for_exit: 'Stop loss hit, cutting losses quickly'
      }
    });
    console.log(`✅ Created completed loss: ${completedLossTrade.ticker} - Stop loss executed`);

    // Scenario 5: Another open position for testing
    const openTrade2 = await prisma.trade.create({
      data: {
        ticker: 'AMZN',
        direction: 'Long',
        instrument_type: 'Stocks',
        entry_price: 145.75,
        quantity: 75,
        remaining_quantity: 75,
        entry_date: new Date('2025-07-24T11:00:00Z'),
        reason_for_entry: 'AWS margins expanding, prime membership growth strong',
        setup: 'Value with Growth',
        status: 'Open',
        stop_loss: 140.00,
        target_1: 155.00,
        target_2: 165.00,
        target_3: 175.00,
        confidence_rating: 7,
        entry_commission: 1.00,
        timeframe_used: '1d',
        notes: 'Trading at 12x EV/Sales vs historical avg of 15x. Prime Day results strong.',
        atr_value: 4.75,
        risk_per_trade: 431.25
      }
    });
    console.log(`✅ Created second open position: ${openTrade2.ticker} - ${openTrade2.quantity} shares @ $${openTrade2.entry_price}`);

    // Scenario 6: Short position (different direction testing)
    const shortTrade = await prisma.trade.create({
      data: {
        ticker: 'SPY',
        direction: 'Short',
        instrument_type: 'ETF',
        entry_price: 440.00,
        quantity: 200,
        remaining_quantity: 200,
        entry_date: new Date('2025-07-25T15:30:00Z'),
        reason_for_entry: 'Market overbought, expecting pullback to 430 support',
        setup: 'Mean Reversion',
        status: 'Open',
        stop_loss: 445.00,
        target_1: 435.00,
        target_2: 430.00,
        target_3: 425.00,
        confidence_rating: 5,
        entry_commission: 1.00,
        timeframe_used: '15m',
        notes: 'RSI at 75, VIX at low levels. Fed meeting next week.',
        atr_value: 2.10,
        risk_per_trade: 1000.00
      }
    });
    console.log(`✅ Created short position: ${shortTrade.ticker} - ${shortTrade.quantity} shares short @ $${shortTrade.entry_price}`);

    console.log('\n3️⃣ Sample data summary:');
    console.log('========================');
    
    const allTrades = await prisma.trade.findMany({
      include: {
        trade_transactions: true
      },
      orderBy: { entry_date: 'asc' }
    });

    let totalPnL = 0;
    let openPositionsValue = 0;

    allTrades.forEach((trade, index) => {
      console.log(`\n${index + 1}. ${trade.ticker} (${trade.direction}) - ${trade.status}`);
      console.log(`   Entry: ${trade.quantity} shares @ $${trade.entry_price} on ${trade.entry_date.toDateString()}`);
      console.log(`   Remaining: ${trade.remaining_quantity} shares`);
      
      if (trade.trade_transactions.length > 0) {
        console.log(`   Exits: ${trade.trade_transactions.length} transactions`);
        const tradePnL = trade.trade_transactions.reduce((sum, tx) => {
          const pnl = trade.direction === 'Long' 
            ? (tx.price - trade.entry_price) * tx.quantity
            : (trade.entry_price - tx.price) * tx.quantity;
          return sum + pnl;
        }, 0);
        totalPnL += tradePnL;
        console.log(`   Realized P&L: $${tradePnL.toFixed(2)}`);
      }
      
      if (trade.remaining_quantity > 0) {
        const unrealizedValue = trade.remaining_quantity * trade.entry_price;
        openPositionsValue += unrealizedValue;
        console.log(`   Open position value: $${unrealizedValue.toFixed(2)}`);
      }
      
      if (trade.post_trade_analysis) {
        console.log(`   Analysis: ${trade.post_trade_analysis.substring(0, 80)}...`);
      }
    });

    console.log(`\n📊 Portfolio Summary:`);
    console.log(`   Total Trades: ${allTrades.length}`);
    console.log(`   Open Positions: ${allTrades.filter(t => t.status === 'Open').length}`);
    console.log(`   Partial Positions: ${allTrades.filter(t => t.status === 'Partial Closed').length}`);
    console.log(`   Closed Positions: ${allTrades.filter(t => t.status === 'Closed').length}`);
    console.log(`   Realized P&L: $${totalPnL.toFixed(2)}`);
    console.log(`   Open Positions Value: $${openPositionsValue.toFixed(2)}`);

    console.log(`\n🎯 Frontend Testing Scenarios Created:`);
    console.log(`   ✅ Open positions ready for partial exits`);
    console.log(`   ✅ Partially closed position with history`);
    console.log(`   ✅ Completed trades with transaction history`);
    console.log(`   ✅ Both profitable and loss scenarios`);
    console.log(`   ✅ Long and short positions`);
    console.log(`   ✅ Various setups and confidence levels`);

    console.log(`\n🚀 Ready for frontend testing!`);
    console.log(`   You can now test the UpdateTrade component with these sample trades`);
    console.log(`   Each scenario tests different aspects of the partial exit functionality`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTradingData();
