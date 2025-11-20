import rateLimit from 'express-rate-limit';

/**
 * Normalize origin by removing trailing slashes (case-sensitive)
 */
const normalizeOrigin = (origin) => {
  if (!origin) return null;
  return origin.trim().replace(/\/+$/, '');
};

/**
 * Get CORS origin configuration
 * Allows all origins by default
 * If CORS_ORIGIN is set, it will restrict to those specific origins (comma-separated)
 */
const getCorsOrigin = () => {
  const corsOrigin = process.env.CORS_ORIGIN || "";
  const origins = corsOrigin
    .split(',')
    .map(o => normalizeOrigin(o))
    .filter(o => o && o.length > 0);
  
  // Multiple origins - use callback function
  return (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }
    const normalizedRequestOrigin = normalizeOrigin(origin);
    // Check if the normalized origin matches any allowed origin
    if (normalizedRequestOrigin && origins.includes(normalizedRequestOrigin)) {
      // Return true to allow this origin (CORS library will use the requested origin)
      callback(null, true);
    } else {
      // Also check exact match (in case origin doesn't have trailing slash)
      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  };
};

export const securityConfig = {
  cors: {
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Id',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'Authorization',
    ],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    preflightContinue: false, // Pass the CORS preflight response to the next handler
  },
};

// Rate limiter configuration
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 minutes
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;

export const rateLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for form submissions
// Use IP + session ID for better tracking (avoids false positives from shared IPs)
const formSubmissionWindow = parseInt(process.env.FORM_SUBMISSION_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 minutes
const formSubmissionMax = parseInt(process.env.FORM_SUBMISSION_MAX_REQUESTS, 10) || 10; // 10 submissions per window

export const formSubmissionLimiter = rateLimit({
  windowMs: formSubmissionWindow,
  max: formSubmissionMax,
  message: 'Too many form submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use a custom key generator that includes session ID to avoid false positives
  keyGenerator: (req) => {
    const sessionId = req.headers['x-session-id'] || req.ip;
    return `${req.ip}-${sessionId}`;
  },
  // Skip rate limiting for certain conditions (optional)
  skip: (req) => {
    // Skip if it's a test environment (you can add more conditions)
    return process.env.NODE_ENV === 'test';
  },
});

