import express from 'express';
import { checkLenderEligibility } from '../controllers/lenderEligibilityController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/check', rateLimiter, checkLenderEligibility);

export default router;
