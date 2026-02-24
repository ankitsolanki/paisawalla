import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import crypto from 'crypto';
import {
  isKarixConfigured,
  generateOtp as karixGenerateOtp,
  validateOtp as karixValidateOtp,
  regenerateOtp as karixRegenerateOtp,
} from '../services/karixOtpService.js';

const HARDCODED_OTP = '123456';

const otpStore = new Map();

const sessionTokenStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000;

const SESSION_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function generateLocalOTP() {
  const min = 100000;
  const max = 999999;
  return crypto.randomInt(min, max + 1).toString();
}

function isLiveMode() {
  const configured = isKarixConfigured();
  if (!configured) {
    logger.info('[OTP Auth] Running in FALLBACK/DEV mode — Karix API keys not configured. Hardcoded OTP (123456) will be accepted.');
  } else {
    logger.info('[OTP Auth] Running in LIVE mode — Karix SMS API is configured.');
  }
  return configured;
}

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

    logCurl({
      label: 'OTP Send',
      method: 'POST',
      url: '/api/auth/send-otp',
      headers: { 'Content-Type': 'application/json' },
      body: { phone },
    });

    if (isLiveMode()) {
      const result = await karixGenerateOtp(phone);

      if (result.success) {
        logger.info('[OTP Auth] Karix OTP generated and sent via SMS', {
          phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        });

        return res.status(200).json(
          buildResponse({
            message: 'OTP sent successfully',
            mode: 'live',
          })
        );
      }

      logger.error('[OTP Auth] Karix OTP generation failed', {
        error: result.error,
        message: result.message,
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });

      return res.status(500).json(
        buildErrorResponse('Failed to send OTP. Please try again later.', { error: result.error }, 500)
      );
    }

    const otp = generateLocalOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    logger.info('[OTP Auth] FALLBACK MODE: Local OTP generated', {
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      reason: 'Karix API keys not configured',
      hint: 'Set KARIX_ACCESS_KEY and KARIX_IP_ADDRESS environment variables to enable live SMS OTP',
      expiresAt: new Date(expiresAt).toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV ONLY] OTP for ${phone}: ${otp}`);
    }

    res.status(200).json(
      buildResponse({
        otp,
        message: 'OTP sent successfully',
        mode: 'fallback',
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

    const liveMode = isLiveMode();

    if (liveMode) {
      const result = await karixValidateOtp(phone, otp);

      if (result.verified) {
        logger.info('[OTP Auth] OTP verified via Karix API', {
          phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        });

        const responseData = {
          message: 'OTP verified successfully',
          verified: true,
          mode: 'live',
        };

        if (applicationId) {
          const token = crypto.randomBytes(32).toString('hex');
          sessionTokenStore.set(token, { applicationId, phone, issuedAt: Date.now() });
          responseData.sessionToken = token;
        }

        return res.status(200).json(buildResponse(responseData));
      }

      return res.status(400).json(
        buildErrorResponse(result.message, { error: result.error, retriesLeft: result.retriesLeft }, 400)
      );
    }

    if (otp === HARDCODED_OTP) {
      logger.info('[OTP Auth] OTP verified via hardcoded fallback OTP (123456)', {
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });

      const responseData = {
        message: 'OTP verified successfully',
        verified: true,
        mode: 'fallback',
      };

      if (applicationId) {
        const token = crypto.randomBytes(32).toString('hex');
        sessionTokenStore.set(token, { applicationId, phone, issuedAt: Date.now() });
        responseData.sessionToken = token;
      }

      return res.status(200).json(buildResponse(responseData));
    }

    const storedOtpData = otpStore.get(phone);

    if (!storedOtpData) {
      return res.status(400).json(
        buildErrorResponse('OTP not found or expired. Please request a new OTP', null, 400)
      );
    }

    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json(
        buildErrorResponse('OTP expired. Please request a new OTP', null, 400)
      );
    }

    if (storedOtpData.attempts >= 5) {
      otpStore.delete(phone);
      return res.status(400).json(
        buildErrorResponse('Maximum verification attempts exceeded. Please request a new OTP', null, 400)
      );
    }

    if (storedOtpData.otp !== otp) {
      storedOtpData.attempts += 1;
      otpStore.set(phone, storedOtpData);

      return res.status(400).json(
        buildErrorResponse('Invalid OTP. Please try again', null, 400)
      );
    }

    otpStore.delete(phone);

    logger.info('[OTP Auth] OTP verified via local store (fallback)', {
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
    });

    const responseData = {
      message: 'OTP verified successfully',
      verified: true,
      mode: 'fallback',
    };

    if (applicationId) {
      const token = crypto.randomBytes(32).toString('hex');
      sessionTokenStore.set(token, { applicationId, phone, issuedAt: Date.now() });
      responseData.sessionToken = token;
    }

    res.status(200).json(buildResponse(responseData));
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

    logCurl({
      label: 'OTP Resend',
      method: 'POST',
      url: '/api/auth/resend-otp',
      headers: { 'Content-Type': 'application/json' },
      body: { phone },
    });

    if (isLiveMode()) {
      const result = await karixRegenerateOtp(phone);

      if (result.success) {
        logger.info('[OTP Auth] OTP resent via Karix regeneration API', {
          phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        });

        return res.status(200).json(
          buildResponse({
            message: 'OTP resent successfully',
            mode: 'live',
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
    }

    const otp = generateLocalOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(phone, {
      otp,
      expiresAt,
      attempts: 0,
    });

    logger.info('[OTP Auth] FALLBACK MODE: OTP regenerated locally', {
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      reason: 'Karix API keys not configured',
      hint: 'Set KARIX_ACCESS_KEY and KARIX_IP_ADDRESS to enable live SMS',
      expiresAt: new Date(expiresAt).toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV ONLY] Resent OTP for ${phone}: ${otp}`);
    }

    res.status(200).json(
      buildResponse({
        otp,
        message: 'OTP resent successfully',
        mode: 'fallback',
      })
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
    sessionTokenStore.set(token, { applicationId, phone, issuedAt: Date.now() });

    logger.info('Session token issued', { applicationId, phone });

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

    const tokenData = sessionTokenStore.get(token);

    if (!tokenData) {
      return res.status(200).json(
        buildResponse({ valid: false, phone: null }, 'Token not found')
      );
    }

    if (Date.now() - tokenData.issuedAt > SESSION_TOKEN_EXPIRY_MS) {
      sessionTokenStore.delete(token);
      return res.status(200).json(
        buildResponse({ valid: false, phone: null }, 'Token expired')
      );
    }

    if (tokenData.applicationId !== applicationId) {
      return res.status(200).json(
        buildResponse({ valid: false, phone: null }, 'Token does not match applicationId')
      );
    }

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
