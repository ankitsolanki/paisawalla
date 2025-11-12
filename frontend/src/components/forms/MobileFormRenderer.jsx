import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../ui/ErrorBoundary';
import Button from '../ui/Button';
import FieldRenderer from '../FieldRenderer';
import MobileStepper from '../MobileStepper';
import SubmitSuccess from '../SubmitSuccess';
import EligibilityChecking from '../EligibilityChecking';
import OffersListing from '../../embeds/offers/OffersListing';
import { validateFormData, validateField } from '../../utils/validation';
import { executeRecaptcha } from '../../utils/recaptcha';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import { tokens } from '../../design-system/tokens';

/**
 * MobileFormRenderer - Optimized for mobile devices (< 640px)
 * Features:
 * - Single column layout
 * - Larger touch targets (min 44px)
 * - Reduced padding for screen space
 * - Stacked buttons
 * - Simplified stepper
 */
const MobileFormRenderer = ({ schema, theme = 'light' }) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [recaptchaToken, setRecaptchaToken] = React.useState(null);
  const [recaptchaError, setRecaptchaError] = React.useState(null);
  const [leadId, setLeadId] = React.useState(null);
  const [checkingEligibility, setCheckingEligibility] = React.useState(false);
  const [applicationId, setApplicationId] = React.useState(null);
  const [eligibilityError, setEligibilityError] = React.useState(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerified, setOtpVerified] = React.useState(false);

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking(schema.formId, formData, schema.steps > 1 ? currentStep : null);

  const getCurrentStepFields = React.useCallback(() => {
    const fields = schema.fields.filter((field) => field.step === currentStep);
    
    // For step 1, conditionally show OTP field only after OTP is sent
    if (currentStep === 1) {
      return fields.filter((field) => {
        if (field.name === 'otp') {
          return otpSent;
        }
        return true;
      });
    }
    
    return fields;
  }, [schema, currentStep, otpSent]);

  const getStepLabels = React.useCallback(() => {
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

  const handleChange = React.useCallback(
    (e) => {
      const { name, value } = e.target;
      
      // Get field schema to check if it's PAN number (ssn field)
      const field = schema.fields.find((f) => f.name === name);
      let processedValue = value;
      
      // Convert PAN number (ssn) to uppercase
      if (field && field.name === 'ssn' && typeof value === 'string') {
        processedValue = value.toUpperCase();
        // Update the input value to show uppercase
        e.target.value = processedValue;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
      trackFieldInteraction(name, 'change', processedValue);
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors, trackFieldInteraction, schema]
  );

  const handleBlur = React.useCallback(
    (e) => {
      const { name, value } = e.target;
      trackFieldInteraction(name, 'blur', value);
      const field = schema.fields.find((f) => f.name === name);
      if (field) {
        // Only validate if field has a value or is required
        // For number fields, 0 is a valid value, so check differently
        const hasValue = field.type === 'number' 
          ? (value !== undefined && value !== null && value !== '' && !isNaN(Number(value)))
          : (value !== undefined && value !== null && value !== '');
        if (hasValue || field.required) {
          const validation = validateField(value, field);
          if (!validation.isValid) {
            setErrors((prev) => ({ ...prev, [name]: validation.error }));
            trackFieldInteraction(name, 'error', value);
          } else {
            // Clear error if validation passes
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
            });
          }
        }
      }
    },
    [schema, trackFieldInteraction]
  );

  const handleFocus = React.useCallback(
    (e) => {
      const { name, value } = e.target;
      trackFieldInteraction(name, 'focus', value);
    },
    [trackFieldInteraction]
  );

  const validateCurrentStep = React.useCallback(() => {
    const currentFields = getCurrentStepFields();
    const stepErrors = {};
    let isValid = true;

    currentFields.forEach((field) => {
      const value = formData[field.name];
      
      // Simple check: is field empty?
      // For number fields, 0 is a valid value, so only check for empty/null/undefined
      const isEmpty = value === undefined || 
                      value === null || 
                      value === '' || 
                      (field.type === 'checkbox' && value === false) ||
                      (field.type === 'number' && (value === '' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')));
      
      if (isEmpty) {
        // Field is empty
        if (field.required) {
          stepErrors[field.name] = `${field.label} is required`;
          isValid = false;
        }
        // If not required and empty, skip validation
      } else {
        // Field has value - validate it
        const validation = validateField(value, field);
        if (!validation.isValid) {
          stepErrors[field.name] = validation.error;
          isValid = false;
        }
      }
    });

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData, getCurrentStepFields]);

  const sendOtp = React.useCallback(async (phone) => {
    setOtpSending(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      // await apiClient.post('/api/auth/send-otp', { phone });
      // For now, simulate OTP send
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOtpSent(true);
      trackButtonClick('otp_sent', { phone });
    } catch (error) {
      setErrors((prev) => ({ ...prev, phone: 'Failed to send OTP. Please try again.' }));
      trackButtonClick('otp_send_error', { error: error.message });
    } finally {
      setOtpSending(false);
    }
  }, [trackButtonClick]);

  const verifyOtp = React.useCallback(async (phone, otp) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // await apiClient.post('/api/auth/verify-otp', { phone, otp });
      // For now, accept any 6-digit OTP for testing
      if (!/^\d{6}$/.test(otp)) {
        setErrors((prev) => ({ ...prev, otp: 'Invalid OTP. Please enter a 6-digit code.' }));
        return false;
      }
      setOtpVerified(true);
      trackButtonClick('otp_verified', { phone });
      return true;
    } catch (error) {
      setErrors((prev) => ({ ...prev, otp: 'Invalid OTP. Please try again.' }));
      trackButtonClick('otp_verify_error', { error: error.message });
      return false;
    }
  }, [trackButtonClick]);

  const handleNext = React.useCallback(async () => {
    // Special handling for step 1 (phone + OTP flow)
    if (currentStep === 1) {
      const phoneField = schema.fields.find((f) => f.name === 'phone' && f.step === 1);
      const phoneValue = formData.phone;
      
      // Validate phone first
      if (phoneField) {
        const phoneValidation = validateField(phoneValue, phoneField);
        if (!phoneValidation.isValid) {
          setErrors((prev) => ({ ...prev, phone: phoneValidation.error }));
          return;
        }
      }
      
      // If OTP not sent yet, send it
      if (!otpSent) {
        await sendOtp(phoneValue);
        return;
      }
      
      // If OTP sent but not verified, verify it
      if (!otpVerified) {
        const otpField = schema.fields.find((f) => f.name === 'otp' && f.step === 1);
        const otpValue = formData.otp;
        
        if (otpField) {
          const otpValidation = validateField(otpValue, otpField);
          if (!otpValidation.isValid) {
            setErrors((prev) => ({ ...prev, otp: otpValidation.error }));
            return;
          }
        }
        
        const verified = await verifyOtp(phoneValue, otpValue);
        if (!verified) {
          return;
        }
      }
      
      // Validate rest of step 1 fields (consent checkboxes)
      if (!validateCurrentStep()) {
        return;
      }
    } else {
      // For other steps, normal validation
      if (!validateCurrentStep()) {
        return;
      }
    }
    
    trackButtonClick('next', { fromStep: currentStep, toStep: currentStep + 1 });
    // Clear errors for current step when moving forward
    const currentFieldNames = getCurrentStepFields().map(f => f.name);
    setErrors((prev) => {
      const newErrors = { ...prev };
      currentFieldNames.forEach(name => delete newErrors[name]);
      return newErrors;
    });
    setCurrentStep((prev) => Math.min(prev + 1, schema.steps));
  }, [currentStep, validateCurrentStep, schema.steps, schema.fields, formData, trackButtonClick, otpSent, otpVerified, sendOtp, verifyOtp, getCurrentStepFields]);

  const handlePrevious = React.useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    // Clear errors when going back
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);

  const handleSubmit = React.useCallback(async () => {
    if (!validateCurrentStep()) return;

    const validation = validateFormData(formData, schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

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

      const submittedLeadId = response.data?._id || response.data?.leadId;
      setLeadId(submittedLeadId);
      setIsSubmitted(true);
      setCheckingEligibility(true);
      trackSubmitSuccess(submittedLeadId);
      webflowBridge.postMessage('formSubmitted', {
        success: true,
        leadId: submittedLeadId,
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

  // Clear errors when step changes
  React.useEffect(() => {
    // Clear all errors when navigating to a new step
    setErrors({});
  }, [currentStep]);

  React.useEffect(() => {
    if (schema.steps === 1 || currentStep === schema.steps) {
      import('../../utils/recaptcha').then(({ loadRecaptcha }) => {
        loadRecaptcha().catch((error) => {
          console.warn('reCAPTCHA load warning:', error);
        });
      });
    }
  }, [schema.steps, currentStep]);

  // Handle eligibility checking completion
  const handleEligibilityComplete = React.useCallback((appId) => {
    setApplicationId(appId);
    setCheckingEligibility(false);
    trackButtonClick('eligibility_complete', { applicationId: appId });
  }, [trackButtonClick]);

  const handleEligibilityError = React.useCallback((error) => {
    setEligibilityError(error);
    setCheckingEligibility(false);
    trackButtonClick('eligibility_error', { error: error.message });
  }, [trackButtonClick]);

  // Show eligibility checking screen
  if (checkingEligibility && leadId) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <EligibilityChecking
            leadId={leadId}
            onComplete={handleEligibilityComplete}
            onError={handleEligibilityError}
            theme={theme}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show offers listing after eligibility check
  if (applicationId && !checkingEligibility) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <OffersListing
            applicationId={applicationId}
            leadId={leadId}
            theme={theme}
            onStateChange={(status, data) => {
              webflowBridge.postMessage('offersStateChange', {
                status,
                applicationId,
                leadId,
                ...data,
              });
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show error state if eligibility check failed
  if (eligibilityError && !checkingEligibility) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <div
            style={{
              textAlign: 'center',
              padding: tokens.spacing['2xl'],
            }}
          >
            <h3
              style={{
                fontSize: tokens.typography.fontSize.xl,
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.colors.error[700],
                marginBottom: tokens.spacing.md,
              }}
            >
              Unable to check eligibility
            </h3>
            <p
              style={{
                fontSize: tokens.typography.fontSize.base,
                color: tokens.colors.gray[600],
                marginBottom: tokens.spacing.lg,
              }}
            >
              {eligibilityError.message || 'An error occurred while checking your eligibility. Please try again later.'}
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setEligibilityError(null);
                setCheckingEligibility(true);
              }}
            >
              Try Again
            </Button>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show success message if form submitted but eligibility check hasn't started
  if (isSubmitted && !checkingEligibility && !applicationId) {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <SubmitSuccess
            message={`Thank you! Your ${schema.title} has been submitted successfully. We'll review your information and get back to you soon.`}
            onCheckEligibility={() => {
              trackButtonClick('check_eligibility');
              if (leadId) {
                setCheckingEligibility(true);
              }
              webflowBridge.postMessage('checkEligibility', {
                formId: schema.formId,
                leadId,
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
            width: '100%',
            margin: '0 auto',
            padding: `${tokens.spacing.lg} ${tokens.spacing.md}`, // Better padding for mobile
          }}
        >
          {/* Header with title */}
          <div style={{ marginBottom: tokens.spacing.lg }}>
            <h2
              style={{
                fontSize: tokens.typography.fontSize['2xl'], // 1.5rem - better hierarchy
                fontWeight: tokens.typography.fontWeight.bold,
                marginBottom: tokens.spacing.xs,
                color: tokens.colors.gray[900],
                lineHeight: tokens.typography.lineHeight.tight,
              }}
            >
              {schema.title}
            </h2>
            {schema.steps > 1 && (
              <p
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.gray[500],
                  marginTop: tokens.spacing.xs,
                }}
              >
                Complete all steps to submit your application
              </p>
            )}
          </div>

          {/* Modern mobile stepper */}
          {schema.steps > 1 && stepLabels.length > 0 && (
            <MobileStepper
              currentStep={currentStep}
              totalSteps={schema.steps}
              steps={stepLabels}
            />
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Mobile: Modern card-based single column layout */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing.lg,
                marginBottom: tokens.spacing.xl,
              }}
            >
              {currentFields.map((field, index) => (
                <div
                  key={field.name}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: tokens.borderRadius.xl, // Larger radius for modern look
                    padding: tokens.spacing.lg, // More padding for breathing room
                    border: `1px solid ${errors[field.name] ? tokens.colors.error[300] : tokens.colors.gray[200]}`,
                    boxShadow: errors[field.name]
                      ? `0 0 0 2px ${tokens.colors.error[500]}20, ${tokens.shadows.md}`
                      : tokens.shadows.sm,
                    transition: `all ${tokens.transitions.normal} ease-in-out`,
                    position: 'relative',
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
                  marginBottom: tokens.spacing.lg,
                  padding: tokens.spacing.md,
                  backgroundColor: tokens.colors.error[50],
                  border: `2px solid ${tokens.colors.error[500]}`,
                  borderRadius: tokens.borderRadius.lg,
                  color: tokens.colors.error[700],
                  fontSize: tokens.typography.fontSize.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  boxShadow: tokens.shadows.sm,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>{errors.submit}</span>
              </div>
            )}

            {recaptchaError && (
              <div
                style={{
                  marginBottom: tokens.spacing.lg,
                  padding: tokens.spacing.md,
                  backgroundColor: tokens.colors.error[50],
                  border: `2px solid ${tokens.colors.error[500]}`,
                  borderRadius: tokens.borderRadius.lg,
                  color: tokens.colors.error[700],
                  fontSize: tokens.typography.fontSize.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: tokens.spacing.sm,
                  boxShadow: tokens.shadows.sm,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>{recaptchaError}</span>
              </div>
            )}

            {isLastStep && (
              <div style={{ marginBottom: tokens.spacing.md }}>
                <div id="recaptcha-container"></div>
              </div>
            )}

            {/* Mobile: Modern sticky button footer */}
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#ffffff',
                paddingTop: tokens.spacing.lg,
                paddingBottom: tokens.spacing.lg,
                marginTop: tokens.spacing.xl,
                marginLeft: `-${tokens.spacing.md}`,
                marginRight: `-${tokens.spacing.md}`,
                paddingLeft: tokens.spacing.md,
                paddingRight: tokens.spacing.md,
                borderTop: `1px solid ${tokens.colors.gray[200]}`,
                display: 'flex',
                flexDirection: 'column',
                gap: tokens.spacing.sm,
                zIndex: 10,
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)', // Subtle shadow for depth
              }}
            >
              {schema.steps > 1 && currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  fullWidth
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.medium,
                  }}
                >
                  ← Previous
                </Button>
              )}

              {isLastStep ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    boxShadow: `0 4px 12px ${tokens.colors.cta.primary}30`,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : '✓ Submit Application'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  fullWidth
                  disabled={otpSending}
                  loading={otpSending}
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    boxShadow: `0 4px 12px ${tokens.colors.cta.primary}30`,
                  }}
                >
                  {currentStep === 1 && !otpSent
                    ? otpSending
                      ? 'Sending OTP...'
                      : 'Send OTP'
                    : currentStep === 1 && !otpVerified
                    ? 'Verify OTP'
                    : `Continue → Step ${currentStep + 1}`}
                </Button>
              )}
            </div>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default MobileFormRenderer;

