const { verifyAccessToken } = require('../utils/jwt');

// Reads the Authorization header if present, verifies it, and sets
// req.user = { id, role } on success. Critically: if there's no token at
// all — or it's invalid/expired — this does NOT block the request, it just
// calls next() with req.user left unset. This is what makes GUEST access
// work: the same route handles all three roles, and each controller decides
// what to do based on whether req.user exists.
//
// Mount globally in server.js, before every route.
function attachUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch (error) {
    // Invalid/expired token — treat exactly like no token at all (GUEST).
    // Do not throw here; the frontend's httpClient interceptor is what
    // handles refreshing an expired token, not this middleware.
  }
  next();
}

// For routes GUEST must never reach (all DELETEs, and every route on
// Watchlist/Capital/Backtest). If req.user is missing, respond 403
// immediately, before any database lookup even happens.
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'This action requires an account. Please log in.' });
  }
  next();
}

// For Quick Review / AI Review specifically. Always call AFTER requireAuth
// (or as part of a chain that includes it) — this only checks role, not
// whether req.user exists at all.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { attachUser, requireAuth, requireRole };
