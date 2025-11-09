import { useEffect, useCallback } from 'react';
import { saveFormData, loadFormData, clearFormData } from '../utils/persistence';

/**
 * Hook for form data persistence
 * Automatically saves and restores form data
 */
export const useFormPersistence = (formType, formData, isSubmitted) => {
  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFormData(formType);
    if (savedData) {
      // Restore data - this should be handled by the form component
      // by calling a restore callback
      return savedData;
    }
  }, [formType]);

  // Save data whenever it changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0 && !isSubmitted) {
      saveFormData(formType, formData);
    }
  }, [formType, formData, isSubmitted]);

  // Clear data on successful submission
  useEffect(() => {
    if (isSubmitted) {
      clearFormData(formType);
    }
  }, [formType, isSubmitted]);

  const restoreFormData = useCallback(() => {
    return loadFormData(formType);
  }, [formType]);

  return { restoreFormData };
};

