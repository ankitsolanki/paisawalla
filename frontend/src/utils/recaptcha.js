/**
 * reCAPTCHA utility functions
 */

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

/**
 * Load reCAPTCHA script dynamically
 */
export const loadRecaptcha = () => {
  return new Promise((resolve, reject) => {
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
    const grecaptcha = await loadRecaptcha();
    const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution error:', error);
    throw new Error('reCAPTCHA verification failed');
  }
};

/**
 * Get reCAPTCHA site key
 */
export const getRecaptchaSiteKey = () => {
  return RECAPTCHA_SITE_KEY;
};

