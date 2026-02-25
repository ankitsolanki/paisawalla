import React, { useState, useCallback, useEffect } from 'react';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import Button from '../../components/ui/CustomButton';
import Input from '../../components/ui/CustomInput';
import Select from '../../components/ui/CustomSelect';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PincodeInput from '../../components/PincodeInput';
import ProgressBar from '../../components/ProgressBar';
import SubmitSuccess from '../../components/SubmitSuccess';
import EligibilityChecking from '../../components/EligibilityChecking';
import FormSection from '../../components/forms/FormSection';
import { validateField, validateForm } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge, isEmbedded } from '../../embed/webflowBridge';
import { getAuthParamsFromUrl } from '../../utils/queryEncoder';
import form2Schema from './form2Schema';

const FORM_FIELD_KEYS = Object.keys(form2Schema).filter((key) => key !== 'steps');

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

// Form2 organized by steps as per CSV requirements
const STEP_SECTIONS = {
  1: [
    {
      id: 'personal-information',
      title: 'Personal Information',
      subtitle: 'Complete details for verification',
      rows: [
        { fields: ['fullName'] },
        { fields: ['email'] },
        { fields: ['dateOfBirth'] },
        { fields: ['pinCode'] },
        { fields: ['panNumber'] },
      ],
    },
  ],
  2: [
    {
      id: 'employment-details',
      title: 'Employment Details',
      subtitle: 'Tell us about your work',
      rows: [
        { fields: ['loanAmount'] },
        { fields: ['employmentType'] },
        { fields: ['netMonthlyIncome'] },
        { fields: ['companyName'] },
        { fields: ['modeOfSalary'] },
      ],
    },
  ],
};

const Form2 = ({ 
  theme = 'light',
  title = 'Quick Eligibility Check',
  description = undefined,
  authPhone = null
}) => {
  const [currentStep, setCurrentStep] = useState(1);
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

  // Check for encoded auth params on mount
  useEffect(() => {
    const authParams = getAuthParamsFromUrl();
    if (authParams && authParams.authenticated && authParams.phone) {
      // User is already authenticated, skip auth and go directly to form
      setFormData((prev) => ({ ...prev, phone: authParams.phone }));
      
      // Try to prefill data from existing lead
      setPrefillStatus('loading');
      apiClient.get('/api/leads/lookup', {
        params: {
          phone: authParams.phone,
          formType: 'form2',
        },
      })
        .then((response) => {
          // Response structure: { success: true, data: leadData, ... }
          // apiClient interceptor returns response.data, so response is already the JSON body
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

  const handleEligibilityComplete = useCallback((appId) => {
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityComplete', {
      applicationId: appId,
      leadId,
    });
    if (isEmbedded()) {
      const script = document.querySelector('script[data-form]');
      const offersUrl = script?.getAttribute('data-offers-url') || 'https://paisawaala.webflow.io/listing-page';
      setTimeout(() => {
        window.location.href = `${offersUrl}?applicationId=${appId}&leadId=${leadId || ''}`;
      }, 500);
    } else {
      window.location.href = `/listing-page?page=offers&applicationId=${appId}${leadId ? `&leadId=${leadId}` : ''}`;
    }
  }, [leadId]);

  const handleEligibilityError = useCallback((error) => {
    setEligibilityError(error);
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityError', {
      error: error?.message || 'Unknown error',
    });
  }, []);

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

    // Mark auto-populated fields
    const autoPopulated = new Set();
    FORM_FIELD_KEYS.forEach((field) => {
      if (payload[field] !== null && payload[field] !== undefined) {
        autoPopulated.add(field);
      }
    });
    setAutoPopulatedFields(autoPopulated);
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
    setErrors((prev) => ({ ...prev, recaptcha: 'Please complete the reCAPTCHA verification.' }));
  }, []);

  // Step navigation
  const steps = Object.keys(STEP_SECTIONS);
  
  // Validate current step fields before allowing navigation
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
      const fieldSchema = form2Schema[fieldName];
      if (!fieldSchema) return;

      // Only validate required fields for step navigation
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

  const handleNext = useCallback((e) => {
    // Prevent form submission if button is inside a form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate current step before moving to next
    const isValid = validateStep(currentStep);
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps.length, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

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
          onLoadingChange={handlePincodeLoadingChange}
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
  }, [formData, errors, handleChange, handleBlur, handleFocus, handlePincodeChange, handlePincodeLookup, handlePincodeLoadingChange, autoPopulatedFields]);

  const renderStepFields = useCallback(
    (stepNumber) => {
      const sections = STEP_SECTIONS[stepNumber] || [];
      // Since each step now has only one section, always show the first (and only) section
      const sectionToShow = sections[0];

      // If no section exists, return null
      if (!sectionToShow) {
        return null;
      }

      // Show the section
      return (
        <FormSection
          key={sectionToShow.id}
          title={sectionToShow.title}
          subtitle={sectionToShow.subtitle}
          rows={sectionToShow.rows}
          renderField={renderField}
          isCompact={isCompactLayout}
        />
      );
    },
    [renderField, isCompactLayout]
  );

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // First validate the current step
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Then validate the entire form to be sure
    const validation = validateForm(formData, form2Schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check reCAPTCHA if required
    if (RECAPTCHA_SITE_KEY && !recaptchaToken && !recaptchaError) {
      setErrors((prev) => ({ ...prev, recaptcha: 'Please complete the reCAPTCHA verification.' }));
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    trackSubmitStart();

    try {
      const payload = {
        ...formData,
        formType: 'form2',
        recaptchaToken: recaptchaToken,
      };

      const response = await apiClient.post('/api/leads', payload);
      const responseLeadId = response?.data?.id || response?.data?._id || response?.id || response?._id;
      
      trackSubmitSuccess();
      
      if (responseLeadId) {
        setLeadId(responseLeadId);
        setCheckingEligibility(true);
        webflowBridge.notifyFormSubmission('form2', {
          success: true,
          leadId: responseLeadId,
          formData: payload,
        });
      } else {
        setIsSubmitted(true);
        webflowBridge.notifyFormSubmission('form2', {
          success: true,
          formData: payload,
        });
      }
    } catch (error) {
      const errorMessage = error?.message || 'Failed to submit form. Please try again.';
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
      trackSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, recaptchaToken, recaptchaError, validateStep, currentStep, trackSubmitStart, trackSubmitSuccess, trackSubmitError]);

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

  if (eligibilityError && !checkingEligibility) {
    return (
      <ErrorBoundary>
        <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem' }}>
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
                setCheckingEligibility(false);
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (isSubmitted) {
    return (
      <ErrorBoundary>
        <SubmitSuccess
          message="Thank you! We've received your information and will contact you soon."
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
              fontSize: isMobile ? '1.25rem' : '1.5rem', // h2: 1.25rem mobile, 1.5rem desktop (20px/24px) - smaller than h1
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
          
          <ProgressBar current={currentStep} total={steps.length} />

          <form onSubmit={(e) => e.preventDefault()}>
            <div
              style={{
                marginBottom: isMobile ? '1rem' : '1.5rem',
              }}
            >
              {renderStepFields(currentStep)}
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
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                justifyContent: isMobile ? 'flex-start' : 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginTop: isMobile ? '1.25rem' : '2rem',
                gap: isMobile ? '0.75rem' : '1rem',
              }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                fullWidth={isMobile}
              >
                Previous
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  fullWidth={isMobile}
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
                  fullWidth={isMobile}
                >
                  {isSubmitting ? 'Submitting...' : 'Check Eligibility'}
                </Button>
              )}
            </div>
          </form>
        </div>
    </ErrorBoundary>
  );
};

export default React.memo(Form2);