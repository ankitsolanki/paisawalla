import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../utils/analytics';

/**
 * Hook for tracking form interactions
 */
export const useFormTracking = (formType, formData, currentStep = null) => {
  const formStartTime = useRef(Date.now());
  const lastInteractionTime = useRef(Date.now());
  const abandonmentCleanup = useRef(null);
  const hasTrackedFormView = useRef(false);
  const previousStep = useRef(currentStep);

  // Initialize abandonment tracking and track form view (only once)
  useEffect(() => {
    // Only track form view once per form instance
    if (!hasTrackedFormView.current) {
      analytics.trackFormView(formType);
      hasTrackedFormView.current = true;
    }

    // Set up abandonment tracking
    abandonmentCleanup.current = analytics.initAbandonmentTracking(
      formType,
      () => formData
    );

    return () => {
      if (abandonmentCleanup.current) {
        abandonmentCleanup.current();
      }
      // Reset on unmount so it can track again if component remounts
      hasTrackedFormView.current = false;
    };
  }, [formType]);

  // Track step changes (only when step actually changes, not on initial mount)
  useEffect(() => {
    // Skip if currentStep is null (single-step form)
    if (currentStep === null) {
      return;
    }

    // Skip on initial mount - only track actual step changes
    if (previousStep.current === null || previousStep.current === undefined) {
      previousStep.current = currentStep;
      return;
    }

    // Only track if step actually changed
    if (previousStep.current !== currentStep) {
      analytics.trackStepChange(formType, previousStep.current, currentStep);
      previousStep.current = currentStep;
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

