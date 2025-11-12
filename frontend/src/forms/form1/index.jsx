import React, { Suspense } from 'react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Form1Component from './Form1';

/**
 * Form 1 - Personal Loan Application (matches CSV sheet exactly)
 */
const Form1 = ({ theme = 'light' }) => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Form1Component theme={theme} />
    </Suspense>
  );
};

export default Form1;

