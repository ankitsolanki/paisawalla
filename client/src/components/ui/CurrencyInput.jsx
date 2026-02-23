import { useState, useEffect } from 'react';

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
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  const hasValue = displayValue && displayValue.toString().trim() !== '';
  const shouldFloatLabel = isFocused || hasValue;
  const shouldShowPlaceholder = isFocused && !hasValue;

  const formatIndianCurrency = (num) => {
    if (!num && num !== 0) return '';
    const numStr = num.toString().replace(/,/g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseFormattedValue = (str) => {
    if (!str) return '';
    const cleaned = str.replace(/,/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? '' : num;
  };

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

    if (inputValue === '') {
      setDisplayValue('');
      onChange({ target: { name, value: '' } });
      return;
    }

    const cleaned = inputValue.replace(/[^\d]/g, '');

    if (cleaned === '') {
      setDisplayValue('');
      onChange({ target: { name, value: '' } });
      return;
    }

    const numValue = parseInt(cleaned, 10);

    if (isNaN(numValue)) {
      return;
    }

    const formatted = formatIndianCurrency(numValue);
    setDisplayValue(formatted);
    onChange({ target: { name, value: numValue } });
  };

  const handleBlur = (e) => {
    setIsFocused(false);

    const numValue = parseFormattedValue(displayValue);

    if (numValue !== '') {
      let constrainedValue = numValue;
      let valueChanged = false;

      if (min !== undefined && numValue < min) {
        constrainedValue = min;
        valueChanged = true;
      }

      if (max !== undefined && numValue > max) {
        constrainedValue = max;
        valueChanged = true;
      }

      if (valueChanged) {
        const formatted = formatIndianCurrency(constrainedValue);
        setDisplayValue(formatted);
        onChange({ target: { name, value: constrainedValue } });
      }
    }

    if (onBlur) {
      const finalValue = parseFormattedValue(displayValue);
      onBlur({
        ...e,
        target: { ...e.target, name, value: finalValue || '' },
      });
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const borderClass = error
    ? 'border-destructive'
    : isFocused
      ? 'border-primary ring-2 ring-primary'
      : 'border-border';

  const paddingClass = shouldFloatLabel ? 'pt-6 pb-2 px-5' : 'py-4 px-5';
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} floating-label-group`}>
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
        className={`w-full rounded-xl border text-base outline-none transition-all duration-300 font-sans ${borderClass} ${paddingClass} ${disabledClass} ${className}`}
        {...props}
      />

      {label && (
        <label
          htmlFor={name}
          className={`absolute left-5 pointer-events-none transition-all duration-300 ${shouldFloatLabel ? 'text-xs text-primary' : 'text-base text-muted-foreground'}`}
          style={{ top: shouldFloatLabel ? '0.5rem' : '1.25rem' }}
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </label>
      )}

      <div className="min-h-[16px] mt-1.5 overflow-hidden">
        {error && (
          <p className="text-sm text-destructive m-0 animate-slideDown">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default CurrencyInput;
