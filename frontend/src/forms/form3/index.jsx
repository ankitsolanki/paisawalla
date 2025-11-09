import React, { Suspense } from 'react';
import DynamicForm from '../../components/DynamicForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import form3Schema from './form3.schema.json';

/**
 * Form 3 - Quick Quote (6 fields, single step)
 */
const Form3 = ({ theme = 'light' }) => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DynamicForm schema={form3Schema} theme={theme} />
    </Suspense>
  );
};

export default Form3;

