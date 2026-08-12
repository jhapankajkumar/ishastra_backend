// The security choke point for the entire multi-tenancy system. Every
// controller uses these four functions instead of hand-writing `where`
// clauses — so "never trust client input for ownership fields" is enforced
// in ONE place, not re-implemented (and potentially forgotten) in every
// controller.
//
// The one sentence that makes the whole system safe: the server decides
// `userId` and `isPaperTrade` from the verified login token — it never
// trusts what the client sends in the request body.

// For reads on the four sandbox-capable models (Trade, Investment,
// Recommendation, ChartAnalysis/Journal). Authenticated users see only their
// own rows; guests see only the shared sandbox.
function buildReadFilter(req) {
  if (req.user) {
    return { userId: req.user.id };
  }
  return { userId: null, isPaperTrade: true };
}

// Same shape as buildReadFilter — used to confirm "do I own the row I'm
// about to update/delete" via a findFirst() before the actual mutation.
// Identical logic to buildReadFilter today, but named separately because
// read and write authorization are conceptually different checks that could
// diverge later (e.g. if guests ever lose write access to the sandbox while
// keeping read access).
function buildWriteFilter(req) {
  return buildReadFilter(req);
}

// The one function that makes "never trust client input for ownership
// fields" actually true in code. Strips any userId/isPaperTrade the client
// tried to send, then force-sets the correct values based on req.user.
function buildCreateData(req, clientBody) {
  const { userId: _ignoredUserId, isPaperTrade: _ignoredIsPaperTrade, ...safeBody } = clientBody || {};

  if (req.user) {
    return { ...safeBody, userId: req.user.id, isPaperTrade: false };
  }
  return { ...safeBody, userId: null, isPaperTrade: true };
}

// For models with no guest concept at all (Watchlist, Capital, Backtest) —
// these sit behind requireAuth, so req.user is always present here.
function buildOwnedOnlyFilter(req) {
  return { userId: req.user.id };
}

module.exports = {
  buildReadFilter,
  buildWriteFilter,
  buildCreateData,
  buildOwnedOnlyFilter,
};
