export const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoURI: process.env.MONGODB_URI,
  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174',
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

  // Validate MongoDB URI format
  if (env.mongoURI && !env.mongoURI.startsWith('mongodb://') && !env.mongoURI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }
};

