import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../ui/ErrorBoundary';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

/**
 * Base Form Component
 * Provides consistent structure and behavior for all forms
 */
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
    
    // Clear error when user starts typing
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
    
    // Validate field
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
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <form onSubmit={handleSubmit} {...props}>
          {renderField ? (
            Object.keys(schema || {}).map(renderField)
          ) : (
            Object.keys(schema || {}).map(renderFieldComponent)
          )}
          {errors.submit && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #ef4444', borderRadius: '0.375rem', color: '#dc2626' }}>
              {errors.submit}
            </div>
          )}
        </form>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default BaseForm;

