// Form 3 Schema - Personal Loan Eligibility Form
export default {
  phone: {
    label: 'Mobile Number',
    type: 'tel',
    required: true,
    rules: ['required', 'phone'],
    placeholder: 'Enter your 10-digit mobile number',
  },
  firstName: {
    label: 'First Name',
    type: 'text',
    required: true,
    rules: ['required'],
    placeholder: 'Enter your first name',
  },
  lastName: {
    label: 'Last Name',
    type: 'text',
    required: true,
    rules: ['required'],
    placeholder: 'Enter your last name',
  },
  email: {
    label: 'Email Address',
    type: 'email',
    required: true,
    rules: ['required', 'email'],
    placeholder: 'Enter your email address',
  },
  loanAmount: {
    label: 'Loan Amount (₹)',
    type: 'currency',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [10000] }, { type: 'max', params: [100000000] }],
    placeholder: 'Enter loan amount (min ₹10,000, max ₹10,00,00,000)',
    min: 10000,
    max: 100000000,
  },
  zipCode: {
    label: 'PIN Code',
    type: 'pincode',
    required: true,
    rules: ['required', 'zipCode'],
    placeholder: 'Enter your 6-digit PIN code',
    cityFieldName: 'city',
    stateFieldName: 'state',
  },
};

