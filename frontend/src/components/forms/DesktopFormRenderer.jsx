import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../ui/ErrorBoundary';
import Button from '../ui/Button';
import FieldRenderer from '../FieldRenderer';
import FormStepper from '../FormStepper';
import ProgressBar from '../ProgressBar';
import SubmitSuccess from '../SubmitSuccess';
import EligibilityChecking from '../EligibilityChecking';
import OffersListing from '../../embeds/offers/OffersListing';
import { validateFormData, validateField } from '../../utils/validation';
import { executeRecaptcha } from '../../utils/recaptcha';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import { tokens } from '../../design-system/tokens';

/**
 * DesktopFormRenderer - Optimized for desktop devices (>= 1024px)
 * Features:
 * - Multi-column grid layout (3+ columns)
 * - Generous padding and spacing
 * - Side-by-side buttons
 * - Full feature set
 */
const DesktopFormRenderer = ({ schema, theme = 'light' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const [leadId, setLeadId] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking(schema.formId, formData, schema.steps > 1 ? currentStep : null);

  const getCurrentStepFields = useCallback(() => {
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

  const sendOtp = useCallback(async (phone) => {
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

  const verifyOtp = useCallback(async (phone, otp) => {
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

  const handleNext = useCallback(async () => {
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
    setCurrentStep((prev) => Math.min(prev + 1, schema.steps));
  }, [currentStep, validateCurrentStep, schema.steps, schema.fields, formData, trackButtonClick, otpSent, otpVerified, sendOtp, verifyOtp]);

  const handlePrevious = useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);

  const handleSubmit = useCallback(async () => {
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

  useEffect(() => {
    if (schema.steps === 1 || currentStep === schema.steps) {
      import('../../utils/recaptcha').then(({ loadRecaptcha }) => {
        loadRecaptcha().catch((error) => {
          console.warn('reCAPTCHA load warning:', error);
        });
      });
    }
  }, [schema.steps, currentStep]);

  // Handle eligibility checking completion
  const handleEligibilityComplete = useCallback((appId) => {
    setApplicationId(appId);
    setCheckingEligibility(false);
    trackButtonClick('eligibility_complete', { applicationId: appId });
  }, [trackButtonClick]);

  const handleEligibilityError = useCallback((error) => {
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
            maxWidth: schema.steps > 1 ? '56rem' : '42rem',
            margin: '0 auto',
            padding: tokens.spacing.xl,
          }}
        >
          <h2
            style={{
              fontSize: tokens.typography.fontSize['3xl'], // 2rem - larger on desktop
              fontWeight: tokens.typography.fontWeight.bold,
              marginBottom: tokens.spacing.xl,
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
            {/* Desktop: Multi-column grid (3+ columns) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: tokens.spacing.lg,
                marginBottom: tokens.spacing.xl,
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

            {/* Desktop: Side-by-side buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: schema.steps > 1 ? 'space-between' : 'flex-end',
                marginTop: tokens.spacing['2xl'],
                gap: tokens.spacing.lg,
              }}
            >
              {schema.steps > 1 && currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
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
                  disabled={otpSending}
                  loading={otpSending}
                >
                  {currentStep === 1 && !otpSent
                    ? otpSending
                      ? 'Sending OTP...'
                      : 'Send OTP'
                    : currentStep === 1 && !otpVerified
                    ? 'Verify OTP'
                    : 'Next'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default DesktopFormRenderer;

