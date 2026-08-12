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

// NIST 800-63B favors length over forced complexity — 8+ chars, no
// mandated uppercase/symbol/number gymnastics.
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('preferredCurrency')
    .isIn(['USD', 'INR'])
    .withMessage('Preferred currency must be USD or INR'),

  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateOtp = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must be numeric'),
  handleValidationErrors
];

const validateEmailOnly = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  handleValidationErrors
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

const validateUpdatePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

// Guest sandbox write limiter — bounds field length on the four
// sandbox-capable models' free-text fields regardless of role.
const validateGuestWritableFields = [
  body('notes').optional().isLength({ max: 2000 }).withMessage('Notes must not exceed 2000 characters'),
  body('reasonForEntry').optional().isLength({ max: 1000 }).withMessage('Reason for entry must not exceed 1000 characters'),
  body('reasonForExit').optional().isLength({ max: 1000 }).withMessage('Reason for exit must not exceed 1000 characters'),
  body('postTradeAnalysis').optional().isLength({ max: 2000 }).withMessage('Post trade analysis must not exceed 2000 characters'),
  body('thesis').optional().isLength({ max: 2000 }).withMessage('Thesis must not exceed 2000 characters'),
  body('entryNotes').optional().isLength({ max: 2000 }).withMessage('Entry notes must not exceed 2000 characters'),
  body('reviewNotes').optional().isLength({ max: 2000 }).withMessage('Review notes must not exceed 2000 characters'),
  body('actionPlan').optional().isLength({ max: 1000 }).withMessage('Action plan must not exceed 1000 characters'),
  handleValidationErrors
];

module.exports = {
  validateTrade,
  validateTradeExit,
  validatePostAnalysis,
  validateTradeId,
  validateAuth,
  validateRegister,
  validateLogin,
  validateOtp,
  validateEmailOnly,
  validateResetPassword,
  validateUpdatePassword,
  validateGuestWritableFields,
  handleValidationErrors
};
