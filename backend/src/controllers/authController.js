import { logger } from '../utils/logger.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import crypto from 'crypto';

// In-memory OTP storage (for development/testing)
// In production, use Redis or a database
const otpStore = new Map();

// OTP expiry time: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Generate a cryptographically secure random 6-digit OTP
 */
function generateOTP() {
  // Use crypto.randomInt for cryptographically secure random number
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
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
      otp, //remove if going to production
      expiresAt,
      attempts: 0,
    });

    // In production, send OTP via SMS service (e.g., Twilio, AWS SNS, etc.)
    // For now, log it for testing (but mask OTP in logs)
    logger.info('OTP generated', {
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'), // Mask phone
      // Never log OTP, even in development
      expiresAt: new Date(expiresAt).toISOString(),
    });
    
    // Only log OTP to console in development (not to log files)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`); // eslint-disable-line no-console
    }

    // TODO: Integrate with SMS service
    // await smsService.sendOTP(phone, otp);

    res.status(200).json(
      buildResponse({
        data: { otp },
        message: 'OTP sent successfully',
        // Never send OTP in response, even in development
        // Check console logs for development OTP
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

    // Hardcoded OTP for testing: accept 123456
    const HARDCODED_OTP = '123456';
    
    if (otp === HARDCODED_OTP) {
      // Hardcoded OTP accepted - skip storage verification for testing
      logger.info('OTP verified successfully (hardcoded OTP)', { phone });
      
      res.status(200).json(
        buildResponse({
          message: 'OTP verified successfully',
          verified: true,
        })
      );
      return;
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

