import express from 'express';
import { initiateBreRequest, checkBreStatus } from '../controllers/breController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/bre/requests - Initiate BRE call
router.post('/requests', rateLimiter, initiateBreRequest);

// POST /api/bre/status - Poll for BRE completion
router.post('/status', rateLimiter, checkBreStatus);

export default router;

