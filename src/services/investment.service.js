// services/investment.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetchAllInvestments = async (filter) => {
  const where = {};

  if (filter?.status) where.status = filter.status;
  if (filter?.ticker) where.ticker = filter.ticker.toUpperCase();

  return await prisma.investment.findMany({
    where,
    orderBy: { entryDate: 'desc' },
    include: {
      transactions: {
        orderBy: { transactionDate: 'desc' },
      },
    },
  });
};

module.exports = { fetchAllInvestments };