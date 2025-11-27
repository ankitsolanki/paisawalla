import React, { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import { useFormTracking } from '../../hooks/useFormTracking';
import { useResponsive } from '../../hooks/useResponsive';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PincodeInput from '../../components/PincodeInput';
import SubmitSuccess from '../../components/SubmitSuccess';
import FormSection from '../../components/forms/FormSection';
import { validateForm, validateField } from '../../utils/validationRules';
import { tokens } from '../../design-system/tokens';
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

const FORM_FIELD_KEYS = Object.keys(form2Schema).filter((key) => key !== 'steps');

const STEP_SECTIONS = {
  1: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      subtitle: 'Tell us about yourself',
      rows: [
        { fields: ['firstName', 'lastName'], cols: [1, 1] },
        { fields: ['dateOfBirth'] },
        { fields: ['email'] },
      ],
    },
    {
      id: 'loan-details',
      title: 'Loan Requirements',
      subtitle: 'What are you looking for?',
      rows: [
        { fields: ['loanAmount'] },
        { fields: ['loanPurpose'] },
      ],
    },
    {
      id: 'employment-info',
      title: 'Employment Details',
      subtitle: 'Help us understand your income',
      rows: [
        { fields: ['employmentType'] },
        { fields: ['netMonthlyIncome'] },
      ],
    },
    {
      id: 'location-info',
      title: 'Location Details',
      subtitle: 'Where are you located?',
      rows: [
        { fields: ['pinCode'] },
        { fields: ['city', 'state'], cols: [1, 1] },
      ],
    },
  ],
};

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
  const [prefillStatus, setPrefillStatus] = useState('idle'); // idle | loading | success | error | not_found
  const [prefillMessage, setPrefillMessage] = useState('');
  const { windowWidth } = useResponsive();
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isCompactLayout = isMobile || isTablet;

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

  // Helper to apply prefilled data
  const applyPrefillData = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev };

      FORM_FIELD_KEYS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          let value = payload[field];
          
          if (value === null || value === undefined) {
            return;
          }
          
          updated[field] = value;
        }
      });

      return updated;
    });
  }, []);

  // Check for encoded auth params on mount and prefill if user exists
  useEffect(() => {
    const authParams = getAuthParamsFromUrl();
    if (authParams && authParams.authenticated && authParams.phone) {
      // Try to prefill data from existing lead
      setPrefillStatus('loading');
      apiClient.get('/api/leads/lookup', {
        params: {
          phone: authParams.phone,
          formType: 'form2',
        },
      })
        .then((response) => {
          const leadData = response?.data || response;
          if (leadData && typeof leadData === 'object') {
            applyPrefillData(leadData);
            setPrefillStatus('success');
            setPrefillMessage('We found your previous details and filled them in. Please review and update if required.');
          } else {
            setPrefillStatus('not_found');
          }
        })
        .catch((error) => {
          const errorMessage = error?.message || 'Unable to fetch your existing details.';
          if (errorMessage.toLowerCase().includes('not found')) {
            setPrefillStatus('not_found');
            setPrefillMessage('');
          } else {
            setPrefillStatus('error');
            setPrefillMessage(errorMessage);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Render step fields using FormSection
  const renderStepFields = useCallback((stepNumber) => {
    const sections = STEP_SECTIONS[stepNumber];
    if (!sections) return null;

    return sections.map((section) => (
      <FormSection
        key={section.id}
        title={section.title}
        subtitle={section.subtitle}
        rows={section.rows}
        renderField={renderField}
        isCompact={isCompactLayout}
      />
    ));
  }, [renderField, isCompactLayout]);

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

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            width: '100%',
            maxWidth: isCompactLayout ? '100%' : '56rem',
            margin: '0 auto',
            padding: isMobile ? '1rem' : '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 700,
              marginBottom: description ? (isMobile ? '0.5rem' : '0.75rem') : (isMobile ? '1rem' : '1.5rem'),
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            {title}
          </h2>
          
          {description && (
            <p
              style={{
                fontSize: isMobile ? '0.875rem' : '0.9375rem',
                color: '#656c77',
                marginBottom: isMobile ? '1rem' : '1.5rem',
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              {description}
            </p>
          )}

          {prefillStatus === 'success' && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #34d399',
                color: '#064e3b',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Details auto-filled</strong>
              <span style={{ fontSize: '0.875rem' }}>
                {prefillMessage || 'We found an existing application and pre-filled your information. Please review and confirm.'}
              </span>
            </div>
          )}

          {prefillStatus === 'error' && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                color: '#991b1b',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Unable to auto-fill</strong>
              <span style={{ fontSize: '0.875rem' }}>
                {prefillMessage || 'We could not fetch your existing information. Please continue by entering your details.'}
              </span>
            </div>
          )}

          {prefillStatus === 'not_found' && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#374151',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Let's get your details</strong>
              <span style={{ fontSize: '0.875rem' }}>
                We could not find an existing application for this number. Please fill in your information to continue.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                marginBottom: isMobile ? '1rem' : '1.5rem',
              }}
            >
              {renderStepFields(1)}
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

            <div
              style={{
                marginTop: isMobile ? '1.25rem' : '2rem',
              }}
            >
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Check Eligibility'}
              </Button>
            </div>
          </form>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(Form2);
