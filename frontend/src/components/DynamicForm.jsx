import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '../design-system/ThemeProvider';
import { useFormTracking } from '../hooks/useFormTracking';
import ErrorBoundary from './ui/ErrorBoundary';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from './ui/Button';
import FieldRenderer from './FieldRenderer';
import FormStepper from './FormStepper';
import ProgressBar from './ProgressBar';
import SubmitSuccess from './SubmitSuccess';
import { validateFormData, validateField } from '../utils/validation';
import { executeRecaptcha } from '../utils/recaptcha';
import apiClient from '../utils/apiClient';
import { webflowBridge } from '../embed/webflowBridge';
import { tokens } from '../design-system/tokens';

/**
 * DynamicForm - Renders forms dynamically from JSON schema
 */
const DynamicForm = ({ schema, theme = 'light' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking(schema.formId, formData, schema.steps > 1 ? currentStep : null);

  // Get fields for current step
  const getCurrentStepFields = useCallback(() => {
    return schema.fields.filter((field) => field.step === currentStep);
  }, [schema, currentStep]);

  // Get step labels
  const getStepLabels = useCallback(() => {
    if (schema.steps === 1) return [];
    const steps = [];
    for (let i = 1; i <= schema.steps; i++) {
      const stepFields = schema.fields.filter((f) => f.step === i);
      const firstField = stepFields[0];
      steps.push({
        label: firstField?.stepLabel || `Step ${i}`,
      });
    }
    return steps;
  }, [schema]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      trackFieldInteraction(name, 'change', value);

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors, trackFieldInteraction]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      trackFieldInteraction(name, 'blur', value);

      // Find field in schema
      const field = schema.fields.find((f) => f.name === name);
      if (field) {
        const validation = validateField(value, field);
        if (!validation.isValid) {
          setErrors((prev) => ({ ...prev, [name]: validation.error }));
          trackFieldInteraction(name, 'error', value);
        }
      }
    },
    [schema, trackFieldInteraction]
  );

  const handleFocus = useCallback(
    (e) => {
      const { name, value } = e.target;
      trackFieldInteraction(name, 'focus', value);
    },
    [trackFieldInteraction]
  );

  const validateCurrentStep = useCallback(() => {
    const currentFields = getCurrentStepFields();
    const stepErrors = {};
    let isValid = true;

    currentFields.forEach((field) => {
      const value = formData[field.name];
      const validation = validateField(value, field);

      if (!validation.isValid) {
        stepErrors[field.name] = validation.error;
        isValid = false;
      }
    });

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData, getCurrentStepFields]);

  const handleNext = useCallback(() => {
    if (validateCurrentStep()) {
      trackButtonClick('next', { fromStep: currentStep, toStep: currentStep + 1 });
      setCurrentStep((prev) => Math.min(prev + 1, schema.steps));
    }
  }, [currentStep, validateCurrentStep, schema.steps, trackButtonClick]);

  const handlePrevious = useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);

  const handleSubmit = useCallback(async () => {
    // Validate current step first
    if (!validateCurrentStep()) {
      return;
    }

    // Validate entire form
    const validation = validateFormData(formData, schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Get reCAPTCHA token
    let token = recaptchaToken;
    if (!token) {
      try {
        trackButtonClick('recaptcha_start');
        token = await executeRecaptcha('submit');
        setRecaptchaToken(token);
        setRecaptchaError(null);
      } catch (error) {
        setRecaptchaError('reCAPTCHA verification failed. Please try again.');
        trackSubmitError(error);
        return;
      }
    }

    trackSubmitStart();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post(schema.submitEndpoint, {
        ...validation.data,
        formType: schema.formId,
        recaptchaToken: token,
      });

      setIsSubmitted(true);
      trackSubmitSuccess(response.data?._id || response.data?.leadId);
      webflowBridge.postMessage('formSubmitted', {
        success: true,
        leadId: response.data?._id || response.data?.leadId,
        formId: schema.formId,
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
        formId: schema.formId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateCurrentStep,
    formData,
    schema,
    recaptchaToken,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  ]);

  // Load reCAPTCHA on mount
  useEffect(() => {
    if (schema.steps === 1 || currentStep === schema.steps) {
      import('../utils/recaptcha').then(({ loadRecaptcha }) => {
        loadRecaptcha().catch((error) => {
          console.warn('reCAPTCHA load warning:', error);
        });
      });
    }
  }, [schema.steps, currentStep]);

  if (isSubmitted) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <SubmitSuccess
            message={`Thank you! Your ${schema.title} has been submitted successfully. We'll review your information and get back to you soon.`}
            onCheckEligibility={() => {
              trackButtonClick('check_eligibility');
              webflowBridge.postMessage('checkEligibility', {
                formId: schema.formId,
              });
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const currentFields = getCurrentStepFields();
  const stepLabels = getStepLabels();
  const isLastStep = currentStep === schema.steps;

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            maxWidth: schema.steps > 1 ? '56rem' : '42rem',
            margin: '0 auto',
            padding: tokens.spacing.lg,
          }}
        >
          <h2
            style={{
              fontSize: tokens.typography.fontSize['2xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              marginBottom: tokens.spacing.lg,
              color: tokens.colors.gray[900],
            }}
          >
            {schema.title}
          </h2>

          {schema.steps > 1 && stepLabels.length > 0 && (
            <>
              <FormStepper
                currentStep={currentStep}
                totalSteps={schema.steps}
                steps={stepLabels}
              />
              <ProgressBar current={currentStep} total={schema.steps} />
            </>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: tokens.spacing.md,
                marginBottom: tokens.spacing.lg,
              }}
            >
              {currentFields.map((field) => (
                <div
                  key={field.name}
                  style={{
                    gridColumn: field.fullWidth ? '1 / -1' : 'auto',
                  }}
                >
                  <FieldRenderer
                    field={field}
                    value={formData[field.name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    error={errors[field.name]}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>

            {errors.submit && (
              <div
                style={{
                  marginBottom: tokens.spacing.md,
                  padding: tokens.spacing.md,
                  backgroundColor: tokens.colors.error[50],
                  border: `1px solid ${tokens.colors.error[500]}`,
                  borderRadius: tokens.borderRadius.md,
                  color: tokens.colors.error[700],
                }}
              >
                {errors.submit}
              </div>
            )}

            {recaptchaError && (
              <div
                style={{
                  marginBottom: tokens.spacing.md,
                  padding: tokens.spacing.md,
                  backgroundColor: tokens.colors.error[50],
                  border: `1px solid ${tokens.colors.error[500]}`,
                  borderRadius: tokens.borderRadius.md,
                  color: tokens.colors.error[700],
                }}
              >
                {recaptchaError}
              </div>
            )}

            {isLastStep && (
              <div style={{ marginBottom: tokens.spacing.lg }}>
                <div id="recaptcha-container"></div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: schema.steps > 1 ? 'space-between' : 'flex-end',
                marginTop: tokens.spacing.xl,
                gap: tokens.spacing.md,
              }}
            >
              {schema.steps > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isSubmitting}
                >
                  Previous
                </Button>
              )}

              {isLastStep ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  fullWidth={schema.steps === 1}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  fullWidth={schema.steps === 1}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default DynamicForm;

