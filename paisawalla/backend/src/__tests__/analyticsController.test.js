/**
 * Analytics Controller Tests
 * TDD approach - tests should be written before or alongside implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { storeEvents, storeBeaconEvent } from '../controllers/analyticsController.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { FormAbandonment } from '../models/FormAbandonment.js';

describe('Analytics Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('storeEvents', () => {
    it('should store analytics events successfully', async () => {
      mockReq.body = {
        events: [
          {
            eventType: 'form_view',
            sessionId: 'test-session-123',
            formType: 'form1',
            timestamp: new Date().toISOString(),
          },
        ],
        sessionId: 'test-session-123',
      };

      // Mock database operations
      AnalyticsEvent.insertMany = jest.fn().mockResolvedValue([]);
      FormAbandonment.insertMany = jest.fn().mockResolvedValue([]);

      await storeEvents(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(AnalyticsEvent.insertMany).toHaveBeenCalled();
    });

    it('should separate and store abandonment events', async () => {
      mockReq.body = {
        events: [
          {
            eventType: 'form_abandonment',
            sessionId: 'test-session-123',
            formType: 'form1',
            formData: {
              formType: 'form1',
              timeOnForm: 5000,
              filledFields: 3,
            },
            timestamp: new Date().toISOString(),
          },
        ],
        sessionId: 'test-session-123',
      };

      FormAbandonment.insertMany = jest.fn().mockResolvedValue([]);
      AnalyticsEvent.insertMany = jest.fn().mockResolvedValue([]);

      await storeEvents(mockReq, mockRes, mockNext);

      expect(FormAbandonment.insertMany).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid events array', async () => {
      mockReq.body = {
        events: null,
        sessionId: 'test-session-123',
      };

      await storeEvents(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('storeBeaconEvent', () => {
    it('should store beacon event successfully', async () => {
      mockReq.body = {
        eventType: 'form_abandonment',
        sessionId: 'test-session-123',
        formType: 'form1',
        timestamp: new Date().toISOString(),
      };

      FormAbandonment.create = jest.fn().mockResolvedValue({});

      await storeBeaconEvent(mockReq, mockRes, mockNext);

      expect(FormAbandonment.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });
});

