import React from 'react';
import { useTheme } from '../../design-system/ThemeProvider';

/**
 * Reusable Input Component
 * Consistent input styling across all forms
 */
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
  const { tokens, colors } = useTheme();

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.normal,
    color: colors.text,
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : colors.input.border}`,
    borderRadius: tokens.borderRadius.md,
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    '&:focus': {
      borderColor: colors.input.focus,
      boxShadow: `0 0 0 3px ${tokens.colors.primary[100]}`,
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  };

  return (
    <div style={{ marginBottom: tokens.spacing.md, width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.text,
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
        type={type}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
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

export default Input;

