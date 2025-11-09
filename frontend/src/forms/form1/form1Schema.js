// Form 1 Schema - 25 fields organized into steps
export default {
  // Step 1: Personal Information
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
  dateOfBirth: {
    label: 'Date of Birth',
    type: 'date',
    required: true,
    rules: ['required'],
  },
  ssn: {
    label: 'Social Security Number',
    type: 'text',
    required: true,
    rules: ['required', 'ssn'],
    placeholder: 'XXX-XX-XXXX',
  },

  // Step 2: Address Information
  address: {
    label: 'Street Address',
    type: 'text',
    required: true,
    rules: ['required'],
    fullWidth: true,
  },
  city: {
    label: 'City',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  state: {
    label: 'State',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'CA', label: 'California' },
      { value: 'NY', label: 'New York' },
      { value: 'TX', label: 'Texas' },
      // Add more states
    ],
  },
  zipCode: {
    label: 'ZIP Code',
    type: 'text',
    required: true,
    rules: ['required', 'zipCode'],
  },
  yearsAtAddress: {
    label: 'Years at Current Address',
    type: 'number',
    required: true,
    rules: ['required', 'numeric'],
  },

  // Step 3: Employment Information
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
      { value: 'student', label: 'Student' },
    ],
  },
  employerName: {
    label: 'Employer Name',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  jobTitle: {
    label: 'Job Title',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  monthlyIncome: {
    label: 'Monthly Income',
    type: 'number',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [0] }],
    step: 0.01,
  },
  yearsEmployed: {
    label: 'Years at Current Job',
    type: 'number',
    required: true,
    rules: ['required', 'numeric'],
  },

  // Step 4: Loan Details
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
  creditScore: {
    label: 'Credit Score (if known)',
    type: 'number',
    required: false,
    rules: [{ type: 'min', params: [300] }, { type: 'max', params: [850] }],
  },
  bankAccountNumber: {
    label: 'Bank Account Number',
    type: 'text',
    required: true,
    rules: ['required'],
  },
  routingNumber: {
    label: 'Routing Number',
    type: 'text',
    required: true,
    rules: ['required'],
  },

  // Step 5: Additional Information
  hasCoSigner: {
    label: 'Do you have a co-signer?',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  previousLoans: {
    label: 'Have you had previous loans?',
    type: 'select',
    required: true,
    rules: ['required'],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  consentMarketing: {
    label: 'I consent to receive marketing communications',
    type: 'checkbox',
    required: false,
  },
  consentCreditCheck: {
    label: 'I consent to a credit check',
    type: 'checkbox',
    required: true,
    rules: ['required'],
  },

  // Step organization
  steps: [
    ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'ssn'],
    ['address', 'city', 'state', 'zipCode', 'yearsAtAddress'],
    ['employmentStatus', 'employerName', 'jobTitle', 'monthlyIncome', 'yearsEmployed'],
    ['loanAmount', 'loanPurpose', 'creditScore', 'bankAccountNumber', 'routingNumber'],
    ['hasCoSigner', 'previousLoans', 'consentMarketing', 'consentCreditCheck'],
  ],
};

