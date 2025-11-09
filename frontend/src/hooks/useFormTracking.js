import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../utils/analytics';

/**
 * Hook for tracking form interactions
 */
export const useFormTracking = (formType, formData, currentStep = null) => {
  const formStartTime = useRef(Date.now());
  const lastInteractionTime = useRef(Date.now());
  const abandonmentCleanup = useRef(null);

  // Initialize abandonment tracking
  useEffect(() => {
    analytics.trackFormView(formType);

    // Set up abandonment tracking
    abandonmentCleanup.current = analytics.initAbandonmentTracking(
      formType,
      () => formData
    );

    return () => {
      if (abandonmentCleanup.current) {
        abandonmentCleanup.current();
      }
    };
  }, [formType]);

  // Track step changes
  useEffect(() => {
    if (currentStep !== null) {
      analytics.trackStepChange(formType, currentStep - 1, currentStep);
    }
  }, [currentStep, formType]);

  const trackFieldInteraction = useCallback((fieldName, action, value = null) => {
    lastInteractionTime.current = Date.now();
    analytics.trackFieldInteraction(formType, fieldName, action, value);
  }, [formType]);

  const trackSubmitStart = useCallback(() => {
    analytics.trackFormSubmitStart(formType, formData);
  }, [formType, formData]);

  const trackSubmitSuccess = useCallback((leadId) => {
    const duration = Date.now() - formStartTime.current;
    analytics.trackFormSubmitSuccess(formType, leadId, duration);
  }, [formType]);

  const trackSubmitError = useCallback((error) => {
    const duration = Date.now() - formStartTime.current;
    analytics.trackFormSubmitError(formType, error, duration);
  }, [formType]);

  const trackButtonClick = useCallback((buttonName, context = {}) => {
    analytics.trackButtonClick(buttonName, { formType, ...context });
  }, [formType]);

  return {
    trackFieldInteraction,
    trackSubmitStart,
    trackSubmitSuccess,
    trackSubmitError,
    trackButtonClick,
  };
};

