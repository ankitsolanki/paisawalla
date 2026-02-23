import mongoose from 'mongoose';

const breSessionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    correlationId: {
      type: String,
    },
    experianApplicationId: {
      type: String,
    },
    serviceContextId: {
      type: String,
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
    parsedResult: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

breSessionSchema.index({ applicationId: 1 });
breSessionSchema.index({ experianApplicationId: 1 });
breSessionSchema.index({ correlationId: 1 });
breSessionSchema.index({ status: 1 });
breSessionSchema.index({ createdAt: -1 });

export const BreSession = mongoose.model('BreSession', breSessionSchema);
