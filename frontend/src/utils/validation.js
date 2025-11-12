import { z } from 'zod';

/**
 * Create Zod schema from field validation rules
 */
export const createFieldSchema = (field) => {
  let schema;
  const isNumber = field.type === 'number';
  const isString = field.type !== 'number' && field.type !== 'checkbox' && field.type !== 'date';

  // Get custom error messages if available
  const errorMessages = field.validation?.errorMessages || {};
  const getErrorMessage = (key, defaultMessage) => {
    return errorMessages[key] || defaultMessage;
  };

  switch (field.type) {
    case 'email':
      schema = z.string().email(getErrorMessage('email', 'Please enter a valid email address'));
      break;
    case 'number':
      // Use preprocess to handle NaN from empty strings and convert to number
      schema = z.preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined) {
            return undefined;
          }
          const num = Number(val);
          return isNaN(num) ? undefined : num;
        },
        z.number({ invalid_type_error: getErrorMessage('number', 'Must be a valid number') }).optional()
      );
      break;
    case 'checkbox':
      // Coerce checkbox values to boolean (handles string "true"/"false" or boolean)
      schema = z.preprocess(
        (val) => {
          if (val === true || val === 'true' || val === 'True' || val === 1 || val === '1') {
            return true;
          }
          if (val === false || val === 'false' || val === 'False' || val === 0 || val === '0' || val === null || val === undefined || val === '') {
            return false;
          }
          return Boolean(val);
        },
        field.required
          ? z.boolean().refine((val) => val === true, getErrorMessage('required', 'This field is required'))
          : z.boolean().optional()
      );
      break;
    case 'date':
      // Validate date format and reasonable range
      schema = z.string().min(1, getErrorMessage('required', 'Date is required')).refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: getErrorMessage('date', 'Please enter a valid date') }
      ).refine(
        (val) => {
          const date = new Date(val);
          const today = new Date();
          const minDate = new Date('1900-01-01');
          // Date should be in the past and not before 1900
          return date <= today && date >= minDate;
        },
        { message: getErrorMessage('dateRange', 'Date must be a valid past date') }
      );
      break;
    default:
      schema = z.string();
  }

  // Apply validation rules based on field type
  if (field.validation) {
    const { minLength, maxLength, min, max, regex, pattern } = field.validation;

    // String length validations (only for string fields)
    if (isString) {
      if (minLength !== undefined) {
        schema = schema.min(minLength, getErrorMessage('minLength', `Must be at least ${minLength} characters`));
      }

      if (maxLength !== undefined) {
        schema = schema.max(maxLength, getErrorMessage('maxLength', `Must be no more than ${maxLength} characters`));
      }
    }

    // Numeric validations (only for number fields)
    if (isNumber) {
      if (min !== undefined) {
        schema = schema.min(min, getErrorMessage('min', `Must be at least ${min}`));
      }

      if (max !== undefined) {
        schema = schema.max(max, getErrorMessage('max', `Must be no more than ${max}`));
      }
    } else {
      // For string fields, min/max can also be used for numeric validation if needed
      // But typically minLength/maxLength are used for strings
      if (min !== undefined && !isNumber) {
        // This would be unusual for strings, but handle it
        schema = schema.refine((val) => {
          const num = Number(val);
          return !isNaN(num) && num >= min;
        }, getErrorMessage('min', `Must be at least ${min}`));
      }

      if (max !== undefined && !isNumber) {
        schema = schema.refine((val) => {
          const num = Number(val);
          return !isNaN(num) && num <= max;
        }, getErrorMessage('max', `Must be no more than ${max}`));
      }
    }

    // Regex/pattern validations (only for string fields)
    if (isString && regex !== undefined) {
      const regexPattern = new RegExp(regex);
      schema = schema.regex(regexPattern, getErrorMessage('regex', getErrorMessage('pattern', 'Invalid format')));
    }

    if (isString && pattern !== undefined) {
      const patternRegex = new RegExp(pattern);
      schema = schema.regex(patternRegex, getErrorMessage('pattern', 'Invalid format'));
    }
  }

  // Apply required validation
  if (field.required) {
    if (field.type === 'checkbox') {
      // Already handled in checkbox case above
    } else if (isNumber) {
      // For numbers, remove optional and validate presence
      schema = schema.refine((val) => {
        // Check if value exists and is a valid number
        return val !== undefined && val !== null && !isNaN(val);
      }, {
        message: getErrorMessage('required', `${field.label} is required`),
      });
    } else {
      // For strings, use min(1) to check non-empty
      schema = schema.min(1, getErrorMessage('required', `${field.label} is required`));
    }
  }
  // Note: Optional handling for numbers is already in the base schema

  return schema;
};

/**
 * Create Zod schema for entire form from JSON schema
 */
export const createFormSchema = (formSchema) => {
  const shape = {};

  formSchema.fields.forEach((field) => {
    shape[field.name] = createFieldSchema(field);
  });

  return z.object(shape);
};

/**
 * Validate form data against schema
 */
export const validateFormData = (formData, formSchema) => {
  try {
    const schema = createFormSchema(formSchema);
    const result = schema.safeParse(formData);

    if (result.success) {
      return {
        isValid: true,
        errors: {},
        data: result.data,
      };
    } else {
      const errors = {};
      result.error.errors.forEach((error) => {
        const fieldName = error.path[0];
        errors[fieldName] = error.message;
      });

      return {
        isValid: false,
        errors,
        data: null,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: { _general: 'Validation error occurred' },
      data: null,
    };
  }
};

/**
 * Validate single field
 */
export const validateField = (value, field) => {
  try {
    const schema = createFieldSchema(field);
    const result = schema.safeParse(value);

    if (result.success) {
      return { isValid: true, error: null };
    } else {
      return {
        isValid: false,
        error: result.error.errors[0]?.message || 'Invalid value',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Validation error',
    };
  }
};

