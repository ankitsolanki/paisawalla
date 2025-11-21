import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import { useResponsive } from '../hooks/useResponsive';
import Input from './ui/Input';
import Select from './ui/Select';
import CurrencyInput from './ui/CurrencyInput';
import PincodeInput from './PincodeInput';
import GenderField from './GenderField';
import AddressFieldGroup from './AddressFieldGroup';
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
  onPincodeLookup, // Optional callback for PIN code lookup
}) => {
  const { colors } = useTheme();
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);
  const { windowWidth } = useResponsive();
  const isSmallScreen = windowWidth < 640;

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
    case 'gender':
      // Use GenderField component for gender selection
      return (
        <GenderField
          name={field.name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          required={field.required}
          error={error}
          disabled={disabled}
          options={field.options || [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          label={field.label || 'Gender'}
        />
      );

    case 'addressGroup':
      // Use AddressFieldGroup component for address fields
      // Expects field.addressFields to contain address, city, state, pincode field names
      const addressFields = field.addressFields || {
        address: 'address',
        city: 'city',
        state: 'state',
        pincode: 'pincode',
      };
      
      // Get values from formData if provided via field.values, otherwise use individual values
      const addressValue = field.values?.address || value?.address || '';
      const cityValue = field.values?.city || value?.city || '';
      const stateValue = field.values?.state || value?.state || '';
      const pincodeValue = field.values?.pincode || value?.pincode || '';
      
      return (
        <AddressFieldGroup
          addressValue={addressValue}
          cityValue={cityValue}
          stateValue={stateValue}
          pincodeValue={pincodeValue}
          addressName={addressFields.address}
          cityName={addressFields.city}
          stateName={addressFields.state}
          pincodeName={addressFields.pincode}
          addressLabel={field.addressLabel || 'Street Address'}
          cityLabel={field.cityLabel || 'City'}
          stateLabel={field.stateLabel || 'State'}
          pincodeLabel={field.pincodeLabel || 'PIN Code'}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          errors={field.errors || {}}
          required={field.requiredFields || {
            address: field.required !== false,
            city: field.required !== false,
            state: field.required !== false,
            pincode: field.required !== false,
          }}
          disabled={disabled}
          stateOptions={field.stateOptions || []}
          onPincodeLookup={onPincodeLookup}
          cityFieldName={addressFields.city}
          stateFieldName={addressFields.state}
          addressPlaceholder={field.addressPlaceholder || 'Enter your street address'}
          cityPlaceholder={field.cityPlaceholder || 'Enter your city'}
          statePlaceholder={field.statePlaceholder || 'Select state'}
          pincodePlaceholder={field.pincodePlaceholder || 'Enter 6-digit PIN code'}
          fullWidth={field.fullWidth !== false}
        />
      );

    case 'select':
      // Check if this is a gender field - use GenderField component instead
      if (field.name === 'gender' || field.label?.toLowerCase() === 'gender') {
        return (
          <GenderField
            name={field.name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={field.required}
            error={error}
            disabled={disabled}
            options={field.options || [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            label={field.label || 'Gender'}
          />
        );
      }
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
      const hasTextareaValue = value && value.toString().trim() !== '';
      const shouldFloatTextareaLabel = isTextareaFocused || hasTextareaValue;
      
      return (
        <div style={{ marginBottom: tokens.spacing.md, width: field.fullWidth ? '100%' : 'auto', position: 'relative' }} className="floating-label-group">
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={onChange}
            onBlur={(e) => {
              setIsTextareaFocused(false);
              onBlur?.(e);
            }}
            onFocus={(e) => {
              setIsTextareaFocused(true);
              onFocus?.(e);
            }}
            required={field.required}
            disabled={disabled}
            rows={field.rows || 3}
            placeholder={shouldFloatTextareaLabel ? '' : (field.placeholder || field.label || '')}
            className="floating-input"
            style={{
              width: '100%',
              padding: shouldFloatTextareaLabel ? '24px 20px 8px 20px' : '16px 20px',
              fontSize: tokens.typography.fontSize.base,
              lineHeight: tokens.typography.lineHeight.normal,
              color: colors.text || '#000000',
              backgroundColor: colors.input.background,
              border: `1px solid ${error ? tokens.colors.error[500] : isTextareaFocused ? tokens.colors.primary[500] : colors.input.border}`,
              borderRadius: '12px', // rounded-[12px] from inspiration
              transition: `all ${tokens.transitions.normal} ease-in-out`,
              outline: 'none',
              fontFamily: tokens.typography.fontFamily.sans.join(', '),
              resize: 'vertical',
              boxShadow: isTextareaFocused && !error 
                ? `0 0 0 2px ${tokens.colors.primary[500]}` // ring-2 ring-primary
                : 'none',
            }}
          />
          {field.label && (
            <label
              htmlFor={field.name}
              className="floating-label"
              style={{
                position: 'absolute',
                left: '20px',
                top: shouldFloatTextareaLabel ? '0.5rem' : '1.25rem',
                transformOrigin: '0 0',
                transform: shouldFloatTextareaLabel ? 'scale(0.75)' : 'scale(1)',
                transition: 'transform 300ms ease-in-out, color 300ms ease-in-out',
                pointerEvents: 'none',
                color: isTextareaFocused ? tokens.colors.primary[500] : (colors.textSecondary || tokens.colors.gray[500]),
                fontSize: shouldFloatTextareaLabel ? tokens.typography.fontSize.sm : tokens.typography.fontSize.base,
                lineHeight: 1,
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: tokens.colors.error[500], marginLeft: tokens.spacing.xs }}>
                  *
                </span>
              )}
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

    case 'radio':
      // Check if this is a gender field by name or label
      if (field.name === 'gender' || field.label?.toLowerCase() === 'gender') {
        return (
          <GenderField
            name={field.name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={field.required}
            error={error}
            disabled={disabled}
            options={field.options || [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            label={field.label || 'Gender'}
          />
        );
      }
      
      // Generic radio button group for other cases
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
              {field.label}
              {field.required && (
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
              {field.options?.map((option) => {
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
                      name={field.name}
                      value={option.value}
                      checked={isChecked}
                      onChange={onChange}
                      onBlur={onBlur}
                      onFocus={onFocus}
                      disabled={disabled}
                      required={field.required}
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

    case 'otp':
      return (
        <Input
          {...commonProps}
          type="text"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      );

    case 'currency':
      return (
        <CurrencyInput
          {...commonProps}
          min={field.min || field.validation?.min}
          max={field.max || field.validation?.max}
        />
      );

    case 'pincode':
      return (
        <PincodeInput
          {...commonProps}
          onPincodeLookup={onPincodeLookup}
          cityFieldName={field.cityFieldName}
          stateFieldName={field.stateFieldName}
        />
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

