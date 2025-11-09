// Form 2 Schema - 11 fields (medium form)
export default {
  firstName: {
    label: 'First Name',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  lastName: {
    label: 'Last Name',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  email: {
    label: 'Email Address',
    type: 'email',
    required: true,
    rules: ['required', 'email'],
  },
  phone: {
    label: 'Phone Number',
    type: 'tel',
    required: true,
    rules: ['required', 'phone'],
  },
  loanAmount: {
    label: 'Desired Loan Amount',
    type: 'number',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [1000] }],
    step: 100,
  },
  loanPurpose: {
    label: 'Loan Purpose',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'debt_consolidation', label: 'Debt Consolidation' },
      { value: 'home_improvement', label: 'Home Improvement' },
      { value: 'major_purchase', label: 'Major Purchase' },
      { value: 'medical_expenses', label: 'Medical Expenses' },
      { value: 'other', label: 'Other' },
    ],
  },
  employmentStatus: {
    label: 'Employment Status',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'employed', label: 'Employed' },
      { value: 'self-employed', label: 'Self-Employed' },
      { value: 'unemployed', label: 'Unemployed' },
      { value: 'retired', label: 'Retired' },
    ],
  },
  monthlyIncome: {
    label: 'Monthly Income',
    type: 'number',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [0] }],
    step: 0.01,
  },
  creditScore: {
    label: 'Credit Score (if known)',
    type: 'number',
    required: false,
    rules: [{ type: 'min', params: [300] }, { type: 'max', params: [850] }],
  },
  zipCode: {
    label: 'ZIP Code',
    type: 'text',
    required: true,
    rules: ['required', 'zipCode'],
  },
  consentMarketing: {
    label: 'I consent to receive marketing communications',
    type: 'checkbox',
    required: false,
  },
};

