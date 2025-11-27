import React, { Suspense } from 'react';
import DynamicForm from '../../components/DynamicForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import form2Schema from './form2.schema.json';

/**
 * Form 2 - Get Started (11 fields, single step)
 */
const Form2 = ({ theme = 'light', title, description }) => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <DynamicForm schema={form2Schema} theme={theme} title={title} description={description} />
    </Suspense>
  );
};

export default Form2;

