import axios from 'axios';
import { logger } from '../utils/logger.js';
import { buildErrorResponse } from '../utils/responseBuilder.js';

export const validateRecaptcha = async (req, res, next) => {
  try {
    const { recaptchaToken } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // If no token provided and no secret key configured, skip validation
    if (!recaptchaToken) {
      logger.info('reCAPTCHA token not provided - skipping validation', {
        ip: req.ip,
        hasSecretKey: !!secretKey,
      });
      req.recaptchaResult = { success: false, skipped: true };
      return next();
    }

    // If token provided but no secret key configured, skip validation
    if (!secretKey || secretKey.trim() === '') {
      logger.warn('reCAPTCHA token provided but secret key not configured - skipping validation', {
        ip: req.ip,
      });
      req.recaptchaResult = { success: false, skipped: true };
      return next();
    }

    // Validate token if both token and secret key are provided
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    const response = await axios.post(verifyUrl, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken,
      },
      timeout: 10000, // 10 second timeout
    });

    const { success, score } = response.data;

    if (!success) {
      logger.warn('reCAPTCHA verification failed', {
        errors: response.data['error-codes'],
        ip: req.ip,
      });
      
      return res.status(400).json(
        buildErrorResponse('reCAPTCHA verification failed', null, 400)
      );
    }

    // Optional: Check score for v3 (threshold typically 0.5)
    if (score !== undefined && score < 0.5) {
      logger.warn('reCAPTCHA score too low', { score, ip: req.ip });
      return res.status(400).json(
        buildErrorResponse('reCAPTCHA verification failed', null, 400)
      );
    }

    // Attach recaptcha result to request for logging
    req.recaptchaResult = { success, score };
    next();
  } catch (error) {
    logger.error('reCAPTCHA validation error', { error: error.message });
    // If validation service fails, allow request to proceed (fail open)
    // This prevents service errors from blocking form submissions
    logger.warn('reCAPTCHA validation service error - allowing request to proceed', {
      error: error.message,
      ip: req.ip,
    });
    req.recaptchaResult = { success: false, error: error.message };
    next();
  }
};

