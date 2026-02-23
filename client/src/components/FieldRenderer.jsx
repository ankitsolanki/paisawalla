import React from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import CurrencyInput from './ui/CurrencyInput';
import PincodeInput from './PincodeInput';
import GenderField from './GenderField';
import AddressFieldGroup from './AddressFieldGroup';

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
  const [isTextareaFocused, setIsTextareaFocused] = React.useState(false);

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
        <div className="mb-4">
          <label
            className={`flex items-center cursor-pointer ${disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''}`}
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
              className="mr-2 w-4 h-4 cursor-pointer accent-primary"
            />
            <span className="text-sm text-foreground">
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </span>
          </label>
          {error && (
            <p className="mt-1 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      );

    case 'textarea':
      const hasTextareaValue = value && value.toString().trim() !== '';
      const shouldFloatTextareaLabel = isTextareaFocused || hasTextareaValue;
      
      const textareaBorderClass = error
        ? 'border-destructive'
        : isTextareaFocused
          ? 'border-primary ring-2 ring-primary'
          : 'border-border';
      
      return (
        <div className="mb-4 w-full relative floating-label-group">
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
            className={`w-full rounded-xl border text-base outline-none transition-all duration-300 resize-y font-sans bg-background text-foreground floating-input ${textareaBorderClass}`}
            style={{
              padding: shouldFloatTextareaLabel ? '24px 20px 8px 20px' : '16px 20px',
            }}
          />
          {field.label && (
            <label
              htmlFor={field.name}
              className="floating-label absolute left-5 pointer-events-none transition-all duration-300"
              style={{
                top: shouldFloatTextareaLabel ? '0.5rem' : '1.25rem',
                transformOrigin: '0 0',
                transform: shouldFloatTextareaLabel ? 'scale(0.75)' : 'scale(1)',
              }}
            >
              <span className={shouldFloatTextareaLabel ? 'text-xs text-primary' : 'text-base text-muted-foreground'}>
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </span>
            </label>
          )}
          {error && (
            <p className="mt-1 text-sm text-destructive">
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
        <div className="mb-4">
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-base font-medium text-muted-foreground mb-3 block">
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {field.options?.map((option) => {
                const isChecked = value === option.value;
                const radioBorderClass = isChecked ? 'border-primary ring-2 ring-primary' : 'border-border';
                
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border rounded-xl transition-all duration-300 bg-background ${radioBorderClass} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
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
                      className="w-5 h-5 mr-3 accent-primary"
                    />
                    <span className={`text-sm text-foreground ${isChecked ? 'font-medium' : 'font-normal'}`}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {error && (
            <p className="mt-1 text-sm text-destructive">
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
