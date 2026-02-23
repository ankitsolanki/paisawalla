import { sanitizeObject } from '../utils/sanitize.js';

/**
 * Middleware to sanitize request body and query parameters
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    const sanitized = sanitizeObject(req.query);
    Object.keys(sanitized).forEach(key => {
      req.query[key] = sanitized[key];
    });
  }
  
  next();
};

