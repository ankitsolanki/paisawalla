import axios from 'axios';
import { logger } from '../utils/logger.js';
import { buildErrorResponse } from '../utils/responseBuilder.js';

export const validateRecaptcha = async (req, res, next) => {
  try {
    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json(
        buildErrorResponse('reCAPTCHA token is required', null, 400)
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

    const response = await axios.post(verifyUrl, null, {
      params: {
        secret: secretKey,
        response: recaptchaToken,
      },
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
    return res.status(500).json(
      buildErrorResponse('reCAPTCHA validation service error', null, 500)
    );
  }
};

