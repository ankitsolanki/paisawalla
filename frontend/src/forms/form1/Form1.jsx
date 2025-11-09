import React, { useState, useCallback, lazy, Suspense } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormStepper from '../../components/FormStepper';
import ProgressBar from '../../components/ProgressBar';
import SubmitSuccess from '../../components/SubmitSuccess';
import { validateField, validateForm } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import form1Schema from './form1Schema';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const Form1 = ({ theme = 'light' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const steps = [
    { label: 'Personal Info' },
    { label: 'Address' },
    { label: 'Employment' },
    { label: 'Loan Details' },
    { label: 'Review' },
  ];

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking('form1', formData, currentStep);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Track field change
    trackFieldInteraction(name, 'change', value);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors, trackFieldInteraction]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'blur', value);
    
    const fieldSchema = form1Schema[name];
    if (fieldSchema && fieldSchema.rules) {
      const error = validateField(value || '', fieldSchema.rules);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        trackFieldInteraction(name, 'error', value);
      }
    }
  }, [trackFieldInteraction]);

  const handleFocus = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'focus', value);
  }, [trackFieldInteraction]);

  const validateStep = useCallback((step) => {
    const stepFields = form1Schema.steps[step - 1] || [];
    const stepErrors = {};
    let isValid = true;

    stepFields.forEach((fieldName) => {
      const fieldSchema = form1Schema[fieldName];
      if (fieldSchema && fieldSchema.rules) {
        const error = validateField(formData[fieldName] || '', fieldSchema.rules);
        if (error) {
          stepErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      trackButtonClick('next', { fromStep: currentStep, toStep: currentStep + 1 });
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  }, [currentStep, validateStep, steps.length, trackButtonClick]);

  const handlePrevious = useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!recaptchaToken) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: 'Please complete the reCAPTCHA verification',
      }));
      return;
    }

    trackSubmitStart();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/leads', {
        ...formData,
        formType: 'form1',
        recaptchaToken,
      });

      setIsSubmitted(true);
      trackSubmitSuccess(response.data._id);
      webflowBridge.postMessage('formSubmitted', {
        success: true,
        leadId: response.data._id,
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || 'Failed to submit form. Please try again.',
      }));
      trackSubmitError(error);
      webflowBridge.postMessage('formSubmitted', {
        success: false,
        error: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, validateStep, recaptchaToken, formData, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

  const handleRecaptchaChange = useCallback((token) => {
    setRecaptchaToken(token);
    if (errors.recaptcha) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.recaptcha;
        return newErrors;
      });
    }
  }, [errors.recaptcha]);

  const renderField = useCallback((fieldName) => {
    const fieldSchema = form1Schema[fieldName];
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
          key={fieldName}
          {...commonProps}
          options={fieldSchema.options || []}
        />
      );
    }

    if (fieldSchema.type === 'textarea') {
      return (
        <div key={fieldName} style={{ gridColumn: fieldSchema.fullWidth ? '1 / -1' : 'auto' }}>
          <label
            htmlFor={fieldName}
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {fieldSchema.label}
            {fieldSchema.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
          </label>
          <textarea
            id={fieldName}
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            rows={fieldSchema.rows || 3}
            required={fieldSchema.required}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              border: `1px solid ${errors[fieldName] ? '#ef4444' : '#d1d5db'}`,
              borderRadius: '0.375rem',
              outline: 'none',
            }}
            placeholder={fieldSchema.placeholder}
          />
          {errors[fieldName] && (
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>
              {errors[fieldName]}
            </p>
          )}
        </div>
      );
    }

    return (
      <Input
        key={fieldName}
        {...commonProps}
        type={fieldSchema.type || 'text'}
        min={fieldSchema.min}
        max={fieldSchema.max}
        step={fieldSchema.step}
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus]);

  if (isSubmitted) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <SubmitSuccess
            message="Your loan application has been submitted successfully. We'll review your information and get back to you soon."
            onCheckEligibility={() => {
              trackButtonClick('check_eligibility');
              webflowBridge.postMessage('checkEligibility', { leadId: formData.leadId });
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const currentStepFields = form1Schema.steps[currentStep - 1] || [];
  const currentFields = currentStepFields.map((fieldName) => ({
    name: fieldName,
    ...form1Schema[fieldName],
  }));

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Personal Loan Application
          </h2>
          
          <FormStepper currentStep={currentStep} totalSteps={steps.length} steps={steps} />
          <ProgressBar current={currentStep} total={steps.length} />

          <form onSubmit={(e) => e.preventDefault()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {currentStepFields.map(renderField)}
            </div>

            {errors.submit && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '0.375rem',
                color: '#dc2626',
              }}>
                {errors.submit}
              </div>
            )}

            {currentStep === steps.length && (
              <div style={{ marginBottom: '1.5rem' }}>
                <ReCAPTCHA
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                />
                {errors.recaptcha && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#dc2626' }}>
                    {errors.recaptcha}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form1);
