import rateLimit from 'express-rate-limit';

export const securityConfig = {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

