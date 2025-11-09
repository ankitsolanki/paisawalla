/**
 * Lead Controller Tests
 * Comprehensive test coverage for lead operations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createLead, getLead } from '../controllers/leadController.js';
import { Lead } from '../models/Lead.js';

describe('Lead Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead successfully with all required fields', async () => {
      mockReq.body = {
        formType: 'form1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
      };
      mockReq.recaptchaResult = { score: 0.9 };

      const mockLead = {
        _id: '507f1f77bcf86cd799439011',
        ...mockReq.body,
        save: jest.fn().mockResolvedValue(true),
      };

      Lead.prototype.save = jest.fn().mockResolvedValue(mockLead);

      await createLead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should include IP address and user agent in lead data', async () => {
      mockReq.body = {
        formType: 'form1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
      };
      mockReq.recaptchaResult = { score: 0.9 };

      const mockLead = {
        _id: '507f1f77bcf86cd799439011',
        save: jest.fn().mockResolvedValue(true),
      };

      Lead.prototype.save = jest.fn().mockImplementation(function() {
        expect(this.ipAddress).toBe('127.0.0.1');
        expect(this.userAgent).toBe('test-user-agent');
        return Promise.resolve(mockLead);
      });

      await createLead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      mockReq.body = {
        formType: 'form1',
        // Missing required fields
      };
      mockReq.recaptchaResult = { score: 0.9 };

      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      validationError.errors = {
        firstName: { message: 'First name is required' },
      };

      Lead.prototype.save = jest.fn().mockRejectedValue(validationError);

      await createLead(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('getLead', () => {
    it('should retrieve a lead by ID', async () => {
      mockReq.params.leadId = '507f1f77bcf86cd799439011';

      const mockLead = {
        _id: '507f1f77bcf86cd799439011',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      Lead.findById = jest.fn().mockResolvedValue(mockLead);

      await getLead(mockReq, mockRes, mockNext);

      expect(Lead.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 404 if lead not found', async () => {
      mockReq.params.leadId = '507f1f77bcf86cd799439011';

      Lead.findById = jest.fn().mockResolvedValue(null);

      await getLead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
