const { rateLimit } = require('express-rate-limit');

// Standard brute-force protection on login/register/forgot-password — an
// attacker trying thousands of password guesses gets stopped at 5 per
// 15-minute window, per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

// A 6-digit OTP is only ~1 million combinations — brute-forceable without a
// limiter. 10 attempts per 15 minutes per IP is generous for a real user
// (who mistypes at most a couple of times) while making brute-forcing
// impractical.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

// "Don't let one guest spam the shared sandbox." Skipped entirely for
// authenticated requests — this only exists to bound anonymous write volume.
const guestWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !!req.user,
  message: { error: 'Too many submissions from this location. Please try again later.' },
});

module.exports = { authLimiter, otpLimiter, guestWriteLimiter };
