import mongoose from 'mongoose';

const breSessionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    breRequestId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'completed', 'failed'],
      default: 'initiated',
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
breSessionSchema.index({ applicationId: 1 });
breSessionSchema.index({ breRequestId: 1 });
breSessionSchema.index({ status: 1 });
breSessionSchema.index({ createdAt: -1 });

export const BreSession = mongoose.model('BreSession', breSessionSchema);

