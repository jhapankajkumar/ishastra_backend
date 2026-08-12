const express = require('express');
const router = express.Router();

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  updatePassword,
  uploadAvatar
} = require('../controllers/auth.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit.middleware');
const {
  validateRegister,
  validateLogin,
  validateOtp,
  validateEmailOnly,
  validateResetPassword,
  validateUpdatePassword
} = require('../middleware/validation.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

/**
 * Auth routes — base path: /api/auth
 */

router.post('/register', authLimiter, validateRegister, register);
router.post('/verify-otp', otpLimiter, validateOtp, verifyOtp);
router.post('/resend-otp', otpLimiter, validateEmailOnly, resendOtp);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, validateEmailOnly, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);

router.get('/me', requireAuth, me);
router.patch('/profile', requireAuth, updateProfile);
router.patch('/password', requireAuth, validateUpdatePassword, updatePassword);
router.post('/avatar', requireAuth, upload.single('avatar'), handleUploadError, uploadAvatar);

module.exports = router;
