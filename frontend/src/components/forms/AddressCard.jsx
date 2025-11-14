import React from 'react';
import { tokens } from '../../design-system/tokens';

/**
 * AddressCard - Professional address input component
 * Inspired by payment app address forms
 * Layout:
 * - First name + Last name (2 cols)
 * - Company (full width)
 * - Address (full width)
 * - Apartment, suite, etc. (full width)
 * - City + Country dropdown (2 cols)
 * - State/Province + Postal code (2 cols)
 * - Country code + Mobile number (2 cols)
 */
const AddressCard = ({
  values = {},
  errors = {},
  onChange,
  onBlur,
  isCompact = false,
}) => {
  const isMobile = isCompact;

  // Full width field style
  const fullWidthFieldStyle = {
    marginBottom: tokens.spacing.md,
  };

  // Two column layout
  const twoColContainerStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  };

  // Input styles
  const inputStyle = {
    width: '100%',
    padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.textRegular,
    color: tokens.colors.gray[600],
    backgroundColor: tokens.colors.gray[50],
    border: `1px solid ${tokens.colors.gray[300]}`,
    borderRadius: tokens.borderRadius.md,
    fontFamily: tokens.typography.fontFamily.sans.join(', '),
    outline: 'none',
    transition: `border-color ${tokens.transitions.normal}`,
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: tokens.colors.primary[500],
    backgroundColor: '#fff',
  };

  const labelStyle = {
    display: 'block',
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.gray[700],
    marginBottom: tokens.spacing.xs,
  };

  const errorStyle = {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.error[500],
    marginTop: tokens.spacing.xs,
  };

  const [focusedField, setFocusedField] = React.useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ target: { name, value } });
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = (fieldName) => {
    setFocusedField(null);
    onBlur?.({ target: { name: fieldName } });
  };

  const renderField = (name, label, type = 'text', placeholder = '') => {
    const value = values[name] || '';
    const error = errors[name];
    const isFocused = focusedField === name;

    return (
      <div key={name}>
        <label style={labelStyle}>{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={() => handleFocus(name)}
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          style={isFocused ? inputFocusStyle : inputStyle}
        />
        {error && <div style={errorStyle}>{error}</div>}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.gray[200]}`,
        padding: tokens.spacing.lg,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* First name + Last name */}
      <div style={twoColContainerStyle}>
        {renderField('firstName', 'First name', 'text', 'John')}
        {renderField('lastName', 'Last name', 'text', 'Doe')}
      </div>

      {/* Company */}
      <div style={fullWidthFieldStyle}>
        {renderField('company', 'Company', 'text', 'Your company')}
      </div>

      {/* Address */}
      <div style={fullWidthFieldStyle}>
        {renderField('address', 'Address', 'text', 'Street address')}
      </div>

      {/* Apartment, suite, etc. */}
      <div style={fullWidthFieldStyle}>
        {renderField('apartment', 'Apartment, suite, etc.', 'text', 'Optional')}
      </div>

      {/* City + Country */}
      <div style={twoColContainerStyle}>
        {renderField('city', 'City', 'text', 'New York')}
        <div>
          <label style={labelStyle}>Country</label>
          <select
            name="country"
            value={values.country || ''}
            onChange={handleChange}
            onFocus={() => handleFocus('country')}
            onBlur={() => handleBlur('country')}
            style={focusedField === 'country' ? inputFocusStyle : inputStyle}
          >
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="IN">India</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
          {errors.country && <div style={errorStyle}>{errors.country}</div>}
        </div>
      </div>

      {/* State / Province + Postal code */}
      <div style={twoColContainerStyle}>
        {renderField('state', 'State / Province', 'text', 'NY')}
        {renderField('postalCode', 'Postal code', 'text', '10001')}
      </div>

      {/* Country code + Mobile number */}
      <div style={twoColContainerStyle}>
        <div>
          <label style={labelStyle}>Country code</label>
          <select
            name="countryCode"
            value={values.countryCode || '+1'}
            onChange={handleChange}
            onFocus={() => handleFocus('countryCode')}
            onBlur={() => handleBlur('countryCode')}
            style={{
              ...inputStyle,
              ...(focusedField === 'countryCode' ? inputFocusStyle : {}),
            }}
          >
            <option value="+1">+1 (US)</option>
            <option value="+91">+91 (India)</option>
            <option value="+1-CA">+1 (Canada)</option>
            <option value="+44">+44 (UK)</option>
            <option value="+61">+61 (Australia)</option>
          </select>
          {errors.countryCode && <div style={errorStyle}>{errors.countryCode}</div>}
        </div>
        {renderField('mobileNumber', 'Mobile number', 'tel', '1234567890')}
      </div>
    </div>
  );
};

export default AddressCard;
