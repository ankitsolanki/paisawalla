import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ProgressBar from '../../components/ProgressBar';
import SubmitSuccess from '../../components/SubmitSuccess';
import EligibilityChecking from '../../components/EligibilityChecking';
import OffersListing from '../../embeds/offers/OffersListing';
import { validateField, validateForm } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import form1Schema from './form1Schema';

// Get reCAPTCHA site key from environment or window (for embedded forms)
// Only use if it's a valid key (not empty and has reasonable length)
const getRecaptchaKey = () => {
  const windowKey = typeof window !== 'undefined' ? window.VITE_RECAPTCHA_SITE_KEY : undefined;
  const envKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const key = windowKey || envKey || '';
  
  // Validate key - reCAPTCHA keys are typically 40 characters, minimum 20
  // Also check that it's not a placeholder or invalid value
  const isValid = key && 
      typeof key === 'string' &&
      key.trim() !== '' && 
      key.trim().length >= 20 && 
      !key.includes('your-key-here') &&
      !key.includes('placeholder') &&
      key.trim() !== 'undefined' &&
      key.trim() !== 'null';
  
  if (isValid) {
    return key.trim();
  }
  
  return '';
};

const RECAPTCHA_SITE_KEY = getRecaptchaKey();

const Form1 = ({ theme = 'light' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [stage, setStage] = useState('phone'); // 'phone' -> 'otp' -> 'form'
  const [ReCAPTCHA, setReCAPTCHA] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);

  // Dynamically load ReCAPTCHA only if we have a valid key
  useEffect(() => {
    if (RECAPTCHA_SITE_KEY && !ReCAPTCHA) {
      import('react-google-recaptcha')
        .then(module => {
          setReCAPTCHA(() => module.default);
        })
        .catch(() => {
          // Silently fail - reCAPTCHA is optional
        });
    }
  }, [ReCAPTCHA]);

  const steps = [
    { label: 'Personal Information' },
    { label: 'Employment Details' },
    { label: 'Address Details' },
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
    
    // Auto-capitalize PAN number
    const processedValue = name === 'panNumber' ? value.toUpperCase() : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    
    // Track field change
    trackFieldInteraction(name, 'change', processedValue);
    
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

  const handlePhoneSubmit = useCallback(async () => {
    // Validate phone
    const phoneRules = form1Schema.phone.rules;
    const phoneError = validateField(formData.phone || '', phoneRules);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }
    
    // Validate consent checkbox
    if (!formData.consentCreditCheck) {
      setErrors((prev) => ({ ...prev, consentCreditCheck: 'This field is required' }));
      return;
    }
    
    // Send OTP
    setOtpSending(true);
    try {
      // In production, POST to your OTP endpoint
      // await apiClient.post('/api/auth/send-otp', { phone: formData.phone });
      setStage('otp');
    } catch (error) {
      setErrors((prev) => ({ ...prev, phone: 'Failed to send OTP. Please try again.' }));
    } finally {
      setOtpSending(false);
    }
  }, [formData.phone, formData.consentCreditCheck]);

  const handleOtpSubmit = useCallback(async () => {
    // Validate OTP = 1234 (hardcoded for testing)
    if ((formData.otp || '').trim() !== '1234') {
      setErrors((prev) => ({ ...prev, otp: 'Invalid verification code. Please enter 1234 to continue.' }));
      return;
    }
    
    setOtpVerified(true);
    setStage('form');
    // In production, verify OTP via API
    // await apiClient.post('/api/auth/verify-otp', { phone: formData.phone, otp: formData.otp });
  }, [formData.otp]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Only require reCAPTCHA on final step if site key is configured AND reCAPTCHA hasn't errored
    if (currentStep === steps.length && RECAPTCHA_SITE_KEY && !recaptchaError && !recaptchaToken) {
      setErrors((prev) => ({
        ...prev,
        recaptcha: 'Please complete the reCAPTCHA verification',
      }));
      return;
    }
    
    // If reCAPTCHA errored, allow submission without it

    trackSubmitStart();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/leads', {
        ...formData,
        formType: 'form1',
        ...(recaptchaToken && { recaptchaToken }),
      });

      const submittedLeadId = response.data?._id || response.data?.data?._id;
      setLeadId(submittedLeadId);
      setCheckingEligibility(true);
      trackSubmitSuccess(submittedLeadId);
      webflowBridge.postMessage('formSubmitted', {
        success: true,
        leadId: submittedLeadId,
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
  }, [currentStep, validateStep, recaptchaToken, recaptchaError, formData, trackSubmitStart, trackSubmitSuccess, trackSubmitError, steps.length]);

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

  const handleRecaptchaError = useCallback(() => {
    // If reCAPTCHA fails to load, make it optional
    setRecaptchaError(true);
    setRecaptchaToken(null);
  }, []);

  // Handle eligibility checking completion
  const handleEligibilityComplete = useCallback((appId) => {
    setApplicationId(appId);
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityComplete', {
      applicationId: appId,
      leadId,
    });
  }, [leadId]);

  // Handle eligibility checking error
  const handleEligibilityError = useCallback((error) => {
    setEligibilityError(error);
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityError', {
      error: error?.message || 'Eligibility check failed',
      leadId,
    });
  }, [leadId]);

  const renderField = useCallback((fieldName) => {
    const fieldSchema = form1Schema[fieldName];
    if (!fieldSchema) return null;

    // Skip phone and OTP in form stage (handled separately)
    if (stage === 'form' && (fieldName === 'phone' || fieldName === 'otp')) {
      return null;
    }

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

    // Handle checkbox type
    if (fieldSchema.type === 'checkbox') {
      return (
        <div key={fieldName} style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name={fieldName}
              checked={formData[fieldName] || false}
              onChange={(e) => handleChange({ target: { name: fieldName, value: e.target.checked } })}
              required={fieldSchema.required}
              style={{ marginRight: '0.5rem' }}
            />
            <span>
              {fieldSchema.label}
              {fieldSchema.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
            </span>
          </label>
          {errors[fieldName] && (
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626' }}>
              {errors[fieldName]}
            </p>
          )}
        </div>
      );
    }

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
        maxLength={fieldSchema.maxLength}
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus, stage]);

  // Show eligibility checking screen after form submission
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
          <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1rem',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#000000' }}>
                Unable to Process
              </h2>
              <p style={{ color: '#656c77', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {eligibilityError?.message || 'We encountered an issue while processing your application.'}
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
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Handle phone/OTP stage before form
  if (stage === 'phone') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Personal Loan Application
            </h2>
            <p style={{ color: '#656c77', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              Enter your mobile number to get started
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handlePhoneSubmit(); }}>
              <div style={{ marginBottom: '1.25rem' }}>
                {renderField('phone')}
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                {renderField('consentCreditCheck')}
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={otpSending || !formData.consentCreditCheck}
                loading={otpSending}
              >
                {otpSending ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (stage === 'otp') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Verify Your Number
            </h2>
            <p style={{ color: '#656c77', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              We've sent a one-time code to {formData.phone || 'your number'}. Please enter it below.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleOtpSubmit(); }}>
              <div style={{ marginBottom: '1.25rem' }}>
                {renderField('otp')}
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
              >
                Verify OTP
              </Button>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#656c77', textAlign: 'center' }}>
                Didn't receive the code? <span style={{ color: '#160E7A', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setStage('phone')}>Resend OTP</span>
              </p>
            </form>
          </div>
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

            {currentStep === steps.length && RECAPTCHA_SITE_KEY && ReCAPTCHA && !recaptchaError && (
              <div style={{ marginBottom: '1.5rem' }}>
                <ReCAPTCHA
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                  onErrored={handleRecaptchaError}
                  onExpired={handleRecaptchaError}
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
