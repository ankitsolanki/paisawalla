import React, { useState, useCallback } from 'react';
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
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus]);

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

  const fields = Object.keys(form3Schema);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div style={{ maxWidth: '28rem', margin: '0 auto', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Quick Quote
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {fields.map(renderField)}
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Get Quote'}
            </Button>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form3);
