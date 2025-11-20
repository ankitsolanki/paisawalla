import axios from 'axios';
import { logger } from '../utils/logger.js';

const BRE_API_URL = process.env.BRE_API_URL;
const BRE_API_KEY = process.env.BRE_API_KEY;
const USE_BRE_STUB = process.env.USE_BRE_STUB !== 'false'; // Default to true (stub mode)

// Store stub status progression for each request
const stubStatusStore = new Map();

class BreService {
  async initiateRequest(application) {
    try {
      // Transform application data to BRE service format
      const payload = this.transformApplicationToBreFormat(application);

      // STUB MODE: Return random requestId and simulate BRE processing
      if (USE_BRE_STUB || !BRE_API_URL) {
        const requestId = `BRE-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
        
        // Get phone number from payload to determine if we should always generate offers
        const phoneNumber = payload?.phone || '';
        // Extract last digit - handle both string and number, remove all non-digits first
        const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
        const lastDigit = digitsOnly.length > 0 ? digitsOnly.slice(-1) : '';
        const phoneEndsInEven = lastDigit && !isNaN(parseInt(lastDigit, 10)) && parseInt(lastDigit, 10) % 2 === 0;
        
        // Initialize stub status progression
        // Status will progress: initiated -> processing -> completed/failed
        // If phone ends in even digit, always complete successfully
        const willComplete = phoneEndsInEven || Math.random() > 0.1; // 90% success rate, or 100% if even phone
        
        const statusProgression = {
          requestId,
          currentStep: 0,
          phoneEndsInEven, // Store for later use
          steps: [
            { status: 'initiated', delay: 0 },
            { status: 'processing', delay: 1000 }, // 1 second (reduced for testing)
            // Complete or fail based on phone number or random
            { 
              status: willComplete ? 'completed' : 'failed',
              delay: 2000 + Math.random() * 2000, // 2-4 seconds (reduced for testing)
            },
          ],
          startTime: Date.now(),
          payload,
        };
        
        stubStatusStore.set(requestId, statusProgression);
        
        logger.info('BRE stub: Request initiated', {
          requestId,
          applicationId: application._id,
          phoneNumber: phoneNumber,
          phoneEndsInEven,
          willAlwaysGetOffers: phoneEndsInEven,
        });

        return {
          requestId,
          payload,
        };
      }

      // REAL MODE: Make actual API call
      const response = await axios.post(
        `${BRE_API_URL}/requests`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${BRE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return {
        requestId: response.data.requestId,
        payload,
      };
    } catch (error) {
      logger.error('BRE service error', {
        error: error.message,
        stack: error.stack,
        applicationId: application?._id,
        isTimeout: error.code === 'ECONNABORTED',
      });
      throw new Error(`Failed to initiate BRE request: ${error.message}`);
    }
  }

  async checkStatus(breRequestId) {
    try {
      // STUB MODE: Return simulated status progression
      if (USE_BRE_STUB || !BRE_API_URL) {
        const statusProgression = stubStatusStore.get(breRequestId);
        
        if (!statusProgression) {
          // Request not found - could be expired or invalid
          return {
            status: 'failed',
            response: null,
            error: 'BRE request not found',
          };
        }

        const now = Date.now();
        const elapsed = now - statusProgression.startTime;
        let currentStatus = 'initiated';

        // Progress through status steps based on elapsed time
        for (let i = 0; i < statusProgression.steps.length; i++) {
          const step = statusProgression.steps[i];
          const stepStartTime = statusProgression.steps
            .slice(0, i)
            .reduce((sum, s) => sum + s.delay, 0);
          
          if (elapsed >= stepStartTime) {
            currentStatus = step.status;
            statusProgression.currentStep = i;
          } else {
            break;
          }
        }

        // Generate random mock response for completed status
        let response = null;
        if (currentStatus === 'completed') {
          // Always generate offers if phone ends in even digit, otherwise 90% chance
          // Also ensure we always generate at least 1 offer for even phone numbers
          const hasOffers = statusProgression.phoneEndsInEven || Math.random() > 0.1;
          const offerCount = statusProgression.phoneEndsInEven 
            ? Math.max(2, Math.floor(Math.random() * 5) + 1) // At least 2 offers for even phone
            : Math.floor(Math.random() * 5) + 1; // 1-5 offers otherwise
          
          response = {
            eligible: hasOffers,
            offers: hasOffers ? this.generateMockOffers(offerCount) : [],
            creditScore: 600 + Math.floor(Math.random() * 200), // 600-800
            riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            decision: hasOffers ? 'approved' : 'pending',
          };
        }

        logger.info('BRE stub: Status checked', {
          breRequestId,
          status: currentStatus,
          elapsed: `${elapsed}ms`,
          hasOffers: currentStatus === 'completed' && response?.offers?.length > 0,
          phoneEndsInEven: statusProgression.phoneEndsInEven,
          offerCount: currentStatus === 'completed' && response?.offers ? response.offers.length : 0,
          phoneNumber: statusProgression.payload?.phone,
        });

        return {
          status: currentStatus,
          response,
          error: currentStatus === 'failed' ? 'Simulated BRE failure' : null,
        };
      }

      // REAL MODE: Make actual API call
      const response = await axios.get(
        `${BRE_API_URL}/requests/${breRequestId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${BRE_API_KEY}`,
          },
          timeout: 10000, // 10 second timeout
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
        stack: error.stack,
        breRequestId,
        isTimeout: error.code === 'ECONNABORTED',
      });
      throw new Error(`Failed to check BRE status: ${error.message}`);
    }
  }

  /**
   * Generate mock offers for stub mode
   * @param {number} count - Number of offers to generate (default: random 1-5)
   */
  generateMockOffers(count = null) {
    const offerCount = count || Math.floor(Math.random() * 5) + 1; // 1-5 offers
    const offers = [];
    
    const lenderNames = [
      'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra Bank',
      'Bajaj Finserv', 'Fullerton India', 'IDFC First Bank', 'Tata Capital', 'Aditya Birla Capital',
      'IndusInd Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank'
    ];
    
    const allFeatures = [
      'Quick response', 'Fast funding process', 'Easy online application',
      'No prepayment penalty', 'Flexible terms', 'Competitive rates',
      'No processing fees', 'Same-day approval', '24/7 customer support',
      'Minimal documentation', 'Flexible EMI options', 'Quick disbursal'
    ];
    
    const allPros = [
      'No processing fees', 'Get responses in minutes', 'Fast approval',
      'Competitive interest rates', 'Flexible repayment', 'No hidden charges',
      'Quick loan disbursal', 'Minimal documentation', 'Online application'
    ];
    
    const allCons = [
      'High credit score required', 'Limited loan amounts',
      'Strict eligibility criteria', 'Processing time may vary'
    ];

    for (let i = 0; i < offerCount; i++) {
      // Indian loan amounts in INR (lakhs converted to actual amount)
      const baseAmountLakhs = [1, 2, 3, 5, 7, 10, 15, 20, 25, 50][Math.floor(Math.random() * 10)];
      const baseAmount = baseAmountLakhs * 100000; // Convert lakhs to actual amount
      const apr = 8 + Math.random() * 20; // 8-28% APR (typical Indian personal loan rates)
      const term = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)]; // 1-5 years
      const minCreditScore = [650, 670, 680, 700, 720, 750][Math.floor(Math.random() * 6)]; // Indian credit score range
      const rating = 4.0 + Math.random() * 1.0; // 4.0-5.0 rating
      const reviewCount = Math.floor(Math.random() * 5000) + 500; // More reviews for popular banks
      
      // Select random features, pros, and cons
      const shuffledFeatures = [...allFeatures].sort(() => 0.5 - Math.random());
      const shuffledPros = [...allPros].sort(() => 0.5 - Math.random());
      const shuffledCons = [...allCons].sort(() => 0.5 - Math.random());
      
      const features = shuffledFeatures.slice(0, Math.floor(Math.random() * 4) + 2);
      const pros = shuffledPros.slice(0, Math.floor(Math.random() * 3) + 1);
      const cons = shuffledCons.slice(0, Math.floor(Math.random() * 2) + 1);
      
      // Calculate monthly payment
      const monthlyRate = apr / 100 / 12;
      const monthlyPayment = baseAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      
      const maxApr = apr + Math.random() * 3; // Max APR slightly higher
      
      offers.push({
        id: `OFFER-${Date.now()}-${i}`,
        lender: lenderNames[i % lenderNames.length],
        lenderName: lenderNames[i % lenderNames.length],
        amount: baseAmount,
        loanAmount: baseAmount,
        apr: parseFloat(apr.toFixed(2)),
        interestRate: parseFloat(apr.toFixed(2)),
        aprRange: `${parseFloat(apr.toFixed(2))} - ${parseFloat(maxApr.toFixed(2))}%`,
        term: term,
        termMonths: term,
        monthlyPayment: Math.round(monthlyPayment),
        minCreditScore: minCreditScore,
        rating: parseFloat(rating.toFixed(1)),
        reviewCount: reviewCount,
        features: features,
        pros: pros,
        cons: cons,
        offerType: 'standard',
        status: 'available',
      });
    }

    // Sort by APR (lowest first)
    return offers.sort((a, b) => a.apr - b.apr);
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

