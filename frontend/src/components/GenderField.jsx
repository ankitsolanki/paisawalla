import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import { useResponsive } from '../hooks/useResponsive';
import { tokens } from '../design-system/tokens';

/**
 * GenderField - Reusable gender selection component
 * Displays gender options as card-style radio buttons matching the inspiration design
 */
const GenderField = ({
  name = 'gender',
  value,
  onChange,
  onBlur,
  onFocus,
  required = false,
  error = null,
  disabled = false,
  options = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  label = 'Gender',
}) => {
  const { colors } = useTheme();
  const { windowWidth } = useResponsive();
  const isSmallScreen = windowWidth < 640;

  return (
    <div style={{ marginBottom: tokens.spacing.md }}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend
          style={{
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.medium,
            color: colors.textSecondary || tokens.colors.gray[600],
            marginBottom: '12px', // mb-3
            display: 'block',
          }}
        >
          {label}
          {required && (
            <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
              *
            </span>
          )}
        </legend>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isSmallScreen ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '16px', // gap-4
          }}
        >
          {options.map((option) => {
            const isChecked = value === option.value;
            return (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px', // p-4
                  border: `1px solid ${isChecked ? tokens.colors.primary[500] : colors.input.border}`,
                  borderRadius: '12px', // rounded-[12px]
                  backgroundColor: colors.input.background,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  boxShadow: isChecked ? `0 0 0 2px ${tokens.colors.primary[500]}` : 'none', // ring-2 ring-primary
                  transition: `all ${tokens.transitions.normal} ease-in-out`,
                }}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={onChange}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  disabled={disabled}
                  required={required}
                  style={{
                    width: '20px', // h-5 w-5
                    height: '20px',
                    marginRight: '12px', // ml-3
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    accentColor: tokens.colors.primary[500],
                  }}
                />
                <span
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: isChecked ? tokens.typography.fontWeight.medium : tokens.typography.fontWeight.normal,
                    color: colors.text,
                  }}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      
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

export default GenderField;

