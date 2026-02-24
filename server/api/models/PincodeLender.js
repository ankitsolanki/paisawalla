import mongoose from 'mongoose';

const pincodeLenderSchema = new mongoose.Schema({
  pincode: { type: String, required: true, index: true },
  lenderName: { type: String, required: true },
  isServiceable: { type: Boolean, default: true },
}, {
  timestamps: false,
  collection: 'pincode_lenders',
});

pincodeLenderSchema.index({ pincode: 1, lenderName: 1 }, { unique: true });

const PincodeLender = mongoose.model('PincodeLender', pincodeLenderSchema);

export default PincodeLender;
