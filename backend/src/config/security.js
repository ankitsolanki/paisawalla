import rateLimit from 'express-rate-limit';

/**
 * Get CORS origin configuration
 * Allows all origins by default
 * If CORS_ORIGIN is set, it will restrict to those specific origins (comma-separated)
 */
const getCorsOrigin = () => {
  const corsOrigin = process.env.CORS_ORIGIN;

  // If CORS_ORIGIN is set, use it (supports comma-separated origins)
  if (corsOrigin) {
    const origins = corsOrigin.split(',').map(o => o.trim());
    if (origins.length === 1) {
      return origins[0];
    }
    // Multiple origins - use callback function
    return (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };
  }

  // Allow all origins if CORS_ORIGIN is not set
  return true;
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
    ],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  },
};

// Rate limiter configuration
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

export const rateLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for form submissions
export const formSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per 15 minutes
  message: 'Too many form submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

