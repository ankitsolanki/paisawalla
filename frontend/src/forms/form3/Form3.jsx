import React, { useState, useCallback, useMemo } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
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

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const Form3 = ({ theme = 'light' }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [stage, setStage] = useState('phone'); // 'phone' -> 'otp' -> 'details' -> 'submitted'
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

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
      // Validate OTP = 1234 (hardcoded)
      if ((formData.otp || '').trim() !== '1234') {
        setErrors((prev) => ({ ...prev, otp: 'Invalid OTP. Please enter 1234 for testing.' }));
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
        formType: 'form3',
        recaptchaToken,
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
          <SubmitSuccess
            message="Thanks! We'll be in touch soon."
          />
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
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Get started
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
            Enter your mobile number to continue. We’ll verify with a one-time code.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {stageFields.map(renderField)}

              {stage === 'otp' && (
                <Input
                  name="otp"
                  label="Enter OTP"
                  required
                  type="text"
                  value={formData.otp || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  error={errors.otp}
                  fullWidth
                  placeholder="Enter 1234 to continue"
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

            {stage === 'details' && (
              <div style={{ marginBottom: '1.25rem' }}>
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting || otpSending || otpVerifying}
              loading={isSubmitting || otpSending || otpVerifying}
            >
              {stage === 'phone' && (otpSending ? 'Sending OTP...' : 'Continue')}
              {stage === 'otp' && (otpVerifying ? 'Verifying...' : 'Verify')}
              {stage === 'details' && (isSubmitting ? 'Submitting...' : 'Submit')}
            </Button>

            {stage === 'otp' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                Didn’t receive the code? <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => setStage('phone')}>Change number</span>
              </p>
            )}
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form3);
