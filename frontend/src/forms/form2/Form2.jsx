import React, { useState, useCallback, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SubmitSuccess from '../../components/SubmitSuccess';
import { validateForm, validateField } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import { getAuthParamsFromUrl } from '../../utils/queryEncoder';
import form2Schema from './form2Schema';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

const Form2 = ({ theme = 'light' }) => {
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
  } = useFormTracking('form2', formData);

  // Check for encoded auth params on mount and pre-fill phone if present
  useEffect(() => {
    const authParams = getAuthParamsFromUrl();
    if (authParams && authParams.authenticated && authParams.phone) {
      // Pre-fill phone number if form2 has a phone field
      if (form2Schema.phone) {
        setFormData((prev) => ({ ...prev, phone: authParams.phone }));
      }
    }
  }, []);

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
    
    const fieldSchema = form2Schema[name];
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

    const validation = validateForm(formData, form2Schema);
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
        formType: 'form2',
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
    const fieldSchema = form2Schema[fieldName];
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
            message="Thank you! We've received your information and will contact you soon."
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  const fields = Object.keys(form2Schema);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Get Started
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
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
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form2);
