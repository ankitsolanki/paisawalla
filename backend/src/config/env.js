import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoURI: process.env.MONGODB_URI,
  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  breApiUrl: process.env.BRE_API_URL,
  breApiKey: process.env.BRE_API_KEY,
  bureauApiUrl: process.env.BUREAU_API_URL,
  bureauApiKey: process.env.BUREAU_API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables
const requiredVars = ['MONGODB_URI', 'RECAPTCHA_SECRET_KEY', 'RECAPTCHA_SITE_KEY'];

export const validateEnv = () => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

