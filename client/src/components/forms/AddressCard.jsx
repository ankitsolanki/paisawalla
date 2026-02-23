import React from 'react';

const AddressCard = ({
  values = {},
  errors = {},
  onChange,
  onBlur,
  isCompact = false,
}) => {
  const isMobile = isCompact;

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

  const inputClassName = "w-full px-3 py-2 text-base text-foreground bg-muted border border-border rounded-md outline-none transition-colors focus:border-primary focus:bg-background";
  const labelClassName = "block text-sm font-medium text-muted-foreground mb-1";
  const errorClassName = "text-xs text-destructive mt-1";

  const renderField = (name, label, type = 'text', placeholder = '') => {
    const value = values[name] || '';
    const error = errors[name];

    return (
      <div key={name}>
        <label className={labelClassName}>{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={() => handleFocus(name)}
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          className={inputClassName}
        />
        {error && <div className={errorClassName}>{error}</div>}
      </div>
    );
  };

  const twoColClass = isCompact ? 'grid grid-cols-1 gap-4 mb-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4';

  return (
    <div className="bg-background rounded-lg border border-border p-6 shadow-sm">
      <div className={twoColClass}>
        {renderField('firstName', 'First name', 'text', 'John')}
        {renderField('lastName', 'Last name', 'text', 'Doe')}
      </div>

      <div className="mb-4">
        {renderField('company', 'Company', 'text', 'Your company')}
      </div>

      <div className="mb-4">
        {renderField('address', 'Address', 'text', 'Street address')}
      </div>

      <div className="mb-4">
        {renderField('apartment', 'Apartment, suite, etc.', 'text', 'Optional')}
      </div>

      <div className={twoColClass}>
        {renderField('city', 'City', 'text', 'New York')}
        <div>
          <label className={labelClassName}>Country</label>
          <select
            name="country"
            value={values.country || ''}
            onChange={handleChange}
            onFocus={() => handleFocus('country')}
            onBlur={() => handleBlur('country')}
            className={inputClassName}
          >
            <option value="">Select country</option>
            <option value="US">United States</option>
            <option value="IN">India</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
          {errors.country && <div className={errorClassName}>{errors.country}</div>}
        </div>
      </div>

      <div className={twoColClass}>
        {renderField('state', 'State / Province', 'text', 'NY')}
        {renderField('postalCode', 'Postal code', 'text', '10001')}
      </div>

      <div className={twoColClass}>
        <div>
          <label className={labelClassName}>Country code</label>
          <select
            name="countryCode"
            value={values.countryCode || '+1'}
            onChange={handleChange}
            onFocus={() => handleFocus('countryCode')}
            onBlur={() => handleBlur('countryCode')}
            className={inputClassName}
          >
            <option value="+1">+1 (US)</option>
            <option value="+91">+91 (India)</option>
            <option value="+1-CA">+1 (Canada)</option>
            <option value="+44">+44 (UK)</option>
            <option value="+61">+61 (Australia)</option>
          </select>
          {errors.countryCode && <div className={errorClassName}>{errors.countryCode}</div>}
        </div>
        {renderField('mobileNumber', 'Mobile number', 'tel', '1234567890')}
      </div>
    </div>
  );
};

export default AddressCard;
