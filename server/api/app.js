import "dotenv/config";

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

import leadRoutes from './routes/leadRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import breRoutes from './routes/breRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import ecvRoutes from './routes/ecvRoutes.js';
import lenderEligibilityRoutes from './routes/lenderEligibilityRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import apiLogRoutes from './routes/apiLogRoutes.js';
import { seedTestData, VARIANT_INFO } from './seeds/testData.js';
import { seedAllLenderData } from './seeds/seedLenderData.js';

validateEnv();

const apiRouter = express.Router();

apiRouter.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
apiRouter.use(cors(securityConfig.cors));
apiRouter.use(sanitizeInput);
apiRouter.use(requestLogger);

apiRouter.use('/leads', leadRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/bre', breRoutes);
apiRouter.use('/offers', offerRoutes);
apiRouter.use('/partners', partnerRoutes);
apiRouter.use('/pages', pageRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/ecv', ecvRoutes);
apiRouter.use('/lender-eligibility', lenderEligibilityRoutes);
apiRouter.use('/eligibility', eligibilityRoutes);
apiRouter.use('/admin/api-logs', apiLogRoutes);

apiRouter.get('/test-variants', (req, res) => {
  res.status(200).json({ ok: true, variants: VARIANT_INFO });
});

apiRouter.post('/test-variants/seed', async (req, res) => {
  try {
    const result = await seedTestData();
    res.status(200).json({ ok: true, variants: result, message: 'Test data seeded successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

apiRouter.use(errorHandler);

const healthRouter = express.Router();
healthRouter.get('/health', async (req, res) => {
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

export async function initializeBackend() {
  try {
    await connectDB();
    seedTestData().catch((err) => {
      logger.warn('Test data seeding failed (non-critical)', { error: err.message });
    });
    seedAllLenderData().catch((err) => {
      logger.warn('Lender data seeding failed (non-critical)', { error: err.message });
    });
  } catch (error) {
    logger.error('MongoDB connection failed during startup', { 
      error: error.message,
      note: 'Server is running but database operations will fail until connection is established'
    });
  }
}

export { apiRouter, healthRouter, logger };
