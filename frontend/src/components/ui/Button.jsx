import React from 'react';
import { useTheme } from '../../design-system/ThemeProvider';

/**
 * Reusable Button Component
 * Consistent button styling across all forms
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) => {
  const { tokens, colors } = useTheme();

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: tokens.typography.fontWeight.semibold,
    borderRadius: tokens.borderRadius.full, // Paisawaala: 1000px (fully rounded)
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    height: tokens.spacing.buttonHeight, // Paisawaala: 48px
    padding: tokens.spacing.buttonPadding, // Paisawaala: 0.75rem 1.5rem
    fontSize: tokens.typography.fontSize.base, // Paisawaala: 1rem
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
  };

  const variantStyles = {
    primary: {
      backgroundColor: tokens.colors.cta.primary, // Paisawaala: #ec3957
      color: '#ffffff',
      border: 'none',
      '&:hover': {
        backgroundColor: tokens.colors.cta.hover, // Paisawaala: #dd23bb
      },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: tokens.colors.primary[600],
      border: `1px solid ${tokens.colors.primary[600]}`,
      '&:hover': {
        backgroundColor: tokens.colors.primary[50],
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.text,
      border: `1px solid ${colors.border}`,
      '&:hover': {
        backgroundColor: colors.background === tokens.colors.background.light
          ? tokens.colors.gray[50]
          : tokens.colors.gray[800],
      },
    },
    danger: {
      backgroundColor: tokens.colors.error[500],
      color: '#ffffff',
      border: 'none',
      '&:hover': {
        backgroundColor: tokens.colors.error[600],
      },
    },
  };

  const sizeStyles = {
    sm: {
      padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
      fontSize: tokens.typography.fontSize.sm,
    },
    md: {
      padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
      fontSize: tokens.typography.fontSize.base,
    },
    lg: {
      padding: `${tokens.spacing.lg} ${tokens.spacing.xl}`,
      fontSize: tokens.typography.fontSize.lg,
    },
  };

  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
      className={className}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;

