const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving with proper path
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// JWT Authentication setup
const { expressjwt: jwt } = require('express-jwt');
const auth = jwt({ 
  secret: process.env.JWT_SECRET || 'dev_secret', 
  algorithms: ['HS256'],
  credentialsRequired: false // Make auth optional for public endpoints
});

// Routes
app.use('/api/trades', require('./routes/trade.routes'));
app.use('/api/tags', require('./routes/tag.routes'));
app.use('/api/exit-tactics', require('./routes/tactic.routes'));
app.use('/api/journals', require('./routes/journal.routes'));
app.use('/api/chart-readings', require('./routes/chart.routes'));
app.use('/api/setups', require('./routes/setup.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});