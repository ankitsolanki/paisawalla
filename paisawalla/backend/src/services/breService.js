import axios from 'axios';
import crypto from 'crypto';
import { breTokenService } from './breTokenService.js';
import { logger } from '../utils/logger.js';
import { logCurl } from '../utils/curlLogger.js';
import { logApiCall } from '../utils/apiLogger.js';

class BreService {
  getBaseUrl() {
    return process.env.EXPERIAN_BRE_BASE_URL || 'https://in-api.experian.com';
  }

  getBpsBasePath() {
    return process.env.EXPERIAN_BRE_PATH || '/decisionanalytics/experianone/nps6t36gvswc/services';
  }

  getUserDomain() {
    return process.env.EXPERIAN_USER_DOMAIN || 'theunimobile.com';
  }

  async _getAuthHeaders() {
    const token = await breTokenService.getToken();
    const cookieString = breTokenService.getCookieString();

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-correlation-id': crypto.randomUUID(),
      'x-user-domain': this.getUserDomain(),
      'X-Screenless-Kill-Null': 'true',
      'traceLevel': '31',
    };

    if (cookieString) {
      headers['Cookie'] = cookieString;
    }

    return headers;
  }

  buildNewAppPayload(applicantData) {
    const {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email,
      pan,
      gender,
      maritalStatus,
      employmentStatus,
      grossIncome,
      takeHomeSalary,
      employerName,
      employerType,
      employmentType,
      loanAmount,
      loanTenure,
      loanPurpose,
      pincode,
      addressLine1,
      addressLine2,
      city,
      state,
      bankAccountNumber,
      ifscCode,
      bankName,
    } = applicantData;

    const dobFormatted = dateOfBirth ? this._formatDate(dateOfBirth) : '';

    return {
      'DV-Application': {
        ServiceID: 'NewApp',
      },
      'DV-Applicant': {
        Applicant: [
          {
            ApplicantType: 'Primary',
            ApplicantCategory: 'Individual',
            ExistingCustomer: 'N',
            Title: (() => { const g = String(gender || '').toLowerCase(); return g === 'female' || g === 'f' || g === '2' ? 'Ms.' : 'Mr.'; })(),
            FirstName: firstName || '',
            MiddleName: '',
            LastName: lastName || '',
            DateOfBirth: dobFormatted,
            Gender: this._mapGender(gender),
            MaritalStatus: maritalStatus || '',
            ResidentStatus: '',
            EducationLevel: '',
            PhoneOffice: '',
            PhoneMobile: phone || '',
            EmailId: email || '',
            BankAccount: [
              {
                AccountType: 'S',
                AccountNumber: bankAccountNumber || '',
                IFSCCode: ifscCode || '',
                BankName: bankName || '',
              },
            ],
            Address: [
              {
                AddressCategory: '',
                AddressType: '',
                AddressLine1: addressLine1 || '',
                AddressLine2: addressLine2 || '',
                AddressLine3: '',
                Landmark: '',
                City: city || '',
                Pincode: pincode || '',
                State: this._mapState(state),
              },
            ],
            Identification: [
              {
                IdentificationType: pan ? 'PAN' : '',
                IdentificationNumber: pan || '',
              },
            ],
            Employment: [
              {
                EmployerType: employerType || '',
                EmploymentStatus: this._mapEmploymentStatus(employmentStatus),
                EmploymentType: employmentType || '',
                EmployerName: employerName || '',
                GrossIncome: grossIncome ? Number(grossIncome) : null,
                TakeHomeSalary: takeHomeSalary ? Number(takeHomeSalary) : null,
              },
            ],
          },
        ],
      },
      'DV-Product': {
        Product: [
          {
            ProductType: 'PL',
            ProductID: 'PL',
            AppliedAmount: loanAmount ? Number(loanAmount) : null,
            TenureMonths: loanTenure || null,
            PurposeOfLoan: loanPurpose || '',
            LTV: 0,
          },
        ],
      },
      'DV-Collateral': {
        Collateral: [
          {
            CollateralType: '',
            AssetCost: null,
            AssetType: '',
            ManufacturerCode: 0,
            Manufacturer: '',
            MakeCode: '',
            Make: '',
            Model: '',
          },
        ],
      },
    };
  }

  async submitNewApp(applicantData) {
    const headers = await this._getAuthHeaders();
    const correlationId = headers['X-Correlation-Id'];
    const payload = this.buildNewAppPayload(applicantData);
    const url = `${this.getBaseUrl()}${this.getBpsBasePath()}/v1/applications/NewApp`;

    logger.info('BRE NewApp: submitting to Experian', {
      url,
      correlationId,
      phone: applicantData.phone?.slice(-4),
    });

    logCurl({
      label: 'BRE NewApp',
      method: 'POST',
      url,
      headers,
      body: payload,
    });

    const { finalize } = logApiCall({
      service: 'Experian BRE',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: payload,
    });

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 60000,
      });

      const data = response.data;

      logger.info('BRE NewApp: response received', {
        correlationId,
        serviceContextId: data?.serviceContextId,
        applicationId: data?.data?.['DV-Application']?.ApplicationID,
        applicationStatus: data?.data?.['DV-Application']?.ApplicationStatus,
      });

      const parsed = this.parseNewAppResponse(data);
      finalize({ statusCode: response.status, rawResponse: data, parsedResponse: parsed });

      return {
        success: true,
        correlationId,
        serviceContextId: data?.serviceContextId,
        requestPayload: payload,
        rawResponse: data,
        parsedResult: parsed,
      };
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      logger.error('BRE NewApp failed', {
        correlationId,
        status,
        responseData,
        message: error.message,
      });

      finalize({ statusCode: status, rawResponse: responseData, error: error.message });

      if (status === 401) {
        breTokenService.invalidateToken();
      }

      throw new Error(`BRE NewApp failed (HTTP ${status || 'N/A'}): ${responseData?.error?.message || error.message}`);
    }
  }

  parseNewAppResponse(responseData) {
    const data = responseData?.data;
    if (!data) {
      return { application: null, lenders: [], creditReport: null };
    }

    const dvApp = data['DV-Application'] || {};
    const dvApplicant = data['DV-Applicant']?.Applicant?.[0] || {};
    const dvCreditReport = data['DV-CreditReport']?.Applicant?.[0]?.CreditReport?.[0] || {};
    const lenderEligibility = dvApplicant.LenderEligibility || [];

    const application = {
      applicationId: dvApp.ApplicationID,
      status: dvApp.ApplicationStatus,
      stage: dvApp.ApplicationStage,
      strategyName: dvApp.StrategyName,
      creationDate: dvApp.ApplicationCreationDate,
      systemDecisionDate: dvApp.SystemDecisionDate,
      errorCount: parseInt(dvApp.ErrorCount || '0', 10),
      incompleteFlag: dvApp.IncompleteFlag,
      executedProcesses: dvApp.ExecutedProcessName || [],
      executedProcessStatuses: dvApp.ExecutedProcessStatus || [],
      bureauCalled: dvApp.ExecutedBureauCalled || [],
      bureauStatus: dvApp.ExecutedBureauCalledStatus || [],
    };

    const creditReport = {
      bureauCalled: dvCreditReport.BureauCalled || null,
      ntcFlag: dvCreditReport.NTCFlag || null,
      score: parseInt(dvCreditReport.Bureau_Score || '0', 10) || null,
      delinquencies: {
        nbr0_3m: parseInt(dvCreditReport.Nbr_Prod_0_3m_All || '0', 10),
        nbr60_24m: parseInt(dvCreditReport.Nbr_Prod_60_24m_All || '0', 10),
        nbr90_12m: parseInt(dvCreditReport.Nbr_Prod_90_12m_ALL || '0', 10),
        nbr30_12m: parseInt(dvCreditReport.Nbr_Prod_30_12M_All || '0', 10),
      },
    };

    const lenders = lenderEligibility.map((lender) => {
      const decision = lender.Decision || {};
      return {
        name: lender.Name,
        loanAmount: lender.LoanAmount || null,
        tenure: lender.Tenure || null,
        roi: lender.ROI || null,
        decisionText: decision.DecisionText,
        decisionCategory: decision.DecisionCategory,
        reasonCodes: (decision.SortedReasonCodeTable || []).filter(Boolean),
        reasonDescriptions: (decision.ReasonCodeDescription || []).filter(Boolean),
        isApproved: decision.DecisionCategory === 'Approve',
        isIneligible: decision.DecisionCategory === 'Ineligible',
      };
    });

    return { application, lenders, creditReport };
  }

  async continueApp(applicationId, additionalData) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}${this.getBpsBasePath()}/v1/applications/update/ContinueApp`;

    const payload = {
      'DV-Application': {
        ServiceID: 'ContinueApp',
      },
      'WorkingStorage': {
        SearchFields: {
          ApplicationID: applicationId,
        },
      },
      ...additionalData,
    };

    logger.info('BRE ContinueApp: submitting', { applicationId });

    logCurl({
      label: 'BRE ContinueApp',
      method: 'POST',
      url,
      headers,
      body: payload,
    });

    const { finalize } = logApiCall({
      service: 'Experian BRE',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: payload,
    });

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 60000,
      });

      logger.info('BRE ContinueApp: response received', {
        applicationId,
        serviceContextId: response.data?.serviceContextId,
      });

      const parsed = this.parseNewAppResponse(response.data);
      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: parsed });

      return {
        success: true,
        rawResponse: response.data,
        parsedResult: parsed,
      };
    } catch (error) {
      const status = error.response?.status;
      logger.error('BRE ContinueApp failed', { applicationId, status, message: error.message });
      finalize({ statusCode: status, rawResponse: error.response?.data, error: error.message });
      if (status === 401) breTokenService.invalidateToken();
      throw new Error(`BRE ContinueApp failed: ${error.message}`);
    }
  }

  async customerDecision(applicationId, decision, remarks) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}${this.getBpsBasePath()}/v1/applications/update/CustomerDecision`;

    const payload = {
      'DV-Application': {
        ServiceID: 'CustomerDecision',
      },
      'WorkingStorage': {
        SearchFields: {
          ApplicationID: applicationId,
        },
        ManualDecision: decision,
        ManualDecisionRemarks: remarks || '',
      },
    };

    logger.info('BRE CustomerDecision: submitting', { applicationId, decision });

    logCurl({
      label: 'BRE CustomerDecision',
      method: 'POST',
      url,
      headers,
      body: payload,
    });

    const { finalize } = logApiCall({
      service: 'Experian BRE',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: payload,
    });

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 60000,
      });

      logger.info('BRE CustomerDecision: response received', { applicationId });

      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: { success: true } });

      return {
        success: true,
        rawResponse: response.data,
      };
    } catch (error) {
      const status = error.response?.status;
      logger.error('BRE CustomerDecision failed', { applicationId, status, message: error.message });
      finalize({ statusCode: status, rawResponse: error.response?.data, error: error.message });
      if (status === 401) breTokenService.invalidateToken();
      throw new Error(`BRE CustomerDecision failed: ${error.message}`);
    }
  }

  async queryApplication(applicationId) {
    const headers = await this._getAuthHeaders();
    const url = `${this.getBaseUrl()}${this.getBpsBasePath()}/v1/applications/search/AppQuery`;

    const payload = {
      'DV-Application': {
        ServiceID: 'AppQuery',
      },
      'WorkingStorage': {
        SearchFields: {
          ApplicationID: applicationId,
        },
      },
    };

    logger.info('BRE AppQuery: querying', { applicationId });

    logCurl({
      label: 'BRE AppQuery',
      method: 'POST',
      url,
      headers,
      body: payload,
    });

    const { finalize } = logApiCall({
      service: 'Experian BRE',
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: payload,
    });

    try {
      const response = await axios.post(url, payload, {
        headers,
        timeout: 30000,
      });

      logger.info('BRE AppQuery: response received', { applicationId });

      const parsed = this.parseNewAppResponse(response.data);
      finalize({ statusCode: response.status, rawResponse: response.data, parsedResponse: parsed });

      return {
        success: true,
        rawResponse: response.data,
        parsedResult: parsed,
      };
    } catch (error) {
      const status = error.response?.status;
      logger.error('BRE AppQuery failed', { applicationId, status, message: error.message });
      finalize({ statusCode: status, rawResponse: error.response?.data, error: error.message });
      if (status === 401) breTokenService.invalidateToken();
      throw new Error(`BRE AppQuery failed: ${error.message}`);
    }
  }

  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  _mapGender(gender) {
    if (!gender) return '';
    const g = String(gender).toLowerCase();
    if (g === 'male' || g === 'm' || g === '1') return '1';
    if (g === 'female' || g === 'f' || g === '2') return '2';
    if (g === 'transgender' || g === 'other' || g === '3') return '3';
    return '';
  }

  _mapState(state) {
    if (!state && state !== 0) return '';
    const s = String(state).toLowerCase().trim();
    if (/^\d{1,2}$/.test(s)) return s.padStart(2, '0');
    const map = {
      'jammu and kashmir': '01', 'jammu & kashmir': '01', 'j&k': '01',
      'himachal pradesh': '02',
      'punjab': '03',
      'chandigarh': '04',
      'uttaranchal': '05', 'uttarakhand': '05',
      'haryana': '06',
      'delhi': '07', 'new delhi': '07',
      'rajasthan': '08',
      'uttar pradesh': '09', 'uttarpradesh': '09',
      'bihar': '10',
      'sikkim': '11',
      'arunachal pradesh': '12',
      'nagaland': '13',
      'manipur': '14',
      'mizoram': '15',
      'tripura': '16',
      'meghalaya': '17',
      'assam': '18',
      'west bengal': '19', 'westbengal': '19',
      'jharkhand': '20',
      'orissa': '21', 'odisha': '21',
      'chhattisgarh': '22', 'chattisgarh': '22',
      'madhya pradesh': '23', 'madhyapradesh': '23',
      'gujarat': '24',
      'daman & diu': '25', 'daman and diu': '25', 'daman&diu': '25',
      'dadra and nagar haveli': '26', 'dadra & nagar haveli': '26',
      'maharashtra': '27',
      'andhra pradesh': '28',
      'karnataka': '29',
      'goa': '30',
      'lakshadweep': '31',
      'kerala': '32',
      'tamil nadu': '33', 'tamilnadu': '33',
      'pondicherry': '34', 'puducherry': '34',
      'andaman and nicobar islands': '35', 'andaman & nicobar islands': '35', 'andaman and nicobar': '35',
      'telangana': '36',
      'apo address': '99', 'apo': '99',
    };
    return map[s] || '';
  }

  _mapEmploymentStatus(status) {
    if (!status) return '';
    const map = {
      'employed': 'S',
      'salaried': 'S',
      'self-employed': 'E',
      'self_employed': 'E',
      'selfemployed': 'E',
      'self-employed professional': 'P',
      'self-employed business': 'E',
      'business': 'E',
      'non-salaried': 'N',
      'non_salaried': 'N',
      'nonsalaried': 'N',
      'unemployed': 'N',
      'retired': 'N',
      'student': 'U',
      'homemaker': 'N',
      's': 'S',
      'n': 'N',
      'e': 'E',
      'p': 'P',
      'u': 'U',
    };
    return map[status.toLowerCase()] || 'S';
  }
}

export const breService = new BreService();
