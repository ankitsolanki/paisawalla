/**
 * reCAPTCHA utility functions
 */

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

/**
 * Validate reCAPTCHA site key
 */
const validateSiteKey = () => {
  if (!RECAPTCHA_SITE_KEY || RECAPTCHA_SITE_KEY.trim() === '') {
    throw new Error(
      'reCAPTCHA site key is not configured. Please set VITE_RECAPTCHA_SITE_KEY in your .env file. ' +
      'See ENV_SETUP.md for instructions on obtaining reCAPTCHA keys from https://www.google.com/recaptcha/admin'
    );
  }
  return true;
};

/**
 * Load reCAPTCHA script dynamically
 */
export const loadRecaptcha = () => {
  return new Promise((resolve, reject) => {
    // Validate site key before attempting to load
    try {
      validateSiteKey();
    } catch (error) {
      reject(error);
      return;
    }

    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          resolve(window.grecaptcha);
        });
      } else {
        reject(new Error('reCAPTCHA failed to load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA script'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Execute reCAPTCHA v3
 */
export const executeRecaptcha = async (action = 'submit') => {
  try {
    // Validate site key before execution
    validateSiteKey();
    
    const grecaptcha = await loadRecaptcha();
    const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution error:', error);
    
    // Provide more helpful error message
    if (error.message.includes('site key is not configured')) {
      throw new Error(
        'reCAPTCHA is not configured. Please set VITE_RECAPTCHA_SITE_KEY in your .env file. ' +
        'For development, you can get test keys from https://www.google.com/recaptcha/admin'
      );
    }
    
    throw new Error('reCAPTCHA verification failed: ' + error.message);
  }
};

/**
 * Get reCAPTCHA site key
 */
export const getRecaptchaSiteKey = () => {
  return RECAPTCHA_SITE_KEY;
};

