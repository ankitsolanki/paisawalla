import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { connectDB } from './config/db.js';
import { securityConfig } from './config/security.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import { requestLogger } from './middleware/requestLogger.js';

// Load environment variables
dotenv.config();

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
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors(securityConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { environment: process.env.NODE_ENV });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();

export default app;

