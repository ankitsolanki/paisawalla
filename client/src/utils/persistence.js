/**
 * Form data persistence utility
 * Saves form data to localStorage for recovery
 */

const STORAGE_PREFIX = 'pw_form_';

export const saveFormData = (formType, formData) => {
  try {
    const key = `${STORAGE_PREFIX}${formType}`;
    const data = {
      formData,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save form data to localStorage:', error);
  }
};

export const loadFormData = (formType) => {
  try {
    const key = `${STORAGE_PREFIX}${formType}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      // Only restore if less than 24 hours old
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - data.timestamp < maxAge) {
        return data.formData;
      } else {
        // Clean up old data
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Failed to load form data from localStorage:', error);
  }
  return null;
};

export const clearFormData = (formType) => {
  try {
    const key = `${STORAGE_PREFIX}${formType}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear form data from localStorage:', error);
  }
};

export const clearAllFormData = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all form data from localStorage:', error);
  }
};

