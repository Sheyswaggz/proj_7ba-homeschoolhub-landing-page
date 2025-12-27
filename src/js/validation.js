/**
 * Form Validation Utilities Module
 * 
 * Provides comprehensive validation functions for form inputs including email,
 * phone number, required fields, and custom validation rules. Implements
 * error message generation and validation state management with accessibility support.
 * 
 * @module validation
 * @version 1.0.0
 */

'use strict';

/**
 * Validation configuration and constants
 */
const VALIDATION_CONFIG = Object.freeze({
  EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  PHONE_REGEX: /^[\d\s\-\(\)]+$/,
  MIN_PHONE_DIGITS: 10,
  MAX_PHONE_DIGITS: 15,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
});

/**
 * Validation error messages
 */
const ERROR_MESSAGES = Object.freeze({
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_FORMAT: 'Email must be in format: name@domain.com',
  PHONE_INVALID: 'Please enter a valid phone number',
  PHONE_FORMAT: 'Phone must contain 10-15 digits',
  PHONE_CHARACTERS: 'Phone can only contain numbers, spaces, hyphens, and parentheses',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name cannot exceed 100 characters',
  MESSAGE_TOO_SHORT: 'Message must be at least 10 characters',
  MESSAGE_TOO_LONG: 'Message cannot exceed 1000 characters',
  GRADE_INVALID: 'Please select a valid grade level',
});

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string|null} error - Error message if validation failed
 * @property {*} value - Sanitized/normalized value
 */

/**
 * Field validation state
 * @typedef {Object} FieldState
 * @property {boolean} touched - Whether field has been interacted with
 * @property {boolean} dirty - Whether field value has changed
 * @property {boolean} valid - Whether field is currently valid
 * @property {string|null} error - Current error message
 */

/**
 * Sanitize string input by trimming whitespace and removing control characters
 * @param {string} value - Input value to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  
  return value
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate required field
 * @param {string} value - Field value to validate
 * @param {string} [fieldName='Field'] - Field name for error messages
 * @returns {ValidationResult} Validation result
 */
function validateRequired(value, fieldName = 'Field') {
  const sanitized = sanitizeString(value);
  
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.REQUIRED,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: sanitized,
  };
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @param {boolean} [required=true] - Whether field is required
 * @returns {ValidationResult} Validation result
 */
function validateEmail(email, required = true) {
  const sanitized = sanitizeString(email);
  
  if (!sanitized) {
    if (required) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED,
        value: sanitized,
      };
    }
    return {
      isValid: true,
      error: null,
      value: sanitized,
    };
  }
  
  if (!VALIDATION_CONFIG.EMAIL_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_INVALID,
      value: sanitized,
    };
  }
  
  const parts = sanitized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_FORMAT,
      value: sanitized,
    };
  }
  
  const [localPart, domain] = parts;
  if (localPart.length > 64 || domain.length > 255) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.EMAIL_INVALID,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: sanitized.toLowerCase(),
  };
}

/**
 * Normalize phone number by removing formatting characters
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number (digits only)
 */
function normalizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display (US format)
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhone(phone) {
  const digits = normalizePhone(phone);
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone;
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @param {boolean} [required=false] - Whether field is required
 * @returns {ValidationResult} Validation result
 */
function validatePhone(phone, required = false) {
  const sanitized = sanitizeString(phone);
  
  if (!sanitized) {
    if (required) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED,
        value: sanitized,
      };
    }
    return {
      isValid: true,
      error: null,
      value: sanitized,
    };
  }
  
  if (!VALIDATION_CONFIG.PHONE_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.PHONE_CHARACTERS,
      value: sanitized,
    };
  }
  
  const digits = normalizePhone(sanitized);
  
  if (digits.length < VALIDATION_CONFIG.MIN_PHONE_DIGITS) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.PHONE_FORMAT,
      value: sanitized,
    };
  }
  
  if (digits.length > VALIDATION_CONFIG.MAX_PHONE_DIGITS) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.PHONE_FORMAT,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: formatPhone(sanitized),
  };
}

/**
 * Validate name field (parent name, student name, etc.)
 * @param {string} name - Name to validate
 * @param {boolean} [required=true] - Whether field is required
 * @returns {ValidationResult} Validation result
 */
function validateName(name, required = true) {
  const sanitized = sanitizeString(name);
  
  if (!sanitized) {
    if (required) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED,
        value: sanitized,
      };
    }
    return {
      isValid: true,
      error: null,
      value: sanitized,
    };
  }
  
  if (sanitized.length < VALIDATION_CONFIG.MIN_NAME_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.NAME_TOO_SHORT,
      value: sanitized,
    };
  }
  
  if (sanitized.length > VALIDATION_CONFIG.MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.NAME_TOO_LONG,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: sanitized,
  };
}

/**
 * Validate message/textarea field
 * @param {string} message - Message to validate
 * @param {boolean} [required=true] - Whether field is required
 * @returns {ValidationResult} Validation result
 */
function validateMessage(message, required = true) {
  const sanitized = sanitizeString(message);
  
  if (!sanitized) {
    if (required) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED,
        value: sanitized,
      };
    }
    return {
      isValid: true,
      error: null,
      value: sanitized,
    };
  }
  
  if (sanitized.length < VALIDATION_CONFIG.MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.MESSAGE_TOO_SHORT,
      value: sanitized,
    };
  }
  
  if (sanitized.length > VALIDATION_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.MESSAGE_TOO_LONG,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: sanitized,
  };
}

/**
 * Validate grade level selection
 * @param {string} grade - Grade level value
 * @param {boolean} [required=true] - Whether field is required
 * @returns {ValidationResult} Validation result
 */
function validateGrade(grade, required = true) {
  const sanitized = sanitizeString(grade);
  
  if (!sanitized || sanitized === '') {
    if (required) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.REQUIRED,
        value: sanitized,
      };
    }
    return {
      isValid: true,
      error: null,
      value: sanitized,
    };
  }
  
  const validGrades = ['k', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  if (!validGrades.includes(sanitized.toLowerCase())) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.GRADE_INVALID,
      value: sanitized,
    };
  }
  
  return {
    isValid: true,
    error: null,
    value: sanitized,
  };
}

/**
 * Validate field based on type and constraints
 * @param {string} value - Field value
 * @param {string} type - Field type (email, phone, text, textarea, select)
 * @param {Object} [options={}] - Validation options
 * @param {boolean} [options.required=true] - Whether field is required
 * @param {string} [options.fieldName] - Field name for error messages
 * @returns {ValidationResult} Validation result
 */
function validateField(value, type, options = {}) {
  const { required = true, fieldName = 'Field' } = options;
  
  try {
    switch (type) {
      case 'email':
        return validateEmail(value, required);
      
      case 'tel':
      case 'phone':
        return validatePhone(value, required);
      
      case 'textarea':
        return validateMessage(value, required);
      
      case 'select':
        return validateGrade(value, required);
      
      case 'text':
      case 'name':
        return validateName(value, required);
      
      default:
        return validateRequired(value, fieldName);
    }
  } catch (error) {
    console.error('[Validation] Field validation error', {
      type,
      fieldName,
      error: error.message,
    });
    
    return {
      isValid: false,
      error: 'Validation error occurred',
      value: sanitizeString(value),
    };
  }
}

/**
 * Create field state manager
 * @returns {Object} Field state manager
 */
function createFieldState() {
  const state = new Map();
  
  return {
    /**
     * Initialize field state
     * @param {string} fieldId - Field identifier
     */
    init(fieldId) {
      if (!state.has(fieldId)) {
        state.set(fieldId, {
          touched: false,
          dirty: false,
          valid: true,
          error: null,
        });
      }
    },
    
    /**
     * Mark field as touched
     * @param {string} fieldId - Field identifier
     */
    setTouched(fieldId) {
      const fieldState = state.get(fieldId);
      if (fieldState) {
        fieldState.touched = true;
      }
    },
    
    /**
     * Mark field as dirty
     * @param {string} fieldId - Field identifier
     */
    setDirty(fieldId) {
      const fieldState = state.get(fieldId);
      if (fieldState) {
        fieldState.dirty = true;
      }
    },
    
    /**
     * Update field validation state
     * @param {string} fieldId - Field identifier
     * @param {boolean} valid - Whether field is valid
     * @param {string|null} error - Error message
     */
    setValidation(fieldId, valid, error) {
      const fieldState = state.get(fieldId);
      if (fieldState) {
        fieldState.valid = valid;
        fieldState.error = error;
      }
    },
    
    /**
     * Get field state
     * @param {string} fieldId - Field identifier
     * @returns {FieldState|null} Field state
     */
    get(fieldId) {
      return state.get(fieldId) || null;
    },
    
    /**
     * Check if field should show error
     * @param {string} fieldId - Field identifier
     * @returns {boolean} Whether to show error
     */
    shouldShowError(fieldId) {
      const fieldState = state.get(fieldId);
      return fieldState ? fieldState.touched && !fieldState.valid : false;
    },
    
    /**
     * Reset field state
     * @param {string} fieldId - Field identifier
     */
    reset(fieldId) {
      if (fieldId) {
        state.delete(fieldId);
      } else {
        state.clear();
      }
    },
  };
}

/**
 * Generate error message for field
 * @param {string} fieldName - Field name
 * @param {string} errorType - Error type
 * @param {Object} [context={}] - Additional context
 * @returns {string} Error message
 */
function generateErrorMessage(fieldName, errorType, context = {}) {
  const baseMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.REQUIRED;
  
  if (context.customMessage) {
    return context.customMessage;
  }
  
  return baseMessage;
}

/**
 * Validate multiple fields
 * @param {Object} fields - Object with field values keyed by field name
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation results keyed by field name
 */
function validateFields(fields, schema) {
  const results = {};
  
  try {
    for (const [fieldName, value] of Object.entries(fields)) {
      const fieldSchema = schema[fieldName];
      
      if (!fieldSchema) {
        console.warn('[Validation] No schema found for field', fieldName);
        continue;
      }
      
      results[fieldName] = validateField(
        value,
        fieldSchema.type,
        {
          required: fieldSchema.required !== false,
          fieldName,
        }
      );
    }
  } catch (error) {
    console.error('[Validation] Multiple field validation error', error);
  }
  
  return results;
}

/**
 * Check if all validation results are valid
 * @param {Object} results - Validation results
 * @returns {boolean} True if all valid
 */
function isFormValid(results) {
  return Object.values(results).every((result) => result.isValid);
}

if (typeof window !== 'undefined') {
  window.FormValidation = {
    validateRequired,
    validateEmail,
    validatePhone,
    validateName,
    validateMessage,
    validateGrade,
    validateField,
    validateFields,
    isFormValid,
    createFieldState,
    generateErrorMessage,
    formatPhone,
    normalizePhone,
    sanitizeString,
    ERROR_MESSAGES,
    VALIDATION_CONFIG,
  };
}