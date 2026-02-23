import { BreSession } from '../models/BreSession.js';
import { Application } from '../models/Application.js';
import { Lead } from '../models/Lead.js';
import { Offer } from '../models/Offer.js';
import { EcvSession } from '../models/EcvSession.js';
import { breService } from '../services/breService.js';
import { lenderRuleEngine } from '../services/lenderRuleEngine.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

const createOffersFromEcvEligibility = async (applicationId, eligibleLenders) => {
  try {
    logger.info('[ECV-FALLBACK] createOffers: Checking for existing offers', { applicationId });
    const existingOffers = await Offer.find({ applicationId });
    if (existingOffers.length > 0) {
      logger.info('[ECV-FALLBACK] createOffers: Offers already exist, skipping', {
        applicationId,
        existingCount: existingOffers.length,
      });
      return existingOffers;
    }

    if (!eligibleLenders || eligibleLenders.length === 0) {
      logger.info('[ECV-FALLBACK] createOffers: No eligible lenders to create offers from', { applicationId });
      return [];
    }

    logger.info('[ECV-FALLBACK] createOffers: Creating offers for eligible lenders', {
      applicationId,
      lenderCount: eligibleLenders.length,
      lenders: eligibleLenders.map(l => l.lender || l.displayName),
    });

    const offers = [];
    for (const lender of eligibleLenders) {
      const loanAmount = lender.maxLoanAmount || 500000;
      const tenure = lender.maxTenureMonths || 36;
      const roi = lender.minRoi || 12;
      const monthlyPayment = calculateEmi(loanAmount, roi, tenure);
      const offerType = lender.isFallback ? 'fallback' : 'standard';

      logger.info('[ECV-FALLBACK] createOffers: Creating offer', {
        applicationId,
        lenderName: lender.displayName || lender.lender,
        loanAmount,
        interestRate: roi,
        termMonths: tenure,
        monthlyPayment,
        offerType,
        isFallback: lender.isFallback || false,
      });

      const offer = new Offer({
        applicationId,
        lenderId: `LENDER-${lender.lender?.replace(/\s+/g, '-')?.toUpperCase()}`,
        lenderName: lender.displayName || lender.lender,
        loanAmount,
        interestRate: roi,
        termMonths: tenure,
        monthlyPayment,
        apr: roi,
        offerType,
        status: 'available',
        offerData: {
          source: 'ecv_fallback',
          decisionText: `Eligible via ECV credit check`,
          isFallback: lender.isFallback || false,
        },
      });
      await offer.save();
      logger.info('[ECV-FALLBACK] createOffers: Offer saved successfully', {
        applicationId,
        offerId: offer._id?.toString(),
        lenderName: offer.lenderName,
      });
      offers.push(offer);
    }

    logger.info('[ECV-FALLBACK] createOffers: All offers created', {
      applicationId,
      offersCreated: offers.length,
    });

    return offers;
  } catch (error) {
    logger.error('[ECV-FALLBACK] createOffers: FAILED', {
      error: error.message,
      applicationId,
      stack: error.stack,
    });
    throw error;
  }
};

const createOffersFromLenders = async (applicationId, lenders) => {
  try {
    const existingOffers = await Offer.find({ applicationId });
    if (existingOffers.length > 0) {
      logger.info('Offers already exist for application, skipping creation', { applicationId });
      return existingOffers;
    }

    const approvedLenders = lenders.filter((l) => l.isApproved);

    if (approvedLenders.length === 0) {
      logger.info('No approved lenders in BRE response', { applicationId });
      return [];
    }

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

    logger.info('Offers created from BRE lender decisions', {
      applicationId,
      totalLenders: lenders.length,
      approvedLenders: approvedLenders.length,
      offersCreated: offers.length,
    });

    return offers;
  } catch (error) {
    logger.error('Error creating offers from lender decisions', {
      error: error.message,
      applicationId,
    });
    throw error;
  }
};

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

export const initiateBreRequest = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json(
        buildErrorResponse('applicationId is required', null, 400)
      );
    }

    const application = await Application.findById(applicationId).populate('leadId');
    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    const existingSession = await BreSession.findOne({
      applicationId,
      status: { $in: ['initiated', 'processing'] },
    });
    if (existingSession) {
      return res.status(409).json(
        buildErrorResponse('BRE request already in progress', null, 409)
      );
    }

    const lead = application.leadId;
    if (!lead) {
      return res.status(400).json(
        buildErrorResponse('Application has no associated lead data', null, 400)
      );
    }

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

    logger.info('BRE applicant data mapped from lead', {
      applicationId,
      formType: lead.formType,
      hasFirstName: !!applicantData.firstName,
      hasLastName: !!applicantData.lastName,
      hasDob: !!applicantData.dateOfBirth,
      hasPhone: !!applicantData.phone,
      hasPan: !!applicantData.pan,
      hasEmployment: !!applicantData.employmentStatus,
      employmentStatus: applicantData.employmentStatus,
      hasIncome: !!applicantData.grossIncome,
      grossIncome: applicantData.grossIncome,
      hasPincode: !!applicantData.pincode,
      pincode: applicantData.pincode,
      hasEmployer: !!applicantData.employerName,
      loanAmount: applicantData.loanAmount,
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

    application.status = 'bre_completed';
    application.breStatus = 'completed';
    application.breCompletedAt = new Date();
    await application.save();

    const offers = await createOffersFromLenders(applicationId, breResult.parsedResult.lenders);

    if (offers.length > 0) {
      application.status = 'offers_available';
      await application.save();
    }

    logger.info('BRE request completed', {
      applicationId,
      experianAppId: breResult.parsedResult?.application?.applicationId,
      totalLenders: breResult.parsedResult?.lenders?.length,
      approvedLenders: breResult.parsedResult?.lenders?.filter((l) => l.isApproved).length,
      offersCreated: offers.length,
      creditScore: breResult.parsedResult?.creditReport?.score,
    });

    res.status(201).json(
      buildResponse({
        breSessionId: breSession._id,
        experianApplicationId: breSession.experianApplicationId,
        status: 'completed',
        creditScore: breResult.parsedResult?.creditReport?.score,
        lenders: breResult.parsedResult?.lenders?.map((l) => ({
          name: l.name,
          decision: l.decisionCategory,
          loanAmount: l.loanAmount,
          tenure: l.tenure,
          roi: l.roi,
          isApproved: l.isApproved,
        })),
        offersCreated: offers.length,
      }, 'BRE request completed successfully')
    );
  } catch (error) {
    logger.error('BRE initiate error', {
      error: error.message,
      stack: error.stack,
    });

    if (req.body.applicationId) {
      try {
        const failedSession = new BreSession({
          applicationId: req.body.applicationId,
          status: 'failed',
          errorMessage: error.message,
        });
        await failedSession.save();
      } catch (_) {}
    }

    next(error);
  }
};

export const checkBreStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json(
        buildErrorResponse('applicationId is required', null, 400)
      );
    }

    const breSession = await BreSession.findOne({ applicationId }).sort({ createdAt: -1 });
    if (!breSession) {
      return res.status(404).json(
        buildErrorResponse('No BRE session found for this application', null, 404)
      );
    }

    let mappedStatus = breSession.status;
    if (mappedStatus === 'completed') mappedStatus = 'complete';
    else if (mappedStatus === 'initiated' || mappedStatus === 'processing') mappedStatus = 'in_progress';

    const offers = await Offer.find({ applicationId, status: 'available' });

    res.status(200).json({
      ok: true,
      status: mappedStatus,
      applicationId: breSession.applicationId?.toString(),
      experianApplicationId: breSession.experianApplicationId,
      completedAt: breSession.completedAt,
      creditScore: breSession.parsedResult?.creditReport?.score || null,
      offersCount: offers.length,
    });
  } catch (error) {
    logger.error('BRE status check error', {
      error: error.message,
    });
    res.status(500).json({
      ok: false,
      code: 'BRE_FAILED',
      message: error.message || 'Failed to check BRE status',
    });
  }
};

export const queryBreApplication = async (req, res, next) => {
  try {
    const { experianApplicationId } = req.params;

    if (!experianApplicationId) {
      return res.status(400).json(
        buildErrorResponse('Experian application ID is required', null, 400)
      );
    }

    const result = await breService.queryApplication(experianApplicationId);

    res.status(200).json(
      buildResponse({
        application: result.parsedResult?.application,
        lenders: result.parsedResult?.lenders,
        creditReport: result.parsedResult?.creditReport,
      }, 'Application query successful')
    );
  } catch (error) {
    logger.error('BRE query error', {
      error: error.message,
    });
    next(error);
  }
};

export const recordCustomerDecision = async (req, res, next) => {
  try {
    const { experianApplicationId, decision, remarks } = req.body;

    if (!experianApplicationId || !decision) {
      return res.status(400).json(
        buildErrorResponse('experianApplicationId and decision are required', null, 400)
      );
    }

    const result = await breService.customerDecision(experianApplicationId, decision, remarks);

    res.status(200).json(
      buildResponse({
        success: true,
      }, 'Customer decision recorded')
    );
  } catch (error) {
    logger.error('BRE customer decision error', {
      error: error.message,
    });
    next(error);
  }
};

export const ecvFallbackEligibility = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    logger.info('[ECV-FALLBACK] Step 1: Request received', {
      applicationId,
      body: req.body,
    });

    if (!applicationId) {
      logger.warn('[ECV-FALLBACK] Missing applicationId in request');
      return res.status(400).json(
        buildErrorResponse('applicationId is required', null, 400)
      );
    }

    logger.info('[ECV-FALLBACK] Step 2: Looking up application and lead data');
    const application = await Application.findById(applicationId).populate('leadId');
    if (!application) {
      logger.warn('[ECV-FALLBACK] Application not found', { applicationId });
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    const lead = application.leadId;
    if (!lead) {
      logger.warn('[ECV-FALLBACK] No lead associated with application', { applicationId });
      return res.status(400).json(
        buildErrorResponse('Application has no associated lead data', null, 400)
      );
    }

    logger.info('[ECV-FALLBACK] Step 3: Lead data retrieved', {
      applicationId,
      leadId: lead._id?.toString(),
      phone: lead.phone ? `***${lead.phone.slice(-4)}` : 'none',
      hasDateOfBirth: !!lead.dateOfBirth,
      employmentStatus: lead.employmentStatus || lead.employmentType || 'not set',
      monthlyIncome: lead.monthlyIncome || lead.grossIncome || lead.netMonthlyIncome || 'not set',
      hasPincode: !!(lead.address?.zipCode || lead.pincode || lead.pinCode),
      pincode: lead.address?.zipCode || lead.pincode || lead.pinCode || 'not set',
      leadCreditScore: lead.creditScore || 'not set',
    });

    let creditScore = lead.creditScore || null;
    let creditScoreSource = 'lead';

    if (!creditScore) {
      logger.info('[ECV-FALLBACK] Step 4: No credit score on lead, checking ECV sessions', {
        applicationId,
        leadId: lead._id?.toString(),
        phone: lead.phone ? `***${lead.phone.slice(-4)}` : 'none',
      });

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
        logger.info('[ECV-FALLBACK] Step 4a: Found credit score from ECV session', {
          applicationId,
          ecvSessionId: ecvSession._id?.toString(),
          creditScore,
          ecvCreatedAt: ecvSession.createdAt,
        });
      } else {
        logger.info('[ECV-FALLBACK] Step 4b: No ECV session found', {
          applicationId,
          ecvSessionFound: !!ecvSession,
          ecvSessionHasScore: ecvSession ? !!ecvSession.creditScore : false,
        });
      }
    } else {
      logger.info('[ECV-FALLBACK] Step 4: Credit score found on lead', {
        applicationId,
        creditScore,
      });
    }

    if (!creditScore) {
      creditScore = 650;
      creditScoreSource = 'default';
      logger.warn('[ECV-FALLBACK] Step 5: No credit score available, using default 650', {
        applicationId,
        defaultScore: creditScore,
      });
    } else {
      logger.info('[ECV-FALLBACK] Step 5: Using credit score', {
        applicationId,
        creditScore,
        source: creditScoreSource,
      });
    }

    const pincode = lead.address?.zipCode || lead.pincode || lead.pinCode;

    const applicantData = {
      dateOfBirth: lead.dateOfBirth,
      employmentStatus: lead.employmentStatus || lead.employmentType,
      grossIncome: lead.monthlyIncome || lead.grossIncome || lead.netMonthlyIncome,
      creditScore,
      pincode: String(pincode || ''),
      bureauData: null,
    };

    logger.info('[ECV-FALLBACK] Step 6: Calling lender rule engine', {
      applicationId,
      applicantData: {
        dateOfBirth: applicantData.dateOfBirth,
        employmentStatus: applicantData.employmentStatus,
        grossIncome: applicantData.grossIncome,
        creditScore: applicantData.creditScore,
        pincode: applicantData.pincode,
        hasBureauData: !!applicantData.bureauData,
      },
    });

    const result = await lenderRuleEngine.evaluateApplicant(applicantData);

    logger.info('[ECV-FALLBACK] Step 7: Rule engine evaluation complete', {
      applicationId,
      eligibleLenders: result.eligible?.map(l => ({
        lender: l.lender || l.displayName,
        isFallback: l.isFallback || false,
        maxLoanAmount: l.maxLoanAmount,
        minRoi: l.minRoi,
        maxTenureMonths: l.maxTenureMonths,
      })),
      ineligibleLenders: result.ineligible?.map(l => ({
        lender: l.lender || l.displayName,
        reason: l.reason || l.reasons,
      })),
      totalEligible: result.eligible?.length || 0,
      totalIneligible: result.ineligible?.length || 0,
    });

    logger.info('[ECV-FALLBACK] Step 8: Creating offers from eligible lenders', {
      applicationId,
      eligibleCount: result.eligible?.length || 0,
    });

    const offers = await createOffersFromEcvEligibility(applicationId, result.eligible);

    application.status = offers.length > 0 ? 'offers_available' : 'ecv_checked';
    application.breStatus = 'ecv_fallback';
    await application.save();

    logger.info('[ECV-FALLBACK] Step 9: ECV fallback flow COMPLETE', {
      applicationId,
      creditScore,
      creditScoreSource,
      eligibleCount: result.eligible?.length || 0,
      ineligibleCount: result.ineligible?.length || 0,
      offersCreated: offers.length,
      applicationStatus: application.status,
      offerDetails: offers.map(o => ({
        lenderName: o.lenderName,
        loanAmount: o.loanAmount,
        interestRate: o.interestRate,
        termMonths: o.termMonths,
        monthlyPayment: o.monthlyPayment,
        offerType: o.offerType,
      })),
    });

    res.status(200).json(
      buildResponse({
        status: 'complete',
        source: 'ecv_fallback',
        creditScore,
        creditScoreSource,
        eligible: result.eligible,
        ineligible: result.ineligible,
        offersCreated: offers.length,
      }, 'ECV fallback eligibility check completed')
    );
  } catch (error) {
    logger.error('[ECV-FALLBACK] FAILED with error', {
      error: error.message,
      stack: error.stack,
      applicationId: req.body?.applicationId,
    });
    next(error);
  }
};
