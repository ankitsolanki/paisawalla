import rateLimit from 'express-rate-limit';

/**
 * Normalize origin by removing trailing slashes (case-sensitive)
 */
const normalizeOrigin = (origin) => {
  if (!origin) return null;
  return origin.trim().replace(/\/+$/, '');
};

/**
 * Check if an origin matches any allowed pattern (supports wildcard patterns)
 */
const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return allowedOrigins.includes(normalized);
};

/**
 * Get CORS origin configuration
 * Allows all origins by default
 * If CORS_ORIGIN is set, it will restrict to those specific origins (comma-separated)
 * When CORS_ORIGIN is empty, allows all origins
 */
const getCorsOrigin = () => {
  const corsOrigin = process.env.CORS_ORIGIN || "";
  const origins = corsOrigin
    .split(',')
    .map(o => normalizeOrigin(o))
    .filter(o => o && o.length > 0);
  
  if (origins.length === 0) {
    return true;
  }
  
  return (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin, origins)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
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
  validate: { ip: false },
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
  validate: false,
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

