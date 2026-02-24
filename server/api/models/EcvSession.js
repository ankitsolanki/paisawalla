import mongoose from 'mongoose';

const ecvSessionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    phone: {
      type: String,
      required: true,
    },
    stgOneHitId: {
      type: String,
    },
    stgTwoHitId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['registered', 'otp_sent', 'verified', 'failed', 'expired'],
      default: 'registered',
    },
    creditScore: {
      type: Number,
    },
    creditReportData: {
      type: mongoose.Schema.Types.Mixed,
    },
    errorMessage: String,
    verifiedAt: Date,
  },
  {
    timestamps: true,
  }
);

ecvSessionSchema.index({ phone: 1 });
ecvSessionSchema.index({ applicationId: 1 });
ecvSessionSchema.index({ leadId: 1 });
ecvSessionSchema.index({ status: 1 });
ecvSessionSchema.index({ createdAt: -1 });

export const EcvSession = mongoose.model('EcvSession', ecvSessionSchema);
