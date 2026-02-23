import express from 'express';
import { sendOtp, verifyOtp, resendOtp, issueSessionToken, validateSessionToken } from '../controllers/authController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/send-otp', rateLimiter, sendOtp);

router.post('/verify-otp', rateLimiter, verifyOtp);

router.post('/resend-otp', rateLimiter, resendOtp);

router.post('/issue-token', rateLimiter, issueSessionToken);

router.post('/validate-token', rateLimiter, validateSessionToken);

export default router;
