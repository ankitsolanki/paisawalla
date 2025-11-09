import { Offer } from '../models/Offer.js';
import { Application } from '../models/Application.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

export const getOffers = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    // Check if BRE is completed
    if (application.status !== 'bre_completed' && application.status !== 'offers_available') {
      return res.status(400).json(
        buildErrorResponse('BRE must be completed before retrieving offers', null, 400)
      );
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

    res.status(200).json(
      buildResponse(offers, `Found ${offers.length} offers`)
    );
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

