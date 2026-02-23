import express from 'express';
import {
  initiateBreRequest,
  checkBreStatus,
  queryBreApplication,
  recordCustomerDecision,
  ecvFallbackEligibility,
} from '../controllers/breController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/requests', rateLimiter, initiateBreRequest);

router.post('/status', rateLimiter, checkBreStatus);

router.get('/query/:experianApplicationId', rateLimiter, queryBreApplication);

router.post('/customer-decision', rateLimiter, recordCustomerDecision);

router.post('/ecv-fallback', rateLimiter, ecvFallbackEligibility);

export default router;
