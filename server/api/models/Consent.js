import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    consentType: {
      type: String,
      enum: ['marketing', 'credit_check', 'data_sharing', 'terms_accepted'],
      required: true,
    },
    consentGiven: {
      type: Boolean,
      required: true,
    },
    consentText: String, // Snapshot of consent text at time of consent
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
consentSchema.index({ leadId: 1 });
consentSchema.index({ consentType: 1 });
consentSchema.index({ timestamp: -1 });

export const Consent = mongoose.model('Consent', consentSchema);

