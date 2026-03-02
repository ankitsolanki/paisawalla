import { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';

const Input = ({
  label,
  name,
  type = 'text',
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
  ...props
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const isDateInput = type === 'date';
  const hasValue = value && value.toString().trim() !== '';
  const shouldFloatLabel = isFocused || hasValue;
  const shouldShowPlaceholder = isFocused && !hasValue;

  const placeholderText = isDateInput
    ? (placeholder || 'dd-mm-yyyy')
    : (placeholder || label || '');

  const borderClass = error
    ? 'border-destructive'
    : isFocused
      ? 'border-primary ring-2 ring-primary'
      : 'border-border';

  const paddingClass = shouldFloatLabel ? 'pt-5 md:pt-6 pb-1.5 md:pb-2 px-3.5 md:px-5' : 'py-3.5 md:py-4 px-3.5 md:px-5';
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';

  const handleDateContainerClick = (e) => {
    if (isDateInput && inputRef.current && !disabled && e.target !== inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.();
    }
  };

  return (
    <div
      className={`relative ${fullWidth ? 'w-full' : ''} floating-label-group`}
      onClick={isDateInput ? handleDateContainerClick : undefined}
    >
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        placeholder={shouldShowPlaceholder ? placeholderText : ''}
        required={required}
        disabled={disabled}
        autoCapitalize={name === 'panNumber' ? 'characters' : undefined}
        autoComplete={name === 'panNumber' ? 'off' : undefined}
        className={`w-full rounded-xl border text-base outline-none transition-all duration-300 font-sans ${borderClass} ${paddingClass} ${disabledClass} ${(name === 'ssn' || name === 'panNumber') ? 'uppercase' : ''} ${isDateInput ? 'cursor-pointer pr-12 min-w-0 date-input' : ''} floating-input ${className}`}
        style={isDateInput ? {
          ...((!isFocused && !hasValue) ? { color: 'transparent' } : {}),
          boxSizing: 'border-box',
          maxWidth: '100%',
          WebkitAppearance: 'none',
        } : undefined}
        data-testid={`input-${name}`}
        {...props}
      />

      {isDateInput && isFocused && !hasValue && (
        <span
          className="absolute pointer-events-none text-muted-foreground text-sm md:text-base transition-opacity duration-300"
          style={{ left: '0.875rem', top: '1.55rem' }}
          data-testid={`placeholder-${name}`}
        >
          {placeholderText}
        </span>
      )}

      {isDateInput && (
        <span
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
          style={{ marginTop: error ? '-0.5rem' : '0' }}
          data-testid={`icon-calendar-${name}`}
        >
          <Calendar className="w-5 h-5" strokeWidth={1.5} />
        </span>
      )}

      {label && (
        <label
          htmlFor={name}
          className={`absolute left-3.5 md:left-5 pointer-events-none transition-all duration-300 truncate max-w-[calc(100%-2rem)] ${shouldFloatLabel ? 'text-xs text-primary' : 'text-sm md:text-base text-muted-foreground'}`}
          style={{ top: shouldFloatLabel ? '0.4rem' : '1rem' }}
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

export default Input;
