import mongoose from 'mongoose';

const formAbandonmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    formType: {
      type: String,
      enum: ['form1', 'form2', 'form3'],
      required: true,
      index: true,
    },
    // Form data at abandonment (sanitized)
    formData: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Timing information
    timeOnForm: {
      type: Number, // milliseconds
      required: true,
    },
    timeSinceLastInteraction: {
      type: Number, // milliseconds
      required: true,
    },
    // Progress information
    filledFields: {
      type: Number,
      required: true,
    },
    totalFields: {
      type: Number,
      required: true,
    },
    completionPercentage: {
      type: Number,
      required: true,
    },
    // UTM parameters
    utmParams: {
      utm_source: String,
      utm_medium: String,
      utm_campaign: String,
      utm_term: String,
      utm_content: String,
      referrer: String,
    },
    // Page information
    pageUrl: String,
    pagePath: String,
    // User fingerprint
    userFingerprint: {
      userAgent: String,
      language: String,
      screenWidth: Number,
      screenHeight: Number,
      timezone: String,
    },
    // Abandonment reason (if detectable)
    abandonmentReason: {
      type: String,
      enum: ['inactivity', 'page_visibility', 'page_unload', 'error', 'unknown'],
      default: 'unknown',
    },
    // Lead ID if lead was created before abandonment
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
formAbandonmentSchema.index({ sessionId: 1, createdAt: -1 });
formAbandonmentSchema.index({ formType: 1, createdAt: -1 });
formAbandonmentSchema.index({ 'utmParams.utm_source': 1, createdAt: -1 });
formAbandonmentSchema.index({ leadId: 1, createdAt: -1 });
formAbandonmentSchema.index({ completionPercentage: 1, createdAt: -1 });

export const FormAbandonment = mongoose.model('FormAbandonment', formAbandonmentSchema);

