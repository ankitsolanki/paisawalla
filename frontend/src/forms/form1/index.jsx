import React, { Suspense } from 'react';
import DynamicForm from '../../components/DynamicForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import form1Schema from './form1.schema.json';

/**
 * Form 1 - Personal Loan Application (25 fields, 5 steps)
 */
const Form1 = ({ theme = 'light' }) => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DynamicForm schema={form1Schema} theme={theme} />
    </Suspense>
  );
};

export default Form1;

