import React from 'react';
import { useTheme } from '../../design-system/ThemeProvider';

/**
 * Reusable Select Component
 * Consistent select styling across all forms
 */
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
  const { tokens, colors } = useTheme();

  const [isFocused, setIsFocused] = React.useState(false);

  const selectStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: '16px 20px', // py-4 px-5 from inspiration
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.normal,
    color: colors.text || '#000000',
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? colors.input.focus : colors.input.border}`,
    borderRadius: '12px', // rounded-[12px] from inspiration
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: isFocused && !error 
      ? `0 0 0 3px ${tokens.colors.primary[50]}` 
      : 'none',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <div style={{ marginBottom: tokens.spacing.md, width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: 0,
          }}
        >
          {label}
          {required && <span> *</span>}
        </label>
      )}
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
        style={selectStyles}
        className={className}
        {...props}
      >
        <option value="">{placeholder || label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

export default Select;

