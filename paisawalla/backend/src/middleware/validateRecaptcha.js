import axios from 'axios';
import { logger } from '../utils/logger.js';
import { buildErrorResponse } from '../utils/responseBuilder.js';
import { logApiCall } from '../utils/apiLogger.js';

export const validateRecaptcha = async (req, res, next) => {
  try {
    const { recaptchaToken } = req.body;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!recaptchaToken) {
      logger.info('reCAPTCHA token not provided - skipping validation', {
        ip: req.ip,
        hasSecretKey: !!secretKey,
      });
      req.recaptchaResult = { success: false, skipped: true };
      return next();
    }

    if (!secretKey || secretKey.trim() === '') {
      logger.warn('reCAPTCHA token provided but secret key not configured - skipping validation', {
        ip: req.ip,
      });
      req.recaptchaResult = { success: false, skipped: true };
      return next();
    }

    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    const { finalize } = logApiCall({
      service: 'Google reCAPTCHA',
      method: 'POST',
      url: verifyUrl,
      requestHeaders: { 'Content-Type': 'application/x-www-form-urlencoded' },
      requestBody: { secret: secretKey, response: recaptchaToken },
    });

    const response = await axios.post(verifyUrl, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken,
      },
      timeout: 10000,
    });

    const { success, score } = response.data;

    finalize({
      statusCode: response.status,
      rawResponse: response.data,
      parsedResponse: { success, score },
    });

    if (!success) {
      logger.warn('reCAPTCHA verification failed', {
        errors: response.data['error-codes'],
        ip: req.ip,
      });
      
      return res.status(400).json(
        buildErrorResponse('reCAPTCHA verification failed', null, 400)
      );
    }

    if (score !== undefined && score < 0.5) {
      logger.warn('reCAPTCHA score too low', { score, ip: req.ip });
      return res.status(400).json(
        buildErrorResponse('reCAPTCHA verification failed', null, 400)
      );
    }

    req.recaptchaResult = { success, score };
    next();
  } catch (error) {
    logger.error('reCAPTCHA validation error', { error: error.message });
    logger.warn('reCAPTCHA validation service error - allowing request to proceed', {
      error: error.message,
      ip: req.ip,
    });
    req.recaptchaResult = { success: false, error: error.message };
    next();
  }
};
