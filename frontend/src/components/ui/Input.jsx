import React, { useState } from 'react';
import { useTheme } from '../../design-system/ThemeProvider';

/**
 * Reusable Input Component with Floating Label
 * Consistent input styling across all forms
 * Implements floating label pattern from inspiration
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
  
  // For date inputs, browsers don't show placeholder, so we need to handle it differently
  const isDateInput = type === 'date';
  
  // Determine if label should float (when focused or has value)
  const hasValue = value && value.toString().trim() !== '';
  
  // For date inputs: float label ONLY when there's a value (not on focus)
  // This prevents overlap with browser's date format hint
  // For other inputs: float label when focused or has value
  const shouldFloatLabel = isDateInput ? hasValue : (isFocused || hasValue);
  
  // Show placeholder only when focused and value is empty
  const shouldShowPlaceholder = isFocused && !hasValue;
  
  // For date inputs, use a format hint instead of label to avoid overlap
  const placeholderText = isDateInput 
    ? (placeholder || 'DD/MM/YYYY') 
    : (placeholder || label || '');

  const inputStyles = {
    width: fullWidth ? '100%' : 'auto',
    padding: shouldFloatLabel ? '24px 20px 8px 20px' : '16px 20px', // pt-6 pb-2 when floating, py-4 when not
    fontSize: tokens.typography.fontSize.base, // 1rem
    lineHeight: tokens.typography.lineHeight.textRegular, // 24px
    color: colors.text || '#000000', // Text color
    backgroundColor: colors.input.background,
    border: `1px solid ${error ? tokens.colors.error[500] : isFocused ? tokens.colors.primary[500] : colors.input.border}`,
    borderRadius: '12px', // rounded-[12px] from inspiration
    transition: `all ${tokens.transitions.normal} ease-in-out`,
    outline: 'none',
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    minHeight: isMobile ? '48px' : 'auto', // Minimum touch target on mobile
    boxShadow: isFocused && !error 
      ? `0 0 0 2px ${tokens.colors.primary[500]}` // ring-2 ring-primary
      : 'none',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
  };

  const labelStyles = {
    position: 'absolute',
    left: '20px', // px-5
    top: shouldFloatLabel ? '0.5rem' : '1.25rem', // translateY(0.5rem) when floating, translateY(1.25rem) when not
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
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
        marginBottom: tokens.spacing.md,
      }}
      className="floating-label-group"
    >
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
        placeholder={shouldShowPlaceholder && !isDateInput ? placeholderText : ''} // Show placeholder only when focused and value is empty (not for date inputs)
        required={required}
        disabled={disabled}
        style={{
          ...inputStyles,
          ...(props.style || {}),
          // Add uppercase styling for PAN number (ssn or panNumber field)
          ...(name === 'ssn' || name === 'panNumber' ? { textTransform: 'uppercase' } : {}),
          // Ensure date inputs are fully clickable
          ...(isDateInput ? { cursor: 'pointer' } : {}),
        }}
        autoCapitalize={name === 'panNumber' ? 'characters' : undefined}
        autoComplete={name === 'panNumber' ? 'off' : undefined}
        className={`floating-input ${className}`}
        {...props}
      />
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
      
      {/* Helper text for date inputs showing format hint */}
      {isDateInput && !hasValue && !isFocused && (
        <p
          style={{
            marginTop: tokens.spacing.xs,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.gray[400],
            margin: '4px 0 0 0',
          }}
        >
          Format: DD/MM/YYYY
        </p>
      )}
      
      {/* Error message container - always reserved space to prevent layout shift */}
      <div
        style={{
          minHeight: '16px', // Fixed height to reserve space
          marginTop: '0.375rem',
          overflow: 'hidden',
        }}
      >
        {error && (
          <p
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.error[600],
              margin: '0',
              animation: 'slideDown 0.2s ease-out',
              opacity: 1,
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Add keyframe animation for smooth error appearance */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Input;

