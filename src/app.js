// =============================================================================
// VOTE VERIFICATION SERVICE - MAIN APPLICATION
// =============================================================================

import express from 'express';
import cors from 'cors';
//import pool from './config/database.js';

// Import route handlers
import verificationRoutes from './routes/verificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import fraudRoutes from './routes/fraudRoutes.js';
import pool from './config/database.js';

const app = express();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
  });
}

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

console.log('🔌 Initializing database connection...');

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log(`✅ Database connected successfully at: ${res.rows[0].now}`);
  }
});

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

// API route handlers
app.use('/api/verification', verificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/fraud', fraudRoutes);

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vote Verification Service is running',
    timestamp: new Date().toISOString(),
    service: 'vote-verification',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Service status endpoint
app.get('/status', async (req, res) => {
  try {
    // Check database connectivity
    const dbResult = await pool.query('SELECT 1 as connected');
    const dbStatus = dbResult.rows[0].connected === 1;

    res.status(200).json({
      success: true,
      service: 'vote-verification',
      status: 'operational',
      components: {
        database: dbStatus ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'vote-verification',
      status: 'degraded',
      components: {
        database: 'unhealthy',
        api: 'healthy'
      },
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Service information endpoint
app.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    service: {
      name: 'Vottery Vote Verification Service',
      version: '1.0.0',
      description: 'Handles vote verification, audit trails, and fraud detection',
      endpoints: {
        verification: '/api/verification',
        audit: '/api/audit',
        fraud: '/api/fraud'
      },
      features: [
        'Vote verification by code',
        'Audit trail management',
        'Hash chain verification',
        'Fraud detection and reporting',
        'Role-based access control'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: {
      verification: '/api/verification',
      audit: '/api/audit',
      fraud: '/api/fraud',
      health: '/health',
      status: '/status',
      info: '/info'
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled application error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: 'Malformed JSON'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      error: 'File size exceeds limit'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================================================

process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🔐 Vote Verification Service Started`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'vottery'}`);
  console.log(`🔗 Service URL: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log(`  📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`  📊 Status: http://localhost:${PORT}/status`);
  console.log(`  ℹ️  Info: http://localhost:${PORT}/info`);
  console.log(`  ✅ Verification: http://localhost:${PORT}/api/verification`);
  console.log(`  📝 Audit: http://localhost:${PORT}/api/audit`);
  console.log(`  🚨 Fraud: http://localhost:${PORT}/api/fraud`);
  console.log('='.repeat(60));
});

export default app;