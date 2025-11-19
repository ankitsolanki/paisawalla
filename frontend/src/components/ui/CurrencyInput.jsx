import React, { useState, useEffect } from 'react';
import { useTheme } from '../../design-system/ThemeProvider';

/**
 * CurrencyInput - Input component with Indian currency formatting
 * Formats numbers with commas as user types (e.g., 10,000)
 * Stores numeric value internally, displays formatted value
 */
const CurrencyInput = ({
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
  min,
  max,
  className = '',
  ...props
}) => {
  const { tokens, colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Detect if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Format number with Indian currency commas
  const formatIndianCurrency = (num) => {
    if (!num && num !== 0) return '';
    const numStr = num.toString().replace(/,/g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted string to number
  const parseFormattedValue = (str) => {
    if (!str) return '';
    const cleaned = str.replace(/,/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? '' : num;
  };

  // Initialize display value from prop value
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const numValue = typeof value === 'string' ? parseFormattedValue(value) : value;
      setDisplayValue(formatIndianCurrency(numValue));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      onChange({
        target: {
          name,
          value: '',
        },
      });
      return;
    }

    // Remove all non-digit characters
    const cleaned = inputValue.replace(/[^\d]/g, '');
    
    if (cleaned === '') {
      setDisplayValue('');
      onChange({
        target: {
          name,
          value: '',
        },
      });
      return;
    }

    // Parse to number
    const numValue = parseInt(cleaned, 10);
    
    if (isNaN(numValue)) {
      return;
    }

    // Don't apply constraints while typing - allow free input
    // Format and update display value
    const formatted = formatIndianCurrency(numValue);
    setDisplayValue(formatted);

    // Call onChange with numeric value (without constraints)
    onChange({
      target: {
        name,
        value: numValue,
      },
    });
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    
    // Apply min/max constraints on blur
    const numValue = parseFormattedValue(displayValue);
    
    if (numValue !== '') {
      let constrainedValue = numValue;
      let valueChanged = false;
      
      // Apply min constraint
      if (min !== undefined && numValue < min) {
        constrainedValue = min;
        valueChanged = true;
      }
      
      // Apply max constraint
      if (max !== undefined && numValue > max) {
        constrainedValue = max;
        valueChanged = true;
      }
      
      // If value was constrained, update display and form data
      if (valueChanged) {
        const formatted = formatIndianCurrency(constrainedValue);
        setDisplayValue(formatted);
        
        // Update form data with constrained value
        onChange({
          target: {
            name,
            value: constrainedValue,
          },
        });
      }
    }
    
    if (onBlur) {
      // Pass the numeric value in the event
      const finalValue = parseFormattedValue(displayValue);
      onBlur({
        ...e,
        target: {
          ...e.target,
          name,
          value: finalValue || '',
        },
      });
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: isMobile 
      ? `${tokens.spacing.md} ${tokens.spacing.md}`
      : `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.textRegular,
    color: colors.textSecondary || tokens.colors.gray[500],
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? colors.input.focus : colors.input.border}`,
    borderRadius: tokens.borderRadius.lg,
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    minHeight: isMobile ? '48px' : 'auto',
    boxShadow: isFocused && !error 
      ? `0 0 0 3px ${tokens.colors.primary[50]}` 
      : 'none',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.textSecondary || tokens.colors.gray[500],
            fontFamily: tokens.typography.fontFamily.sans.join(', '),
          }}
        >
          {label}
          {required && (
            <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
              *
            </span>
          )}
        </label>
      )}
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={inputStyles}
        className={className}
        {...props}
      />
      {error && (
        <p
          style={{
            marginTop: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.error[600],
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;

