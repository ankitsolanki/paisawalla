import React, { useState, useCallback, lazy, Suspense, useEffect } from 'react';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/CustomButton';
import Input from '../../components/ui/CustomInput';
import Select from '../../components/ui/CustomSelect';
import CurrencyInput from '../../components/ui/CurrencyInput';
import PincodeInput from '../../components/PincodeInput';
import ProgressBar from '../../components/ProgressBar';
import SubmitSuccess from '../../components/SubmitSuccess';
import EligibilityChecking from '../../components/EligibilityChecking';
import FormSection from '../../components/forms/FormSection';
import GenderField from '../../components/GenderField';
import { validateField, validateForm } from '../../utils/validationRules';
import apiClient from '../../utils/apiClient';
import { webflowBridge, isEmbedded } from '../../embed/webflowBridge';
import { getAuthParamsFromUrl } from '../../utils/queryEncoder';
import form1Schema from './form1Schema';

const FORM_FIELD_KEYS = Object.keys(form1Schema).filter((key) => key !== 'steps');

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

const STEP_SECTIONS = {
  1: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      subtitle: 'Complete details for verification',
      rows: [
        { fields: ['firstName', 'lastName'], cols: [1, 1] },
        { fields: ['email'] },
        { fields: ['dateOfBirth'] },
        { fields: ['gender'] },
        { fields: ['panNumber'] },
      ],
    },
  ],
  2: [
    {
      id: 'personal-location',
      title: 'Where do you live?',
      subtitle: 'We use this to personalize offers in your area',
      rows: [
        { fields: ['pinCode'] },
        { fields: ['state', 'city'], cols: [1, 1] },
      ],
    },
  ],
  3: [
    {
      id: 'employment-info',
      title: 'Employment Details',
      subtitle: 'Tell us about your work',
      rows: [
        { fields: ['loanAmount'] },
        { fields: ['employmentType'] },
        // Salaried fields (conditionally visible)
        { fields: ['netMonthlyIncome'] },
        { fields: ['companyName'] },
        { fields: ['modeOfSalary'] },
        // Self-employed professional fields (conditionally visible)
        { fields: ['annualIncome'] },
        { fields: ['organizationName'] },
        { fields: ['profession'] },
        // Self-employed business fields (conditionally visible)
        { fields: ['annualTurnover'] },
        { fields: ['companyEmail'] },
      ],
    },
  ],
  4: [
    {
      id: 'company-address',
      title: 'Company Address',
      subtitle: 'Helps us verify your employment',
      rows: [
        { fields: ['companyAddress'] },
        { fields: ['companyPinCode'] },
        { fields: ['companyCity', 'companyState'], cols: [1, 1] },
      ],
    },
  ],
  5: [
    {
      id: 'current-address',
      title: 'Current Address',
      subtitle: 'Where you currently reside',
      rows: [
        { fields: ['currentAddress'] },
        { fields: ['address'] },
      ],
    },
  ],
  6: [
    {
      id: 'additional-info',
      title: 'Additional Information',
      rows: [
        { fields: ['mothersName'] },
        { fields: ['loanPurpose'] },
        { fields: ['currentResidentialType'] },
        { fields: ['organizationType'] },
      ],
    },
  ],
};

const Form1 = ({ 
  theme = 'light',
  title = 'Personal Loan Application',
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
          formType: 'form1',
        },
      })
        .then((response) => {
          const leadData = response?.data || response;
          if (leadData?.found === false || !leadData || typeof leadData !== 'object') {
            setPrefillStatus('not_found');
            setPrefillMessage('');
          } else {
            const actualLead = leadData?.lead || leadData;
            applyPrefillData(actualLead);
            setPrefillStatus('success');
            setPrefillMessage('We found your previous details and filled them in. Please review and update if required.');
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

  const steps = [
    { label: 'Personal Information' },
    { label: 'Location' },
    { label: 'Employment Details' },
    { label: 'Company Address' },
    { label: 'Current Address' },
    { label: 'Additional Information' },
  ];

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking('form1', formData, currentStep);

  // Helper function to determine if field should be visible based on employment type
  const isFieldVisible = useCallback((fieldName) => {
    const employmentType = formData.employmentType;
    
    // Employment-related fields that have conditional visibility
    const employmentFields = [
      'netMonthlyIncome', 'companyName', 'modeOfSalary',
      'annualIncome', 'organizationName', 'profession', 'annualTurnover'
    ];
    
    // If field is not employment-related, always show it
    if (!employmentFields.includes(fieldName)) {
      return true;
    }
    
    // Fields that are always visible regardless of employment type
    const alwaysVisibleFields = [
      'loanAmount', 'employmentType', 'companyAddress', 
      'companyCity', 'companyState', 'companyPinCode'
    ];
    
    if (alwaysVisibleFields.includes(fieldName)) {
      return true;
    }

    // companyEmail is visible for all employment types except Student
    if (fieldName === 'companyEmail') {
      return employmentType && employmentType !== 'Student';
    }

    // For employment-related fields, check visibility based on employment type
    // If no employment type selected, hide all conditional fields
    if (!employmentType || employmentType === '') {
      return false;
    }

    // Conditional visibility based on employment type
    switch (employmentType) {
      case 'Salaried':
        // Show: netMonthlyIncome, companyName, modeOfSalary
        // Hide: annualIncome, organizationName, profession, annualTurnover
        return ['netMonthlyIncome', 'companyName', 'modeOfSalary'].includes(fieldName);
      
      case 'Self-employed professional':
        // Show: annualIncome, organizationName, profession
        // Hide: netMonthlyIncome, companyName, modeOfSalary, annualTurnover
        return ['annualIncome', 'organizationName', 'profession'].includes(fieldName);
      
      case 'Self-employed business':
        // Show: annualTurnover, annualIncome
        // Hide: netMonthlyIncome, companyName, modeOfSalary, organizationName, profession
        return ['annualTurnover', 'annualIncome'].includes(fieldName);
      
      case 'Student':
        // Hide all employment-related income/company fields
        return false;
      
      default:
        return false;
    }
  }, [formData.employmentType]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Auto-capitalize PAN number
    const processedValue = name === 'panNumber' ? value.toUpperCase() : value;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: processedValue };
      
      // If employment type changed, clear values of fields that are no longer visible
      if (name === 'employmentType') {
        const newEmploymentType = processedValue;
        const fieldsToClear = [
          'netMonthlyIncome', 'companyName', 'modeOfSalary',
          'annualIncome', 'organizationName', 'profession', 'annualTurnover'
        ];
        
        // Determine which fields should be visible with the new employment type
        const shouldBeVisible = (field) => {
          if (!newEmploymentType) return true;
          
          switch (newEmploymentType) {
            case 'Salaried':
              return ['netMonthlyIncome', 'companyName', 'modeOfSalary'].includes(field);
            case 'Self-employed professional':
              return ['annualIncome', 'organizationName', 'profession'].includes(field);
            case 'Self-employed business':
              return ['annualTurnover', 'annualIncome'].includes(field);
            case 'Student':
              return false; // All employment fields hidden for students
            default:
              return true;
          }
        };
        
        fieldsToClear.forEach((field) => {
          if (!shouldBeVisible(field)) {
            updated[field] = '';
            // Clear errors for hidden fields
            setErrors((prevErrors) => {
              const newErrors = { ...prevErrors };
              delete newErrors[field];
              return newErrors;
            });
          }
        });
      }
      
      return updated;
    });
    
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
  }, [errors, trackFieldInteraction, isFieldVisible]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    trackFieldInteraction(name, 'blur', value);
    
    // Skip validation for hidden fields
    if (!isFieldVisible(name)) {
      return;
    }

    const fieldSchema = form1Schema[name];
    if (!fieldSchema) return;

    // Only validate format/pattern rules on blur, NOT required fields
    // Required validation will only happen when user clicks Next
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
    const strValue = value != null ? String(value) : '';
    if (strValue.trim() !== '' && rulesToValidate.length > 0) {
      const error = validateField(value, rulesToValidate);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
        trackFieldInteraction(name, 'error', value);
      } else {
        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (strValue.trim() !== '') {
      // If field has value but no format rules, clear any existing errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [trackFieldInteraction, isFieldVisible]);

  const applyPrefillData = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev };

      FORM_FIELD_KEYS.forEach((field) => {
        // Check if field exists in payload (including empty strings and 0 values)
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          let value = payload[field];
          
          // Skip null and undefined, but allow empty strings, 0, false
          if (value === null || value === undefined) {
            return;
          }
          
          // Handle date fields - convert ISO format to yyyy-MM-dd
          if (field === 'dateOfBirth' && value) {
            // If value is ISO format, extract just the date part
            if (typeof value === 'string' && value.includes('T')) {
              value = value.split('T')[0];
            } else if (value instanceof Date) {
              // Convert Date object to yyyy-MM-dd
              const year = value.getFullYear();
              const month = String(value.getMonth() + 1).padStart(2, '0');
              const day = String(value.getDate()).padStart(2, '0');
              value = `${year}-${month}-${day}`;
            }
          }
          
          // Handle PAN number - uppercase
          if (field === 'panNumber' && value) {
            value = String(value).toUpperCase();
          }
          
          // Handle currency fields - ensure they're numbers
          const currencyFields = ['loanAmount', 'netMonthlyIncome', 'annualIncome', 'annualTurnover'];
          if (currencyFields.includes(field) && value !== '') {
            // Convert to number if it's a string
            if (typeof value === 'string') {
              const numValue = parseFloat(value.replace(/,/g, ''));
              value = isNaN(numValue) ? value : numValue;
            }
          }
          
          // Handle address field - if it's an object, extract the street value
          if (field === 'address' && typeof value === 'object' && value !== null) {
            value = value.street || '';
          }
          
          // Handle currentAddress field - if it's an object, extract the string value
          if (field === 'currentAddress' && typeof value === 'object' && value !== null) {
            // Try to get a string representation or use the entire object as string if empty
            if (typeof value === 'object' && value.value !== undefined) {
              value = value.value;
            } else if (typeof value === 'object' && value.locality !== undefined) {
              value = value.locality;
            } else if (typeof value === 'object' && Object.keys(value).length > 0) {
              // If it's an object with properties, try to extract a meaningful value
              value = value.locality || value.area || value.landmark || '';
            } else {
              value = '';
            }
          }
          
          // Store the value
          updated[field] = value;
        }
      });

      return updated;
    });
  }, []);

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
      
      // Auto-populate city if field name is provided and city is available
      if (cityFieldName && city) {
        updated[cityFieldName] = city;
        trackFieldInteraction(cityFieldName, 'auto-populated', city);
        // Mark city as auto-populated
        setAutoPopulatedFields((prevSet) => new Set(prevSet).add(cityFieldName));
      }
      
      // Auto-populate state if field name is provided and state is available
      if (stateFieldName && state) {
        // Find matching state option value from the state dropdown
        const stateSchema = form1Schema[stateFieldName];
        if (stateSchema && stateSchema.options) {
          // Try to find exact match first
          const exactMatch = stateSchema.options.find(
            (opt) => opt.label.toLowerCase() === state.toLowerCase()
          );
          
          if (exactMatch) {
            updated[stateFieldName] = exactMatch.value;
            trackFieldInteraction(stateFieldName, 'auto-populated', exactMatch.value);
            // Mark state as auto-populated
            setAutoPopulatedFields((prevSet) => new Set(prevSet).add(stateFieldName));
          } else {
            // Try partial match
            const partialMatch = stateSchema.options.find(
              (opt) => opt.label.toLowerCase().includes(state.toLowerCase()) ||
                       state.toLowerCase().includes(opt.label.toLowerCase())
            );
            
            if (partialMatch) {
              updated[stateFieldName] = partialMatch.value;
              trackFieldInteraction(stateFieldName, 'auto-populated', partialMatch.value);
              // Mark state as auto-populated
              setAutoPopulatedFields((prevSet) => new Set(prevSet).add(stateFieldName));
            }
          }
        }
      }
      
      return updated;
    });
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
        newSet.delete('companyCity');
        newSet.delete('companyState');
        return newSet;
      });
    }
  }, [handleChange]);

  const validateStep = useCallback((step) => {
    // Get fields for this step from STEP_SECTIONS instead of form1Schema.steps
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
      // Skip validation for hidden fields
      if (!isFieldVisible(fieldName)) {
        return;
      }

      const fieldSchema = form1Schema[fieldName];
      if (!fieldSchema) return;

      // Determine if field should be required based on employment type
      const employmentType = formData.employmentType;
      let shouldValidate = false;
      let rulesToValidate = fieldSchema.rules || [];

      // Special handling for conditionally required fields based on employment type
      // companyEmail is required for all employment types except Student
      if (fieldName === 'companyEmail') {
        if (employmentType && employmentType !== 'Student') {
          shouldValidate = true;
          if (!rulesToValidate.includes('required')) {
            rulesToValidate = ['required', ...rulesToValidate];
          }
        }
        // If Student or no employment type, skip validation
      }
      // Check if field is required based on conditional visibility for Salaried employment
      else if (employmentType === 'Salaried' && ['netMonthlyIncome', 'companyName', 'modeOfSalary'].includes(fieldName)) {
        shouldValidate = true;
        // Add required rule if not already present
        if (!rulesToValidate.includes('required')) {
          rulesToValidate = ['required', ...rulesToValidate];
        }
      }
      // Check if field is required based on conditional visibility for Self-employed professional
      else if (employmentType === 'Self-employed professional' && ['annualIncome', 'organizationName', 'profession'].includes(fieldName)) {
        shouldValidate = true;
        if (!rulesToValidate.includes('required')) {
          rulesToValidate = ['required', ...rulesToValidate];
        }
      }
      // Check if field is required based on conditional visibility for Self-employed business
      else if (employmentType === 'Self-employed business' && ['annualTurnover', 'annualIncome'].includes(fieldName)) {
        shouldValidate = true;
        if (!rulesToValidate.includes('required')) {
          rulesToValidate = ['required', ...rulesToValidate];
        }
      }
      // For all other fields, validate if they're marked as required in schema
      else if (fieldSchema.required) {
        shouldValidate = true;
      }

      // Validate field if it should be validated
      if (shouldValidate && rulesToValidate.length > 0) {
        const fieldValue = formData[fieldName] || '';
        const error = validateField(fieldValue, rulesToValidate);
        if (error) {
          stepErrors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData, isFieldVisible]);

  const handleNext = useCallback((e) => {
    // Prevent form submission if button is inside a form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    
    // Since each step now has only one section, just validate the step and move forward
    const isValid = validateStep(currentStep);
    
    if (isValid) {
      trackButtonClick('next', { fromStep: currentStep, toStep: currentStep + 1 });
      setCurrentStep((prev) => {
        const nextStep = Math.min(prev + 1, steps.length);
        return nextStep;
      });
    } else {
    }
  }, [currentStep, validateStep, steps.length, trackButtonClick]);

  const handlePrevious = useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);


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
      // Transform form data to match backend schema
      const transformedData = { ...formData };
      
      // Transform the address field from string to object if provided
      if (transformedData.address && typeof transformedData.address === 'string') {
        transformedData.address = {
          street: transformedData.address,
          city: formData.city || '',
          state: formData.state || '',
          zipCode: formData.pinCode || '',
          country: 'India',
        };
      }
      
      const response = await apiClient.post('/api/leads', {
        ...transformedData,
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
  const handleEligibilityComplete = useCallback(async (appId) => {
    setCheckingEligibility(false);
    webflowBridge.postMessage('eligibilityComplete', {
      applicationId: appId,
      leadId,
    });

    let sessionToken = null;
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (cleanPhone) {
      try {
        const response = await apiClient.post('/api/auth/issue-session-token', { phone: cleanPhone, applicationId: appId });
        sessionToken = response?.data?.sessionToken || null;
        if (sessionToken) {
          console.log('[PW:Session] Session token issued — will pass via URL to listing page', { applicationId: appId, maskedToken: `${sessionToken.slice(0, 8)}...` });
        } else {
          console.warn('[PW:Session] issue-session-token responded but no token in response', { response });
        }
      } catch (err) {
        console.warn('[PW:Session] Failed to issue session token — user will see OTP on listing page', { error: err.message, applicationId: appId });
      }
    } else {
      console.warn('[PW:Session] No phone available to issue session token', { applicationId: appId });
    }

    const stParam = sessionToken ? `&_st=${sessionToken}` : '';
    if (isEmbedded()) {
      const script = document.querySelector('script[data-form]');
      const offersUrl = script?.getAttribute('data-offers-url') || 'https://paisawaala.webflow.io/listing-page';
      setTimeout(() => {
        window.location.href = `${offersUrl}?applicationId=${appId}&leadId=${leadId || ''}${stParam}`;
      }, 500);
    } else {
      window.location.href = `/listing-page?page=offers&applicationId=${appId}${leadId ? `&leadId=${leadId}` : ''}${stParam}`;
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
    const fieldSchema = form1Schema[fieldName];
    if (!fieldSchema) return null;

    // Skip phone and OTP fields (handled by AuthForm)
    if (fieldName === 'phone' || fieldName === 'otp') {
      return null;
    }

    // Check conditional visibility based on employment type
    if (!isFieldVisible(fieldName)) {
      return null;
    }

    // Determine if field should be required based on visibility and employment type
    const employmentType = formData.employmentType;
    let isRequired = fieldSchema.required;
    
    // companyEmail is required for all employment types except Student
    if (fieldName === 'companyEmail') {
      isRequired = employmentType && employmentType !== 'Student';
    }
    // Override required status for conditionally visible fields
    else if (employmentType === 'Salaried') {
      if (['netMonthlyIncome', 'companyName', 'modeOfSalary'].includes(fieldName)) {
        isRequired = true;
      }
    } else if (employmentType === 'Self-employed professional') {
      if (['annualIncome', 'organizationName', 'profession'].includes(fieldName)) {
        isRequired = true;
      }
    } else if (employmentType === 'Self-employed business') {
      if (['annualTurnover', 'annualIncome'].includes(fieldName)) {
        isRequired = true;
      }
    }

    const commonProps = {
      name: fieldName,
      label: fieldSchema.label,
      required: isRequired,
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

    // Handle gender field - use GenderField component (regardless of type)
    if (fieldName === 'gender') {
      return (
        <GenderField
          key={fieldName}
          name={fieldName}
          value={formData[fieldName] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={isRequired}
          error={errors[fieldName]}
          disabled={false}
          options={fieldSchema.options || [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          label={fieldSchema.label || 'Gender'}
        />
      );
    }

    // Handle radio type (for non-gender radio fields)
    if (fieldSchema.type === 'radio') {
      return (
        <GenderField
          key={fieldName}
          name={fieldName}
          value={formData[fieldName] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={isRequired}
          error={errors[fieldName]}
          disabled={false}
          options={fieldSchema.options || []}
          label={fieldSchema.label}
        />
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

    // Handle city field with loading state
    // Only disable personal address city, keep company city editable
    if (fieldName === 'city') {
      const isAutoPopulated = autoPopulatedFields.has(fieldName);
      const isLoading = pincodeLoading && fieldName === 'city';
      
      return (
        <Input
          key={fieldName}
          {...commonProps}
          type="text"
          disabled={isAutoPopulated}
          placeholder={isLoading ? 'Loading...' : commonProps.placeholder}
        />
      );
    }

    // Company city - always editable, show loading state
    if (fieldName === 'companyCity') {
      const isLoading = pincodeLoading && fieldName === 'companyCity';
      
      return (
        <Input
          key={fieldName}
          {...commonProps}
          type="text"
          placeholder={isLoading ? 'Loading...' : commonProps.placeholder}
        />
      );
    }

    // Handle state field - only disable personal address state
    if (fieldName === 'state') {
      const isAutoPopulated = autoPopulatedFields.has(fieldName);
      
      if (fieldSchema.type === 'select') {
        return (
          <Select
            key={fieldName}
            {...commonProps}
            options={fieldSchema.options || []}
            disabled={isAutoPopulated}
          />
        );
      }
    }

    // Company state - always editable
    if (fieldName === 'companyState') {
      if (fieldSchema.type === 'select') {
        return (
          <Select
            key={fieldName}
            {...commonProps}
            options={fieldSchema.options || []}
          />
        );
      }
    }

    // For date fields, ensure the value is in yyyy-MM-dd format
    let adjustedValue = commonProps.value;
    if (fieldSchema.type === 'date' && adjustedValue) {
      // If value contains 'T' (ISO format), extract just the date part
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
  }, [formData, errors, handleChange, handleBlur, handleFocus, handlePincodeLookup, handlePincodeLoadingChange, handlePincodeChange, autoPopulatedFields, pincodeLoading, isFieldVisible]);

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
          isFieldVisible={isFieldVisible}
        />
      );
    },
    [renderField, isCompactLayout, isFieldVisible]
  );


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
        <div style={{
          width: '100%',
          maxWidth: isCompactLayout ? '100%' : '32rem',
          margin: '0 auto',
          padding: isMobile ? '1rem' : '1.25rem',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: isMobile ? '1rem' : '1rem' }}>
            <div style={{
              width: isMobile ? '56px' : '64px',
              height: isMobile ? '56px' : '64px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width={isMobile ? '28' : '32'} height={isMobile ? '28' : '32'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#000000',
            }}>
              Unable to Process
            </h2>
            <p style={{
              color: '#656c77',
              marginBottom: isMobile ? '1rem' : '1rem',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              lineHeight: '1.5',
            }}>
              {eligibilityError?.message || 'We encountered an issue while processing your application.'}
            </p>
            <Button
              variant="primary"
              fullWidth={isMobile}
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
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Let’s get your details</strong>
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

            {currentStep === steps.length && RECAPTCHA_SITE_KEY && !recaptchaError && ReCAPTCHA && (
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
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </div>
    </ErrorBoundary>
  );
};

export default React.memo(Form1);

