import { BreSession } from '../models/BreSession.js';
import { Application } from '../models/Application.js';
import { breService } from '../services/breService.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

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
        
        // Update application
        const application = await Application.findById(breSession.applicationId);
        if (application) {
          application.status = 'bre_completed';
          application.breStatus = 'completed';
          application.breCompletedAt = new Date();
          await application.save();
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

