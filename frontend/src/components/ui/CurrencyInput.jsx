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

  // Determine if label should float (when focused or has value)
  const hasValue = displayValue && displayValue.toString().trim() !== '';
  const shouldFloatLabel = isFocused || hasValue;

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

  // Show placeholder only when focused and value is empty
  const shouldShowPlaceholder = isFocused && !hasValue;

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: shouldFloatLabel ? '24px 20px 8px 20px' : '16px 20px', // pt-6 pb-2 when floating, py-4 when not
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.textRegular,
    color: colors.text || '#000000',
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? tokens.colors.primary[500] : colors.input.border}`,
    borderRadius: '12px', // rounded-[12px] from inspiration
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    minHeight: isMobile ? '48px' : 'auto',
    boxShadow: isFocused && !error 
      ? `0 0 0 2px ${tokens.colors.primary[500]}` // ring-2 ring-primary
      : 'none',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const labelStyles = {
    position: 'absolute',
    left: '20px', // px-5
    top: shouldFloatLabel ? '0.5rem' : '1.25rem', // translateY(0.5rem) when floating, translateY(1.25rem) when not
    transformOrigin: '0 0',
    transform: shouldFloatLabel ? 'scale(0.75)' : 'scale(1)',
    transition: 'transform 300ms ease-in-out, color 300ms ease-in-out',
    pointerEvents: 'none',
    color: isFocused ? tokens.colors.primary[500] : (colors.textSecondary || tokens.colors.gray[500]),
    fontSize: shouldFloatLabel ? tokens.typography.fontSize.sm : tokens.typography.fontSize.base,
    lineHeight: 1,
  };

  return (
    <div 
      style={{ 
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
        marginBottom: tokens.spacing.md,
        paddingBottom: error ? '24px' : '0px', // Reserve space for error message
      }}
      className="floating-label-group"
    >
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={shouldShowPlaceholder ? (placeholder || label || '') : ''}
        required={required}
        disabled={disabled}
        style={inputStyles}
        className={className}
        {...props}
      />
      {label && (
        <label
          htmlFor={name}
          className="floating-label"
          style={labelStyles}
        >
          {label}
          {required && <span style={{ color: tokens.colors.error[500] }}> *</span>}
        </label>
      )}
      
      {error && (
        <p
          style={{
            position: 'absolute',
            bottom: '-24px',
            left: '0px',
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.error[600],
            margin: '0px',
            whiteSpace: 'nowrap',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;

