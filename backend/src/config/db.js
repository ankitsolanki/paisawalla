import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_RETRY_ATTEMPTS = parseInt(process.env.MONGODB_RETRY_ATTEMPTS, 10) || 5;
const RETRY_DELAY = parseInt(process.env.MONGODB_RETRY_DELAY, 10) || 5000;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  let attempts = 0;

  // Set up event handlers BEFORE connecting
  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000, // Increased timeout
        maxPoolSize: 10,
        minPoolSize: 2,
        bufferCommands: false,
      });
      
      logger.info('MongoDB connected successfully', {
        uri: mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Better credential masking
      });
    } catch (error) {
      attempts++;
      
      if (attempts < MAX_RETRY_ATTEMPTS) {
        logger.warn(`MongoDB connection attempt ${attempts} failed, retrying...`, {
          error: error.message,
          nextAttemptIn: `${RETRY_DELAY}ms`,
        });
        
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return connectWithRetry();
      } else {
        logger.error('MongoDB connection failed after max retries', {
          attempts,
          error: error.message,
        });
        throw error;
      }
    }
  };

  await connectWithRetry();
};

