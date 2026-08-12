const prisma = require('../db');
const CapitalManager = require('../utils/capitalManager');

/**
 * Capital Management Controller
 * Handles API endpoints for capital management.
 * Every route here sits behind requireAuth (see capital.routes.js) — there is
 * no guest concept for Capital, so req.user is always present.
 */

/**
 * Get all capital information for the current user
 */
const getAllCapital = async (req, res) => {
  try {
    const summary = await CapitalManager.getCapitalSummary(req.user.id);

    res.json({
      success: true,
      message: 'Capital information retrieved successfully',
      data: summary.data,
      timestamp: summary.timestamp
    });
  } catch (error) {
    console.error('Error fetching capital information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capital information',
      error: error.message
    });
  }
};

/**
 * Get capital information for a specific currency
 */
const getCapitalByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: 'Currency parameter is required'
      });
    }

    const capital = await CapitalManager.getCapital(req.user.id, currency);

    if (!capital) {
      return res.status(404).json({
        success: false,
        message: `Capital record not found for currency: ${currency.toUpperCase()}`
      });
    }

    const allocated = capital.total - capital.remaining;
    const utilizationRate = capital.total > 0 ? (allocated / capital.total) * 100 : 0;

    res.json({
      success: true,
      data: {
        currency: capital.currency,
        total: capital.total,
        remaining: capital.remaining,
        allocated: allocated,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        updatedAt: capital.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error fetching capital for ${req.params.currency}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capital information',
      error: error.message
    });
  }
};

/**
 * Update/Reset capital for a specific currency
 */
const updateCapital = async (req, res) => {
  try {
    const { currency } = req.params;
    const { total, adjustRemaining } = req.body;

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: 'Currency parameter is required'
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total capital must be greater than 0'
      });
    }

    const updatedCapital = await CapitalManager.resetCapital(
      req.user.id,
      currency,
      parseFloat(total),
      adjustRemaining
    );

    const allocated = updatedCapital.total - updatedCapital.remaining;
    const utilizationRate = updatedCapital.total > 0 ? (allocated / updatedCapital.total) * 100 : 0;

    res.json({
      success: true,
      message: `Capital updated successfully for ${currency.toUpperCase()}`,
      data: {
        currency: updatedCapital.currency,
        total: updatedCapital.total,
        remaining: updatedCapital.remaining,
        allocated: allocated,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        updatedAt: updatedCapital.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error updating capital for ${req.params.currency}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update capital',
      error: error.message
    });
  }
};

/**
 * Add capital for a specific currency while preserving allocated funds
 */
const addCapital = async (req, res) => {
  try {
    const { currency } = req.params;
    const { amount } = req.body;

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: 'Currency parameter is required'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const updatedCapital = await CapitalManager.addCapital(req.user.id, currency, parsedAmount);
    const allocated = updatedCapital.total - updatedCapital.remaining;
    const utilizationRate = updatedCapital.total > 0 ? (allocated / updatedCapital.total) * 100 : 0;

    res.json({
      success: true,
      message: `Added capital successfully for ${currency.toUpperCase()}`,
      data: {
        currency: updatedCapital.currency,
        total: updatedCapital.total,
        remaining: updatedCapital.remaining,
        allocated,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        updatedAt: updatedCapital.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error adding capital for ${req.params.currency}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to add capital',
      error: error.message
    });
  }
};

/**
 * Remove capital for a specific currency ensuring allocated funds remain untouched
 */
const removeCapital = async (req, res) => {
  try {
    const { currency } = req.params;
    const { amount } = req.body;

    if (!currency) {
      return res.status(400).json({
        success: false,
        message: 'Currency parameter is required'
      });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const updatedCapital = await CapitalManager.removeCapital(req.user.id, currency, parsedAmount);
    const allocated = updatedCapital.total - updatedCapital.remaining;
    const utilizationRate = updatedCapital.total > 0 ? (allocated / updatedCapital.total) * 100 : 0;

    res.json({
      success: true,
      message: `Removed capital successfully for ${currency.toUpperCase()}`,
      data: {
        currency: updatedCapital.currency,
        total: updatedCapital.total,
        remaining: updatedCapital.remaining,
        allocated,
        utilizationRate: parseFloat(utilizationRate.toFixed(2)),
        updatedAt: updatedCapital.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error removing capital for ${req.params.currency}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove capital',
      error: error.message
    });
  }
};

/**
 * Initialize capital records with default values
 */
const initializeCapital = async (req, res) => {
  try {
    const { initialCapitals } = req.body;

    await CapitalManager.initializeCapital(req.user.id, initialCapitals);

    const summary = await CapitalManager.getCapitalSummary(req.user.id);

    res.json({
      success: true,
      message: 'Capital initialized successfully',
      data: summary.data
    });
  } catch (error) {
    console.error('Error initializing capital:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize capital',
      error: error.message
    });
  }
};

/**
 * Check capital availability for a potential trade
 */
const checkCapitalAvailability = async (req, res) => {
  try {
    const { currency, amount } = req.query;

    if (!currency || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Currency and amount parameters are required'
      });
    }

    const requiredAmount = parseFloat(amount);
    if (requiredAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const isAvailable = await CapitalManager.hasSufficientCapital(req.user.id, currency, requiredAmount);
    const capital = await CapitalManager.getCapital(req.user.id, currency);

    res.json({
      success: true,
      data: {
        currency: currency.toUpperCase(),
        requiredAmount: requiredAmount,
        availableAmount: capital ? capital.remaining : 0,
        isAvailable: isAvailable,
        shortfall: isAvailable ? 0 : requiredAmount - (capital ? capital.remaining : 0)
      }
    });
  } catch (error) {
    console.error('Error checking capital availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check capital availability',
      error: error.message
    });
  }
};

/**
 * Deposit capital — creates the user's Capital row for that currency on
 * first use, then atomically bumps the balance and writes a ledger row.
 * Non-SUPERUSER accounts may only deposit in their registered preferredCurrency.
 */
const deposit = async (req, res) => {
  try {
    const { amount, currency, note } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const upperCurrency = currency.toUpperCase();

    if (req.user.role !== 'SUPERUSER') {
      const account = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (account.preferredCurrency !== upperCurrency) {
        return res.status(400).json({
          success: false,
          message: `You can only deposit in your selected trading currency (${account.preferredCurrency}).`
        });
      }
    }

    let capital = await CapitalManager.getCapital(req.user.id, upperCurrency);
    if (!capital) {
      capital = await prisma.capital.create({
        data: { userId: req.user.id, currency: upperCurrency, total: 0, remaining: 0 }
      });
    }

    const newRemaining = capital.remaining + parsedAmount;

    const [updatedCapital, transaction] = await prisma.$transaction([
      prisma.capital.update({
        where: { userId_currency: { userId: req.user.id, currency: upperCurrency } },
        data: { total: capital.total + parsedAmount, remaining: newRemaining, updatedAt: new Date() }
      }),
      prisma.capitalTransaction.create({
        data: {
          capitalId: capital.id,
          userId: req.user.id,
          type: 'DEPOSIT',
          amount: parsedAmount,
          currency: upperCurrency,
          balanceAfter: newRemaining,
          note: note || null
        }
      })
    ]);

    res.json({ success: true, message: 'Deposit successful', data: { capital: updatedCapital, transaction } });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ success: false, message: 'Failed to process deposit', error: error.message });
  }
};

/**
 * Withdraw capital — same atomic ledger-plus-balance pattern as deposit.
 */
const withdraw = async (req, res) => {
  try {
    const { amount, currency, note } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!currency) {
      return res.status(400).json({ success: false, message: 'Currency is required' });
    }
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const upperCurrency = currency.toUpperCase();

    if (req.user.role !== 'SUPERUSER') {
      const account = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (account.preferredCurrency !== upperCurrency) {
        return res.status(400).json({
          success: false,
          message: `You can only withdraw in your selected trading currency (${account.preferredCurrency}).`
        });
      }
    }

    const capital = await CapitalManager.getCapital(req.user.id, upperCurrency);
    if (!capital || capital.remaining < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient capital. Available: ${capital ? capital.remaining : 0} ${upperCurrency}`
      });
    }

    const newRemaining = capital.remaining - parsedAmount;

    const [updatedCapital, transaction] = await prisma.$transaction([
      prisma.capital.update({
        where: { userId_currency: { userId: req.user.id, currency: upperCurrency } },
        data: { total: capital.total - parsedAmount, remaining: newRemaining, updatedAt: new Date() }
      }),
      prisma.capitalTransaction.create({
        data: {
          capitalId: capital.id,
          userId: req.user.id,
          type: 'WITHDRAW',
          amount: parsedAmount,
          currency: upperCurrency,
          balanceAfter: newRemaining,
          note: note || null
        }
      })
    ]);

    res.json({ success: true, message: 'Withdrawal successful', data: { capital: updatedCapital, transaction } });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal', error: error.message });
  }
};

/**
 * Get the current user's deposit/withdraw history, newest first.
 */
const getTransactions = async (req, res) => {
  try {
    const { currency } = req.query;
    const where = { userId: req.user.id };
    if (currency) where.currency = currency.toUpperCase();

    const transactions = await prisma.capitalTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error fetching capital transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
  }
};

module.exports = {
  getAllCapital,
  getCapitalByCurrency,
  addCapital,
  removeCapital,
  updateCapital,
  initializeCapital,
  checkCapitalAvailability,
  deposit,
  withdraw,
  getTransactions
};
