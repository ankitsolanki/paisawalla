import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MAX_RETRY_ATTEMPTS = parseInt(process.env.MONGODB_RETRY_ATTEMPTS) || 5;
const RETRY_DELAY = parseInt(process.env.MONGODB_RETRY_DELAY) || 5000;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  let attempts = 0;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
      });
      
      logger.info('MongoDB connected successfully', {
        uri: mongoURI.replace(/\/\/.*@/, '//***@'), // Mask credentials in logs
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      attempts++;
      
      if (attempts < MAX_RETRY_ATTEMPTS) {
        logger.warn(`MongoDB connection attempt ${attempts} failed, retrying...`, {
          error: error.message,
          nextAttemptIn: `${RETRY_DELAY}ms`,
        });
        
        setTimeout(connectWithRetry, RETRY_DELAY);
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

