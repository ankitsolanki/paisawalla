import { useState, useCallback, useEffect } from 'react';
import { useFormTracking } from '../../hooks/useFormTracking';
import ErrorBoundary from '../ui/ErrorBoundary';
import Button from '../ui/CustomButton';
import FieldRenderer from '../FieldRenderer';
import FormStepper from '../FormStepper';
import ProgressBar from '../ProgressBar';
import SubmitSuccess from '../SubmitSuccess';
import EligibilityChecking from '../EligibilityChecking';
import OffersListing from '../../embeds/offers/OffersListing';
import { validateFormData, validateField } from '../../utils/validation';
import { executeRecaptcha } from '../../utils/recaptcha';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';

const DesktopFormRenderer = ({ schema, theme = 'light', title, description }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(null);
  const [leadId, setLeadId] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  } = useFormTracking(schema.formId, formData, schema.steps > 1 ? currentStep : null);

  const getCurrentStepFields = useCallback(() => {
    const fields = schema.fields.filter((field) => field.step === currentStep);
    if (currentStep === 1) {
      return fields.filter((field) => {
        if (field.name === 'otp') {
          return otpSent;
        }
        return true;
      });
    }
    return fields;
  }, [schema, currentStep, otpSent]);

  const getStepLabels = useCallback(() => {
    if (schema.steps === 1) return [];
    const steps = [];
    for (let i = 1; i <= schema.steps; i++) {
      const stepFields = schema.fields.filter((f) => f.step === i);
      const firstField = stepFields[0];
      steps.push({
        label: firstField?.stepLabel || `Step ${i}`,
      });
    }
    return steps;
  }, [schema]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const field = schema.fields.find((f) => f.name === name);
      let processedValue = value;
      if (field && field.name === 'ssn' && typeof value === 'string') {
        processedValue = value.toUpperCase();
        e.target.value = processedValue;
      }
        fieldName: name,
        value,
        processedValue,
        valueType: typeof value,
        rawValue: e.target.value,
        inputType: e.target.type,
      });
      setFormData((prev) => {
        const newFormData = { ...prev, [name]: processedValue };
          fieldName: name,
          newValue: newFormData[name],
        });
        return newFormData;
      });
      trackFieldInteraction(name, 'change', processedValue);
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors, trackFieldInteraction, schema]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
        fieldName: name,
        value,
        valueType: typeof value,
        rawValue: e.target.value,
      });
      trackFieldInteraction(name, 'blur', value);
      const field = schema.fields.find((f) => f.name === name);
      if (field) {
          fieldName: field.name,
          fieldType: field.type,
          isRequired: field.required,
        });
        const hasValue = field.type === 'number' 
          ? (value !== undefined && value !== null && value !== '' && !isNaN(Number(value)))
          : (value !== undefined && value !== null && value !== '');
          hasValue,
          isRequired: field.required,
          willValidate: hasValue || field.required,
        });
        if (hasValue || field.required) {
            fieldName: name,
            value,
          });
          const validation = validateField(value, field);
            fieldName: name,
            isValid: validation.isValid,
            error: validation.error,
          });
          if (!validation.isValid) {
            setErrors((prev) => ({ ...prev, [name]: validation.error }));
            trackFieldInteraction(name, 'error', value);
          } else {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
            });
          }
        }
      } else {
        console.warn('[HANDLE BLUR] Field not found in schema', { fieldName: name });
      }
    },
    [schema, trackFieldInteraction]
  );

  const handleFocus = useCallback(
    (e) => {
      const { name, value } = e.target;
      trackFieldInteraction(name, 'focus', value);
    },
    [trackFieldInteraction]
  );

  const validateCurrentStep = useCallback(() => {
      currentStep,
      formData,
    });
    const currentFields = getCurrentStepFields();
      fieldNames: currentFields.map(f => f.name),
      fieldCount: currentFields.length,
    });
    const stepErrors = {};
    let isValid = true;
    currentFields.forEach((field) => {
      const value = formData[field.name];
        fieldName: field.name,
        fieldType: field.type,
        value,
        valueType: typeof value,
        isRequired: field.required,
      });
      const isEmpty = value === undefined || 
                      value === null || 
                      value === '' || 
                      (field.type === 'checkbox' && value === false) ||
                      (field.type === 'number' && (value === '' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')));
        fieldName: field.name,
        isEmpty,
      });
      if (isEmpty) {
        if (field.required) {
            fieldName: field.name,
          });
          stepErrors[field.name] = `${field.label} is required`;
          isValid = false;
        }
      } else {
          fieldName: field.name,
          value,
        });
        const validation = validateField(value, field);
          fieldName: field.name,
          isValid: validation.isValid,
          error: validation.error,
        });
        if (!validation.isValid) {
          stepErrors[field.name] = validation.error;
          isValid = false;
        }
      }
    });
      isValid,
      errors: stepErrors,
    });
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return isValid;
  }, [formData, getCurrentStepFields, currentStep]);

  const sendOtp = useCallback(async (phone) => {
    setOtpSending(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await apiClient.post('/api/auth/send-otp', { phone: cleanPhone });
      setOtpSent(true);
      trackButtonClick('otp_sent', { phone: cleanPhone });
    } catch (error) {
      const msg = error?.message || 'Failed to send OTP. Please try again.';
      setErrors((prev) => ({ ...prev, phone: msg }));
      trackButtonClick('otp_send_error', { error: msg });
    } finally {
      setOtpSending(false);
    }
  }, [trackButtonClick]);

  const verifyOtp = useCallback(async (phone, otp) => {
    if (!/^\d{6}$/.test(otp)) {
      setErrors((prev) => ({ ...prev, otp: 'Invalid OTP. Please enter a 6-digit code.' }));
      return false;
    }
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await apiClient.post('/api/auth/verify-otp', { phone: cleanPhone, otp });
      setOtpVerified(true);
      trackButtonClick('otp_verified', { phone: cleanPhone });
      return true;
    } catch (error) {
      const msg = error?.message || 'Invalid OTP. Please try again.';
      setErrors((prev) => ({ ...prev, otp: msg }));
      trackButtonClick('otp_verify_error', { error: msg });
      return false;
    }
  }, [trackButtonClick]);

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
      const phoneField = schema.fields.find((f) => f.name === 'phone' && f.step === 1);
      const phoneValue = formData.phone;
      if (phoneField) {
        const phoneValidation = validateField(phoneValue, phoneField);
        if (!phoneValidation.isValid) {
          setErrors((prev) => ({ ...prev, phone: phoneValidation.error }));
          return;
        }
      }
      if (!otpSent) {
        await sendOtp(phoneValue);
        return;
      }
      if (!otpVerified) {
        const otpField = schema.fields.find((f) => f.name === 'otp' && f.step === 1);
        const otpValue = formData.otp;
        if (otpField) {
          const otpValidation = validateField(otpValue, otpField);
          if (!otpValidation.isValid) {
            setErrors((prev) => ({ ...prev, otp: otpValidation.error }));
            return;
          }
        }
        const verified = await verifyOtp(phoneValue, otpValue);
        if (!verified) {
          return;
        }
      }
      if (!validateCurrentStep()) {
        return;
      }
    } else {
      if (!validateCurrentStep()) {
        return;
      }
    }
    trackButtonClick('next', { fromStep: currentStep, toStep: currentStep + 1 });
    const currentFieldNames = getCurrentStepFields().map(f => f.name);
    setErrors((prev) => {
      const newErrors = { ...prev };
      currentFieldNames.forEach(name => delete newErrors[name]);
      return newErrors;
    });
    setCurrentStep((prev) => Math.min(prev + 1, schema.steps));
  }, [currentStep, validateCurrentStep, schema.steps, schema.fields, formData, trackButtonClick, otpSent, otpVerified, sendOtp, verifyOtp]);

  const handlePrevious = useCallback(() => {
    trackButtonClick('previous', { fromStep: currentStep, toStep: currentStep - 1 });
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [currentStep, trackButtonClick]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;
    const validation = validateFormData(formData, schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    let token = recaptchaToken;
    if (!token) {
      try {
        trackButtonClick('recaptcha_start');
        token = await executeRecaptcha('submit');
        setRecaptchaToken(token);
        setRecaptchaError(null);
      } catch (error) {
        setRecaptchaError('reCAPTCHA verification failed. Please try again.');
        trackSubmitError(error);
        return;
      }
    }
    trackSubmitStart();
    setIsSubmitting(true);
    try {
      const response = await apiClient.post(schema.submitEndpoint, {
        ...validation.data,
        formType: schema.formId,
        recaptchaToken: token,
      });
      const submittedLeadId = response.data?._id || response.data?.leadId;
      setLeadId(submittedLeadId);
      setIsSubmitted(true);
      setCheckingEligibility(true);
      trackSubmitSuccess(submittedLeadId);
      webflowBridge.postMessage('formSubmitted', {
        success: true,
        leadId: submittedLeadId,
        formId: schema.formId,
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
        formId: schema.formId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateCurrentStep,
    formData,
    schema,
    recaptchaToken,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  ]);

  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  useEffect(() => {
    if (schema.steps === 1 || currentStep === schema.steps) {
      import('../../utils/recaptcha').then(({ loadRecaptcha }) => {
        loadRecaptcha().catch((error) => {
          console.warn('reCAPTCHA load warning:', error);
        });
      });
    }
  }, [schema.steps, currentStep]);

  const handleEligibilityComplete = useCallback((appId) => {
    setApplicationId(appId);
    setCheckingEligibility(false);
    trackButtonClick('eligibility_complete', { applicationId: appId });
  }, [trackButtonClick]);

  const handleEligibilityError = useCallback((error) => {
    setEligibilityError(error);
    setCheckingEligibility(false);
    trackButtonClick('eligibility_error', { error: error.message });
  }, [trackButtonClick]);

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

  if (applicationId && !checkingEligibility) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  if (eligibilityError && !checkingEligibility) {
    return (
      <ErrorBoundary>
        <div className="text-center p-8">
          <h3 className="text-xl font-bold text-destructive mb-4">
            Unable to check eligibility
          </h3>
          <p className="text-base text-muted-foreground mb-6">
            {eligibilityError.message || 'An error occurred while checking your eligibility. Please try again later.'}
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
      </ErrorBoundary>
    );
  }

  if (isSubmitted && !checkingEligibility && !applicationId) {
    return (
      <ErrorBoundary>
        <SubmitSuccess
          message={`Thank you! Your ${schema.title} has been submitted successfully. We'll review your information and get back to you soon.`}
          onCheckEligibility={() => {
            trackButtonClick('check_eligibility');
            if (leadId) {
              setCheckingEligibility(true);
            }
            webflowBridge.postMessage('checkEligibility', {
              formId: schema.formId,
              leadId,
            });
          }}
        />
      </ErrorBoundary>
    );
  }

  const currentFields = getCurrentStepFields();
  const stepLabels = getStepLabels();
  const isLastStep = currentStep === schema.steps;

  return (
    <ErrorBoundary>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            {title || schema.title}
          </h1>
          {(description || schema.description) && (
            <p className="text-base text-muted-foreground">
              {description || schema.description}
            </p>
          )}
        </div>

        {schema.steps > 1 && stepLabels.length > 0 && (
          <>
            <FormStepper
              currentStep={currentStep}
              totalSteps={schema.steps}
              steps={stepLabels}
            />
            <ProgressBar current={currentStep} total={schema.steps} />
          </>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6">
            {currentFields.map((field) => (
              <div
                key={field.name}
                className={field.fullWidth ? 'col-span-full' : ''}
              >
                <FieldRenderer
                  field={field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  error={errors[field.name]}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>

          {errors.submit && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
              {errors.submit}
            </div>
          )}

          {recaptchaError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-md text-destructive">
              {recaptchaError}
            </div>
          )}

          {isLastStep && (
            <div className="mb-6">
              <div id="recaptcha-container"></div>
            </div>
          )}

          <div className="flex justify-end pt-4 gap-6">
            {schema.steps > 1 && currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
                fullWidth={schema.steps === 1}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                fullWidth={schema.steps === 1}
                disabled={otpSending}
                loading={otpSending}
              >
                {currentStep === 1 && !otpSent
                  ? otpSending
                    ? 'Sending OTP...'
                    : 'Send OTP'
                  : currentStep === 1 && !otpVerified
                  ? 'Verify OTP'
                  : 'Next'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
};

export default DesktopFormRenderer;
