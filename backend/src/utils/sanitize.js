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
    .replace(/<[^>]*>/g, '') // Remove HTML tags more comprehensively
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (with optional spaces)
    .replace(/data:text\/html/gi, '') // Remove data URIs with HTML
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
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
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
  // More comprehensive email regex (still not RFC 5322 compliant but better)
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  
  // Additional length check
  if (sanitized.length > 254) return null; // RFC 5321 limit
  
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

