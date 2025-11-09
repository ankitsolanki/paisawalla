/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : null;
};

/**
 * Sanitize phone number
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return null;
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Validate length (10-15 digits for international)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }
  
  return digitsOnly;
};

