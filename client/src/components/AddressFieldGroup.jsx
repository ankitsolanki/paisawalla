import Input from './ui/CustomInput';
import Select from './ui/CustomSelect';
import PincodeInput from './PincodeInput';

const AddressFieldGroup = ({
  addressValue = '',
  cityValue = '',
  stateValue = '',
  pincodeValue = '',

  addressName = 'address',
  cityName = 'city',
  stateName = 'state',
  pincodeName = 'pincode',

  addressLabel = 'Street Address',
  cityLabel = 'City',
  stateLabel = 'State',
  pincodeLabel = 'PIN Code',

  onChange,
  onBlur,
  onFocus,

  errors = {},
  required = {
    address: true,
    city: true,
    state: true,
    pincode: true,
  },
  disabled = false,

  stateOptions = [],

  onPincodeLookup,
  cityFieldName,
  stateFieldName,

  addressPlaceholder = 'Enter your street address',
  cityPlaceholder = 'Enter your city',
  statePlaceholder = 'Select state',
  pincodePlaceholder = 'Enter 6-digit PIN code',

  fullWidth = true,
}) => {
  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
