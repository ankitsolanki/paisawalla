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

export const lookupLeadByPhone = async (req, res, next) => {
  try {
    const rawPhone = req.query?.phone;
    const phone = typeof rawPhone === 'string' ? rawPhone.trim() : '';

    if (!phone) {
      return res.status(400).json(
        buildErrorResponse('Phone number is required', null, 400)
      );
    }

    const rawFormType = req.query?.formType;
    const formType = typeof rawFormType === 'string' ? rawFormType.trim() : '';

    const lookupQuery = {
      phone,
      ...(formType ? { formType } : {}),
    };

    const lead = await Lead.findOne(
      lookupQuery,
      null,
      { sort: { createdAt: -1 } }
    ).lean();

    if (!lead) {
      return res.status(404).json(
        buildErrorResponse('Lead not found for this phone number', null, 404)
      );
    }

    const { ssn, bankAccountNumber, ...safeLead } = lead;

    logger.info('Lead lookup successful', {
      phone,
      leadId: lead._id,
      formType: lead.formType,
    });

    res.status(200).json(buildResponse(safeLead));
  } catch (error) {
    next(error);
  }
};

