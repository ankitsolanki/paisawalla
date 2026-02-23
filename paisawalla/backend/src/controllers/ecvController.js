import { EcvSession } from '../models/EcvSession.js';
import { Application } from '../models/Application.js';
import { Lead } from '../models/Lead.js';
import { experianEcvService } from '../services/experianEcvService.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

export const registerEcv = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, pan, dateOfBirth, applicationId, leadId } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json(
        buildErrorResponse('firstName, lastName, and phone are required', null, 400)
      );
    }

    const result = await experianEcvService.register({
      firstName,
      lastName,
      phone,
      email,
      pan,
      dateOfBirth,
    });

    const ecvSession = new EcvSession({
      applicationId: applicationId || undefined,
      leadId: leadId || undefined,
      phone,
      stgOneHitId: result.stgOneHitId,
      stgTwoHitId: result.stgTwoHitId,
      status: 'registered',
    });
    await ecvSession.save();

    logger.info('ECV session created', {
      sessionId: ecvSession._id,
      phone: phone.slice(-4),
    });

    res.status(201).json(
      buildResponse({
        sessionId: ecvSession._id,
        stgOneHitId: result.stgOneHitId,
        stgTwoHitId: result.stgTwoHitId,
        status: 'registered',
      }, 'ECV registration successful')
    );
  } catch (error) {
    logger.error('ECV register controller error', {
      error: error.message,
      stack: error.stack,
    });

    if (req.body.phone) {
      try {
        const failedSession = new EcvSession({
          applicationId: req.body.applicationId || undefined,
          leadId: req.body.leadId || undefined,
          phone: req.body.phone,
          status: 'failed',
          errorMessage: error.message,
        });
        await failedSession.save();
      } catch (_) {}
    }

    next(error);
  }
};

export const generateOtp = async (req, res, next) => {
  try {
    const { sessionId, stgOneHitId, stgTwoHitId, phone, type } = req.body;

    let ecvSession = null;
    let hitOne = stgOneHitId;
    let hitTwo = stgTwoHitId;
    let mobileNo = phone;

    if (sessionId) {
      ecvSession = await EcvSession.findById(sessionId);
      if (!ecvSession) {
        return res.status(404).json(
          buildErrorResponse('ECV session not found', null, 404)
        );
      }
      hitOne = ecvSession.stgOneHitId;
      hitTwo = ecvSession.stgTwoHitId;
      mobileNo = ecvSession.phone;
    }

    if (!hitOne || !hitTwo || !mobileNo) {
      return res.status(400).json(
        buildErrorResponse('stgOneHitId, stgTwoHitId, and phone are required (or provide sessionId)', null, 400)
      );
    }

    const result = await experianEcvService.generateOtp({
      stgOneHitId: hitOne,
      stgTwoHitId: hitTwo,
      phone: mobileNo,
      type: type || 'CUSTOM',
    });

    if (ecvSession) {
      ecvSession.status = 'otp_sent';
      await ecvSession.save();
    }

    res.status(200).json(
      buildResponse({
        success: true,
        status: 'otp_sent',
      }, 'OTP sent successfully')
    );
  } catch (error) {
    logger.error('ECV generateOtp controller error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const validateOtp = async (req, res, next) => {
  try {
    const { sessionId, stgOneHitId, stgTwoHitId, phone, otp, type } = req.body;

    if (!otp) {
      return res.status(400).json(
        buildErrorResponse('OTP is required', null, 400)
      );
    }

    let ecvSession = null;
    let hitOne = stgOneHitId;
    let hitTwo = stgTwoHitId;
    let mobileNo = phone;

    if (sessionId) {
      ecvSession = await EcvSession.findById(sessionId);
      if (!ecvSession) {
        return res.status(404).json(
          buildErrorResponse('ECV session not found', null, 404)
        );
      }
      hitOne = ecvSession.stgOneHitId;
      hitTwo = ecvSession.stgTwoHitId;
      mobileNo = ecvSession.phone;
    }

    if (!hitOne || !hitTwo || !mobileNo) {
      return res.status(400).json(
        buildErrorResponse('stgOneHitId, stgTwoHitId, and phone are required (or provide sessionId)', null, 400)
      );
    }

    const result = await experianEcvService.validateOtp({
      stgOneHitId: hitOne,
      stgTwoHitId: hitTwo,
      phone: mobileNo,
      otp,
      type: type || 'CUSTOM',
    });

    if (ecvSession) {
      ecvSession.status = 'verified';
      ecvSession.creditScore = result.creditScore;
      ecvSession.creditReportData = result.creditReportData;
      ecvSession.verifiedAt = new Date();
      await ecvSession.save();

      if (ecvSession.leadId) {
        await Lead.findByIdAndUpdate(ecvSession.leadId, {
          creditScore: result.creditScore,
        });
      }
    }

    logger.info('ECV OTP validated, credit report retrieved', {
      sessionId: ecvSession?._id,
      creditScore: result.creditScore,
    });

    res.status(200).json(
      buildResponse({
        success: true,
        status: 'verified',
        creditScore: result.creditScore,
        sessionId: ecvSession?._id,
      }, 'OTP verified and credit report retrieved')
    );
  } catch (error) {
    logger.error('ECV validateOtp controller error', {
      error: error.message,
      stack: error.stack,
    });

    if (sessionId) {
      try {
        const failedSession = await EcvSession.findById(sessionId);
        if (failedSession) {
          failedSession.status = 'failed';
          failedSession.errorMessage = error.message;
          await failedSession.save();
        }
      } catch (_) {}
    }

    next(error);
  }
};

export const refreshCreditReport = async (req, res, next) => {
  try {
    const { sessionId, hitId } = req.body;

    let resolvedHitId = hitId;

    if (sessionId && !hitId) {
      const ecvSession = await EcvSession.findById(sessionId);
      if (!ecvSession) {
        return res.status(404).json(
          buildErrorResponse('ECV session not found', null, 404)
        );
      }
      resolvedHitId = ecvSession.stgOneHitId;
    }

    if (!resolvedHitId) {
      return res.status(400).json(
        buildErrorResponse('hitId or sessionId is required', null, 400)
      );
    }

    const result = await experianEcvService.onDemandRefresh({ hitId: resolvedHitId });

    if (sessionId) {
      const ecvSession = await EcvSession.findById(sessionId);
      if (ecvSession) {
        ecvSession.creditScore = result.creditScore;
        ecvSession.creditReportData = result.creditReportData;
        await ecvSession.save();
      }
    }

    res.status(200).json(
      buildResponse({
        success: true,
        creditScore: result.creditScore,
      }, 'Credit report refreshed')
    );
  } catch (error) {
    logger.error('ECV refresh controller error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const generateMaskedMobile = async (req, res, next) => {
  try {
    const { sessionId, stgOneHitId, stgTwoHitId } = req.body;

    let hitOne = stgOneHitId;
    let hitTwo = stgTwoHitId;

    if (sessionId) {
      const ecvSession = await EcvSession.findById(sessionId);
      if (!ecvSession) {
        return res.status(404).json(
          buildErrorResponse('ECV session not found', null, 404)
        );
      }
      hitOne = ecvSession.stgOneHitId;
      hitTwo = ecvSession.stgTwoHitId;
    }

    if (!hitOne || !hitTwo) {
      return res.status(400).json(
        buildErrorResponse('stgOneHitId and stgTwoHitId are required (or provide sessionId)', null, 400)
      );
    }

    const result = await experianEcvService.generateMaskedMobile({
      stgOneHitId: hitOne,
      stgTwoHitId: hitTwo,
    });

    res.status(200).json(
      buildResponse({
        maskedMobiles: result.maskedMobiles,
      }, 'Masked mobile numbers retrieved')
    );
  } catch (error) {
    logger.error('ECV generateMaskedMobile controller error', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};
