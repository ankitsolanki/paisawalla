import express from 'express';
import { initiateBreRequest, checkBreStatus, checkBreStatusByRequestId } from '../controllers/breController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/bre/requests - Initiate BRE call
router.post('/requests', rateLimiter, initiateBreRequest);

// POST /api/bre/status - Poll for BRE completion (legacy, uses body)
router.post('/status', rateLimiter, checkBreStatus);

// POST /api/bre/requests/:requestId/status - Poll for BRE completion (new format)
router.post('/requests/:requestId/status', rateLimiter, checkBreStatusByRequestId);

export default router;

