import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { logApiCall } from '../utils/apiLogger.js';

function encryptOtp(otp) {
  const keyBase64 = process.env.KARIX_OTP_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('KARIX_OTP_ENCRYPTION_KEY is not set — cannot encrypt OTP');
  }
  const key = Buffer.from(keyBase64, 'base64');
  const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
  const encrypted = Buffer.concat([cipher.update(otp, 'utf8'), cipher.final()]);
  return encrypted.toString('base64');
}

function getBaseUrl() {
  return process.env.KARIX_BASE_URL || 'https://auth.instaalerts.zone/otpauthapi';
}

function getConfig() {
  const accessKey = process.env.KARIX_ACCESS_KEY;
  const departmentId = process.env.KARIX_DEPARTMENT_ID || 'Uni_SMS_OTP_feb20';
  const ipAddress = process.env.KARIX_IP_ADDRESS || '';

  return { accessKey, departmentId, ipAddress };
}

export function assertKarixConfigured() {
  const { accessKey, ipAddress } = getConfig();
  const missing = [];

  if (!accessKey) missing.push('KARIX_ACCESS_KEY');
  if (!ipAddress) missing.push('KARIX_IP_ADDRESS');

  if (missing.length > 0) {
    const msg = `[Karix OTP] FATAL: Required environment variables are not set: ${missing.join(', ')}. OTP service cannot start.`;
    logger.error(msg, { missingKeys: missing });
    throw new Error(msg);
  }
}

function formatMobile(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

export async function generateOtp(phone) {
  const { accessKey, departmentId, ipAddress } = getConfig();
  const mobile = formatMobile(phone);
  const baseUrl = getBaseUrl();

  logger.info('[Karix OTP] generateOtp called — about to hit Karix API', {
    mobile: mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2'),
    timestamp: new Date().toISOString(),
  });

  const params = new URLSearchParams({
    ipaddress: ipAddress,
    mobile: mobile,
  });

  const url = `${baseUrl}/otpgenservlet?${params.toString()}`;

  const headers = {
    'access_key': accessKey,
    'department-id': departmentId,
  };

  logCurl({
    label: 'Karix OTP Generation',
    method: 'POST',
    url,
    headers: {
      'access_key': '[MASKED]',
      'department-id': departmentId,
    },
  });

  const { finalize } = logApiCall({
    service: 'Karix OTP',
    method: 'POST',
    url,
    requestHeaders: headers,
    requestBody: { ipaddress: ipAddress, mobile },
  });

  try {
    const response = await axios.post(url, null, {
      headers,
      timeout: 30000,
    });

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    logger.info('[Karix OTP] Generation response', {
      status: response.status,
      response: responseText,
      mobile: mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2'),
    });

    let result;

    if (responseText.includes('OTP Generated Successfully')) {
      result = { success: true, message: 'OTP sent successfully via SMS' };
    } else if (responseText.includes('UNAUTHERISED USER') || responseText.includes('UNAUTHORISED')) {
      logger.error('[Karix OTP] Authentication failed - invalid access_key');
      result = { success: false, message: 'SMS service authentication failed', error: 'UNAUTHORIZED' };
    } else if (responseText.includes('Invalid Parameters')) {
      logger.error('[Karix OTP] Invalid parameters sent to Karix API');
      result = { success: false, message: 'Invalid parameters for SMS service', error: 'INVALID_PARAMS' };
    } else if (responseText.includes('The feature is not enabled')) {
      logger.error('[Karix OTP] OTP Auth feature not enabled on the Karix account');
      result = { success: false, message: 'OTP feature not enabled', error: 'FEATURE_DISABLED' };
    } else if (responseText.includes('SMSEMAILFAIL')) {
      logger.error('[Karix OTP] SMS/Email delivery failed');
      result = { success: false, message: 'Failed to deliver OTP via SMS', error: 'DELIVERY_FAILED' };
    } else if (responseText.includes('ERROR')) {
      logger.error('[Karix OTP] Failed to generate OTP', { response: responseText });
      result = { success: false, message: 'Failed to generate OTP', error: 'GENERATION_ERROR' };
    } else {
      result = { success: true, message: responseText };
    }

    finalize({
      statusCode: response.status,
      rawResponse: responseText,
      parsedResponse: result,
    });

    return result;
  } catch (error) {
    logger.error('[Karix OTP] Generation API call failed', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    const result = { success: false, message: 'SMS service unavailable', error: 'API_ERROR' };
    finalize({
      statusCode: error.response?.status,
      rawResponse: error.response?.data,
      error: error.message,
    });
    return result;
  }
}

export async function validateOtp(phone, otp) {
  const { accessKey, ipAddress } = getConfig();
  const mobile = formatMobile(phone);
  const baseUrl = getBaseUrl();

  const encryptedOtp = encryptOtp(otp);

  const params = new URLSearchParams({
    ipaddress: ipAddress,
    otp: encryptedOtp,
    mobile: mobile,
  });

  const url = `${baseUrl}/otpvalidationservlet?${params.toString()}`;

  const headers = {
    'access_key': accessKey,
  };

  logCurl({
    label: 'Karix OTP Validation',
    method: 'POST',
    url: `${baseUrl}/otpvalidationservlet?ipaddress=${ipAddress}&otp=[MASKED]&mobile=${mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2')}`,
    headers: {
      'access_key': '[MASKED]',
    },
  });

  const { finalize } = logApiCall({
    service: 'Karix OTP',
    method: 'POST',
    url: `${baseUrl}/otpvalidationservlet`,
    requestHeaders: headers,
    requestBody: { ipaddress: ipAddress, otp, mobile },
  });

  try {
    const response = await axios.post(url, null, {
      headers,
      timeout: 30000,
    });

    const responseText = typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);

    logger.info('[Karix OTP] Validation response', {
      status: response.status,
      response: responseText,
      mobile: mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2'),
    });

    let result;

    if (responseText.includes('Verified successfully')) {
      result = { success: true, verified: true, message: 'OTP verified successfully' };
    } else if (response.status === 200 && responseText === '') {
      logger.warn('[Karix OTP] Validation returned 200 with empty body — treating as unrecognized failure', {
        mobile: mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2'),
      });
      result = { success: false, verified: false, message: 'OTP verification failed. Please try again.', error: 'EMPTY_RESPONSE' };
    } else if (responseText.includes('OTPEXPIRED')) {
      result = { success: false, verified: false, message: 'OTP has expired. Please request a new OTP', error: 'OTP_EXPIRED' };
    } else if (responseText.includes('Max no of tries')) {
      result = { success: false, verified: false, message: 'Maximum verification attempts reached. Please request a new OTP', error: 'MAX_ATTEMPTS' };
    } else if (responseText.includes('Wrong PIN')) {
      const retriesMatch = responseText.match(/remaining\s*#?\s*(\d+)/i);
      const retriesLeft = retriesMatch ? parseInt(retriesMatch[1], 10) : null;
      result = {
        success: false,
        verified: false,
        message: retriesLeft !== null
          ? `Wrong OTP. ${retriesLeft} attempts remaining`
          : 'Wrong OTP. Please try again',
        error: 'WRONG_OTP',
        retriesLeft,
      };
    } else {
      result = { success: false, verified: false, message: responseText, error: 'UNKNOWN' };
    }

    finalize({
      statusCode: response.status,
      rawResponse: responseText,
      parsedResponse: result,
    });

    return result;
  } catch (error) {
    logger.error('[Karix OTP] Validation API call failed', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    const result = { success: false, verified: false, message: 'SMS service unavailable', error: 'API_ERROR' };
    finalize({
      statusCode: error.response?.status,
      rawResponse: error.response?.data,
      error: error.message,
    });
    return result;
  }
}

export async function regenerateOtp(phone) {
  const { accessKey, departmentId, ipAddress } = getConfig();
  const mobile = formatMobile(phone);
  const baseUrl = getBaseUrl();

  const params = new URLSearchParams({
    ipaddress: ipAddress,
    mobile: mobile,
  });

  const url = `${baseUrl}/otpregenservlet?${params.toString()}`;

  const headers = {
    'access_key': accessKey,
    'department-id': departmentId,
  };

  logCurl({
    label: 'Karix OTP Regeneration',
    method: 'POST',
    url,
    headers: {
      'access_key': '[MASKED]',
      'department-id': departmentId,
    },
  });

  const { finalize } = logApiCall({
    service: 'Karix OTP',
    method: 'POST',
    url,
    requestHeaders: headers,
    requestBody: { ipaddress: ipAddress, mobile },
  });

  try {
    const response = await axios.post(url, null, {
      headers,
      timeout: 30000,
    });

    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    logger.info('[Karix OTP] Regeneration response', {
      status: response.status,
      response: responseText,
      mobile: mobile.replace(/(\d{4})\d{6}(\d{2})/, '$1******$2'),
    });

    let result;

    if (responseText.includes('OTP Generated Successfully')) {
      result = { success: true, message: 'OTP resent successfully via SMS' };
    } else if (responseText.includes('MAXREGEN')) {
      result = { success: false, message: 'Maximum resend attempts reached. Please request a new OTP', error: 'MAX_REGEN' };
    } else if (responseText.includes('UNAUTHERISED USER') || responseText.includes('UNAUTHORISED')) {
      logger.error('[Karix OTP] Authentication failed during regeneration');
      result = { success: false, message: 'SMS service authentication failed', error: 'UNAUTHORIZED' };
    } else if (responseText.includes('ERROR')) {
      logger.error('[Karix OTP] Failed to regenerate OTP', { response: responseText });
      result = { success: false, message: 'Failed to resend OTP', error: 'REGEN_ERROR' };
    } else {
      result = { success: true, message: responseText };
    }

    finalize({
      statusCode: response.status,
      rawResponse: responseText,
      parsedResponse: result,
    });

    return result;
  } catch (error) {
    logger.error('[Karix OTP] Regeneration API call failed', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    const result = { success: false, message: 'SMS service unavailable', error: 'API_ERROR' };
    finalize({
      statusCode: error.response?.status,
      rawResponse: error.response?.data,
      error: error.message,
    });
    return result;
  }
}
