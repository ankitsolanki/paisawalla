import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import Input from './ui/Input';
import Select from './ui/Select';
import { tokens } from '../design-system/tokens';

/**
 * FieldRenderer - Dynamically renders form fields based on schema
 */
const FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  disabled = false,
}) => {
  const { colors } = useTheme();

  const commonProps = {
    name: field.name,
    label: field.label,
    required: field.required,
    value: value || '',
    onChange: onChange,
    onBlur: onBlur,
    onFocus: onFocus,
    error: error,
    disabled: disabled,
    fullWidth: field.fullWidth !== false,
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case 'select':
      return (
        <Select
          {...commonProps}
          options={field.options || []}
        />
      );

    case 'checkbox':
      return (
        <div style={{ marginBottom: tokens.spacing.md }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <input
              type="checkbox"
              name={field.name}
              checked={value === true || value === 'true'}
              onChange={(e) => onChange({ target: { name: field.name, value: e.target.checked } })}
              onBlur={onBlur}
              onFocus={onFocus}
              disabled={disabled}
              required={field.required}
              style={{
                marginRight: tokens.spacing.sm,
                width: '1rem',
                height: '1rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            />
            <span
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: colors.text,
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
                  *
                </span>
              )}
            </span>
          </label>
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

    case 'textarea':
      return (
        <div style={{ marginBottom: tokens.spacing.md, width: field.fullWidth ? '100%' : 'auto' }}>
          <label
            htmlFor={field.name}
            style={{
              display: 'block',
              marginBottom: tokens.spacing.xs,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: colors.text,
            }}
          >
            {field.label}
            {field.required && (
              <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
                *
              </span>
            )}
          </label>
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={field.required}
            disabled={disabled}
            rows={field.rows || 3}
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
              fontSize: tokens.typography.fontSize.base,
              lineHeight: tokens.typography.lineHeight.normal,
              color: colors.text,
              backgroundColor: colors.input.background,
              border: `1px solid ${error ? tokens.colors.error[500] : colors.input.border}`,
              borderRadius: tokens.borderRadius.md,
              transition: `all ${tokens.transitions.normal} ease-in-out`,
              outline: 'none',
              fontFamily: tokens.typography.fontFamily.sans.join(', '),
              resize: 'vertical',
            }}
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

    case 'radio':
      return (
        <div style={{ marginBottom: tokens.spacing.md }}>
          <label
            style={{
              display: 'block',
              marginBottom: tokens.spacing.xs,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: colors.text,
            }}
          >
            {field.label}
            {field.required && (
              <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
                *
              </span>
            )}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.sm }}>
            {field.options?.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  disabled={disabled}
                  required={field.required}
                  style={{
                    marginRight: tokens.spacing.sm,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                />
                <span style={{ fontSize: tokens.typography.fontSize.sm, color: colors.text }}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
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

    default:
      return (
        <Input
          {...commonProps}
          type={field.type || 'text'}
          min={field.validation?.min}
          max={field.validation?.max}
          step={field.type === 'number' ? 1 : undefined}
        />
      );
  }
};

export default FieldRenderer;

