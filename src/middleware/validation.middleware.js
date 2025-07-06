const { body, param, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Trade validation rules
const validateTrade = [
  body('ticker')
    .notEmpty()
    .withMessage('Ticker is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Ticker must be 1-10 characters')
    .isAlphanumeric()
    .withMessage('Ticker must contain only letters and numbers'),
  
  body('entryDate')
    .isISO8601()
    .withMessage('Entry date must be a valid date'),
  
  body('entryOrderPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry price must be a positive number'),
  
  body('entryFilledShares')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reasonForEntry')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Reason for entry must not exceed 1000 characters'),
  
  handleValidationErrors
];

const validateTradeExit = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Trade ID must be a positive integer'),
  
  body('exitDate')
    .isISO8601()
    .withMessage('Exit date must be a valid date'),
  
  body('exitOrderPrice')
    .isFloat({ min: 0 })
    .withMessage('Exit price must be a positive number'),
  
  body('reasonForExit')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Reason for exit must not exceed 1000 characters'),
  
  body('exitTactic')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Exit tactic must be a positive integer'),
  
  handleValidationErrors
];

const validatePostAnalysis = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Trade ID must be a positive integer'),
  
  body('postTradeAnalysis')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Post trade analysis must not exceed 2000 characters'),
  
  handleValidationErrors
];

const validateTradeId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Trade ID must be a positive integer'),
  
  handleValidationErrors
];

const validateAuth = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateTrade,
  validateTradeExit,
  validatePostAnalysis,
  validateTradeId,
  validateAuth,
  handleValidationErrors
};
