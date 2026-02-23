import { Offer } from '../models/Offer.js';
import { Application } from '../models/Application.js';
import { BreSession } from '../models/BreSession.js';
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

    const offers = await Offer.find({
      applicationId,
      status: 'available',
    }).sort({ interestRate: 1 });

    if (offers.length > 0 && application.status !== 'offers_available') {
      application.status = 'offers_available';
      await application.save();
    }

    const breSession = await BreSession.findOne({ applicationId }).sort({ createdAt: -1 });

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
        loanAmountRaw: offer.offerData?.rawLoanAmount || null,
        tenureRaw: offer.offerData?.rawTenure || null,
        roiRaw: offer.offerData?.rawRoi || null,
        decisionText: offer.offerData?.decisionText || null,
        features: offer.offerData?.features || [],
      })),
      count: offers.length,
      breStatus: breSession?.status || null,
      creditScore: breSession?.parsedResult?.creditReport?.score || null,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplicationPhone = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId).populate('leadId');
    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    const lead = application.leadId;
    if (!lead || !lead.phone) {
      return res.status(404).json(
        buildErrorResponse('Phone number not found for this application', null, 404)
      );
    }

    const phone = lead.phone;
    const maskedPhone = '******' + phone.slice(-4);

    logger.info('Application phone retrieved', {
      applicationId,
      maskedPhone,
    });

    res.status(200).json(
      buildResponse({
        maskedPhone,
        phone,
      }, 'Phone number retrieved successfully')
    );
  } catch (error) {
    logger.error('Error retrieving application phone', {
      error: error.message,
      stack: error.stack,
    });
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
