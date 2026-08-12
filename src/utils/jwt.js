const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// HS256 (symmetric, one shared secret) not RS256 (asymmetric key pair): RS256
// exists so a service that only VERIFIES tokens can do so without holding the
// secret that CREATES them — essential in microservices, where many
// independent services check tokens signed by one auth service. Ishastra is a
// single monolith that both signs and verifies its own tokens, so that split
// buys nothing here.
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' }
  );
}

function verifyAccessToken(token) {
  // Throws on invalid/expired — callers catch this.
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
}

// Refresh tokens are plain random strings, not JWTs — their only job is
// "prove you hold a valid credential," which doesn't need embedded claims.
// Storing the HASH in the DB (never the raw token) means revoking one is
// just deleting/flagging a row — instant, no waiting for expiry.
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

// SHA-256 (not bcrypt) is correct here: this is a high-entropy random token,
// not a human-chosen password, so bcrypt's deliberate slowness buys nothing
// and would just make every refresh request slower for no benefit.
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};
