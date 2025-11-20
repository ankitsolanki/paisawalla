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
      enum: ['pending', 'bre_processing', 'bre_completed', 'offers_available', 'accepted', 'rejected'],
      default: 'pending',
    },
    breRequestId: {
      type: String, // BRE service request ID
    },
    breStatus: {
      type: String,
      enum: ['pending', 'initiated', 'processing', 'completed', 'failed'],
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

// Generate application number
applicationSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    const count = await Application.countDocuments();
    this.applicationNumber = `APP-${Date.now()}-${count + 1}`;
  }
  next();
});

// Indexes
applicationSchema.index({ leadId: 1 });
// applicationNumber index is automatically created by unique: true
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);

