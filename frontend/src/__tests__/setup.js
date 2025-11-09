import '@testing-library/jest-dom';

// Mock window.analytics
global.window.analytics = {
  track: jest.fn(),
  trackFormView: jest.fn(),
  trackFieldInteraction: jest.fn(),
  trackStepChange: jest.fn(),
  trackFormSubmitStart: jest.fn(),
  trackFormSubmitSuccess: jest.fn(),
  trackFormSubmitError: jest.fn(),
  trackFormAbandonment: jest.fn(),
  trackButtonClick: jest.fn(),
};

// Mock environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.VITE_RECAPTCHA_SITE_KEY = 'test-site-key';

