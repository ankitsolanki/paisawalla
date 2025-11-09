// Form 3 Schema - 6 fields (short form)
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
    label: 'Loan Amount',
    type: 'number',
    required: true,
    rules: ['required', 'numeric', { type: 'min', params: [1000] }],
    step: 100,
  },
  zipCode: {
    label: 'ZIP Code',
    type: 'text',
    required: true,
    rules: ['required', 'zipCode'],
  },
};

