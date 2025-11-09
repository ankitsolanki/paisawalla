import { logger } from '../utils/logger.js';
import { buildErrorResponse } from '../utils/responseBuilder.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    
    return res.status(400).json(
      buildErrorResponse('Validation error', errors, 400)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      buildErrorResponse(`${field} already exists`, null, 409)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      buildErrorResponse('Invalid token', null, 401)
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json(
    buildErrorResponse(message, null, statusCode)
  );
};

