import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SubmitSuccess from '../../components/SubmitSuccess';
import { validateForm, validateField } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import form3Schema from './form3Schema';

// Get reCAPTCHA site key from environment or window (for embedded forms)
// Only use if it's a valid key (not empty and has reasonable length)
const getRecaptchaKey = () => {
  const windowKey = typeof window !== 'undefined' ? window.VITE_RECAPTCHA_SITE_KEY : undefined;
  const envKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  console.log('[Form3] reCAPTCHA Key Detection:', {
    windowKey: windowKey ? `${windowKey.substring(0, 10)}...` : 'undefined',
    envKey: envKey ? `${envKey.substring(0, 10)}...` : 'undefined',
    windowKeyType: typeof windowKey,
    envKeyType: typeof envKey,
  });
  
  const key = windowKey || envKey || '';
  
  console.log('[Form3] Raw key value:', {
    key: key ? `${key.substring(0, 20)}...` : 'empty',
    keyType: typeof key,
    keyLength: key ? key.length : 0,
    isString: typeof key === 'string',
    trimmed: key ? key.trim() : '',
    trimmedLength: key ? key.trim().length : 0,
  });
  
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
  
  console.log('[Form3] Key validation result:', {
    isValid,
    checks: {
      exists: !!key,
      isString: typeof key === 'string',
      notEmpty: key ? key.trim() !== '' : false,
      minLength: key ? key.trim().length >= 20 : false,
      notPlaceholder: key ? !key.includes('your-key-here') && !key.includes('placeholder') : false,
      notUndefined: key ? key.trim() !== 'undefined' : false,
      notNull: key ? key.trim() !== 'null' : false,
    },
  });
  
  if (isValid) {
    const trimmedKey = key.trim();
    console.log('[Form3] Valid reCAPTCHA key found:', {
      keyLength: trimmedKey.length,
      keyPreview: `${trimmedKey.substring(0, 10)}...${trimmedKey.substring(trimmedKey.length - 5)}`,
    });
    return trimmedKey;
  }
  
  console.log('[Form3] No valid reCAPTCHA key found - reCAPTCHA will be disabled');
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

  // Dynamically load ReCAPTCHA only if we have a valid key
  useEffect(() => {
    console.log('[Form3] ReCAPTCHA loading check:', {
      hasKey: !!RECAPTCHA_SITE_KEY,
      keyValue: RECAPTCHA_SITE_KEY ? `${RECAPTCHA_SITE_KEY.substring(0, 10)}...` : 'none',
      hasComponent: !!ReCAPTCHA,
      stage,
    });
    
    if (RECAPTCHA_SITE_KEY && !ReCAPTCHA) {
      console.log('[Form3] Loading reCAPTCHA module...');
      import('react-google-recaptcha')
        .then(module => {
          console.log('[Form3] reCAPTCHA module loaded successfully');
          setReCAPTCHA(() => module.default);
        })
        .catch((error) => {
          console.error('[Form3] reCAPTCHA module could not be loaded:', error);
        });
    } else if (!RECAPTCHA_SITE_KEY) {
      console.log('[Form3] Skipping reCAPTCHA load - no valid key');
    } else if (ReCAPTCHA) {
      console.log('[Form3] ReCAPTCHA component already loaded');
    }
  }, [ReCAPTCHA, stage]);

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

    // Only require reCAPTCHA if site key is configured
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
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
        formType: 'form3',
        ...(recaptchaToken && { recaptchaToken }), // Only include if token exists
      });

      setIsSubmitted(true);
      setStage('submitted');
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
  }, [formData, recaptchaToken, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

  const handleRecaptchaChange = useCallback((token) => {
    console.log('[Form3] reCAPTCHA token received:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });
    setRecaptchaToken(token);
    if (errors.recaptcha) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.recaptcha;
        return newErrors;
      });
    }
  }, [errors.recaptcha]);

  const handleRecaptchaError = useCallback((error) => {
    // If reCAPTCHA fails to load, make it optional
    console.error('[Form3] reCAPTCHA error:', {
      error: error?.message || error || 'Unknown error',
      errorType: typeof error,
      errorDetails: error,
      siteKey: RECAPTCHA_SITE_KEY ? `${RECAPTCHA_SITE_KEY.substring(0, 10)}...` : 'none',
    });
    console.warn('[Form3] reCAPTCHA failed to load. Form can still be submitted.');
    setRecaptchaToken(null);
  }, []);

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

  if (isSubmitted) {
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
                backgroundColor: '#edfcf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#000000' }}>
                Application Submitted!
              </h2>
              <p style={{ color: '#656c77', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                We're processing your application and will show you personalized offers shortly.
              </p>
              <p style={{ color: '#8b8b8b', fontSize: '0.75rem' }}>
                You'll receive offers from multiple lenders with transparent comparisons.
              </p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const fields = useMemo(() => Object.keys(form3Schema), []);

  // Select which fields to render based on stage
  const stageFields = useMemo(() => {
    if (stage === 'phone') return ['phone'];
    if (stage === 'otp') return ['phone']; // phone shown (disabled) above OTP box
    if (stage === 'details') return fields; // all fields
    return [];
  }, [stage, fields]);

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

            {stage === 'details' && (() => {
              const shouldRender = RECAPTCHA_SITE_KEY && ReCAPTCHA;
              console.log('[Form3] ReCAPTCHA render check:', {
                stage,
                hasKey: !!RECAPTCHA_SITE_KEY,
                keyValue: RECAPTCHA_SITE_KEY ? `${RECAPTCHA_SITE_KEY.substring(0, 10)}...` : 'none',
                hasComponent: !!ReCAPTCHA,
                shouldRender,
              });
              
              if (!shouldRender) {
                console.log('[Form3] ReCAPTCHA not rendered - missing key or component');
                return null;
              }
              
              console.log('[Form3] Rendering ReCAPTCHA component with key:', {
                keyPreview: `${RECAPTCHA_SITE_KEY.substring(0, 10)}...${RECAPTCHA_SITE_KEY.substring(RECAPTCHA_SITE_KEY.length - 5)}`,
                keyLength: RECAPTCHA_SITE_KEY.length,
              });
              
              return (
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
              );
            })()}

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
