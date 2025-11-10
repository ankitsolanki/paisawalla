import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SubmitSuccess from '../../components/SubmitSuccess';
import EligibilityChecking from '../../components/EligibilityChecking';
import OffersListing from '../../embeds/offers/OffersListing';
import { validateForm, validateField } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import form3Schema from './form3Schema';

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

const Form3 = ({ theme = 'light' }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [stage, setStage] = useState('phone'); // 'phone' -> 'otp' -> 'details' -> 'submitted'
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
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

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
  } = useFormTracking('form3', formData);

  const handleChange = useCallback((e) => {
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
  }, [errors, trackFieldInteraction]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'blur', value);
    
    const fieldSchema = form3Schema[name];
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

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Stage-based submission handling
    if (stage === 'phone') {
      // Validate phone only
      const phoneRules = form3Schema.phone.rules;
      const phoneError = validateField(formData.phone || '', phoneRules);
      if (phoneError) {
        setErrors((prev) => ({ ...prev, phone: phoneError }));
        return;
      }
      // Simulate OTP request
      setOtpSending(true);
      try {
        // In production, POST to your OTP endpoint with the phone
        // await apiClient.post('/api/auth/send-otp', { phone: formData.phone });
        setStage('otp');
      } finally {
        setOtpSending(false);
      }
      return;
    }

    if (stage === 'otp') {
      // Validate OTP = 1234 (hardcoded for testing)
      if ((formData.otp || '').trim() !== '1234') {
        setErrors((prev) => ({ ...prev, otp: 'Invalid verification code. Please enter 1234 to continue.' }));
        return;
      }
      setOtpVerifying(true);
      try {
        // In production, verify OTP via API
        // await apiClient.post('/api/auth/verify-otp', { phone: formData.phone, otp: formData.otp });
        setStage('details');
      } finally {
        setOtpVerifying(false);
      }
      return;
    }

    // Final details stage: validate full form and submit lead
    const validation = validateForm(formData, form3Schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Only require reCAPTCHA if site key is configured AND reCAPTCHA hasn't errored
    if (RECAPTCHA_SITE_KEY && !recaptchaError && !recaptchaToken) {
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
        formType: 'form3',
        ...(recaptchaToken && { recaptchaToken }), // Only include if token exists
      });

      const submittedLeadId = response.data?._id || response.data?.data?._id;
      setIsSubmitted(true);
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
  }, [formData, recaptchaToken, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

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
    const fieldSchema = form3Schema[fieldName];
    if (!fieldSchema) return null;

    return (
      <Input
        key={fieldName}
        name={fieldName}
        label={fieldSchema.label}
        required={fieldSchema.required}
        type={fieldSchema.type || 'text'}
        value={formData[fieldName] || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={errors[fieldName]}
        fullWidth
        placeholder={fieldSchema.placeholder}
        min={fieldSchema.min}
        max={fieldSchema.max}
        step={fieldSchema.step}
        disabled={fieldName === 'phone' && (stage === 'otp' || stage === 'details')}
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus, stage]);

  // All hooks must be called before conditional returns
  const fields = useMemo(() => Object.keys(form3Schema), []);

  // Select which fields to render based on stage
  const stageFields = useMemo(() => {
    if (stage === 'phone') return ['phone'];
    if (stage === 'otp') return ['phone']; // phone shown (disabled) above OTP box
    if (stage === 'details') return fields; // all fields
    return [];
  }, [stage, fields]);

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

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.25rem' }}>
          {stage === 'phone' && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#000000' }}>
                Check My Eligibility
          </h2>
              <p style={{ color: '#656c77', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                Personal loans tailored for you, compare & apply in minutes
              </p>
              <p style={{ color: '#8b8b8b', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                No impact on your credit score, instant soft-check
              </p>
            </>
          )}
          
          {stage === 'otp' && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#000000' }}>
                Verify Your Number
              </h2>
              <p style={{ color: '#656c77', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                We've sent a one-time code to {formData.phone || 'your number'}. Please enter it below.
              </p>
            </>
          )}

          {stage === 'details' && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#000000' }}>
                Complete Your Application
              </h2>
              <p style={{ color: '#656c77', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                Get matched offers from 35+ lenders. 100% digital process.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {stageFields.map(renderField)}

              {stage === 'otp' && (
                <Input
                  name="otp"
                  label="Enter Verification Code"
                  required
                  type="text"
                  value={formData.otp || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  error={errors.otp}
                  fullWidth
                  placeholder="Enter the 4-digit code sent to your mobile"
                  maxLength={6}
                />
              )}
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

            {stage === 'details' && RECAPTCHA_SITE_KEY && ReCAPTCHA && !recaptchaError && (
              <div style={{ marginBottom: '1.25rem' }}>
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting || otpSending || otpVerifying}
              loading={isSubmitting || otpSending || otpVerifying}
            >
              {stage === 'phone' && (otpSending ? 'Sending OTP...' : 'Check My Eligibility')}
              {stage === 'otp' && (otpVerifying ? 'Verifying...' : 'Verify OTP')}
              {stage === 'details' && (isSubmitting ? 'Submitting...' : 'Get My Offers')}
            </Button>

            {stage === 'otp' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#656c77', textAlign: 'center' }}>
                Didn't receive the code? <span style={{ color: '#160E7A', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setStage('phone')}>Resend OTP</span>
              </p>
            )}

            {stage === 'phone' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#8b8b8b', textAlign: 'center' }}>
                By continuing, you agree to our Terms of Use and Privacy Policy
              </p>
            )}
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form3);
