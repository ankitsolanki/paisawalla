import React, { useState, useCallback } from 'react';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const BaseForm = ({
  formType,
  theme = 'light',
  schema,
  steps = null,
  onSubmit,
  children,
  renderField,
  ...props
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking(formType, formData, steps ? currentStep : null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'blur', value);
    
    if (schema && schema[name] && schema[name].rules) {
      const { validateField } = require('../../utils/validationRules');
      const error = validateField(value, schema[name].rules);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        trackFieldInteraction(name, 'error', value);
      }
    }
  }, [schema, trackFieldInteraction]);

  const handleFocus = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'focus', value);
  }, [trackFieldInteraction]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    trackSubmitStart();

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      setIsSubmitted(true);
      trackSubmitSuccess(result.leadId || result.id);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Failed to submit form. Please try again.',
      }));
      trackSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

  const renderFieldComponent = useCallback((fieldName) => {
    const fieldSchema = schema[fieldName];
    if (!fieldSchema) return null;

    const commonProps = {
      name: fieldName,
      label: fieldSchema.label,
      required: fieldSchema.required,
      value: formData[fieldName] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      error: errors[fieldName],
      fullWidth: fieldSchema.fullWidth !== false,
      placeholder: fieldSchema.placeholder,
    };

    if (fieldSchema.type === 'select') {
      return (
        <Select
          {...commonProps}
          options={fieldSchema.options || []}
        />
      );
    }

    if (fieldSchema.type === 'textarea') {
      return (
        <Input
          {...commonProps}
          type="textarea"
          rows={fieldSchema.rows || 3}
        />
      );
    }

    return (
      <Input
        {...commonProps}
        type={fieldSchema.type || 'text'}
        min={fieldSchema.min}
        max={fieldSchema.max}
        step={fieldSchema.step}
      />
    );
  }, [schema, formData, errors, handleChange, handleBlur, handleFocus]);

  if (isSubmitted && children) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit} {...props}>
        {renderField ? (
          Object.keys(schema || {}).map(renderField)
        ) : (
          Object.keys(schema || {}).map(renderFieldComponent)
        )}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-500 rounded-md text-red-600">
            {errors.submit}
          </div>
        )}
      </form>
    </ErrorBoundary>
  );
};

export default BaseForm;
