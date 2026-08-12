const crypto = require('crypto');
const prisma = require('../db');
const { hashPassword, verifyPassword } = require('../utils/passwordHash');
const { signAccessToken, generateRefreshToken, hashRefreshToken } = require('../utils/jwt');
const EmailService = require('../services/email.service');

const emailService = new EmailService();

const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'ishastra_rt';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);
const OTP_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 45;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  };
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    preferredCurrency: user.preferredCurrency,
    avatarUrl: user.avatarUrl
  };
}

// Issues a fresh access token + refresh token pair for a user, storing the
// refresh token's hash (never the raw value) and setting the httpOnly cookie.
async function issueTokens(user, req, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null
    }
  });

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return { accessToken, refreshToken };
}

// Registration — no auto-login. Creates the account, emails a 6-digit OTP,
// and stops there; the user must verify, then log in separately.
const register = async (req, res) => {
  try {
    const { email, password, preferredCurrency } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        preferredCurrency,
        emailVerified: false,
        otpCodeHash: hashRefreshToken(otp),
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
      }
    });

    await emailService.sendOtpEmail(user.email, otp);

    res.status(201).json({ message: 'Account created. Check your email for a verification code.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }
    if (hashRefreshToken(otp) !== user.otpCodeHash) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, otpCodeHash: null, otpExpiresAt: null }
    });

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Never reveal whether the email has an account or is already verified.
    if (user && !user.emailVerified) {
      const otp = generateOtp();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCodeHash: hashRefreshToken(otp),
          otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
        }
      });
      await emailService.sendOtpEmail(user.email, otp);
    }

    res.json({ message: 'If that email needs verification, a new code has been sent.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken } = await issueTokens(user, req, res);

    res.json({ accessToken, user: publicUser(user) });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

// Rotation: the presented refresh token is revoked and replaced with a new
// one on every use — an old, stolen cookie stops working the moment the
// legitimate owner refreshes once.
const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const tokenHash = hashRefreshToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await issueTokens(user, req, res);

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: hashRefreshToken(newRefreshToken)
      }
    });

    res.json({ accessToken: newAccessToken, user: publicUser(user) });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
};

const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (rawToken) {
      const tokenHash = hashRefreshToken(rawToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/auth' });
    res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Same response whether or not the account exists — never reveal which
    // emails are registered.
    if (user) {
      const rawToken = generateRefreshToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: hashRefreshToken(rawToken),
          passwordResetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000)
        }
      });
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
      await emailService.sendPasswordResetEmail(user.email, resetLink);
    }

    res.json({ message: 'If that email has an account, a reset link has been sent.' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { passwordResetTokenHash: tokenHash } });
    if (!user || !user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null
        }
      }),
      // A password reset implies possible compromise — force every existing
      // session to re-authenticate, unlike a voluntary updatePassword.
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    res.json({ message: 'Password reset. Please log in again.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// preferredCurrency, role, and email are deliberately not editable here —
// avatarUrl has its own dedicated uploadAvatar endpoint. Nothing else on the
// User model is user-editable in this pass, so this is a read-through today;
// it exists as the one place to add future editable profile fields.
const updateProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const validPassword = await verifyPassword(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

module.exports = {
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
};
