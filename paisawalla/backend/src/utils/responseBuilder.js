/**
 * Standardized response builder for API responses
 */
export const buildResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

export const buildErrorResponse = (message, errors = null, statusCode = 400) => {
  return {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
};

