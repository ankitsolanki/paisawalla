import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { logApiCall } from '../utils/apiLogger.js';

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

class BreTokenService {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.refreshPromise = null;
    this.cookies = {};
  }

  getBaseUrl() {
    return process.env.EXPERIAN_BRE_BASE_URL || 'https://in-api.experian.com';
  }

  getCredentials() {
    return {
      username: process.env.EXPERIAN_BRE_USERNAME,
      password: process.env.EXPERIAN_BRE_PASSWORD,
      client_id: process.env.EXPERIAN_BRE_CLIENT_ID,
      client_secret: process.env.EXPERIAN_BRE_CLIENT_SECRET,
    };
  }

  getUserDomain() {
    return process.env.EXPERIAN_USER_DOMAIN || 'theunimobile.com';
  }

  async getToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return this.cachedToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._fetchNewToken();
    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  _extractCookies(responseHeaders) {
    const setCookieHeaders = responseHeaders['set-cookie'];
    if (!setCookieHeaders) return;

    const cookieArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

    for (const cookieStr of cookieArray) {
      const nameValue = cookieStr.split(';')[0];
      if (nameValue) {
        const eqIndex = nameValue.indexOf('=');
        if (eqIndex > 0) {
          const name = nameValue.substring(0, eqIndex).trim();
          const value = nameValue.substring(eqIndex + 1).trim();
          this.cookies[name] = value;
        }
      }
    }

    logger.info('BRE Token: cookies extracted', {
      cookieNames: Object.keys(this.cookies),
    });
  }

  async _fetchNewToken() {
    const credentials = this.getCredentials();

    if (!credentials.username || !credentials.client_id || !credentials.client_secret || !credentials.password) {
      throw new Error('BRE API credentials not configured. Set EXPERIAN_BRE_USERNAME, EXPERIAN_BRE_PASSWORD, EXPERIAN_BRE_CLIENT_ID, EXPERIAN_BRE_CLIENT_SECRET');
    }

    const tokenUrl = `${this.getBaseUrl()}/auth/experianone/v1/token`;

    logger.info('BRE Token: fetching new access token', { tokenUrl });

    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-correlation-id': crypto.randomUUID(),
      'X-User-Domain': this.getUserDomain(),
    };

    logCurl({
      label: 'BRE Token Request',
      method: 'POST',
      url: tokenUrl,
      headers: requestHeaders,
      body: credentials,
    });

    const { finalize } = logApiCall({
      service: 'Experian BRE Token',
      method: 'POST',
      url: tokenUrl,
      requestHeaders,
      requestBody: credentials,
    });

    try {
      const response = await axios.post(tokenUrl, credentials, {
        headers: requestHeaders,
        timeout: 15000,
      });

      this._extractCookies(response.headers);

      const { access_token, issued_at, expires_in, refresh_token } = response.data;

      if (!access_token) {
        throw new Error('No access_token in BRE token response');
      }

      this.cachedToken = access_token;
      const expiresInMs = (parseInt(expires_in, 10) || 1800) * 1000;
      const issuedAtMs = issued_at
        ? (String(issued_at).length > 10 ? parseInt(issued_at, 10) : parseInt(issued_at, 10) * 1000)
        : Date.now();
      this.tokenExpiresAt = issuedAtMs + expiresInMs;

      if (refresh_token) {
        this.cookies['exp_rt'] = refresh_token;
      }

      logger.info('BRE Token: access token acquired', {
        expiresIn: `${Math.round(expiresInMs / 1000)}s`,
        expiresAt: new Date(this.tokenExpiresAt).toISOString(),
        hasRefreshToken: !!refresh_token,
        cookieCount: Object.keys(this.cookies).length,
      });

      finalize({
        statusCode: response.status,
        rawResponse: response.data,
        parsedResponse: { tokenAcquired: true, expiresIn: `${Math.round(expiresInMs / 1000)}s`, hasRefreshToken: !!refresh_token },
      });

      return this.cachedToken;
    } catch (error) {
      this.cachedToken = null;
      this.tokenExpiresAt = 0;

      const status = error.response?.status;
      const data = error.response?.data;
      logger.error('BRE Token: failed to fetch token', {
        status,
        responseData: data,
        message: error.message,
      });

      finalize({
        statusCode: status,
        rawResponse: data,
        error: error.message,
      });

      throw new Error(`BRE token request failed (HTTP ${status || 'N/A'}): ${error.message}`);
    }
  }

  invalidateToken() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.cookies = {};
    logger.info('BRE Token: cache invalidated');
  }
}

export const breTokenService = new BreTokenService();
