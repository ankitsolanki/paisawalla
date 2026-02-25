import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    applicationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'bre_processing', 'bre_completed', 'ecv_checked', 'offers_available', 'accepted', 'rejected'],
      default: 'pending',
    },
    breRequestId: {
      type: String, // BRE service request ID
    },
    breStatus: {
      type: String,
      enum: ['pending', 'initiated', 'processing', 'completed', 'failed', 'ecv_fallback', 'rule_engine_fallback'],
    },
    breCompletedAt: Date,
    // Application data snapshot
    applicationData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.pre('save', async function () {
  if (!this.applicationNumber) {
    const count = await mongoose.model('Application').countDocuments();
    this.applicationNumber = `APP-${Date.now()}-${count + 1}`;
  }
});

// Indexes
applicationSchema.index({ leadId: 1 });
// applicationNumber index is automatically created by unique: true
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);

