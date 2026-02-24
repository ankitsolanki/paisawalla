import { useState } from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  options = [],
  required = false,
  error = null,
  disabled = false,
  fullWidth = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value && value.toString().trim() !== '';
  const shouldFloatLabel = isFocused || hasValue;

  const borderClass = error
    ? 'border-destructive'
    : isFocused
      ? 'border-primary ring-2 ring-primary'
      : 'border-border';

  const paddingClass = shouldFloatLabel
    ? 'pt-5 md:pt-6 pb-1.5 md:pb-2 px-3.5 md:px-5 pr-8 md:pr-10'
    : 'py-3.5 md:py-4 px-3.5 md:px-5 pr-8 md:pr-10';

  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

  const arrowSvg = isFocused
    ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234338CA' d='M6 9L1 4h10z'/%3E%3C/svg%3E"
    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E";

  return (
    <div className={`relative max-w-full ${fullWidth ? 'w-full' : ''}`}>
      <select
        id={name}
        name={name}
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
        required={required}
        disabled={disabled}
        className={`w-full rounded-xl border text-base outline-none transition-all duration-300 appearance-none truncate box-border bg-transparent ${borderClass} ${paddingClass} ${disabledClass} ${className}`}
        style={{
          backgroundImage: `url("${arrowSvg}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '12px',
        }}
        {...props}
      >
        <option value="" disabled></option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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

export default Select;
