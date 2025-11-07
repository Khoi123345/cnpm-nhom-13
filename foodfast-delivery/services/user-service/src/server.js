const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const pool = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User Service is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

const startServer = async () => {
  const MAX_RETRIES = 10;      // số lần thử lại
  const RETRY_DELAY = 5000;    // 5 giây giữa mỗi lần thử

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Database connection established');
      
      app.listen(PORT, () => {
        console.log(`🚀 User Service is running on port ${PORT}`);
        console.log(`📍 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
        console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      });
      return; // ✅ thành công, thoát vòng lặp
    } catch (error) {
      console.warn(`⚠️  Database not ready (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
    }
  }

  console.error('❌ Database connection failed after several retries. Exiting.');
  process.exit(1);
};

startServer();

module.exports = app;