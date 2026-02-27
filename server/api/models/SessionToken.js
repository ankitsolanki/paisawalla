import mongoose from 'mongoose';

const sessionTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  applicationId: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

export const SessionToken = mongoose.model('SessionToken', sessionTokenSchema);
