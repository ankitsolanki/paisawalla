import mongoose from 'mongoose';
import { BreSession } from '../models/BreSession.js';
import { Application } from '../models/Application.js';
import { Lead } from '../models/Lead.js';
import { Offer } from '../models/Offer.js';
import { EcvSession } from '../models/EcvSession.js';
import { breService } from '../services/breService.js';
import { lenderRuleEngine } from '../services/lenderRuleEngine.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

function parseLoanAmount(raw) {
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const str = raw.toString().toLowerCase();
  const numMatch = str.match(/([\d.]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1]);
  if (str.includes('lakh') || str.includes('lac')) return num * 100000;
  if (str.includes('crore') || str.includes('cr')) return num * 10000000;
  if (str.includes('k') || str.includes('thousand')) return num * 1000;
  return num;
}

function parseTenureMonths(raw) {
  if (!raw) return 36;
  if (typeof raw === 'number') return raw;
  const str = raw.toString().toLowerCase();
  const numMatch = str.match(/([\d.]+)/);
  if (!numMatch) return 36;
  const num = parseInt(numMatch[1], 10);
  if (str.includes('year')) return num * 12;
  return num;
}

function parseRoi(raw) {
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const str = raw.toString();
  const numMatch = str.match(/([\d.]+)/);
  if (!numMatch) return 0;
  return parseFloat(numMatch[1]);
}

function calculateEmi(principal, annualRate, tenureMonths) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.round(principal / tenureMonths);
  const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

const createOffersFromBre = async (applicationId, lenders) => {
  const existingOffers = await Offer.find({ applicationId });
  if (existingOffers.length > 0) {
    logger.info('[ELIGIBILITY] Offers already exist, skipping creation', { applicationId });
    return existingOffers;
  }

  const approvedLenders = lenders.filter((l) => l.isApproved);
  if (approvedLenders.length === 0) return [];

  const offers = [];
  for (const lender of approvedLenders) {
    const parsedAmount = parseLoanAmount(lender.loanAmount);
    const parsedTenure = parseTenureMonths(lender.tenure);
    const parsedRoi = parseRoi(lender.roi);
    const monthlyPayment = calculateEmi(parsedAmount, parsedRoi, parsedTenure);

    const offer = new Offer({
      applicationId,
      lenderId: `LENDER-${lender.name?.replace(/\s+/g, '-')?.toUpperCase()}`,
      lenderName: lender.name,
      loanAmount: parsedAmount,
      interestRate: parsedRoi,
      termMonths: parsedTenure,
      monthlyPayment,
      apr: parsedRoi,
      offerType: 'standard',
      status: 'available',
      offerData: {
        rawLoanAmount: lender.loanAmount,
        rawTenure: lender.tenure,
        rawRoi: lender.roi,
        decisionText: lender.decisionText,
        decisionCategory: lender.decisionCategory,
        reasonCodes: lender.reasonCodes,
        reasonDescriptions: lender.reasonDescriptions,
      },
    });
    await offer.save();
    offers.push(offer);
  }

  return offers;
};

const createOffersFromRuleEngine = async (applicationId, eligibleLenders) => {
  const existingOffers = await Offer.find({ applicationId });
  if (existingOffers.length > 0) {
    logger.info('[ELIGIBILITY] Offers already exist, skipping creation', { applicationId });
    return existingOffers;
  }

  if (!eligibleLenders || eligibleLenders.length === 0) return [];

  const offers = [];
  for (const lender of eligibleLenders) {
    const loanAmount = lender.maxLoanAmount || 500000;
    const tenure = lender.maxTenureMonths || 36;
    const roi = lender.minRoi || 12;
    const monthlyPayment = calculateEmi(loanAmount, roi, tenure);
    const offerType = lender.isFallback ? 'fallback' : 'standard';

    const offer = new Offer({
      applicationId,
      lenderId: `LENDER-${(lender.displayName || lender.lender)?.replace(/\s+/g, '-')?.toUpperCase()}`,
      lenderName: lender.displayName || lender.lender,
      loanAmount,
      interestRate: roi,
      termMonths: tenure,
      monthlyPayment,
      apr: roi,
      offerType,
      status: 'available',
      offerData: {
        source: 'rule_engine',
        decisionText: `Eligible via credit check`,
        isFallback: lender.isFallback || false,
      },
    });
    await offer.save();
    offers.push(offer);
  }

  return offers;
};

const runBreEligibility = async (application, lead) => {
  const applicationId = application._id.toString();

  let firstName = lead.firstName || '';
  let lastName = lead.lastName || '';
  if (!firstName && lead.fullName) {
    const nameParts = lead.fullName.trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  const applicantData = {
    firstName,
    lastName,
    dateOfBirth: lead.dateOfBirth,
    phone: lead.phone,
    email: lead.email || lead.companyEmail,
    pan: lead.pan || lead.panNumber,
    gender: lead.gender,
    maritalStatus: lead.maritalStatus,
    employmentStatus: lead.employmentStatus || lead.employmentType,
    grossIncome: lead.monthlyIncome || lead.grossIncome || lead.netMonthlyIncome,
    takeHomeSalary: lead.takeHomeSalary || lead.netMonthlyIncome,
    employerName: lead.employerName || lead.companyName || lead.organizationName,
    loanAmount: lead.loanAmount,
    loanTenure: lead.loanTenure,
    loanPurpose: lead.loanPurpose,
    pincode: lead.address?.zipCode || lead.pincode || lead.pinCode,
    addressLine1: lead.address?.street || lead.currentAddress || lead.address,
    city: lead.address?.city || lead.city,
    state: lead.address?.state || lead.state,
    bankAccountNumber: lead.bankAccountNumber,
    ifscCode: lead.ifscCode,
    bankName: lead.bankName,
  };

  logger.info('[ELIGIBILITY] Running BRE check', {
    applicationId,
    hasName: !!(applicantData.firstName || applicantData.lastName),
    hasDob: !!applicantData.dateOfBirth,
    hasPhone: !!applicantData.phone,
    hasPan: !!applicantData.pan,
    hasEmployment: !!applicantData.employmentStatus,
    hasIncome: !!applicantData.grossIncome,
    hasPincode: !!applicantData.pincode,
  });

  const breResult = await breService.submitNewApp(applicantData);

  const breSession = new BreSession({
    applicationId,
    correlationId: breResult.correlationId,
    serviceContextId: breResult.serviceContextId,
    experianApplicationId: breResult.parsedResult?.application?.applicationId,
    status: 'completed',
    requestPayload: breResult.requestPayload,
    responsePayload: breResult.rawResponse,
    parsedResult: breResult.parsedResult,
    completedAt: new Date(),
  });
  await breSession.save();

  application.breStatus = 'completed';
  application.breCompletedAt = new Date();
  await application.save();

  const lenders = breResult.parsedResult?.lenders || [];
  const offers = await createOffersFromBre(applicationId, lenders);

  const creditScore = breResult.parsedResult?.creditReport?.score;

  logger.info('[ELIGIBILITY] BRE check completed', {
    applicationId,
    totalLenders: breResult.parsedResult?.lenders?.length,
    approvedLenders: breResult.parsedResult?.lenders?.filter((l) => l.isApproved).length,
    offersCreated: offers.length,
    creditScore,
  });

  return { offers, creditScore };
};

const runRuleEngineEligibility = async (application, lead) => {
  const applicationId = application._id.toString();

  logger.info('[ELIGIBILITY] Running rule engine fallback', { applicationId });

  let creditScore = lead.creditScore || null;
  let creditScoreSource = 'lead';

  if (!creditScore) {
    const ecvSession = await EcvSession.findOne({
      $or: [
        { leadId: lead._id },
        { phone: lead.phone },
      ],
      status: 'verified',
    }).sort({ createdAt: -1 });

    if (ecvSession && ecvSession.creditScore) {
      creditScore = ecvSession.creditScore;
      creditScoreSource = 'ecv_session';
    }
  }

  if (!creditScore) {
    creditScore = 650;
    creditScoreSource = 'default';
    logger.warn('[ELIGIBILITY] No credit score available, using default 650', { applicationId });
  }

  const applicantData = {
    dateOfBirth: lead.dateOfBirth,
    employmentStatus: lead.employmentStatus || lead.employmentType,
    grossIncome: lead.monthlyIncome || lead.grossIncome || lead.netMonthlyIncome,
    creditScore,
    pincode: String(lead.address?.zipCode || lead.pincode || lead.pinCode || ''),
    bureauData: null,
  };

  const result = await lenderRuleEngine.evaluateApplicant(applicantData);

  logger.info('[ELIGIBILITY] Rule engine evaluation complete', {
    applicationId,
    creditScore,
    creditScoreSource,
    totalEligible: result.eligible?.length || 0,
    totalIneligible: result.ineligible?.length || 0,
  });

  const offers = await createOffersFromRuleEngine(applicationId, result.eligible);

  application.breStatus = 'rule_engine_fallback';
  await application.save();

  return { offers, creditScore };
};

export const checkEligibility = async (req, res, next) => {
  try {
    const { leadId } = req.body;

    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json(
        buildErrorResponse('Valid leadId is required', null, 400)
      );
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json(
        buildErrorResponse('Lead not found', null, 404)
      );
    }

    logger.info('[ELIGIBILITY] Starting eligibility check', {
      leadId,
      phone: lead.phone ? `***${lead.phone.slice(-4)}` : 'none',
      formType: lead.formType,
    });

    let application = await Application.findOne({ leadId });
    if (!application) {
      const count = await Application.countDocuments();
      const applicationNumber = `APP-${Date.now()}-${count + 1}`;
      application = new Application({
        leadId,
        applicationNumber,
        applicationData: lead.toObject(),
        status: 'pending',
      });
      await application.save();
      lead.status = 'application_created';
      await lead.save();
      logger.info('[ELIGIBILITY] Application created', {
        applicationId: application._id,
        applicationNumber,
      });
    } else {
      logger.info('[ELIGIBILITY] Using existing application', {
        applicationId: application._id,
      });
    }

    const applicationId = application._id.toString();

    let offers = [];
    let creditScore = null;

    try {
      const breResult = await runBreEligibility(application, lead);
      offers = breResult.offers;
      creditScore = breResult.creditScore;
    } catch (breError) {
      logger.warn('[ELIGIBILITY] BRE failed, falling back to rule engine', {
        applicationId,
        error: breError.message,
      });

      try {
        const fallbackResult = await runRuleEngineEligibility(application, lead);
        offers = fallbackResult.offers;
        creditScore = fallbackResult.creditScore;
      } catch (fallbackError) {
        logger.error('[ELIGIBILITY] Rule engine fallback also failed', {
          applicationId,
          error: fallbackError.message,
        });
      }
    }

    application.status = offers.length > 0 ? 'offers_available' : 'bre_completed';
    await application.save();

    logger.info('[ELIGIBILITY] Check complete', {
      applicationId,
      offersCount: offers.length,
      creditScore,
    });

    res.status(200).json(
      buildResponse({
        applicationId,
        offersCount: offers.length,
        offers: offers.map(o => ({
          lenderName: o.lenderName,
          loanAmount: o.loanAmount,
          interestRate: o.interestRate,
          termMonths: o.termMonths,
          monthlyPayment: o.monthlyPayment,
          offerType: o.offerType,
        })),
      }, 'Eligibility check completed')
    );
  } catch (error) {
    logger.error('[ELIGIBILITY] Unexpected error', {
      error: error.message,
      stack: error.stack,
      leadId: req.body?.leadId,
    });
    next(error);
  }
};
