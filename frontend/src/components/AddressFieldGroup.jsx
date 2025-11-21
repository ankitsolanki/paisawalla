import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import Input from './ui/Input';
import Select from './ui/Select';
import PincodeInput from './PincodeInput';
import { tokens } from '../design-system/tokens';

/**
 * AddressFieldGroup - Reusable address field group component
 * Groups address, city, state, and pincode fields together for consistency
 */
const AddressFieldGroup = ({
  // Field values
  addressValue = '',
  cityValue = '',
  stateValue = '',
  pincodeValue = '',
  
  // Field names
  addressName = 'address',
  cityName = 'city',
  stateName = 'state',
  pincodeName = 'pincode',
  
  // Labels
  addressLabel = 'Street Address',
  cityLabel = 'City',
  stateLabel = 'State',
  pincodeLabel = 'PIN Code',
  
  // Change handlers
  onChange,
  onBlur,
  onFocus,
  
  // Validation
  errors = {},
  required = {
    address: true,
    city: true,
    state: true,
    pincode: true,
  },
  disabled = false,
  
  // State options (for dropdown)
  stateOptions = [],
  
  // Pincode lookup
  onPincodeLookup,
  cityFieldName,
  stateFieldName,
  
  // Placeholders
  addressPlaceholder = 'Enter your street address',
  cityPlaceholder = 'Enter your city',
  statePlaceholder = 'Select state',
  pincodePlaceholder = 'Enter 6-digit PIN code',
  
  // Layout
  fullWidth = true,
}) => {
  const { colors } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}> {/* space-y-6 */}
      {/* Street Address - Full Width */}
      <Input
        name={addressName}
        label={addressLabel}
        value={addressValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        required={required.address}
        error={errors[addressName]}
        disabled={disabled}
        fullWidth={fullWidth}
        placeholder={addressPlaceholder}
        type="text"
      />

      {/* Pincode - Full Width */}
      <PincodeInput
        name={pincodeName}
        label={pincodeLabel}
        value={pincodeValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        required={required.pincode}
        error={errors[pincodeName]}
        disabled={disabled}
        fullWidth={fullWidth}
        placeholder={pincodePlaceholder}
        onPincodeLookup={onPincodeLookup}
        cityFieldName={cityFieldName || cityName}
        stateFieldName={stateFieldName || stateName}
      />

      {/* City and State - Two Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px', // gap-6
        }}
      >
        {/* City */}
        <Input
          name={cityName}
          label={cityLabel}
          value={cityValue}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          required={required.city}
          error={errors[cityName]}
          disabled={disabled}
          fullWidth={true}
          placeholder={cityPlaceholder}
          type="text"
        />

        {/* State */}
        {stateOptions && stateOptions.length > 0 ? (
          <Select
            name={stateName}
            label={stateLabel}
            value={stateValue}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={required.state}
            error={errors[stateName]}
            disabled={disabled}
            fullWidth={true}
            placeholder={statePlaceholder}
            options={stateOptions}
          />
        ) : (
          <Input
            name={stateName}
            label={stateLabel}
            value={stateValue}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={required.state}
            error={errors[stateName]}
            disabled={disabled}
            fullWidth={true}
            placeholder={statePlaceholder}
            type="text"
          />
        )}
      </div>
    </div>
  );
};

export default AddressFieldGroup;

