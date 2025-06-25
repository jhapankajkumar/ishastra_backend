const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
const { expressjwt: jwt } = require('express-jwt');
const auth = jwt({ secret: process.env.JWT_SECRET || 'dev_secret', algorithms: ['HS256'] });

app.use('/api/trades', require('./routes/trade.routes'));
app.use('/api/tags', require('./routes/tag.routes'));
app.use('/api/exit-tactics', require('./routes/tactic.routes'));
app.use('/api/journals', require('./routes/journal.routes'));

// Authentication routes
app.use('/api/auth', require('./routes/auth.routes'));

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});