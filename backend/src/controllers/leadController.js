import { Lead } from '../models/Lead.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

export const createLead = async (req, res, next) => {
  try {
    const leadData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      recaptchaScore: req.recaptchaResult?.score,
    };

    const lead = new Lead(leadData);
    await lead.save();

    logger.info('Lead created successfully', {
      leadId: lead._id,
      formType: lead.formType,
      email: lead.email,
    });

    res.status(201).json(
      buildResponse(lead, 'Lead created successfully', 201)
    );
  } catch (error) {
    next(error);
  }
};

export const getLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json(
        buildErrorResponse('Lead not found', null, 404)
      );
    }

    res.status(200).json(buildResponse(lead));
  } catch (error) {
    next(error);
  }
};

