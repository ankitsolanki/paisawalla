import React, { useState, useCallback, useEffect } from 'react';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/CustomButton';
import Input from '../../components/ui/CustomInput';
import Select from '../../components/ui/CustomSelect';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PincodeInput from '../../components/PincodeInput';
import SubmitSuccess from '../../components/SubmitSuccess';
import EligibilityChecking from '../../components/EligibilityChecking';
import FormSection from '../../components/forms/FormSection';
import { validateForm, validateField } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge, isEmbedded } from '../../embed/webflowBridge';
import { getAuthParamsFromUrl } from '../../utils/queryEncoder';
import form3Schema from './form3Schema';

const FORM_FIELD_KEYS = Object.keys(form3Schema).filter((key) => key !== 'steps');

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

// Form3 organized as single step as per CSV
const STEP_SECTIONS = {
  1: [
    {
      id: 'quick-application',
      title: 'Quick Application',
      subtitle: 'Complete your loan application',
      rows: [
        { fields: ['fullName'] },
        { fields: ['panNumber'] },
        { fields: ['dateOfBirth'] },
        { fields: ['pinCode'] },
        { fields: ['loanAmount'] },
        { fields: ['employmentType'] },
        { fields: ['netMonthlyIncome'] },
      ],
    },
  ],
};

const Form3 = ({ 
  theme = 'light',
  title = 'Complete Your Application',
  description = undefined,
  authPhone = null
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [ReCAPTCHA, setReCAPTCHA] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [prefillStatus, setPrefillStatus] = useState('idle'); // idle | loading | success | error | not_found
  const [prefillMessage, setPrefillMessage] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState(new Set()); // Track auto-populated fields
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isCompactLayout = isMobile || isTablet;

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
      // User is already authenticated - set phone from auth params (required for lead submission)
      setFormData((prev) => ({ ...prev, phone: authParams.phone }));
      // Try to prefill data from existing lead
      setPrefillStatus('loading');
      apiClient.get('/api/leads/lookup', {
        params: {
          phone: authParams.phone,
          formType: 'form3',
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

  useEffect(() => {
    if (authPhone) {
      setFormData((prev) => ({ ...prev, phone: authPhone }));
    }
  }, [authPhone]);

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
    const strValue = String(value ?? '');
    if (strValue.trim() !== '' && rulesToValidate.length > 0) {
      const error = validateField(strValue, rulesToValidate);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        trackFieldInteraction(name, 'error', strValue);
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (strValue.trim() !== '') {
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

  // Handle PIN code loading state change
  const handlePincodeLoadingChange = useCallback((isLoading) => {
    setPincodeLoading(isLoading);
  }, []);

  // Clear auto-populated state when PIN code is cleared
  const handlePincodeChange = useCallback((e) => {
    const { value } = e.target;
    handleChange(e);
    
    // If PIN code is cleared, clear auto-populated state for city and state
    if (!value || value.length === 0) {
      setAutoPopulatedFields((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.delete('city');
        newSet.delete('state');
        return newSet;
      });
      
      // Clear city and state values
      setFormData((prev) => ({
        ...prev,
        city: '',
        state: '',
      }));
      
      // Clear any existing errors for these fields
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.city;
        delete newErrors.state;
        return newErrors;
      });
    }
  }, [handleChange]);

  // Handle PIN code lookup and auto-populate city/state
  const handlePincodeLookup = useCallback((details) => {
    if (!details) return;

    const { city, state, cityFieldName, stateFieldName } = details;

    setFormData((prev) => {
      const updated = { ...prev };
      if (cityFieldName && city) {
        updated[cityFieldName] = city;
      }
      if (stateFieldName && state) {
        updated[stateFieldName] = state;
      }
      return updated;
    });

    // Mark these fields as auto-populated
    const fieldsToMark = [];
    if (cityFieldName && city) fieldsToMark.push(cityFieldName);
    if (stateFieldName && state) fieldsToMark.push(stateFieldName);
    
    if (fieldsToMark.length > 0) {
      setAutoPopulatedFields((prev) => new Set([...prev, ...fieldsToMark]));
    }

    // Clear any existing errors for these fields
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (cityFieldName) delete newErrors[cityFieldName];
      if (stateFieldName) delete newErrors[stateFieldName];
      return newErrors;
    });

    trackFieldInteraction(cityFieldName || 'city', 'auto_populate', city);
    trackFieldInteraction(stateFieldName || 'state', 'auto_populate', state);
  }, [trackFieldInteraction]);

  // Validate current step fields before allowing submission
  const validateStep = useCallback((step) => {
    // Get fields for this step from STEP_SECTIONS
    const sections = STEP_SECTIONS[step] || [];
    const sectionToShow = sections[0];
    if (!sectionToShow) {
      return true; // No fields to validate
    }

    // Collect all field names from all rows in this section
    const stepFields = [];
    sectionToShow.rows.forEach((row) => {
      if (row.fields && Array.isArray(row.fields)) {
        stepFields.push(...row.fields);
      }
    });

    const stepErrors = {};
    let isValid = true;

    stepFields.forEach((fieldName) => {
      const fieldSchema = form3Schema[fieldName];
      if (!fieldSchema) return;

      // Only validate required fields for step validation
      if (fieldSchema.required) {
        const fieldValue = formData[fieldName] || '';
        const error = validateField(fieldValue, fieldSchema.rules || []);
        if (error) {
          stepErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    // Update errors state with step validation errors
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // First validate the current step
    if (!validateStep(1)) {
      return;
    }

    // Then validate the entire form to be sure
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
  }, [formData, recaptchaToken, recaptchaError, validateStep, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

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
  const handleEligibilityComplete = useCallback(async (appId) => {
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityComplete', {
      applicationId: appId,
      leadId,
    });

    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone) {
      try {
        const response = await apiClient.post('/api/auth/issue-session-token', { phone: cleanPhone, applicationId: appId });
        const sessionToken = response?.data?.sessionToken;
        if (sessionToken) {
          localStorage.setItem(`pw_session_${appId}`, sessionToken);
          console.log('[PW:Session] Pre-redirect session token saved — listing page will skip OTP', { applicationId: appId, maskedToken: `${sessionToken.slice(0, 8)}...` });
        } else {
          console.warn('[PW:Session] issue-session-token responded but no token in response', { response });
        }
      } catch (err) {
        console.warn('[PW:Session] Failed to issue pre-redirect session token — user will see OTP on listing page', { error: err.message, applicationId: appId });
      }
    } else {
      console.warn('[PW:Session] No phone available to issue pre-redirect session token', { applicationId: appId });
    }

    if (isEmbedded()) {
      const script = document.querySelector('script[data-form]');
      const offersUrl = script?.getAttribute('data-offers-url') || 'https://paisawaala.webflow.io/listing-page';
      setTimeout(() => {
        window.location.href = `${offersUrl}?applicationId=${appId}&leadId=${leadId || ''}`;
      }, 500);
    } else {
      window.location.href = `/listing-page?page=offers&applicationId=${appId}${leadId ? `&leadId=${leadId}` : ''}`;
    }
  }, [leadId, formData]);

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

    // For date fields, ensure the value is in yyyy-MM-dd format
    let adjustedValue = commonProps.value;
    if (fieldSchema.type === 'date' && adjustedValue) {
      if (adjustedValue.includes('T')) {
        adjustedValue = adjustedValue.split('T')[0];
      }
    }

    return (
      <Input
        key={fieldName}
        {...commonProps}
        value={adjustedValue}
        type={fieldSchema.type || 'text'}
        min={fieldSchema.min}
        max={fieldSchema.max}
        step={fieldSchema.step}
        maxLength={fieldSchema.maxLength}
      />
    );
  }, [formData, errors, handleChange, handleBlur, handleFocus, handlePincodeChange, handlePincodeLookup, handlePincodeLoadingChange, autoPopulatedFields]);

  // All hooks must be called before conditional returns

  // Show eligibility checking screen after form submission
  if (checkingEligibility && leadId) {
    return (
      <ErrorBoundary>
        <EligibilityChecking
          leadId={leadId}
          onComplete={handleEligibilityComplete}
          onError={handleEligibilityError}
          theme={theme}
        />
      </ErrorBoundary>
    );
  }

  // Show error state if eligibility check failed
  if (eligibilityError && !checkingEligibility) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          width: '100%',
          maxWidth: '42rem',
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
              <FormSection
                key="quick-application"
                title="Quick Application"
                subtitle="Complete your loan application"
                rows={STEP_SECTIONS[1][0].rows}
                renderField={renderField}
                isCompact={isCompactLayout}
              />
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

            {RECAPTCHA_SITE_KEY && ReCAPTCHA && !recaptchaError && (
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Get My Offers'}
            </Button>
          </form>
        </div>
    </ErrorBoundary>
  );
};

export default React.memo(Form3);
