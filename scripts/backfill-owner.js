require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// One-off script — assigns every pre-existing row (created before auth existed)
// to the SUPERUSER account, across all 7 ownable models. Run once, AFTER
// scripts/create-superuser.js, and BEFORE Migration 4 (which tightens
// Watchlist/Capital/Backtest's userId to required — that migration will fail
// loudly if this backfill hasn't run, which is a deliberate safety check).
//
// Run once: node scripts/backfill-owner.js
//
// Why this matters: without it, every pre-existing Trade/Investment/
// Recommendation/ChartAnalysis row would have userId=null — which, after this
// migration, is the exact signal for "guest sandbox row." Skipping this
// backfill would silently expose the owner's entire real trading history to
// every anonymous visitor. This script is what prevents that.
async function backfillOwner() {
  const email = process.env.SUPERUSER_EMAIL;
  if (!email) {
    throw new Error('SUPERUSER_EMAIL must be set in .env before running this script.');
  }

  const superuser = await prisma.user.findUnique({ where: { email } });
  if (!superuser) {
    throw new Error(
      `No user found with email ${email}. Run scripts/create-superuser.js first.`
    );
  }

  const models = [
    'trade',
    'investment',
    'recommendation',
    'chartAnalysis',
    'watchlistStock',
    'capital',
    'backtestTrade',
  ];

  console.log(`Backfilling ownerless rows to superuser id=${superuser.id} (${superuser.email})...`);

  for (const model of models) {
    const result = await prisma[model].updateMany({
      where: { userId: null },
      data: { userId: superuser.id },
    });
    console.log(`  ${model}: ${result.count} row(s) assigned`);
  }

  console.log('✅ Backfill complete. Verifying zero rows remain ownerless...');

  for (const model of models) {
    const remaining = await prisma[model].count({ where: { userId: null } });
    if (remaining > 0) {
      throw new Error(`❌ ${model} still has ${remaining} ownerless row(s) — backfill did not fully succeed.`);
    }
  }

  console.log('✅ Verified: zero ownerless rows remain across all 7 models. Safe to proceed to Migration 4.');
}

if (require.main === module) {
  backfillOwner()
    .catch((error) => {
      console.error('❌ Backfill failed:', error.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { backfillOwner };
