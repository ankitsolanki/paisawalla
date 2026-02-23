import express from 'express';
import {
  registerEcv,
  generateOtp,
  validateOtp,
  refreshCreditReport,
  generateMaskedMobile,
} from '../controllers/ecvController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', rateLimiter, registerEcv);

router.post('/generate-otp', rateLimiter, generateOtp);

router.post('/validate-otp', rateLimiter, validateOtp);

router.post('/refresh', rateLimiter, refreshCreditReport);

router.post('/masked-mobile', rateLimiter, generateMaskedMobile);

export default router;
