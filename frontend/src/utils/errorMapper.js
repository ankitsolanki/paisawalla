/**
 * Error Mapper Utility
 * Maps backend error codes to UI states
 */

export const ERROR_CODES = {
  BRE_TIMEOUT: 'BRE_TIMEOUT',
  BRE_FAILED: 'BRE_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  OK_BUT_EMPTY: 'OK_BUT_EMPTY',
};

/**
 * Maps error response to UI state
 * @param {Error} error - The error object
 * @returns {string} - UI state: 'error', 'timeout', 'empty'
 */
export const mapErrorToState = (error) => {
  if (!error) return 'error';

  // Check for timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'timeout';
  }

  // Check error response code
  const errorCode = error.response?.data?.code || error.code;
  const statusCode = error.response?.status;

  switch (errorCode) {
    case ERROR_CODES.BRE_TIMEOUT:
      return 'timeout';
    case ERROR_CODES.BRE_FAILED:
      return 'error';
    case ERROR_CODES.NOT_FOUND:
      return 'error';
    case ERROR_CODES.VALIDATION_ERROR:
      return 'error';
    case ERROR_CODES.OK_BUT_EMPTY:
      return 'empty';
    default:
      // Check HTTP status codes
      if (statusCode === 404) {
        return 'error';
      }
      if (statusCode === 408 || statusCode === 504) {
        return 'timeout';
      }
      return 'error';
  }
};

/**
 * Gets user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  const errorMessage = error.response?.data?.message || error.message;

  // Map common error messages
  if (errorMessage?.includes('timeout') || errorMessage?.includes('TIMEOUT')) {
    return 'The request took too long to complete';
  }

  if (errorMessage?.includes('not found') || errorMessage?.includes('NOT_FOUND')) {
    return 'Application not found';
  }

  if (errorMessage?.includes('BRE') && errorMessage?.includes('failed')) {
    return 'Eligibility check failed. Please try again.';
  }

  return errorMessage || 'An unexpected error occurred';
};


