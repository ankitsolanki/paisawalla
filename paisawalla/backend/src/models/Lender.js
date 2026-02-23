import mongoose from 'mongoose';

const lenderSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  maxLoanAmount: { type: Number, required: true },
  maxTenureMonths: { type: Number, required: true },
  minRoi: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isFallback: { type: Boolean, default: false },
}, {
  timestamps: false,
  collection: 'lenders',
});

const Lender = mongoose.model('Lender', lenderSchema);

export default Lender;
