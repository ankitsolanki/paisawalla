import { Lead } from '../models/Lead.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

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
      // Don't log PII (email) for privacy/GDPR compliance
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
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json(
        buildErrorResponse('Invalid lead ID format', null, 400)
      );
    }
    
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

    const lead = await Lead.findOne(lookupQuery)
      .sort({ createdAt: -1 })
      .lean();

    if (!lead) {
      logger.info('Lead lookup — no lead found for phone', {
        phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
        formType: formType || 'any',
      });
      return res.status(200).json(
        buildResponse({ found: false, lead: null }, 'No lead found for this phone number')
      );
    }

    // Remove sensitive fields more explicitly
    const safeLead = { ...lead };
    delete safeLead.ssn;
    delete safeLead.bankAccountNumber;

    logger.info('Lead lookup successful', {
      phone: phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'), // Mask phone in logs
      leadId: lead._id,
      formType: lead.formType,
    });

    res.status(200).json(buildResponse({ found: true, lead: safeLead }));
  } catch (error) {
    next(error);
  }
};

