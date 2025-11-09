import { z } from 'zod';

/**
 * Create Zod schema from field validation rules
 */
export const createFieldSchema = (field) => {
  let schema;

  switch (field.type) {
    case 'email':
      schema = z.string().email('Please enter a valid email address');
      break;
    case 'number':
      schema = z.coerce.number();
      break;
    case 'checkbox':
      schema = field.required
        ? z.boolean().refine((val) => val === true, 'This field is required')
        : z.boolean().optional();
      break;
    case 'date':
      schema = z.string().min(1, 'Date is required');
      break;
    default:
      schema = z.string();
  }

  // Apply validation rules
  if (field.validation) {
    const { minLength, maxLength, min, max, regex, pattern } = field.validation;

    if (minLength !== undefined) {
      schema = schema.min(minLength, `Must be at least ${minLength} characters`);
    }

    if (maxLength !== undefined) {
      schema = schema.max(maxLength, `Must be no more than ${maxLength} characters`);
    }

    if (min !== undefined) {
      schema = schema.min(min, `Must be at least ${min}`);
    }

    if (max !== undefined) {
      schema = schema.max(max, `Must be no more than ${max}`);
    }

    if (regex !== undefined) {
      const regexPattern = new RegExp(regex);
      schema = schema.regex(regexPattern, 'Invalid format');
    }

    if (pattern !== undefined) {
      const patternRegex = new RegExp(pattern);
      schema = schema.regex(patternRegex, 'Invalid format');
    }
  }

  // Apply required validation
  if (field.required && field.type !== 'checkbox') {
    schema = schema.min(1, `${field.label} is required`);
  } else if (!field.required) {
    schema = schema.optional();
  }

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

