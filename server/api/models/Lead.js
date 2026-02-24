import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    formType: {
      type: String,
      enum: ['form1', 'form2', 'form3'],
      required: true,
    },
    // Personal Information
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    // Address Information
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // Employment Information
    employmentStatus: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'retired', 'student'],
    },
    employerName: String,
    jobTitle: String,
    monthlyIncome: Number,
    // Loan Information
    loanAmount: Number,
    loanPurpose: String,
    creditScore: Number,
    // Additional fields for Form 1 (25 fields)
    ssn: String, // Encrypted in production
    bankAccountNumber: String, // Encrypted in production
    // Metadata
    source: String, // Webflow page URL
    ipAddress: String,
    userAgent: String,
    recaptchaScore: Number,
    // Status
    status: {
      type: String,
      enum: ['new', 'qualified', 'application_created', 'rejected'],
      default: 'new',
    },
  },
  {
    timestamps: true,
    strict: false, // Allow all fields to be saved (for dynamic form fields)
  }
);

// Indexes
leadSchema.index({ email: 1 }, { sparse: true });
leadSchema.index({ phone: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1 });

export const Lead = mongoose.model('Lead', leadSchema);

