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
    type: 'currency',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [10000] }, { type: 'max', params: [100000000] }],
    min: 10000,
    max: 100000000,
  },
  loanPurpose: {
    label: 'Loan Purpose',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'Medical Emergency', label: 'Medical Emergency' },
      { value: 'Home Renovation', label: 'Home Renovation' },
      { value: 'Wedding /Marriage', label: 'Wedding /Marriage' },
      { value: 'Travel / Vacation', label: 'Travel / Vacation' },
      { value: 'Debt Consolidation', label: 'Debt Consolidation' },
      { value: 'Others', label: 'Others' },
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
    label: 'PIN Code',
    type: 'pincode',
    required: true,
    rules: ['required', 'zipCode'],
    placeholder: 'Enter 6-digit PIN code',
    cityFieldName: 'city',
    stateFieldName: 'state',
  },
  consentMarketing: {
    label: 'I consent to receive marketing communications',
    type: 'checkbox',
    required: false,
  },
};

