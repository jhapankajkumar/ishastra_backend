const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret';

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: { username, password_hash: hashed }
  });
  res.json({ id: user.id, username: user.username });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.users.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1d' });
  res.json({ token });
};