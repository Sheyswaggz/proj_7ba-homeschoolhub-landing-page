/**
 * HomeschoolHub Contact Form Module
 * 
 * Implements comprehensive form validation, spam protection, and submission handling
 * with real-time feedback and accessibility support.
 * 
 * @module contact
 * @version 1.0.0
 */

'use strict';

/**
 * Contact form configuration
 */
const CONTACT_CONFIG = Object.freeze({
  VALIDATION_DELAY: 500,
  SUBMISSION_TIMEOUT: 10000,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  HONEYPOT_FIELD: 'website',
  SUCCESS_DISPLAY_DURATION: 5000,
});

/**
 * Validation error messages
 */
const ERROR_MESSAGES = Object.freeze({
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number (10 digits minimum)',
  MESSAGE_TOO_SHORT: `Message must be at least ${CONTACT_CONFIG.MIN_MESSAGE_LENGTH} characters`,
  MESSAGE_TOO_LONG: `Message must not exceed ${CONTACT_CONFIG.MAX_MESSAGE_LENGTH} characters`,
  INVALID_GRADE: 'Please select a valid grade level',
  SUBMISSION_FAILED: 'Failed to submit form. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
});

/**
 * Valid grade level options
 */
const VALID_GRADES = Object.freeze([
  'pre-k',
  'kindergarten',
  'grade-1',
  'grade-2',
  'grade-3',
  'grade-4',
  'grade-5',
  'grade-6',
  'grade-7',
  'grade-8',
  'grade-9',
  'grade-10',
  'grade-11',
  'grade-12',
]);

/**
 * Form validation state
 */
const formState = {
  isSubmitting: false,
  validationErrors: new Map(),
  touchedFields: new Set(),
};

/**
 * Validation rules for form fields
 */
const validationRules = {
  /**
   * Validate parent name field
   * @param {string} value - Field value
   * @returns {{isValid: boolean, error: string|null}}
   */
  parentName(value) {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate email field
   * @param {string} value - Field value
   * @returns {{isValid: boolean, error: string|null}}
   */
  email(value) {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate phone field
   * @param {string} value - Field value
   * @returns {{isValid: boolean, error: string|null}}
   */
  phone(value) {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { isValid: true, error: null };
    }
    
    const digitsOnly = trimmed.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_PHONE };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate grade level field
   * @param {string} value - Field value
   * @returns {{isValid: boolean, error: string|null}}
   */
  gradeLevel(value) {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
    }
    
    if (!VALID_GRADES.includes(trimmed)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_GRADE };
    }
    
    return { isValid: true, error: null };
  },

  /**
   * Validate message field
   * @param {string} value - Field value
   * @returns {{isValid: boolean, error: string|null}}
   */
  message(value) {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { isValid: false, error: ERROR_MESSAGES.REQUIRED };
    }
    
    if (trimmed.length < CONTACT_CONFIG.MIN_MESSAGE_LENGTH) {
      return { isValid: false, error: ERROR_MESSAGES.MESSAGE_TOO_SHORT };
    }
    
    if (trimmed.length > CONTACT_CONFIG.MAX_MESSAGE_LENGTH) {
      return { isValid: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
    }
    
    return { isValid: true, error: null };
  },
};

/**
 * Show validation error for a field
 * @param {HTMLElement} field - Form field element
 * @param {string} errorMessage - Error message to display
 */
function showFieldError(field, errorMessage) {
  if (!field) {
    console.error('[Contact] Cannot show error: field is null');
    return;
  }

  const errorId = field.getAttribute('aria-describedby');
  const errorElement = errorId ? document.getElementById(errorId) : null;

  field.classList.add('error');
  field.setAttribute('aria-invalid', 'true');

  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.classList.add('visible');
    
    announceToScreenReader(errorMessage);
  }

  formState.validationErrors.set(field.name, errorMessage);
  
  console.log('[Contact] Validation error shown', {
    field: field.name,
    error: errorMessage,
  });
}

/**
 * Clear validation error for a field
 * @param {HTMLElement} field - Form field element
 */
function clearFieldError(field) {
  if (!field) {
    console.error('[Contact] Cannot clear error: field is null');
    return;
  }

  const errorId = field.getAttribute('aria-describedby');
  const errorElement = errorId ? document.getElementById(errorId) : null;

  field.classList.remove('error');
  field.removeAttribute('aria-invalid');

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
  }

  formState.validationErrors.delete(field.name);
}

/**
 * Validate a single form field
 * @param {HTMLElement} field - Form field to validate
 * @returns {boolean} True if field is valid
 */
function validateField(field) {
  if (!field || !field.name) {
    console.error('[Contact] Cannot validate: invalid field', field);
    return false;
  }

  const fieldName = field.name;
  const fieldValue = field.value;
  const validator = validationRules[fieldName];

  clearFieldError(field);

  if (!validator) {
    console.warn('[Contact] No validator found for field', fieldName);
    return true;
  }

  const result = validator(fieldValue);

  if (!result.isValid) {
    showFieldError(field, result.error);
    return false;
  }

  console.log('[Contact] Field validated successfully', { field: fieldName });
  return true;
}

/**
 * Validate entire form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if all fields are valid
 */
function validateForm(form) {
  if (!form) {
    console.error('[Contact] Cannot validate: form is null');
    return false;
  }

  const fields = Array.from(form.querySelectorAll('[name]')).filter(
    (field) => field.name !== CONTACT_CONFIG.HONEYPOT_FIELD
  );

  let isValid = true;
  let firstInvalidField = null;

  fields.forEach((field) => {
    const fieldValid = validateField(field);
    
    if (!fieldValid) {
      isValid = false;
      
      if (!firstInvalidField) {
        firstInvalidField = field;
      }
    }
  });

  if (!isValid && firstInvalidField) {
    firstInvalidField.focus();
    
    console.log('[Contact] Form validation failed', {
      errorCount: formState.validationErrors.size,
      firstInvalidField: firstInvalidField.name,
    });
  } else {
    console.log('[Contact] Form validation passed');
  }

  return isValid;
}

/**
 * Check honeypot field for spam detection
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} True if honeypot is empty (not spam)
 */
function checkHoneypot(form) {
  const honeypotField = form.querySelector(`[name="${CONTACT_CONFIG.HONEYPOT_FIELD}"]`);
  
  if (!honeypotField) {
    console.warn('[Contact] Honeypot field not found');
    return true;
  }

  const isSpam = honeypotField.value.trim() !== '';
  
  if (isSpam) {
    console.warn('[Contact] Spam detected via honeypot', {
      honeypotValue: honeypotField.value,
      timestamp: new Date().toISOString(),
    });
  }

  return !isSpam;
}

/**
 * Collect form data
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data object
 */
function collectFormData(form) {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (key !== CONTACT_CONFIG.HONEYPOT_FIELD) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  data.timestamp = new Date().toISOString();
  data.userAgent = navigator.userAgent;

  console.log('[Contact] Form data collected', {
    fields: Object.keys(data),
    timestamp: data.timestamp,
  });

  return data;
}

/**
 * Show success message
 * @param {HTMLElement} container - Message container element
 */
function showSuccessMessage(container) {
  if (!container) {
    console.error('[Contact] Cannot show success: container is null');
    return;
  }

  container.innerHTML = `
    <div class="success-message" role="alert" aria-live="polite">
      <svg class="success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="success-content">
        <h3 class="success-title">Thank you for your inquiry!</h3>
        <p class="success-text">We've received your message and will get back to you within 24 hours.</p>
      </div>
    </div>
  `;

  container.classList.add('visible');
  
  announceToScreenReader('Form submitted successfully. We will contact you within 24 hours.');

  setTimeout(() => {
    container.classList.remove('visible');
  }, CONTACT_CONFIG.SUCCESS_DISPLAY_DURATION);

  console.log('[Contact] Success message displayed');
}

/**
 * Show error message
 * @param {HTMLElement} container - Message container element
 * @param {string} message - Error message
 */
function showErrorMessage(container, message) {
  if (!container) {
    console.error('[Contact] Cannot show error: container is null');
    return;
  }

  container.innerHTML = `
    <div class="error-message" role="alert" aria-live="assertive">
      <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="error-content">
        <h3 class="error-title">Submission Failed</h3>
        <p class="error-text">${message}</p>
      </div>
    </div>
  `;

  container.classList.add('visible');
  
  announceToScreenReader(`Error: ${message}`);

  console.error('[Contact] Error message displayed', { message });
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Submit form data
 * @param {Object} data - Form data to submit
 * @returns {Promise<Object>} Submission result
 */
async function submitFormData(data) {
  console.log('[Contact] Submitting form data', {
    fields: Object.keys(data),
    timestamp: data.timestamp,
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[Contact] Form submission simulated (no backend configured)', data);
      
      resolve({
        success: true,
        message: 'Form submitted successfully',
        data,
      });
    }, 1500);
  });
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const messageContainer = document.getElementById('form-message');

  if (formState.isSubmitting) {
    console.warn('[Contact] Form submission already in progress');
    return;
  }

  console.log('[Contact] Form submission initiated');

  if (!checkHoneypot(form)) {
    console.warn('[Contact] Form submission blocked: spam detected');
    return;
  }

  if (!validateForm(form)) {
    console.warn('[Contact] Form submission blocked: validation failed');
    return;
  }

  formState.isSubmitting = true;

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : '';

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    submitButton.setAttribute('aria-busy', 'true');
  }

  try {
    const formData = collectFormData(form);
    const result = await submitFormData(formData);

    if (result.success) {
      form.reset();
      formState.validationErrors.clear();
      formState.touchedFields.clear();
      
      showSuccessMessage(messageContainer);
      
      console.log('[Contact] Form submitted successfully', {
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(result.message || ERROR_MESSAGES.SUBMISSION_FAILED);
    }
  } catch (error) {
    console.error('[Contact] Form submission failed', {
      error: error.message,
      stack: error.stack,
    });

    const errorMessage = error.message || ERROR_MESSAGES.NETWORK_ERROR;
    showErrorMessage(messageContainer, errorMessage);
  } finally {
    formState.isSubmitting = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      submitButton.removeAttribute('aria-busy');
    }
  }
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
  let timeoutId = null;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Handle field input with debounced validation
 * @param {Event} event - Input event
 */
const handleFieldInput = debounce(function(event) {
  const field = event.target;
  
  if (formState.touchedFields.has(field.name)) {
    validateField(field);
  }
}, CONTACT_CONFIG.VALIDATION_DELAY);

/**
 * Handle field blur
 * @param {Event} event - Blur event
 */
function handleFieldBlur(event) {
  const field = event.target;
  
  formState.touchedFields.add(field.name);
  validateField(field);
}

/**
 * Format phone number as user types
 * @param {Event} event - Input event
 */
function handlePhoneInput(event) {
  const field = event.target;
  const value = field.value.replace(/\D/g, '');
  
  let formatted = value;
  
  if (value.length >= 6) {
    formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
  } else if (value.length >= 3) {
    formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
  }
  
  field.value = formatted;
}

/**
 * Initialize contact form
 */
function initContactForm() {
  const form = document.getElementById('contact-form');

  if (!form) {
    console.warn('[Contact] Contact form not found in DOM');
    return;
  }

  console.log('[Contact] Initializing contact form');

  form.addEventListener('submit', handleFormSubmit);

  const fields = form.querySelectorAll('input, textarea, select');
  
  fields.forEach((field) => {
    if (field.name === CONTACT_CONFIG.HONEYPOT_FIELD) {
      return;
    }

    field.addEventListener('input', handleFieldInput);
    field.addEventListener('blur', handleFieldBlur);

    if (field.type === 'tel') {
      field.addEventListener('input', handlePhoneInput);
    }
  });

  const messageContainer = document.getElementById('form-message');
  if (!messageContainer) {
    console.warn('[Contact] Form message container not found');
  }

  console.log('[Contact] Contact form initialized successfully', {
    fieldCount: fields.length,
    hasMessageContainer: !!messageContainer,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactForm);
} else {
  initContactForm();
}