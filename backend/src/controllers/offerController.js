import { Offer } from '../models/Offer.js';
import { Application } from '../models/Application.js';
import { BreSession } from '../models/BreSession.js';
import { breService } from '../services/breService.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

export const getOffers = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId).populate('leadId');
    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    // Auto-initiate BRE if not already started
    if (application.status === 'pending') {
      // Check if BRE session already exists
      const existingBreSession = await BreSession.findOne({ applicationId });
      
      if (!existingBreSession) {
        // Initiate BRE request automatically
        try {
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
          
          logger.info('BRE auto-initiated when fetching offers', {
            applicationId,
            breRequestId: breRequest.requestId,
          });
        } catch (error) {
          logger.error('Failed to auto-initiate BRE', {
            error: error.message,
            applicationId,
          });
          // Continue anyway - will return empty offers
        }
      }
    }

    // If BRE is processing, actively check status and wait for completion
    if ((application.status === 'bre_processing' || application.status === 'pending') && application.breRequestId) {
      try {
        let breSession = await BreSession.findOne({ breRequestId: application.breRequestId });
        
        if (!breSession) {
          logger.warn('BRE session not found for requestId', {
            applicationId,
            breRequestId: application.breRequestId,
          });
        } else {
          // Poll BRE status up to 3 times (max 15 seconds wait)
          let maxPolls = 5;
          let pollCount = 0;
          
          while (pollCount < maxPolls && breSession.status !== 'completed' && breSession.status !== 'failed') {
            // Check BRE status
            const breStatus = await breService.checkStatus(application.breRequestId);
            
            // Update session if status changed
            if (breStatus.status !== breSession.status) {
              breSession.status = breStatus.status;
              if (breStatus.status === 'completed') {
                breSession.responsePayload = breStatus.response;
                breSession.completedAt = new Date();
                await breSession.save();
                
                // Update application
                application.status = 'bre_completed';
                application.breStatus = 'completed';
                application.breCompletedAt = new Date();
                await application.save();
                
                logger.info('BRE completed while polling in offer controller', {
                  applicationId,
                  breRequestId: application.breRequestId,
                  hasOffers: breStatus.response?.offers?.length > 0,
                });
                
                break; // Exit loop, BRE is complete
              } else if (breStatus.status === 'failed') {
                breSession.errorMessage = breStatus.error;
                await breSession.save();
                break; // Exit loop, BRE failed
              } else {
                await breSession.save();
              }
            }
            
            // Wait before next poll (2 seconds)
            if (breSession.status !== 'completed' && breSession.status !== 'failed') {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            pollCount++;
            // Refresh session from DB
            breSession = await BreSession.findOne({ breRequestId: application.breRequestId });
          }
          
          // If BRE completed, create offers if they don't exist
          if (breSession && breSession.status === 'completed' && breSession.responsePayload) {
            const breResponse = breSession.responsePayload;
            if (breResponse.offers && Array.isArray(breResponse.offers) && breResponse.offers.length > 0) {
              // Check if offers exist, if not create them
              const existingOffers = await Offer.find({ applicationId });
              if (existingOffers.length === 0) {
                // Create offers from BRE response
                for (const breOffer of breResponse.offers) {
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
                }
                
                // Update application status
                application.status = 'bre_completed';
                await application.save();
                
                logger.info('Offers created from BRE response in offer controller', {
                  applicationId,
                  offerCount: breResponse.offers.length,
                });
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error checking BRE status in offer controller', {
          error: error.message,
          applicationId,
          stack: error.stack,
        });
        // Continue anyway
      }
    }

    const offers = await Offer.find({
      applicationId,
      status: 'available',
    }).sort({ interestRate: 1 }); // Sort by lowest interest rate

    // Update application status if offers are available
    if (offers.length > 0 && application.status !== 'offers_available') {
      application.status = 'offers_available';
      await application.save();
    }

    logger.info('Offers retrieved', {
      applicationId,
      offerCount: offers.length,
    });

    res.status(200).json({
      ok: true,
      offers: offers.map(offer => ({
        id: offer._id,
        _id: offer._id,
        lender: offer.lenderName,
        lenderId: offer.lenderId,
        amount: offer.loanAmount,
        apr: offer.apr,
        interestRate: offer.interestRate,
        term: offer.termMonths,
        monthlyPayment: offer.monthlyPayment,
        offerType: offer.offerType,
        status: offer.status,
        features: offer.offerData?.features || [],
      })),
      count: offers.length,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json(
        buildErrorResponse('Offer not found', null, 404)
      );
    }

    if (offer.status !== 'available') {
      return res.status(400).json(
        buildErrorResponse('Offer is not available', null, 400)
      );
    }

    offer.status = 'accepted';
    await offer.save();

    logger.info('Offer accepted', { offerId, applicationId: offer.applicationId });

    res.status(200).json(
      buildResponse(offer, 'Offer accepted successfully')
    );
  } catch (error) {
    next(error);
  }
};

