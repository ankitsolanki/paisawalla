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
    fontWeight: tokens.typography.fontWeight.semibold, // font-semibold
    borderRadius: tokens.borderRadius.full, // Fully rounded
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    padding: '12px 32px', // py-3 px-8 from inspiration
    fontSize: tokens.typography.fontSize.base, // 1rem
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
  };

  const variantStyles = {
    primary: {
      backgroundColor: tokens.colors.cta.primary, // Paisawaala: #160E7A
      color: '#ffffff',
      border: 'none',
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
      padding: '8px 16px',
      fontSize: tokens.typography.fontSize.sm,
    },
    md: {
      padding: '12px 32px', // py-3 px-8 from inspiration
      fontSize: tokens.typography.fontSize.base,
    },
    lg: {
      padding: '16px 40px',
      fontSize: tokens.typography.fontSize.lg,
    },
  };

  const style = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  // Handle hover state for primary buttons
  const handleMouseEnter = (e) => {
    if (variant === 'primary' && !disabled && !loading) {
      e.currentTarget.style.backgroundColor = 'rgba(67, 56, 202, 0.9)'; // hover:bg-opacity-90
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary' && !disabled && !loading) {
      e.currentTarget.style.backgroundColor = tokens.colors.cta.primary;
    }
  };

  // Handle focus state
  const handleFocus = (e) => {
    if (variant === 'primary' && !disabled && !loading) {
      e.currentTarget.style.outline = 'none';
      e.currentTarget.style.boxShadow = `0 0 0 2px ${tokens.colors.primary[500]}, 0 0 0 4px ${tokens.colors.primary[50]}`;
    }
  };

  const handleBlur = (e) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  const handleClick = (e) => {
    console.log('Button clicked', { onClick, disabled, loading, type });
    if (onClick && !disabled && !loading) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
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

