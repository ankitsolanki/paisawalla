import { logger } from '../utils/logger.js';
import { buildErrorResponse } from '../utils/responseBuilder.js';

export const errorHandler = (err, req, res, next) => {
  // Don't log stack trace in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  logger.error('Error occurred', {
    error: err.message,
    ...(isDevelopment && { stack: err.stack }),
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
  });

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

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
    const fields = Object.keys(err.keyPattern || {});
    const field = fields.length > 0 ? fields[0] : 'field';
    const message = fields.length > 1 
      ? 'Duplicate key violation' 
      : `${field} already exists`;
    return res.status(409).json(
      buildErrorResponse(message, null, 409)
    );
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      buildErrorResponse('Invalid ID format', null, 400)
    );
  }

  // Mongoose timeout error
  if (err.name === 'MongoServerError' && err.code === 50) {
    return res.status(504).json(
      buildErrorResponse('Database operation timed out', null, 504)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      buildErrorResponse('Invalid token', null, 401)
    );
  }

  // Default error - don't expose internal error messages in production
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && !isDevelopment
    ? 'Internal server error'
    : (err.message || 'Internal server error');

  res.status(statusCode).json(
    buildErrorResponse(message, null, statusCode)
  );
};

