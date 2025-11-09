import rateLimit from 'express-rate-limit';

/**
 * Get CORS origin configuration
 * In development, allows multiple localhost ports
 * In production, uses CORS_ORIGIN env variable
 */
const getCorsOrigin = () => {
  const env = process.env.NODE_ENV || 'development';
  const corsOrigin = process.env.CORS_ORIGIN;

  // Production: use configured origin
  if (env === 'production' && corsOrigin) {
    return corsOrigin;
  }

  // Development: allow common Vite dev server ports
  if (env === 'development') {
    // If CORS_ORIGIN is set, use it, otherwise allow common dev ports
    if (corsOrigin) {
      return corsOrigin;
    }
    // Allow multiple localhost origins in development
    return (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow any localhost origin
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    };
  }

  // Fallback
  return corsOrigin || 'http://localhost:5173';
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

