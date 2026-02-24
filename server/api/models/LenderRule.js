import mongoose from 'mongoose';

const lenderRuleSchema = new mongoose.Schema({
  lenderName: { type: String, required: true, index: true },
  srNo: { type: Number, default: 0 },
  creditRule: { type: String, default: '' },
  logicalDescription: { type: String, default: '' },
  policyCode: { type: String, default: '' },
  decision: { type: String, default: '' },
  ruleConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: false,
  collection: 'lender_rules',
});

const LenderRule = mongoose.model('LenderRule', lenderRuleSchema);

export default LenderRule;
