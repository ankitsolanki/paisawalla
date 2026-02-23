const FieldGroup = ({ label, fields, formData, errors, onChange, onBlur }) => {
  return (
    <div className="mb-6">
      {label && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{label}</h3>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.fullWidth ? 'sm:col-span-2' : ''}
          >
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[field.name] ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onChange}
                onBlur={onBlur}
                rows={field.rows || 3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[field.name] ? 'border-destructive' : 'border-border'
                }`}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type || 'text'}
                value={formData[field.name] || ''}
                onChange={onChange}
                onBlur={onBlur}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[field.name] ? 'border-destructive' : 'border-border'
                }`}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
              />
            )}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-destructive">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldGroup;
