import express from 'express';
import {
  initiateBreRequest,
  checkBreStatus,
  queryBreApplication,
  recordCustomerDecision,
  ecvFallbackEligibility,
} from '../controllers/breController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { ipWhitelist } from '../middleware/ipWhitelist.js';

const router = express.Router();

router.post('/requests', rateLimiter, initiateBreRequest);

router.post('/status', rateLimiter, checkBreStatus);

// GET /api/bre/query/:experianApplicationId - Admin only
router.get('/query/:experianApplicationId', ipWhitelist, rateLimiter, queryBreApplication);

router.post('/customer-decision', rateLimiter, recordCustomerDecision);

router.post('/ecv-fallback', rateLimiter, ecvFallbackEligibility);

export default router;
