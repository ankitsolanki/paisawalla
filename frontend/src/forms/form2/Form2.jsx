import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PincodeInput from '../../components/PincodeInput';
import SubmitSuccess from '../../components/SubmitSuccess';
import { validateForm, validateField } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';
import { getAuthParamsFromUrl } from '../../utils/queryEncoder';
import form2Schema from './form2Schema';

// Get reCAPTCHA site key from environment or window (for embedded forms)
const getRecaptchaKey = () => {
  const windowKey = typeof window !== 'undefined' ? window.VITE_RECAPTCHA_SITE_KEY : undefined;
  const envKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const key = windowKey || envKey || '';
  
  const isValid = key && 
      typeof key === 'string' &&
      key.trim() !== '' && 
      key.trim().length >= 20 && 
      !key.includes('your-key-here') &&
      !key.includes('placeholder') &&
      key.trim() !== 'undefined' &&
      key.trim() !== 'null';
  
  return isValid ? key.trim() : '';
};

const RECAPTCHA_SITE_KEY = getRecaptchaKey();

const Form2 = ({ 
  theme = 'light',
  title = 'Quick Eligibility Check',
  description = 'Tell us a bit about yourself to see your loan eligibility'
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [ReCAPTCHA, setReCAPTCHA] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState(new Set());

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
  } = useFormTracking('form2', formData);

  // Check for encoded auth params on mount and pre-fill phone if present
  useEffect(() => {
    const authParams = getAuthParamsFromUrl();
    if (authParams && authParams.authenticated && authParams.phone) {
      // Phone is already authenticated - we don't need to store it in form2
      // Just acknowledge that user is authenticated
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
    if (!fieldSchema) return;

    // Only validate format/pattern rules on blur, NOT required fields
    let rulesToValidate = fieldSchema.rules || [];
    
    // Remove 'required' rule - we don't want to show required errors on blur
    rulesToValidate = rulesToValidate.filter(rule => {
      if (typeof rule === 'string') {
        return rule !== 'required';
      }
      if (typeof rule === 'object' && rule.type === 'required') {
        return false;
      }
      return true;
    });

    // Only validate if field has a value and there are non-required rules to validate
    if (value && value.trim() !== '' && rulesToValidate.length > 0) {
      const error = validateField(value, rulesToValidate);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        trackFieldInteraction(name, 'error', value);
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (value && value.trim() !== '') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [trackFieldInteraction]);

  const handleFocus = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'focus', value);
  }, [trackFieldInteraction]);

  // Handle PIN code lookup and auto-populate city/state
  const handlePincodeLookup = useCallback((details) => {
    if (!details) return;

    const { city, state, cityFieldName, stateFieldName } = details;

    setFormData((prev) => {
      const updated = { ...prev };
      
      if (cityFieldName && city) {
        updated[cityFieldName] = city;
        trackFieldInteraction(cityFieldName, 'auto-populated', city);
        setAutoPopulatedFields((prevSet) => new Set(prevSet).add(cityFieldName));
      }
      
      if (stateFieldName && state) {
        const stateSchema = form2Schema[stateFieldName];
        if (stateSchema && stateSchema.options) {
          const exactMatch = stateSchema.options.find(
            (opt) => opt.label.toLowerCase() === state.toLowerCase()
          );
          
          if (exactMatch) {
            updated[stateFieldName] = exactMatch.value;
            trackFieldInteraction(stateFieldName, 'auto-populated', exactMatch.value);
            setAutoPopulatedFields((prevSet) => new Set(prevSet).add(stateFieldName));
          } else {
            const partialMatch = stateSchema.options.find(
              (opt) => opt.label.toLowerCase().includes(state.toLowerCase()) ||
                       state.toLowerCase().includes(opt.label.toLowerCase())
            );
            
            if (partialMatch) {
              updated[stateFieldName] = partialMatch.value;
              trackFieldInteraction(stateFieldName, 'auto-populated', partialMatch.value);
              setAutoPopulatedFields((prevSet) => new Set(prevSet).add(stateFieldName));
            }
          }
        }
      }
      
      return updated;
    });
  }, [trackFieldInteraction]);

  // Clear auto-populated state when PIN code is cleared
  const handlePincodeChange = useCallback((e) => {
    const { value } = e.target;
    handleChange(e);
    
    if (!value || value.length === 0) {
      setAutoPopulatedFields((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.delete('city');
        newSet.delete('state');
        return newSet;
      });
    }
  }, [handleChange]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validation = validateForm(formData, form2Schema);
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

    trackSubmitStart();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/api/leads', {
        ...formData,
        formType: 'form2',
        ...(recaptchaToken && { recaptchaToken }),
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
  }, [formData, recaptchaToken, recaptchaError, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

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
    setRecaptchaError(true);
    setRecaptchaToken(null);
  }, []);

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
          disabled={autoPopulatedFields.has(fieldName)}
        />
      );
    }

    if (fieldSchema.type === 'currency') {
      return (
        <CurrencyInput
          key={fieldName}
          {...commonProps}
          min={fieldSchema.min}
          max={fieldSchema.max}
        />
      );
    }

    if (fieldSchema.type === 'pincode') {
      return (
        <PincodeInput
          key={fieldName}
          {...commonProps}
          onChange={handlePincodeChange}
          onPincodeLookup={handlePincodeLookup}
          cityFieldName={fieldSchema.cityFieldName}
          stateFieldName={fieldSchema.stateFieldName}
        />
      );
    }

    // Handle city field - disable if auto-populated
    if (fieldName === 'city') {
      const isAutoPopulated = autoPopulatedFields.has(fieldName);
      return (
        <Input
          key={fieldName}
          {...commonProps}
          type="text"
          disabled={isAutoPopulated}
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
        maxLength={fieldSchema.maxLength}
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus, handlePincodeChange, handlePincodeLookup, autoPopulatedFields]);

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: description ? '0.75rem' : '1.5rem' }}>
            {title}
          </h2>
          
          {description && (
            <p
              style={{
                fontSize: '0.9375rem',
                color: '#656c77',
                marginBottom: '1.5rem',
              }}
            >
              {description}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
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

            {RECAPTCHA_SITE_KEY && !recaptchaError && ReCAPTCHA && (
              <div style={{ marginBottom: '1rem' }}>
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
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Check Eligibility'}
            </Button>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form2);
