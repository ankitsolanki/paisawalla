// Load environment variables FIRST before any other imports that might use them
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { connectDB } from './config/db.js';
import { securityConfig } from './config/security.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env, validateEnv } from './config/env.js';
import { buildErrorResponse } from './utils/responseBuilder.js';
import mongoose from 'mongoose';

// Import routes
import leadRoutes from './routes/leadRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import breRoutes from './routes/breRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = env.port;

// Validate environment variables
validateEnv();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(securityConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString() 
    });
  }
});

// API routes
app.use('/api/leads', leadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bre', breRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(
    buildErrorResponse('Route not found', null, 404)
  );
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { environment: env.nodeEnv });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        logger.info('HTTP server closed');
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer().catch((error) => {
  logger.error('Fatal error starting server', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;

