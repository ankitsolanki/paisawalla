import express from 'express';
import {
  storeEvents,
  storeBeaconEvent,
  getSessionEvents,
  getFormAbandonments,
} from '../controllers/analyticsController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/analytics/events - Store analytics events (batch)
router.post('/events', rateLimiter, storeEvents);

// POST /api/analytics/events/beacon - Store event via beacon (for page unload)
router.post('/events/beacon', storeBeaconEvent); // No rate limit for beacon

// GET /api/analytics/sessions/:sessionId/events - Get events for a session
router.get('/sessions/:sessionId/events', rateLimiter, getSessionEvents);

// GET /api/analytics/abandonments - Get form abandonment data
router.get('/abandonments', rateLimiter, getFormAbandonments);

export default router;

