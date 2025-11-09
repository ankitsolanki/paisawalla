import axios from 'axios';
import { logger } from '../utils/logger.js';

const BUREAU_API_URL = process.env.BUREAU_API_URL;
const BUREAU_API_KEY = process.env.BUREAU_API_KEY;

class BureauService {
  async fetchCreditReport(ssn, dateOfBirth) {
    try {
      const response = await axios.post(
        `${BUREAU_API_URL}/credit-report`,
        {
          ssn,
          dateOfBirth,
        },
        {
          headers: {
            'Authorization': `Bearer ${BUREAU_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Bureau service error', {
        error: error.message,
      });
      throw new Error('Failed to fetch credit report');
    }
  }

  async validateIdentity(identityData) {
    try {
      const response = await axios.post(
        `${BUREAU_API_URL}/identity-verification`,
        identityData,
        {
          headers: {
            'Authorization': `Bearer ${BUREAU_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Identity validation error', {
        error: error.message,
      });
      throw new Error('Failed to validate identity');
    }
  }
}

export const bureauService = new BureauService();

