import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import crypto from 'crypto';
import {
  assertKarixConfigured,
  generateOtp as karixGenerateOtp,
  validateOtp as karixValidateOtp,
  regenerateOtp as karixRegenerateOtp,
} from '../services/karixOtpService.js';
import { SessionToken } from '../models/SessionToken.js';

const SESSION_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json(
        buildErrorResponse('Invalid phone number format. Must be 10 digits starting with 6-9', null, 400)
      );
    }

    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    logger.info('[OTP Auth] >>> SEND-OTP request received', {
      reqId,
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      referer: req.headers.referer || req.headers.origin || 'none',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
      timestamp: new Date().toISOString(),
    });

    logCurl({
      label: 'OTP Send',
      method: 'POST',
      url: '/api/auth/send-otp',
      headers: { 'Content-Type': 'application/json' },
      body: { phone },
    });

    assertKarixConfigured();

    const result = await karixGenerateOtp(phone);

    if (result.success) {
      logger.info('[OTP Auth] >>> SEND-OTP result: SUCCESS', {
        reqId,
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });

      return res.status(200).json(
        buildResponse({
          message: 'OTP sent successfully',
        })
      );
    }

    logger.error('[OTP Auth] >>> SEND-OTP result: FAILED', {
      reqId,
      error: result.error,
      message: result.message,
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
    });

    return res.status(500).json(
      buildErrorResponse('Failed to send OTP. Please try again later.', { error: result.error }, 500)
    );
  } catch (error) {
    logger.error('Error sending OTP', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, applicationId } = req.body;

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

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json(
        buildErrorResponse('Invalid phone number format', null, 400)
      );
    }

    const otpRegex = /^\d{4,8}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json(
        buildErrorResponse('Invalid OTP format', null, 400)
      );
    }

    logCurl({
      label: 'OTP Verify',
      method: 'POST',
      url: '/api/auth/verify-otp',
      headers: { 'Content-Type': 'application/json' },
      body: { phone, otp: '[MASKED]', applicationId },
    });

    assertKarixConfigured();

    const result = await karixValidateOtp(phone, otp);

    if (result.verified) {
      logger.info('[OTP Auth] OTP verified via Karix API', {
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });

      const responseData = {
        message: 'OTP verified successfully',
        verified: true,
      };

      if (applicationId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + SESSION_TOKEN_EXPIRY_MS);
        await SessionToken.create({ token, applicationId, phone, expiresAt });
        responseData.sessionToken = token;
        logger.info('[OTP Auth] Session token created and attached to OTP verify response', {
          applicationId,
          maskedToken: `${token.slice(0, 8)}...`,
          expiresAt: expiresAt.toISOString(),
          phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        });
      }

      return res.status(200).json(buildResponse(responseData));
    }

    return res.status(400).json(
      buildErrorResponse(result.message, { error: result.error, retriesLeft: result.retriesLeft }, 400)
    );
  } catch (error) {
    logger.error('Error verifying OTP', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json(
        buildErrorResponse('Invalid phone number format. Must be 10 digits starting with 6-9', null, 400)
      );
    }

    const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();
    logger.info('[OTP Auth] >>> RESEND-OTP request received', {
      reqId,
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      referer: req.headers.referer || req.headers.origin || 'none',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
      timestamp: new Date().toISOString(),
    });

    logCurl({
      label: 'OTP Resend',
      method: 'POST',
      url: '/api/auth/resend-otp',
      headers: { 'Content-Type': 'application/json' },
      body: { phone },
    });

    assertKarixConfigured();

    const result = await karixRegenerateOtp(phone);

    if (result.success) {
      logger.info('[OTP Auth] >>> RESEND-OTP result: SUCCESS', {
        reqId,
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });

      return res.status(200).json(
        buildResponse({
          message: 'OTP resent successfully',
        })
      );
    }

    if (result.error === 'MAX_REGEN') {
      return res.status(400).json(
        buildErrorResponse(result.message, { error: result.error }, 400)
      );
    }

    logger.error('[OTP Auth] Karix OTP regeneration failed', {
      error: result.error,
      message: result.message,
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
    });

    return res.status(500).json(
      buildErrorResponse('Failed to resend OTP. Please try again later.', { error: result.error }, 500)
    );
  } catch (error) {
    logger.error('Error resending OTP', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const issueSessionToken = async (req, res, next) => {
  try {
    const { applicationId, phone } = req.body;

    if (!applicationId || typeof applicationId !== 'string') {
      return res.status(400).json(
        buildErrorResponse('applicationId is required', null, 400)
      );
    }

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TOKEN_EXPIRY_MS);

    await SessionToken.create({ token, applicationId, phone, expiresAt });

    logger.info('[Session] Session token issued via issueSessionToken endpoint', {
      applicationId,
      maskedToken: `${token.slice(0, 8)}...`,
      expiresAt: expiresAt.toISOString(),
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
    });

    res.status(200).json(
      buildResponse({
        sessionToken: token,
      }, 'Session token issued successfully')
    );
  } catch (error) {
    logger.error('Error issuing session token', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const validateSessionToken = async (req, res, next) => {
  try {
    const { token, applicationId } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json(
        buildErrorResponse('Token is required', null, 400)
      );
    }

    if (!applicationId || typeof applicationId !== 'string') {
      return res.status(400).json(
        buildErrorResponse('applicationId is required', null, 400)
      );
    }

    const maskedToken = `${token.slice(0, 8)}...`;
    logger.info('[Session] Validating session token', { applicationId, maskedToken });

    const tokenData = await SessionToken.findOne({ token, expiresAt: { $gt: new Date() } });

    if (!tokenData) {
      logger.warn('[Session] Token NOT found in DB or is expired — session invalid', { applicationId, maskedToken, checkedAt: new Date().toISOString() });
      return res.status(200).json(
        buildResponse({ valid: false, phone: null }, 'Token not found or expired')
      );
    }

    if (tokenData.applicationId !== applicationId) {
      logger.warn('[Session] Token applicationId MISMATCH — session invalid', {
        expectedApplicationId: applicationId,
        actualApplicationId: tokenData.applicationId,
        maskedToken,
      });
      return res.status(200).json(
        buildResponse({ valid: false, phone: null }, 'Token does not match applicationId')
      );
    }

    logger.info('[Session] Token is VALID — session active', {
      applicationId,
      maskedToken,
      phone: tokenData.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      expiresAt: tokenData.expiresAt.toISOString(),
    });

    res.status(200).json(
      buildResponse({ valid: true, phone: tokenData.phone }, 'Token is valid')
    );
  } catch (error) {
    logger.error('Error validating session token', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};
