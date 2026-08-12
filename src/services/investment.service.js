// services/investment.service.js
const prisma = require('../db');

const fetchAllInvestments = async (filter, ownerWhere = {}) => {
  const where = { ...ownerWhere };

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
