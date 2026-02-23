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
    ? 'pt-6 pb-2 sm:px-5 px-4 sm:pr-10 pr-9'
    : 'sm:py-4 py-3.5 sm:px-5 px-4 sm:pr-10 pr-9';

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
        className={`w-full rounded-xl border sm:text-base text-sm outline-none transition-all duration-300 appearance-none truncate box-border ${borderClass} ${paddingClass} ${disabledClass} ${className}`}
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
          className={`absolute sm:left-5 left-4 pointer-events-none transition-all duration-300 ${shouldFloatLabel ? 'text-xs text-primary' : 'sm:text-base text-sm text-muted-foreground'}`}
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

export default Select;
