const bcrypt = require('bcrypt');

// bcrypt is deliberately slow (~100ms per hash at cost factor 12) — that
// slowness is the security feature: it makes brute-forcing a stolen hash
// impractically slow, while being invisible to a real user logging in once.
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, verifyPassword };
