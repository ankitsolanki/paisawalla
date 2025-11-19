import { logger } from '../utils/logger.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

// In-memory OTP storage (for development/testing)
// In production, use Redis or a database
const otpStore = new Map();

// OTP expiry time: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Generate a random 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    // Validate phone format (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json(
        buildErrorResponse('Invalid phone number format. Must be 10 digits starting with 6-9', null, 400)
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    // Store OTP (in production, use Redis)
    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    // In production, send OTP via SMS service (e.g., Twilio, AWS SNS, etc.)
    // For now, log it for testing
    logger.info('OTP generated', {
      phone,
      otp, // Remove this in production
      expiresAt: new Date(expiresAt).toISOString(),
    });

    // TODO: Integrate with SMS service
    // await smsService.sendOTP(phone, otp);

    res.status(200).json(
      buildResponse({
        message: 'OTP sent successfully',
        // In production, don't send OTP in response
        // For testing/development, include it
        ...(process.env.NODE_ENV === 'development' && { otp }),
      })
    );
  } catch (error) {
    logger.error('Error sending OTP', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json(
        buildErrorResponse('OTP is required', null, 400)
      );
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json(
        buildErrorResponse('Invalid phone number format', null, 400)
      );
    }

    // Validate OTP format (6 digits)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json(
        buildErrorResponse('Invalid OTP format. Must be 6 digits', null, 400)
      );
    }

    // Get stored OTP
    const storedOtpData = otpStore.get(phone);

    if (!storedOtpData) {
      return res.status(400).json(
        buildErrorResponse('OTP not found or expired. Please request a new OTP', null, 400)
      );
    }

    // Check if OTP expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json(
        buildErrorResponse('OTP expired. Please request a new OTP', null, 400)
      );
    }

    // Check max attempts (5 attempts)
    if (storedOtpData.attempts >= 5) {
      otpStore.delete(phone);
      return res.status(400).json(
        buildErrorResponse('Maximum verification attempts exceeded. Please request a new OTP', null, 400)
      );
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      otpStore.set(phone, storedOtpData);
      
      return res.status(400).json(
        buildErrorResponse('Invalid OTP. Please try again', null, 400)
      );
    }

    // OTP verified successfully - remove from store
    otpStore.delete(phone);

    logger.info('OTP verified successfully', { phone });

    res.status(200).json(
      buildResponse({
        message: 'OTP verified successfully',
        verified: true,
      })
    );
  } catch (error) {
    logger.error('Error verifying OTP', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

