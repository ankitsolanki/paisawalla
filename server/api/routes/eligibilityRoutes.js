import express from 'express';
import { checkEligibility } from '../controllers/eligibilityController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/check', rateLimiter, checkEligibility);

export default router;
