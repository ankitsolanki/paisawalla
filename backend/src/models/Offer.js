import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    lenderId: {
      type: String,
      required: true,
    },
    lenderName: {
      type: String,
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    termMonths: {
      type: Number,
      required: true,
    },
    monthlyPayment: {
      type: Number,
      required: true,
    },
    apr: {
      type: Number,
      required: true,
    },
    offerType: {
      type: String,
      enum: ['pre-approved', 'conditional', 'standard'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['available', 'accepted', 'expired', 'withdrawn'],
      default: 'available',
    },
    expiresAt: Date,
    offerData: {
      type: mongoose.Schema.Types.Mixed, // Additional lender-specific data
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
offerSchema.index({ applicationId: 1 });
offerSchema.index({ lenderId: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ createdAt: -1 });

export const Offer = mongoose.model('Offer', offerSchema);

