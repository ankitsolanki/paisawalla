import express from 'express';
import { sendOtp, verifyOtp } from '../controllers/authController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/auth/send-otp - Send OTP to phone number
router.post('/send-otp', rateLimiter, sendOtp);

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', rateLimiter, verifyOtp);

export default router;

