/**
 * Validation Rules Tests
 * Comprehensive test coverage for form validation
 */

import { describe, it, expect } from '@jest/globals';
import { validateField, validateForm, validators } from '../utils/validationRules';

describe('Validation Rules', () => {
  describe('validateField', () => {
    it('should validate required field', () => {
      expect(validateField('', ['required'])).toBe('This field is required');
      expect(validateField('   ', ['required'])).toBe('This field is required');
      expect(validateField('value', ['required'])).toBeNull();
    });

    it('should validate email format', () => {
      expect(validateField('invalid-email', ['email'])).toBe('Please enter a valid email address');
      expect(validateField('test@example.com', ['email'])).toBeNull();
      expect(validateField('', ['email'])).toBeNull(); // Empty should pass (required handles that)
    });

    it('should validate phone number', () => {
      expect(validateField('123', ['phone'])).toBe('Please enter a valid phone number');
      expect(validateField('1234567890', ['phone'])).toBeNull();
      expect(validateField('(123) 456-7890', ['phone'])).toBeNull();
    });

    it('should validate zip code', () => {
      expect(validateField('123', ['zipCode'])).toBe('Please enter a valid ZIP code');
      expect(validateField('12345', ['zipCode'])).toBeNull();
      expect(validateField('12345-6789', ['zipCode'])).toBeNull();
    });

    it('should validate SSN format', () => {
      expect(validateField('123456789', ['ssn'])).toBe('Please enter a valid SSN (XXX-XX-XXXX)');
      expect(validateField('123-45-6789', ['ssn'])).toBeNull();
    });

    it('should validate numeric values', () => {
      expect(validateField('abc', ['numeric'])).toBe('Must be a number');
      expect(validateField('123', ['numeric'])).toBeNull();
    });

    it('should validate min value', () => {
      expect(validateField('5', [{ type: 'min', params: [10] }])).toBe('Must be at least 10');
      expect(validateField('15', [{ type: 'min', params: [10] }])).toBeNull();
    });

    it('should validate max value', () => {
      expect(validateField('15', [{ type: 'max', params: [10] }])).toBe('Must be no more than 10');
      expect(validateField('5', [{ type: 'max', params: [10] }])).toBeNull();
    });

    it('should validate multiple rules', () => {
      expect(validateField('', ['required', 'email'])).toBe('This field is required');
      expect(validateField('invalid', ['required', 'email'])).toBe('Please enter a valid email address');
      expect(validateField('test@example.com', ['required', 'email'])).toBeNull();
    });
  });

  describe('validateForm', () => {
    const schema = {
      firstName: {
        rules: ['required'],
      },
      email: {
        rules: ['required', 'email'],
      },
      phone: {
        rules: ['phone'],
      },
    };

    it('should validate entire form', () => {
      const formData = {
        firstName: 'John',
        email: 'john@example.com',
        phone: '1234567890',
      };

      const result = validateForm(formData, schema);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should return errors for invalid form data', () => {
      const formData = {
        firstName: '',
        email: 'invalid-email',
        phone: '123',
      };

      const result = validateForm(formData, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.phone).toBeDefined();
    });
  });
});

