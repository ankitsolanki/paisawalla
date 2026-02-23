import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    formType: {
      type: String,
      enum: ['form1', 'form2', 'form3', null],
      index: true,
    },
    // Event data
    eventData: {
      type: mongoose.Schema.Types.Mixed,
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
    // Timestamp
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    // Lead ID if associated with a lead
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

// Indexes for common queries
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ formType: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ 'utmParams.utm_source': 1, timestamp: -1 });
analyticsEventSchema.index({ leadId: 1, timestamp: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

