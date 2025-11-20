import { Application } from '../models/Application.js';
import { Lead } from '../models/Lead.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export const createApplication = async (req, res, next) => {
  try {
    const { leadId } = req.body;

    // Validate ObjectId format
    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json(
        buildErrorResponse('Invalid lead ID format', null, 400)
      );
    }

    // Verify lead exists
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json(
        buildErrorResponse('Lead not found', null, 404)
      );
    }

    // Check if application already exists for this lead
    const existingApplication = await Application.findOne({ leadId });
    if (existingApplication) {
      return res.status(409).json(
        buildErrorResponse('Application already exists for this lead', null, 409)
      );
    }

    // Generate application number
    const count = await Application.countDocuments();
    const applicationNumber = `APP-${Date.now()}-${count + 1}`;

    const application = new Application({
      leadId,
      applicationNumber,
      applicationData: lead.toObject(),
      status: 'pending',
    });

    await application.save();

    // Update lead status
    lead.status = 'application_created';
    await lead.save();

    logger.info('Application created successfully', {
      applicationId: application._id,
      applicationNumber: application.applicationNumber,
      leadId,
    });

    res.status(201).json(
      buildResponse(application, 'Application created successfully', 201)
    );
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json(
        buildErrorResponse('Invalid application ID format', null, 400)
      );
    }
    
    const application = await Application.findById(applicationId)
      .populate('leadId');

    if (!application) {
      return res.status(404).json(
        buildErrorResponse('Application not found', null, 404)
      );
    }

    res.status(200).json(buildResponse(application));
  } catch (error) {
    next(error);
  }
};

