import { BreSession } from '../models/BreSession.js';
import { Application } from '../models/Application.js';
import { Offer } from '../models/Offer.js';
import { breService } from '../services/breService.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

/**
 * Create offers from BRE response
 */
const createOffersFromBreResponse = async (applicationId, breOffers) => {
  try {
    // Check if offers already exist for this application
    const existingOffers = await Offer.find({ applicationId });
    if (existingOffers.length > 0) {
      logger.info('Offers already exist for application', { applicationId });
      return;
    }

    const offers = [];
    for (const breOffer of breOffers) {
      const offer = new Offer({
        applicationId,
        lenderId: breOffer.id || `LENDER-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        lenderName: breOffer.lender || 'Lender',
        loanAmount: breOffer.amount || 0,
        interestRate: breOffer.apr || 0,
        termMonths: breOffer.term || 36,
        monthlyPayment: breOffer.monthlyPayment || 0,
        apr: breOffer.apr || 0,
        offerType: 'standard',
        status: 'available',
        offerData: breOffer,
      });
      await offer.save();
      offers.push(offer);
    }

    logger.info('Offers created from BRE response', {
      applicationId,
      offerCount: offers.length,
    });

    return offers;
  } catch (error) {
    logger.error('Error creating offers from BRE response', {
      error: error.message,
      applicationId,
    });
    throw error;
  }
};

export const initiateBreRequest = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findById(applicationId).populate('leadId');
    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    // Check if BRE request already exists
    const existingSession = await BreSession.findOne({ applicationId });
    if (existingSession && existingSession.status === 'processing') {
      return res.status(409).json(
        buildErrorResponse('BRE request already in progress', null, 409)
      );
    }

    // Initiate BRE request
    const breRequest = await breService.initiateRequest(application);

    // Create BRE session
    const breSession = new BreSession({
      applicationId,
      breRequestId: breRequest.requestId,
      status: 'initiated',
      requestPayload: breRequest.payload,
    });
    await breSession.save();

    // Update application status
    application.status = 'bre_processing';
    application.breRequestId = breRequest.requestId;
    application.breStatus = 'initiated';
    await application.save();

    logger.info('BRE request initiated', {
      applicationId,
      breRequestId: breRequest.requestId,
    });

    res.status(201).json(
      buildResponse(
        { breRequestId: breRequest.requestId, status: 'initiated' },
        'BRE request initiated successfully',
        201
      )
    );
  } catch (error) {
    next(error);
  }
};

export const checkBreStatus = async (req, res, next) => {
  try {
    const { breRequestId } = req.body;

    const breSession = await BreSession.findOne({ breRequestId });
    if (!breSession) {
      return res.status(404).json(
        buildErrorResponse('BRE request not found', null, 404)
      );
    }

    // Poll BRE service for status
    const status = await breService.checkStatus(breRequestId);

    // Update session if status changed
    if (status.status !== breSession.status) {
      breSession.status = status.status;
      if (status.status === 'completed') {
        breSession.responsePayload = status.response;
        breSession.completedAt = new Date();
        
        // Update application and create offers
        const application = await Application.findById(breSession.applicationId);
        if (application) {
          application.status = 'bre_completed';
          application.breStatus = 'completed';
          application.breCompletedAt = new Date();
          await application.save();

          // Create offers from BRE response if available
          if (status.response && status.response.offers && Array.isArray(status.response.offers) && status.response.offers.length > 0) {
            await createOffersFromBreResponse(application._id, status.response.offers);
          }
        }
      } else if (status.status === 'failed') {
        breSession.errorMessage = status.error;
      }
      await breSession.save();
    }

    res.status(200).json(buildResponse({
      breRequestId,
      status: breSession.status,
      completedAt: breSession.completedAt,
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Check BRE status by requestId from URL parameter
 * POST /api/bre/requests/:requestId/status
 */
export const checkBreStatusByRequestId = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json(
        buildErrorResponse('Request ID is required', null, 400)
      );
    }

    const breSession = await BreSession.findOne({ breRequestId: requestId });
    if (!breSession) {
      return res.status(404).json(
        buildErrorResponse('BRE request not found', null, 404)
      );
    }

    // Poll BRE service for status
    const status = await breService.checkStatus(requestId);

    // Update session if status changed
    if (status.status !== breSession.status) {
      breSession.status = status.status;
      if (status.status === 'completed') {
        breSession.responsePayload = status.response;
        breSession.completedAt = new Date();
        
        // Update application and create offers
        const application = await Application.findById(breSession.applicationId);
        if (application) {
          application.status = 'bre_completed';
          application.breStatus = 'completed';
          application.breCompletedAt = new Date();
          await application.save();

          // Create offers from BRE response if available
          if (status.response && status.response.offers && Array.isArray(status.response.offers) && status.response.offers.length > 0) {
            await createOffersFromBreResponse(application._id, status.response.offers);
          }
        }
      } else if (status.status === 'failed') {
        breSession.errorMessage = status.error;
      }
      await breSession.save();
    }

    // Map status values to match frontend expectations
    let mappedStatus = breSession.status;
    if (mappedStatus === 'completed') {
      mappedStatus = 'complete';
    } else if (mappedStatus === 'initiated' || mappedStatus === 'processing') {
      mappedStatus = 'in_progress';
    }

    res.status(200).json({
      ok: true,
      status: mappedStatus,
      applicationId: breSession.applicationId?.toString(),
      breRequestId: requestId,
      completedAt: breSession.completedAt,
    });
  } catch (error) {
    logger.error('BRE status check error', {
      error: error.message,
      requestId: req.params.requestId,
    });
    
    // Return error in expected format
    res.status(500).json({
      ok: false,
      code: 'BRE_FAILED',
      message: error.message || 'Failed to check BRE status',
    });
  }
};

