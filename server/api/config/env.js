export const env = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoURI: process.env.MONGODB_URI,
  karixOtpEncryptionKey: process.env.KARIX_OTP_ENCRYPTION_KEY,
  karixOtpEncryptionIv: process.env.KARIX_OTP_ENCRYPTION_IV,
  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174',
  logLevel: process.env.LOG_LEVEL || 'info',
  experian: {
    baseUrl: process.env.EXPERIAN_BASE_URL || 'https://uat-in-api.experian.com',
    clientId: process.env.EXPERIAN_CLIENT_ID,
    clientSecret: process.env.EXPERIAN_CLIENT_SECRET,
    username: process.env.EXPERIAN_USERNAME,
    password: process.env.EXPERIAN_PASSWORD,
    userDomain: process.env.EXPERIAN_USER_DOMAIN || 'theunimobile.com',
    clientName: process.env.EXPERIAN_CLIENT_NAME || '',
    voucherCode: process.env.EXPERIAN_VOUCHER_CODE || '',
  },
  experianBre: {
    baseUrl: process.env.EXPERIAN_BRE_BASE_URL || 'https://in-api.experian.com',
    brePath: process.env.EXPERIAN_BRE_PATH || '/decisionanalytics/experianone/nps6t36gvswc/services',
    clientId: process.env.EXPERIAN_BRE_CLIENT_ID,
    clientSecret: process.env.EXPERIAN_BRE_CLIENT_SECRET,
    username: process.env.EXPERIAN_BRE_USERNAME,
    password: process.env.EXPERIAN_BRE_PASSWORD,
    userDomain: process.env.EXPERIAN_USER_DOMAIN || 'theunimobile.com',
  },
};

const requiredVars = ['MONGODB_URI', 'KARIX_OTP_ENCRYPTION_KEY', 'KARIX_OTP_ENCRYPTION_IV'];
const optionalVars = ['RECAPTCHA_SECRET_KEY', 'RECAPTCHA_SITE_KEY'];

export const validateEnv = () => {
  const missing = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const missingOptional = optionalVars.filter((varName) => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn(`Optional environment variables not set: ${missingOptional.join(', ')}`);
  }

  if (env.mongoURI && !env.mongoURI.startsWith('mongodb://') && !env.mongoURI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  const ecvVars = ['EXPERIAN_CLIENT_ID', 'EXPERIAN_CLIENT_SECRET', 'EXPERIAN_USERNAME', 'EXPERIAN_PASSWORD'];
  const missingEcv = ecvVars.filter((v) => !process.env[v]);
  if (missingEcv.length > 0) {
    console.warn(`Experian ECV credentials not set (ECV will not work): ${missingEcv.join(', ')}`);
  }

  const breVars = ['EXPERIAN_BRE_CLIENT_ID', 'EXPERIAN_BRE_CLIENT_SECRET', 'EXPERIAN_BRE_USERNAME', 'EXPERIAN_BRE_PASSWORD'];
  const missingBre = breVars.filter((v) => !process.env[v]);
  if (missingBre.length > 0) {
    console.warn(`Experian BRE credentials not set (BRE will not work): ${missingBre.join(', ')}`);
  }
};
