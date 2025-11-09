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
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return 'Please enter a valid phone number';
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
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(value)) {
      return 'Please enter a valid ZIP code';
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

// Export validators for direct use if needed
export { validators };

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

