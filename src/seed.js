const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    { name: 'Breakout' , tag_id: 1001},
    { name: 'Reversal', tag_id: 1002}
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
  } catch (error) {
    console.error('❌ Failed to seed trade setups:', error.message);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});