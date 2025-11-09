/**
 * Polling Utility
 * Helper functions for polling API endpoints
 */

/**
 * Polls an endpoint at regular intervals until a condition is met
 * @param {Function} pollFn - Async function that returns the poll result
 * @param {Function} shouldContinue - Function that returns true if polling should continue
 * @param {Object} options - Polling options
 * @param {number} options.interval - Polling interval in milliseconds (default: 3000)
 * @param {number} options.maxPolls - Maximum number of polls (default: 30)
 * @param {number} options.timeout - Maximum time to poll in milliseconds
 * @param {Function} options.onPoll - Callback called on each poll
 * @param {Function} options.onComplete - Callback called when polling completes
 * @param {Function} options.onError - Callback called on error
 * @returns {Promise} - Promise that resolves with final result or rejects on timeout/error
 */
export const poll = async (pollFn, shouldContinue, options = {}) => {
  const {
    interval = 3000,
    maxPolls = 30,
    timeout = null,
    onPoll = null,
    onComplete = null,
    onError = null,
  } = options;

  let pollCount = 0;
  const startTime = Date.now();
  const maxTime = timeout ? startTime + timeout : null;

  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check timeout
        if (maxTime && Date.now() >= maxTime) {
          clearInterval(pollInterval);
          reject(new Error('Polling timeout'));
          return;
        }

        // Check max polls
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          reject(new Error('Max polls reached'));
          return;
        }

        pollCount++;

        // Execute poll function
        const result = await pollFn();

        // Call onPoll callback
        if (onPoll) {
          onPoll(result, pollCount);
        }

        // Check if we should continue
        if (!shouldContinue(result)) {
          clearInterval(pollInterval);
          if (onComplete) {
            onComplete(result);
          }
          resolve(result);
          return;
        }
      } catch (error) {
        clearInterval(pollInterval);
        if (onError) {
          onError(error);
        }
        reject(error);
      }
    }, interval);

    // Initial poll
    (async () => {
      try {
        pollCount++;
        const result = await pollFn();
        if (onPoll) {
          onPoll(result, pollCount);
        }
        if (!shouldContinue(result)) {
          clearInterval(pollInterval);
          if (onComplete) {
            onComplete(result);
          }
          resolve(result);
        }
      } catch (error) {
        clearInterval(pollInterval);
        if (onError) {
          onError(error);
        }
        reject(error);
      }
    })();
  });
};

