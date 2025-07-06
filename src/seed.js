const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTrades = require('./sample_trades_seed.json');

async function main() {
  // Seed Exit Tactics
  const tactics = [
    { tactic_id: 3001 , name: 'Target Hit', description: 'Exited when profit target was reached' },
    { tactic_id: 3002 , name: 'Stop Loss Hit', description: 'Exited due to stop loss being hit' },
    { tactic_id: 3003 , name: 'Trailing Stop', description: 'Exited using a trailing stop' },
    { tactic_id: 3004 , name: 'Time Exit', description: 'Exited based on time constraint' },
    { tactic_id: 3005 , name: 'Manual Exit', description: 'Exited manually due to changing market conditions' }
  ];

  for (const tactic of tactics) {
    await prisma.exit_tactics.upsert({
      where: { tactic_id: tactic.tactic_id },
      update: {},
      create: tactic
    });
  }

  console.log('✅ Exit tactics seeded.');

//   // Optionally seed a user
//   const user = await prisma.users.upsert({
//     where: { username: 'admin' },
//     update: {},
//     create: {
//       username: 'admin',
//       password_hash: '$2b$10$DUMMYHASHREPLACEMEwithbcrypthash' // Replace with actual hashed password
//     }
//   });

//   console.log('✅ User seeded.');

  // Optionally seed tags
  const tags = [
    { tag_id: 1001, name: 'Breakout' , description: 'Price moves above resistance or below support with momentum' },
    { tag_id: 1002, name: 'Reversal', description: 'Trade entered expecting a change in trend direction' },
    { tag_id: 1003, name: 'Pullback', description: 'Entered after a temporary retracement in an ongoing trend' },
    { tag_id: 1004, name: 'Trend Continuation', description: 'Entered in the direction of the prevailing trend' },
    { tag_id: 1005, name: 'Fade', description: 'Counter-trend trade expecting price to snap back' },
    { tag_id: 1006, name: 'Support Bounce', description: 'Trade entered near a known support zone' },
    { tag_id: 1007, name: 'Resistance Rejection', description: 'Trade taken after price fails to break resistance' },
    { tag_id: 1008, name: 'EMA Touch', description: 'Trade initiated when price touches an important moving average' },
    { tag_id: 1009, name: 'Volume Spike', description: 'Triggered by unusual volume activity indicating momentum' },
    { tag_id: 1010, name: 'Divergence', description: 'Based on RSI/MACD showing divergence from price movement' },
    { tag_id: 1011, name: 'Inside Bar', description: 'Trade setup formed after a narrow range day or bar' },
    { tag_id: 1012, name: 'Gap Fill', description: 'Trade entered expecting price to fill a previous gap' },
    { tag_id: 1013, name: 'Pattern Break', description: 'Triggered by breakout from a known chart pattern (flag, triangle, etc.)' },
    { tag_id: 1014, name: 'High Conviction', description: 'Subjective tag denoting extra confidence in the setup' },
    { tag_id: 1015, name: 'Low Risk Entry', description: 'Trade characterized by small stop size relative to potential reward' }
  ];

  for (const tag of tags) {
    await prisma.tags.upsert({
      where: { tag_id: tag.tag_id },
      update: {},
      create: tag
    });
  }

  console.log('✅ Tags seeded.');

  try {
    const setups = [
      { trade_setup_id: 2001, name: "Triple Screen", description: "Multi-timeframe trend + momentum system" },
      { trade_setup_id: 2002, name: "Impulse System", description: "Color-coded trend/momentum alignment" },
      { trade_setup_id: 2003, name: "MACD Histogram Divergence", description: "Reversal using MACD histogram signals" },
      { trade_setup_id: 2004, name: "Safe Zone Stop", description: "Volatility-based stop-loss technique" },
      { trade_setup_id: 2005, name: "Force Index Pullback", description: "Momentum-based pullback entry" },
      { trade_setup_id: 2006, name: "Envelope Reversion", description: "Fade overextensions from moving avg envelopes" },
      { trade_setup_id: 2007, name: "Elder-Ray", description: "Bull/Bear Power divergence system" }
    ];

    for (const setup of setups) {
      await prisma.trade_setups.upsert({
        where: { trade_setup_id: setup.trade_setup_id },
        update: {},
        create: setup
      });
    }

    console.log('✅ Trade setups seeded.');

    // Seed sample trades
    // for (const trade of sampleTrades) {
    //   const { tag_ids, ...tradeData } = trade;

    //   // Convert ISO strings to actual Date objects
    //   tradeData.entry_date = new Date(tradeData.entry_date);
    //   tradeData.exit_date = new Date(tradeData.exit_date);

    //   const createdTrade = await prisma.trades.create({
    //     data: tradeData
    //   });
    // }

    console.log('✅ Sample trades seeded.');
  } catch (error) {
    console.error('❌ Failed ', error.message);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});