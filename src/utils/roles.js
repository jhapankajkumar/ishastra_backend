// GUEST is never stored anywhere — it simply means "no valid access token was
// presented on this request." Only these two roles ever exist as a User row.
const ROLES = Object.freeze({
  USER: 'USER',
  SUPERUSER: 'SUPERUSER',
});

module.exports = { ROLES };
