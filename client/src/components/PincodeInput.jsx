import { useState, useCallback } from 'react';
import Input from './ui/CustomInput';

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
  onPincodeLookup,
  onLoadingChange,
  cityFieldName,
  stateFieldName,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const fetchPincodeDetails = useCallback(async (pincode) => {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return null;
    }

    setIsLoading(true);
    setLookupError(null);
    if (onLoadingChange) {
      onLoadingChange(true);
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffices = data[0].PostOffice;
        if (postOffices && postOffices.length > 0) {
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
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  }, []);

  const handleChange = useCallback((e) => {
    const inputValue = e.target.value;
    const cleaned = inputValue.replace(/\D/g, '').slice(0, 6);

    onChange({
      target: {
        name,
        value: cleaned,
      },
    });

    setLookupError(null);

    if (cleaned.length === 6 && /^\d{6}$/.test(cleaned)) {
      fetchPincodeDetails(cleaned).then((details) => {
        if (details && onPincodeLookup) {
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
