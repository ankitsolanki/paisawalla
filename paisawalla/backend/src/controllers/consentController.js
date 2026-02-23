import { Consent } from '../models/Consent.js';
import { Lead } from '../models/Lead.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

export const storeConsent = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const { consentType, consentGiven, consentText } = req.body;

    // Verify lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json(
        buildErrorResponse('Lead not found', null, 404)
      );
    }

    // Validate consent type
    const validConsentTypes = ['marketing', 'credit_check', 'data_sharing', 'terms_accepted'];
    if (!validConsentTypes.includes(consentType)) {
      return res.status(400).json(
        buildErrorResponse('Invalid consent type', null, 400)
      );
    }

    // Create consent record
    const consent = new Consent({
      leadId,
      consentType,
      consentGiven: consentGiven !== false, // Default to true if not explicitly false
      consentText,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await consent.save();

    logger.info('Consent stored successfully', {
      leadId,
      consentType,
      consentGiven: consent.consentGiven,
    });

    res.status(201).json(
      buildResponse(consent, 'Consent stored successfully', 201)
    );
  } catch (error) {
    next(error);
  }
};

