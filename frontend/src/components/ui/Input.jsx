import React, { useState } from 'react';
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

  // Detect if mobile (simple check - can be enhanced)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: isMobile 
      ? `${tokens.spacing.md} ${tokens.spacing.md}` // Larger padding on mobile for touch
      : `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSize.base, // Paisawaala: 1rem
    lineHeight: tokens.typography.lineHeight.textRegular, // Paisawaala: 24px
    color: colors.textSecondary || tokens.colors.gray[500], // Paisawaala: #656c77
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? colors.input.focus : colors.input.border}`,
    borderRadius: tokens.borderRadius.lg, // Larger radius for modern look
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    minHeight: isMobile ? '48px' : 'auto', // Minimum touch target on mobile
    boxShadow: isFocused && !error 
      ? `0 0 0 3px ${tokens.colors.primary[50]}` 
      : 'none', // Light blue focus ring
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
            fontSize: tokens.typography.fontSize.sm, // Paisawaala: 0.875rem
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.textSecondary || tokens.colors.gray[500], // Paisawaala: #656c77
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
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          ...inputStyles,
          ...(props.style || {}),
          // Add uppercase styling for PAN number (ssn or panNumber field)
          ...(name === 'ssn' || name === 'panNumber' ? { textTransform: 'uppercase' } : {}),
        }}
        autoCapitalize={name === 'panNumber' ? 'characters' : undefined}
        autoComplete={name === 'panNumber' ? 'off' : undefined}
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

