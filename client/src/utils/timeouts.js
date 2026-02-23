/**
 * Timeout Utilities
 * Helper functions for managing timeouts
 */

/**
 * Creates a timeout promise that rejects after specified duration
 * @param {number} ms - Milliseconds to wait before timeout
 * @param {string} message - Error message for timeout
 * @returns {Promise} - Promise that rejects after timeout
 */
export const createTimeout = (ms, message = 'Request timeout') => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
};

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message for timeout
 * @returns {Promise} - Promise that rejects on timeout
 */
export const withTimeout = (promise, ms, message = 'Request timeout') => {
  return Promise.race([
    promise,
    createTimeout(ms, message),
  ]);
};

/**
 * Default timeout values
 */
export const TIMEOUTS = {
  OFFERS_FETCH: 60000, // 60 seconds for offers fetch
  BRE_POLL: 30000, // 30 seconds for BRE polling
  API_CALL: 30000, // 30 seconds for general API calls
};





