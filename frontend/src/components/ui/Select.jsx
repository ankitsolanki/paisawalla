import React from 'react';
import { useTheme } from '../../design-system/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';

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
  const { windowWidth } = useResponsive();
  const isMobile = windowWidth < 640;

  const [isFocused, setIsFocused] = React.useState(false);

  const hasValue = value && value.toString().trim() !== '';
  const shouldFloatLabel = isFocused || hasValue;

  const selectStyles = {
    width: fullWidth ? '100%' : 'auto',
    maxWidth: '100%', // Prevent overflow
    padding: shouldFloatLabel 
      ? (isMobile ? '24px 36px 8px 16px' : '24px 40px 8px 20px') // Floating label padding
      : (isMobile ? '14px 36px 14px 16px' : '16px 40px 16px 20px'), // Normal padding
    fontSize: isMobile ? tokens.typography.fontSize.sm : tokens.typography.fontSize.base, // Responsive font size
    lineHeight: tokens.typography.lineHeight.normal,
    color: colors.text || '#000000',
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? tokens.colors.primary[500] : colors.input.border}`,
    borderRadius: '12px', // rounded-[12px] from inspiration
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: isFocused && !error 
      ? `0 0 0 2px ${tokens.colors.primary[500]}` // ring-2 ring-primary
      : 'none',
    opacity: disabled ? 0.6 : 1,
    // Prevent text overflow
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    // Ensure select fits within viewport
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  };

  const labelStyles = {
    position: 'absolute',
    left: isMobile ? '16px' : '20px',
    top: shouldFloatLabel ? '0.5rem' : '1.25rem',
    transformOrigin: '0 0',
    transform: shouldFloatLabel ? 'scale(0.75)' : 'scale(1)',
    transition: 'transform 300ms ease-in-out, color 300ms ease-in-out',
    pointerEvents: 'none',
    color: isFocused ? tokens.colors.primary[500] : (colors.textSecondary || tokens.colors.gray[500]),
    fontSize: shouldFloatLabel ? tokens.typography.fontSize.sm : tokens.typography.fontSize.base,
    lineHeight: 1,
  };

  return (
    <div 
      style={{ 
        marginBottom: tokens.spacing.md, 
        width: fullWidth ? '100%' : 'auto',
        maxWidth: '100%', // Prevent container overflow
        position: 'relative',
      }}
    >
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
        <option value="" disabled hidden>{shouldFloatLabel ? '' : (placeholder || label)}</option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{
              // Ensure options don't overflow on mobile
              maxWidth: '100%',
              wordWrap: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow for better mobile support */}
      <style>{`
        select#${name} {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right ${isMobile ? '12px' : '16px'} center;
          background-size: ${isMobile ? '10px' : '12px'};
          padding-right: ${isMobile ? '36px' : '40px'};
        }
        select#${name}:focus {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234338CA' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        }
        @media (max-width: 640px) {
          select#${name} {
            font-size: ${tokens.typography.fontSize.sm};
          }
          select#${name} option {
            font-size: ${tokens.typography.fontSize.sm};
            padding: 8px;
            word-wrap: break-word;
            white-space: normal;
          }
        }
      `}</style>
      {label && (
        <label
          htmlFor={name}
          className="floating-label"
          style={labelStyles}
        >
          {label}
          {required && <span style={{ color: tokens.colors.error[500] }}> *</span>}
        </label>
      )}
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

