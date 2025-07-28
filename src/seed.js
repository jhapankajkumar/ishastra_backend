const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTrades = require('./sample_trades_seed.json');

async function main() {
  await prisma.trade.createMany({
    data: sampleTrades,
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});