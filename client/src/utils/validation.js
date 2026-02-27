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

  // Preprocess PAN number (ssn) to uppercase before any validation
  const preprocessValue = (val) => {
    if (field.name === 'ssn' && typeof val === 'string') {
      return val.toUpperCase();
    }
    return val;
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
      // HTML date input returns YYYY-MM-DD format
      // Start with base string schema (required validation will be added later if needed)
      schema = z.string().refine(
        (val) => {
            fieldName: field.name,
            value: val,
            valueType: typeof val,
            isEmpty: !val || val.trim() === '',
          });
          
          if (!val || typeof val !== 'string' || val.trim() === '') {
            return false;
          }
          
          // HTML date input always returns YYYY-MM-DD format
          // Parse as local date to avoid timezone issues
          const parts = val.split('-');
            parts,
            partsLength: parts.length,
          });
          
          if (parts.length !== 3) {
            return false;
          }
          
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          
            year,
            month: month + 1, // Display as 1-indexed
            day,
            parsedDate: date.toISOString(),
            isValidDate: !isNaN(date.getTime()),
            dateYear: date.getFullYear(),
            dateMonth: date.getMonth(),
            dateDay: date.getDate(),
            matches: !isNaN(date.getTime()) && 
                     date.getFullYear() === year && 
                     date.getMonth() === month && 
                     date.getDate() === day,
          });
          
          // Check if date is valid and matches input
          const isValid = !isNaN(date.getTime()) && 
                 date.getFullYear() === year && 
                 date.getMonth() === month && 
                 date.getDate() === day;
          
          if (!isValid) {
          }
          
          return isValid;
        },
        { message: getErrorMessage('date', 'Please enter a valid date') }
      ).refine(
        (val) => {
            fieldName: field.name,
            value: val,
          });
          
          if (!val || typeof val !== 'string' || val.trim() === '') {
            return false;
          }
          
          const parts = val.split('-');
          if (parts.length !== 3) {
            return false;
          }
          
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const inputDate = new Date(year, month, day);
          
            year,
            month: month + 1,
            day,
            inputDate: inputDate.toISOString(),
            isValidDate: !isNaN(inputDate.getTime()),
          });
          
          if (isNaN(inputDate.getTime())) {
            return false;
          }
          
          // Compare dates only (no time)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dateOnly = new Date(year, month, day);
          const minDate = new Date(1900, 0, 1);
          
            dateOnly: dateOnly.toISOString(),
            today: today.toISOString(),
            minDate: minDate.toISOString(),
            isPastOrToday: dateOnly <= today,
            isAfterMinDate: dateOnly >= minDate,
            finalResult: dateOnly <= today && dateOnly >= minDate,
          });
          
          // Date should be in the past (or today) and not before 1900
          const isValid = dateOnly <= today && dateOnly >= minDate;
          
          if (!isValid) {
          }
          
          return isValid;
        },
        { message: getErrorMessage('dateRange', 'Date must be a valid past date') }
      );
      break;
    default:
      // For PAN number (ssn), preprocess to uppercase
      if (field.name === 'ssn') {
        schema = z.preprocess(
          preprocessValue,
          z.string()
        );
      } else {
        schema = z.string();
      }
  }

  // Apply validation rules based on field type
  if (field.validation) {
    const { minLength, maxLength, min, max, regex, pattern } = field.validation;

    // String length validations (only for string fields)
    if (isString) {
      if (minLength !== undefined) {
        // Check if schema has min method (it's a ZodString), otherwise use refine
        if (typeof schema.min === 'function') {
          schema = schema.min(minLength, getErrorMessage('minLength', `Must be at least ${minLength} characters`));
        } else {
          // Schema is ZodEffects (from preprocess), use refine
          schema = schema.refine(
            (val) => {
              const strVal = typeof val === 'string' ? val : String(val || '');
              return strVal.length >= minLength;
            },
            { message: getErrorMessage('minLength', `Must be at least ${minLength} characters`) }
          );
        }
      }

      if (maxLength !== undefined) {
        // Check if schema has max method (it's a ZodString), otherwise use refine
        if (typeof schema.max === 'function') {
          schema = schema.max(maxLength, getErrorMessage('maxLength', `Must be no more than ${maxLength} characters`));
        } else {
          // Schema is ZodEffects (from preprocess), use refine
          schema = schema.refine(
            (val) => {
              const strVal = typeof val === 'string' ? val : String(val || '');
              return strVal.length <= maxLength;
            },
            { message: getErrorMessage('maxLength', `Must be no more than ${maxLength} characters`) }
          );
        }
      }
    }

    // Numeric validations (only for number fields)
    if (isNumber) {
      if (min !== undefined) {
        // Number fields use preprocess, so schema is ZodEffects - use refine instead of min
        schema = schema.refine(
          (val) => {
            const num = typeof val === 'number' ? val : Number(val);
            return !isNaN(num) && num >= min;
          },
          { message: getErrorMessage('min', `Must be at least ${min}`) }
        );
      }

      if (max !== undefined) {
        // Number fields use preprocess, so schema is ZodEffects - use refine instead of max
        schema = schema.refine(
          (val) => {
            const num = typeof val === 'number' ? val : Number(val);
            return !isNaN(num) && num <= max;
          },
          { message: getErrorMessage('max', `Must be no more than ${max}`) }
        );
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
    // PAN number (ssn) is already converted to uppercase via preprocess
    if (isString && regex !== undefined) {
      const regexPattern = new RegExp(regex);
      // For PAN number, use refine since schema might be ZodEffects after preprocess
      // Value is already uppercase from preprocess
      if (field.name === 'ssn') {
        schema = schema.refine(
          (val) => {
            // Value should already be uppercase from preprocess, but ensure it is
            const upperVal = typeof val === 'string' ? val.toUpperCase() : val;
            return regexPattern.test(upperVal);
          },
          { message: getErrorMessage('regex', getErrorMessage('pattern', 'Invalid format')) }
        );
      } else {
        // Check if schema has regex method (it's a ZodString), otherwise use refine
        if (typeof schema.regex === 'function') {
          schema = schema.regex(regexPattern, getErrorMessage('regex', getErrorMessage('pattern', 'Invalid format')));
        } else {
          schema = schema.refine(
            (val) => regexPattern.test(val),
            { message: getErrorMessage('regex', getErrorMessage('pattern', 'Invalid format')) }
          );
        }
      }
    }

    if (isString && pattern !== undefined) {
      const patternRegex = new RegExp(pattern);
      // For PAN number, use refine since schema might be ZodEffects after preprocess
      // Value is already uppercase from preprocess
      if (field.name === 'ssn') {
        schema = schema.refine(
          (val) => {
            // Value should already be uppercase from preprocess, but ensure it is
            const upperVal = typeof val === 'string' ? val.toUpperCase() : val;
            return patternRegex.test(upperVal);
          },
          { message: getErrorMessage('pattern', 'Invalid format') }
        );
      } else {
        // Check if schema has regex method (it's a ZodString), otherwise use refine
        if (typeof schema.regex === 'function') {
          schema = schema.regex(patternRegex, getErrorMessage('pattern', 'Invalid format'));
        } else {
          schema = schema.refine(
            (val) => patternRegex.test(val),
            { message: getErrorMessage('pattern', 'Invalid format') }
          );
        }
      }
    }
  }

  // Apply required validation
  if (field.required) {
    if (field.type === 'checkbox') {
      // Already handled in checkbox case above
    } else if (field.type === 'date') {
      // For date fields, use refine since schema is already ZodEffects after refine calls
      schema = schema.refine(
        (val) => {
          return val !== undefined && val !== null && val !== '' && typeof val === 'string' && val.trim() !== '';
        },
        {
          message: getErrorMessage('required', `${field.label} is required`),
        }
      );
    } else if (isNumber) {
      // For numbers, remove optional and validate presence
      schema = schema.refine((val) => {
        // Check if value exists and is a valid number
        return val !== undefined && val !== null && !isNaN(val);
      }, {
        message: getErrorMessage('required', `${field.label} is required`),
      });
    } else {
      // For strings, use min(1) to check non-empty (only if schema is still ZodString)
      // Check if schema has min method (it's a ZodString), otherwise use refine
      if (typeof schema.min === 'function') {
        schema = schema.min(1, getErrorMessage('required', `${field.label} is required`));
      } else {
        // Schema is already ZodEffects, use refine
        schema = schema.refine(
          (val) => {
            return val !== undefined && val !== null && val !== '' && typeof val === 'string' && val.trim() !== '';
          },
          {
            message: getErrorMessage('required', `${field.label} is required`),
          }
        );
      }
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
    fieldName: field.name,
    fieldType: field.type,
    value,
    valueType: typeof value,
    isRequired: field.required,
  });
  
  try {
    const schema = createFieldSchema(field);
    const result = schema.safeParse(value);

      fieldName: field.name,
      success: result.success,
      errors: result.success ? null : result.error.errors.map(e => ({
        path: e.path,
        message: e.message,
        code: e.code,
      })),
    });

    if (result.success) {
      return { isValid: true, error: null };
    } else {
      const errorMessage = result.error.errors[0]?.message || 'Invalid value';
        fieldName: field.name,
        error: errorMessage,
      });
      return {
        isValid: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('[VALIDATE FIELD] EXCEPTION', {
      fieldName: field.name,
      error: error.message,
      stack: error.stack,
    });
    return {
      isValid: false,
      error: 'Validation error',
    };
  }
};

