/**
 * Validation Tests
 * Tests for input validation and sanitization
 */

import { describe, it, expect } from '@jest/globals';

describe('Input Validation', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Phone Validation', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '+1 123 456 7890',
      ];

      validPhones.forEach((phone) => {
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        const digitsOnly = phone.replace(/\D/g, '');
        expect(phoneRegex.test(phone) && digitsOnly.length >= 10).toBe(true);
      });
    });
  });

  describe('SSN Validation', () => {
    it('should validate correct SSN format', () => {
      const validSSN = '123-45-6789';
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      expect(ssnRegex.test(validSSN)).toBe(true);
    });

    it('should reject invalid SSN formats', () => {
      const invalidSSNs = [
        '123456789',
        '123-45-678',
        '12-345-6789',
      ];

      invalidSSNs.forEach((ssn) => {
        const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
        expect(ssnRegex.test(ssn)).toBe(false);
      });
    });
  });

  describe('ZIP Code Validation', () => {
    it('should validate correct ZIP code formats', () => {
      const validZIPs = [
        '12345',
        '12345-6789',
      ];

      validZIPs.forEach((zip) => {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        expect(zipRegex.test(zip)).toBe(true);
      });
    });
  });
});

