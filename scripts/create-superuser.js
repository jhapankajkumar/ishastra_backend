require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// One-off script — there is exactly one SUPERUSER account, ever, by design.
// Run once: node scripts/create-superuser.js
// Reads SUPERUSER_EMAIL / SUPERUSER_PASSWORD from .env — never hardcode them here.
async function createSuperuser() {
  const email = process.env.SUPERUSER_EMAIL;
  const password = process.env.SUPERUSER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'SUPERUSER_EMAIL and SUPERUSER_PASSWORD must be set in .env before running this script.'
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  A user with email ${email} already exists (id=${existing.id}, role=${existing.role}). Not creating a duplicate.`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));

  // emailVerified: true — this account never goes through the public OTP
  // registration flow, so there's no verification step to skip.
  // preferredCurrency: null — SUPERUSER is exempt from the one-currency-per-user
  // rule (this account already has real trading history in both USD and INR).
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'SUPERUSER',
      emailVerified: true,
      preferredCurrency: null,
    },
  });

  console.log(`✅ Created SUPERUSER account: ${user.email} (id=${user.id})`);
  return user;
}

if (require.main === module) {
  createSuperuser()
    .catch((error) => {
      console.error('❌ Failed to create superuser:', error.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { createSuperuser };
