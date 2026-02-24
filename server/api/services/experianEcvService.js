import axios from 'axios';
import { experianTokenService } from './experianTokenService.js';
import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { logApiCall } from '../utils/apiLogger.js';

class ExperianEcvService {
  getBaseUrl() {
    return process.env.EXPERIAN_BASE_URL || 'https://uat-in-api.experian.com';
  }

  getClientName() {
    return process.env.EXPERIAN_CLIENT_NAME || '';
  }

  async _getAuthHeaders() {
    const token = await experianTokenService.getToken();
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
    };
  }

  async register({ firstName, lastName, phone, email, pan, dateOfBirth }) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}/ecs/ecv-api/v1/enhanced-match`;

    const params = new URLSearchParams();
    params.append('clientName', this.getClientName());
    params.append('allowInput', '1');
    params.append('allowEdit', '1');
    params.append('allowCaptcha', '1');
    params.append('allowConsent', '1');
    params.append('allowEmailVerify', '1');
    params.append('allowVoucher', '1');
    params.append('voucherCode', process.env.EXPERIAN_VOUCHER_CODE || '');
    params.append('firstName', firstName || '');
    params.append('surName', lastName || '');
    params.append('mobileNo', phone || '');
    params.append('email', email || '');
    params.append('pan', pan || '');
    params.append('reason', 'Find out my credit score');
    params.append('noValidationByPass', '0');
    params.append('emailConditionalByPass', '1');

    logger.info('ECV Register: calling Experian', { phone: phone?.slice(-4), url });

    logCurl({
      label: 'ECV Register',
      method: 'POST',
      url,
      headers,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: params,
    });

    try {
      const response = await axios.post(url, params, {
        headers,
        timeout: 30000,
      });

      const data = response.data;
      const stgOneHitId = data?.stageOneId_ || data?.stgOneHitId;
      const stgTwoHitId = data?.stageTwoId_ || data?.stgTwoHitId;

      if (!stgOneHitId || !stgTwoHitId) {
        const errorString = data?.errorString || 'Unknown validation error';
        logger.error('ECV Register: missing hit IDs in response', { responseData: data, errorString });
        finalize({ statusCode: response.status, rawResponse: data, error: errorString });
        throw new Error(`Experian ECV registration failed: ${errorString}`);
      }

      logger.info('ECV Register: success', { stgOneHitId, stgTwoHitId, newUserId: data?.newUserId });

      const parsed = { stgOneHitId, stgTwoHitId, newUserId: data?.newUserId };
      finalize({ statusCode: response.status, rawResponse: data, parsedResponse: parsed });

      return {
        stgOneHitId,
        stgTwoHitId,
        newUserId: data?.newUserId,
        rawResponse: data,
      };
    } catch (error) {
      if (!error.message.includes('Experian ECV registration failed')) {
        const status = error.response?.status;
        const responseData = error.response?.data;
        logger.error('ECV Register failed', { status, responseData, message: error.message });
        finalize({ statusCode: status, rawResponse: responseData, error: error.message });
        if (status === 401) experianTokenService.invalidateToken();
      }
      throw error.message.includes('Experian ECV registration failed') ? error : new Error(`ECV registration failed (HTTP ${error.response?.status || 'N/A'}): ${error.response?.data?.errorString || error.message}`);
    }
  }

  async generateOtp({ stgOneHitId, stgTwoHitId, phone, type = 'CUSTOM' }) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}/ecs/ecv-api/v1/generate-mobile-otp`;

    const params = new URLSearchParams();
    params.append('stgOneHitId', stgOneHitId);
    params.append('stgTwoHitId', stgTwoHitId);
    params.append('mobileNo', phone);
    params.append('type', type);

    logger.info('ECV GenerateOTP: calling Experian', { phone: phone?.slice(-4), type });

    logCurl({
      label: 'ECV GenerateOTP',
      method: 'POST',
      url,
      headers,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: params,
    });

    try {
      const response = await axios.post(url, params, {
        headers,
        timeout: 30000,
      });

      logger.info('ECV GenerateOTP: success', { responseStatus: response.status });

      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: { success: true } });

      return {
        success: true,
        rawResponse: response.data,
      };
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      logger.error('ECV GenerateOTP failed', { status, responseData, message: error.message });
      finalize({ statusCode: status, rawResponse: responseData, error: error.message });
      if (status === 401) experianTokenService.invalidateToken();
      throw new Error(`ECV OTP generation failed (HTTP ${status || 'N/A'}): ${responseData?.errorString || error.message}`);
    }
  }

  async validateOtp({ stgOneHitId, stgTwoHitId, phone, otp, type = 'CUSTOM' }) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}/ecs/ecv-api/v1/validate-mobile-otp`;

    const params = new URLSearchParams();
    params.append('stgOneHitId', stgOneHitId);
    params.append('stgTwoHitId', stgTwoHitId);
    params.append('otp', otp);
    params.append('mobileNo', phone);
    params.append('type', type);

    logger.info('ECV ValidateOTP: calling Experian', { phone: phone?.slice(-4) });

    logCurl({
      label: 'ECV ValidateOTP',
      method: 'POST',
      url,
      headers,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: params,
    });

    try {
      const response = await axios.post(url, params, {
        headers,
        timeout: 30000,
      });

      const data = response.data;

      logger.info('ECV ValidateOTP: success', { hasScore: !!data?.score });

      const parsed = { success: true, creditScore: data?.score || data?.creditScore || null };
      finalize({ statusCode: response.status, rawResponse: data, parsedResponse: parsed });

      return {
        success: true,
        creditScore: data?.score || data?.creditScore || null,
        creditReportData: data,
        rawResponse: data,
      };
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      logger.error('ECV ValidateOTP failed', { status, responseData, message: error.message });
      finalize({ statusCode: status, rawResponse: responseData, error: error.message });
      if (status === 401) experianTokenService.invalidateToken();
      throw new Error(`ECV OTP validation failed (HTTP ${status || 'N/A'}): ${responseData?.errorString || error.message}`);
    }
  }

  async onDemandRefresh({ hitId }) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}/ecs/ecv-api/v1/ondemand-refresh`;

    const params = new URLSearchParams();
    params.append('clientName', this.getClientName());
    params.append('hitId', hitId);

    logger.info('ECV OnDemandRefresh: calling Experian', { hitId });

    logCurl({
      label: 'ECV OnDemandRefresh',
      method: 'POST',
      url,
      headers,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: params,
    });

    try {
      const response = await axios.post(url, params, {
        headers,
        timeout: 30000,
      });

      logger.info('ECV OnDemandRefresh: success');

      const parsed = { success: true, creditScore: response.data?.score || response.data?.creditScore || null };
      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: parsed });

      return {
        success: true,
        creditScore: response.data?.score || response.data?.creditScore || null,
        creditReportData: response.data,
        rawResponse: response.data,
      };
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      logger.error('ECV OnDemandRefresh failed', { status, responseData, message: error.message });
      finalize({ statusCode: status, rawResponse: responseData, error: error.message });
      if (status === 401) experianTokenService.invalidateToken();
      throw new Error(`ECV on-demand refresh failed (HTTP ${status || 'N/A'}): ${responseData?.errorString || error.message}`);
    }
  }

  async generateMaskedMobile({ stgOneHitId, stgTwoHitId }) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}/ecs/ecv-api/v1/generate-masked-mobile`;

    const params = new URLSearchParams();
    params.append('stgOneHitId', stgOneHitId);
    params.append('stgTwoHitId', stgTwoHitId);
    params.append('clientName', this.getClientName());

    logger.info('ECV GenerateMaskedMobile: calling Experian');

    logCurl({
      label: 'ECV GenerateMaskedMobile',
      method: 'POST',
      url,
      headers,
      body: params,
      contentType: 'form-urlencoded',
    });

    const { finalize } = logApiCall({
      service: 'Experian ECV',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: params,
    });

    try {
      const response = await axios.post(url, params, {
        headers,
        timeout: 30000,
      });

      logger.info('ECV GenerateMaskedMobile: success');

      const parsed = { success: true, maskedMobiles: response.data?.maskedMobileNumbers || response.data?.maskedMobiles || [] };
      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: parsed });

      return {
        success: true,
        maskedMobiles: response.data?.maskedMobileNumbers || response.data?.maskedMobiles || [],
        rawResponse: response.data,
      };
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      logger.error('ECV GenerateMaskedMobile failed', { status, responseData, message: error.message });
      finalize({ statusCode: status, rawResponse: responseData, error: error.message });
      if (status === 401) experianTokenService.invalidateToken();
      throw new Error(`ECV masked mobile generation failed (HTTP ${status || 'N/A'}): ${responseData?.errorString || error.message}`);
    }
  }
}

export const experianEcvService = new ExperianEcvService();
