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
    type: 'number',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [10000] }, { type: 'max', params: [1000000] }],
    step: 1000,
    placeholder: 'From ₹10,000 to ₹10 Lakh',
  },
  zipCode: {
    label: 'PIN Code',
    type: 'text',
    required: true,
    rules: ['required', 'zipCode'],
    placeholder: 'Enter your 6-digit PIN code',
  },
};

