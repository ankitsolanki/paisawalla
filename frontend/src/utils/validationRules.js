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

  // PAN Number validation (Indian)
  pan: (value) => {
    if (!value) return null;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(value.trim().toUpperCase())) {
      return 'Please Enter a Valid Pan';
    }
    // Check 4th character is P, F, C, A, H, B, L, J, R, Y, or N
    const fourthChar = value.trim().toUpperCase()[3];
    const validFourthChars = ['P', 'F', 'C', 'A', 'H', 'B', 'L', 'J', 'R', 'Y', 'N'];
    if (!validFourthChars.includes(fourthChar)) {
      return 'Please Enter a Valid Pan';
    }
    return null;
  },

  // First name validation: only alphabets and space, max 26 chars
  firstName: (value) => {
    if (!value) return null;
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(value.trim())) {
      return 'Please enter a valid full name';
    }
    if (value.trim().length > 26) {
      return 'Name must be 26 characters or less';
    }
    return null;
  },

  // Date of Birth validation: must be between 21 and 55 years old, format dd-mmm-yyyy (for text input)
  dob: (value) => {
    if (!value) return null;
    // Check format dd-mmm-yyyy
    const dobRegex = /^(\d{2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i;
    const match = value.trim().match(dobRegex);
    if (!match) {
      return 'Please enter a valid Date of Birth (format: dd-mmm-yyyy, e.g., 01-Aug-2010)';
    }
    
    const day = parseInt(match[1], 10);
    const month = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    
    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    const birthDate = new Date(year, monthMap[month], day);
    if (birthDate.getDate() !== day || birthDate.getMonth() !== monthMap[month] || birthDate.getFullYear() !== year) {
      return 'Please enter a valid Date of Birth';
    }
    
    const today = new Date();
    const age = today.getFullYear() - year - (today.getMonth() < monthMap[month] || (today.getMonth() === monthMap[month] && today.getDate() < day) ? 1 : 0);
    
    if (age < 21) {
      return 'You must be at least 21 years old';
    }
    if (age > 55) {
      return 'You must be less than 55 years old';
    }
    
    return null;
  },

  // Date of Birth validation for date picker (YYYY-MM-DD format)
  dobDate: (value) => {
    if (!value) return null;
    
    const birthDate = new Date(value);
    if (isNaN(birthDate.getTime())) {
      return 'Please enter a valid Date of Birth';
    }
    
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
    
    if (age < 21) {
      return 'You must be at least 21 years old';
    }
    if (age > 55) {
      return 'You must be less than 55 years old';
    }
    
    return null;
  },

  // OTP validation: 4 digits
  otp: (value) => {
    if (!value) return null;
    const otpRegex = /^\d{4}$/;
    if (!otpRegex.test(value.trim())) {
      return 'Please enter a valid 4 digit otp';
    }
    return null;
  },

  // City validation: Alphanumeric, allows [],./\ symbols, max 40 chars
  city: (value) => {
    if (!value) return null;
    const cityRegex = /^[A-Za-z0-9\s\[\].,/\\]+$/;
    if (!cityRegex.test(value.trim())) {
      return 'Please enter a valid city name';
    }
    if (value.trim().length > 40) {
      return 'City name must be 40 characters or less';
    }
    return null;
  },

  // Net monthly income: max 8 digits
  netMonthlyIncome: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Please enter a Net monthly income (not more than 8 numeric digit)';
    }
    if (value.toString().replace(/[^0-9]/g, '').length > 8) {
      return 'Please enter a Net monthly income (not more than 8 numeric digit)';
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

