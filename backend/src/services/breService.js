import axios from 'axios';
import { logger } from '../utils/logger.js';

const BRE_API_URL = process.env.BRE_API_URL;
const BRE_API_KEY = process.env.BRE_API_KEY;

class BreService {
  async initiateRequest(application) {
    try {
      // Transform application data to BRE service format
      const payload = this.transformApplicationToBreFormat(application);

      const response = await axios.post(
        `${BRE_API_URL}/requests`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${BRE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        requestId: response.data.requestId,
        payload,
      };
    } catch (error) {
      logger.error('BRE service error', {
        error: error.message,
        applicationId: application._id,
      });
      throw new Error('Failed to initiate BRE request');
    }
  }

  async checkStatus(breRequestId) {
    try {
      const response = await axios.get(
        `${BRE_API_URL}/requests/${breRequestId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${BRE_API_KEY}`,
          },
        }
      );

      return {
        status: response.data.status,
        response: response.data.result,
        error: response.data.error,
      };
    } catch (error) {
      logger.error('BRE status check error', {
        error: error.message,
        breRequestId,
      });
      throw new Error('Failed to check BRE status');
    }
  }

  transformApplicationToBreFormat(application) {
    const lead = application.leadId;
    
    return {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      dateOfBirth: lead.dateOfBirth,
      address: lead.address,
      employmentStatus: lead.employmentStatus,
      monthlyIncome: lead.monthlyIncome,
      loanAmount: lead.loanAmount,
      loanPurpose: lead.loanPurpose,
      creditScore: lead.creditScore,
    };
  }
}

export const breService = new BreService();

