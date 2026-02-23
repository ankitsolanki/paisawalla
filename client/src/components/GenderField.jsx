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
  return (
    <div>
      <fieldset className="border-none p-0 m-0">
        <legend className="text-base font-medium text-muted-foreground mb-3 block">
          {label}
          {required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {options.map((option) => {
            const isChecked = value === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-center p-4 border rounded-xl transition-all duration-300
                  ${isChecked ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border bg-background'}
                  ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
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
                  className={`h-5 w-5 mr-3 accent-primary ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
                <span className={`text-sm ${isChecked ? 'font-medium' : 'font-normal'} text-foreground`}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="min-h-[16px] mt-1.5 overflow-hidden">
        {error && (
          <p className="mt-1 text-sm text-destructive animate-slide-down">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default GenderField;
