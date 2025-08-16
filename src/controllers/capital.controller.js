const CapitalManager = require('../utils/capitalManager');

/**
 * Capital Management Controller
 * Handles API endpoints for capital management
 */

/**
 * Get all capital information
 */
const getAllCapital = async (req, res) => {
  try {
    const summary = await CapitalManager.getCapitalSummary();
    
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

    const capital = await CapitalManager.getCapital(currency);
    
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
      currency, 
      parseFloat(total), 
      adjustRemaining === true
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
 * Initialize capital records with default values
 */
const initializeCapital = async (req, res) => {
  try {
    const { initialCapitals } = req.body;

    await CapitalManager.initializeCapital(initialCapitals);

    const summary = await CapitalManager.getCapitalSummary();

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

    const isAvailable = await CapitalManager.hasSufficientCapital(currency, requiredAmount);
    const capital = await CapitalManager.getCapital(currency);

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

module.exports = {
  getAllCapital,
  getCapitalByCurrency,
  updateCapital,
  initializeCapital,
  checkCapitalAvailability
};
