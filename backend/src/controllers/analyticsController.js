import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { FormAbandonment } from '../models/FormAbandonment.js';
import { buildResponse, buildErrorResponse } from '../utils/responseBuilder.js';
import { logger } from '../utils/logger.js';

/**
 * Store analytics events in batch
 */
export const storeEvents = async (req, res, next) => {
  try {
    const { events, sessionId } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json(
        buildErrorResponse('Events array is required', null, 400)
      );
    }

    // Separate form abandonment events
    const abandonmentEvents = events.filter(e => e.eventType === 'form_abandonment');
    const otherEvents = events.filter(e => e.eventType !== 'form_abandonment');

    // Store abandonment events separately
    if (abandonmentEvents.length > 0) {
      const abandonmentDocs = abandonmentEvents.map(event => ({
        sessionId: event.sessionId || sessionId,
        formType: event.formData?.formType || event.formType,
        formData: event.formData?.formData || {},
        timeOnForm: event.formData?.timeOnForm || 0,
        timeSinceLastInteraction: event.formData?.timeSinceLastInteraction || 0,
        filledFields: event.formData?.filledFields || 0,
        totalFields: event.formData?.totalFields || 0,
        completionPercentage: event.formData?.completionPercentage || 0,
        utmParams: event.utmParams || {},
        pageUrl: event.pageUrl,
        pagePath: event.pagePath,
        userFingerprint: event.userFingerprint || {},
        abandonmentReason: event.abandonmentReason || 'unknown',
        leadId: event.leadId || null,
        timestamp: new Date(event.timestamp),
      }));

      await FormAbandonment.insertMany(abandonmentDocs);
    }

    // Store other events
    if (otherEvents.length > 0) {
      const eventDocs = otherEvents.map(event => ({
        eventType: event.eventType,
        sessionId: event.sessionId || sessionId,
        formType: event.formData?.formType || event.formType || null,
        eventData: event,
        utmParams: event.utmParams || {},
        pageUrl: event.pageUrl,
        pagePath: event.pagePath,
        userFingerprint: event.userFingerprint || {},
        timestamp: new Date(event.timestamp),
        leadId: event.leadId || null,
      }));

      await AnalyticsEvent.insertMany(eventDocs);
    }

    logger.info('Analytics events stored', {
      sessionId,
      totalEvents: events.length,
      abandonmentEvents: abandonmentEvents.length,
      otherEvents: otherEvents.length,
    });

    res.status(200).json(
      buildResponse(
        { stored: events.length },
        'Events stored successfully'
      )
    );
  } catch (error) {
    logger.error('Error storing analytics events', { error: error.message });
    next(error);
  }
};

/**
 * Handle beacon requests (for reliable tracking on page unload)
 */
export const storeBeaconEvent = async (req, res, next) => {
  try {
    const event = req.body;

    if (event.eventType === 'form_abandonment') {
      const abandonmentDoc = {
        sessionId: event.sessionId,
        formType: event.formType,
        formData: event.formData || {},
        timeOnForm: event.timeOnForm || 0,
        timeSinceLastInteraction: event.timeSinceLastInteraction || 0,
        filledFields: event.filledFields || 0,
        totalFields: event.totalFields || 0,
        completionPercentage: event.completionPercentage || 0,
        utmParams: event.utmParams || {},
        pageUrl: event.pageUrl,
        pagePath: event.pagePath,
        userFingerprint: event.userFingerprint || {},
        abandonmentReason: 'page_unload',
        timestamp: new Date(event.timestamp),
      };

      await FormAbandonment.create(abandonmentDoc);
    } else {
      await AnalyticsEvent.create({
        eventType: event.eventType,
        sessionId: event.sessionId,
        formType: event.formType || null,
        eventData: event,
        utmParams: event.utmParams || {},
        pageUrl: event.pageUrl,
        pagePath: event.pagePath,
        userFingerprint: event.userFingerprint || {},
        timestamp: new Date(event.timestamp),
      });
    }

    res.status(204).send(); // No content response for beacon
  } catch (error) {
    logger.error('Error storing beacon event', { error: error.message });
    // Still return 204 to not break beacon
    res.status(204).send();
  }
};

/**
 * Get analytics events for a session
 */
export const getSessionEvents = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const events = await AnalyticsEvent.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json(buildResponse(events));
  } catch (error) {
    next(error);
  }
};

/**
 * Get form abandonment data
 */
export const getFormAbandonments = async (req, res, next) => {
  try {
    const { formType, startDate, endDate } = req.query;

    const query = {};
    if (formType) query.formType = formType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const abandonments = await FormAbandonment.find(query)
      .sort({ createdAt: -1 })
      .limit(1000);

    res.status(200).json(buildResponse(abandonments));
  } catch (error) {
    next(error);
  }
};

