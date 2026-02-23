import axios from 'axios';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { logApiCall } from '../utils/apiLogger.js';

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;

class ExperianTokenService {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.refreshPromise = null;
  }

  getBaseUrl() {
    return process.env.EXPERIAN_BASE_URL || 'https://uat-in-api.experian.com';
  }

  getUserDomain() {
    return process.env.EXPERIAN_USER_DOMAIN || 'theunimobile.com';
  }

  getCredentials() {
    return {
      clientId: process.env.EXPERIAN_CLIENT_ID,
      clientSecret: process.env.EXPERIAN_CLIENT_SECRET,
      username: process.env.EXPERIAN_USERNAME,
      password: process.env.EXPERIAN_PASSWORD,
    };
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

  async _fetchNewToken() {
    const { clientId, clientSecret, username, password } = this.getCredentials();

    if (!clientId || !clientSecret || !username || !password) {
      throw new Error('Experian ECV credentials not configured. Set EXPERIAN_CLIENT_ID, EXPERIAN_CLIENT_SECRET, EXPERIAN_USERNAME, EXPERIAN_PASSWORD');
    }

    const tokenUrl = `${this.getBaseUrl()}/oauth2/v1/token`;

    logger.info('ECV Token: fetching new access token', { tokenUrl });

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const requestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-correlation-id': crypto.randomUUID(),
      'X-User-Domain': this.getUserDomain(),
    };

    logCurl({
      label: 'ECV Token Request',
      method: 'POST',
      url: tokenUrl,
      headers: requestHeaders,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV Token',
      method: 'POST',
      url: tokenUrl,
      requestHeaders,
      requestBody: params,
    });

    try {
      const response = await axios.post(tokenUrl, params, {
        headers: requestHeaders,
        timeout: 15000,
      });

      const { access_token, issued_at, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access_token in ECV token response');
      }

      this.cachedToken = access_token;
      const expiresInMs = (parseInt(expires_in, 10) || 1800) * 1000;
      const issuedAtMs = issued_at
        ? (String(issued_at).length > 10 ? parseInt(issued_at, 10) : parseInt(issued_at, 10) * 1000)
        : Date.now();
      this.tokenExpiresAt = issuedAtMs + expiresInMs;

      logger.info('ECV Token: access token acquired', {
        expiresIn: `${Math.round(expiresInMs / 1000)}s`,
        expiresAt: new Date(this.tokenExpiresAt).toISOString(),
      });

      finalize({
        statusCode: response.status,
        rawResponse: response.data,
        parsedResponse: { tokenAcquired: true, expiresIn: `${Math.round(expiresInMs / 1000)}s` },
      });

      return this.cachedToken;
    } catch (error) {
      this.cachedToken = null;
      this.tokenExpiresAt = 0;

      const status = error.response?.status;
      const data = error.response?.data;
      logger.error('ECV Token: failed to fetch token', {
        status,
        responseData: data,
        message: error.message,
      });

      finalize({
        statusCode: status,
        rawResponse: data,
        error: error.message,
      });

      throw new Error(`ECV token request failed (HTTP ${status || 'N/A'}): ${error.message}`);
    }
  }

  invalidateToken() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    logger.info('ECV Token: cache invalidated');
  }
}

export const experianTokenService = new ExperianTokenService();
