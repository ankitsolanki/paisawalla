/**
 * Retry utility for failed API calls
 */

export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
};

/**
 * Retry with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

