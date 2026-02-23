import { useState, useRef } from 'react';

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

  const paddingClass = shouldFloatLabel ? 'pt-6 pb-2 px-5' : 'py-4 px-5';
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} floating-label-group`}>
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
        className={`w-full rounded-xl border text-base outline-none transition-all duration-300 font-sans ${borderClass} ${paddingClass} ${disabledClass} ${(name === 'ssn' || name === 'panNumber') ? 'uppercase' : ''} ${isDateInput ? 'cursor-pointer' : ''} floating-input ${isDateInput ? 'date-input' : ''} ${className}`}
        style={isDateInput && !isFocused && !hasValue ? { color: 'transparent' } : undefined}
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

export default Input;
