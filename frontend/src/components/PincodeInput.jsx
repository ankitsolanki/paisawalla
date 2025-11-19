import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import Input from './ui/Input';

/**
 * PincodeInput - Reusable PIN code input component with auto-population
 * Calls postalpincode.in API to fetch city and state based on PIN code
 * Auto-populates city and state fields when valid 6-digit PIN is entered
 */
const PincodeInput = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  error = null,
  disabled = false,
  fullWidth = false,
  className = '',
  // Callback to auto-populate city and state
  onPincodeLookup,
  // Callback to notify parent of loading state changes
  onLoadingChange,
  // Field names for city and state (for auto-population)
  cityFieldName,
  stateFieldName,
  ...props
}) => {
  const { tokens, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Fetch city and state from PIN code
  const fetchPincodeDetails = useCallback(async (pincode) => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return null;
    }

    setIsLoading(true);
    setLookupError(null);
    // Notify parent of loading state
    if (onLoadingChange) {
      onLoadingChange(true);
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffices = data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
          // Use the first post office entry
          const firstPostOffice = postOffices[0];
          const city = firstPostOffice.Name || firstPostOffice.Block || '';
          const state = firstPostOffice.State || '';

          return {
            city: city.trim(),
            state: state.trim(),
            district: firstPostOffice.District || '',
          };
        }
      }

      setLookupError('PIN code not found');
      return null;
    } catch (err) {
      console.error('Error fetching PIN code details:', err);
      setLookupError('Unable to fetch PIN code details. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
      // Notify parent that loading is complete
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  }, []);

  // Handle PIN code change
  const handleChange = useCallback((e) => {
    const inputValue = e.target.value;
    
    // Only allow digits, max 6 digits
    const cleaned = inputValue.replace(/\D/g, '').slice(0, 6);
    
    // Update the input value
    onChange({
      target: {
        name,
        value: cleaned,
      },
    });

    // Clear previous errors
    setLookupError(null);

    // If we have a valid 6-digit PIN, fetch details
    if (cleaned.length === 6 && /^\d{6}$/.test(cleaned)) {
      fetchPincodeDetails(cleaned).then((details) => {
        if (details && onPincodeLookup) {
          // Call the callback with the details
          onPincodeLookup({
            pincode: cleaned,
            city: details.city,
            state: details.state,
            district: details.district,
            cityFieldName,
            stateFieldName,
          });
        }
      });
    }
  }, [name, onChange, fetchPincodeDetails, onPincodeLookup, cityFieldName, stateFieldName]);

  // Display error (either validation error or lookup error)
  const displayError = error || lookupError;

  return (
    <Input
      label={label}
      name={name}
      type="text"
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder || 'Enter 6-digit PIN code'}
      required={required}
      error={displayError}
      disabled={disabled}
      fullWidth={fullWidth}
      className={className}
      maxLength={6}
      inputMode="numeric"
      pattern="[0-9]*"
      {...props}
    />
  );
};

export default PincodeInput;

