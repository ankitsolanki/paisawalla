/**
 * Validation rules for form fields
 */

export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null; // Let required validator handle empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    // Indian phone number validation: 10 digits, may start with +91 or 0
    const cleaned = value.replace(/\D/g, '');
    
    // Remove country code +91 or leading 0 if present
    let digits = cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      digits = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      digits = cleaned.substring(1);
    }
    
    // Must be exactly 10 digits and start with 6-9 (Indian mobile number format)
    if (digits.length !== 10) {
      return 'Please enter a valid 10-digit mobile number';
    }
    if (!/^[6-9]/.test(digits)) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  numeric: (value) => {
    if (!value) return null;
    if (isNaN(value) || value === '') {
      return 'Must be a number';
    }
    return null;
  },

  min: (min) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },

  zipCode: (value) => {
    if (!value) return null;
    // Indian PIN code validation: exactly 6 digits
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(value.trim())) {
      return 'Please enter a valid 6-digit PIN code';
    }
    return null;
  },

  ssn: (value) => {
    if (!value) return null;
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(value)) {
      return 'Please enter a valid SSN (XXX-XX-XXXX)';
    }
    return null;
  },
};

/**
 * Validate a field value against an array of validators
 */
export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    let validator;
    let params = [];

    if (typeof rule === 'string') {
      validator = validators[rule];
    } else if (typeof rule === 'object' && rule.type) {
      validator = validators[rule.type];
      params = rule.params || [];
    }

    if (validator) {
      const error = typeof validator === 'function' && params.length > 0
        ? validator(...params)(value)
        : validator(value);
      
      if (error) {
        return error;
      }
    }
  }
  return null;
};

/**
 * Validate an entire form object
 */
export const validateForm = (formData, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach((fieldName) => {
    const fieldSchema = schema[fieldName];
    const value = formData[fieldName];
    const error = validateField(value, fieldSchema.rules || []);
    
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

