/**
 * HomeschoolHub Landing Page - Main JavaScript Module
 * 
 * Provides core utilities for DOM manipulation, event handling, and form validation.
 * Implements progressive enhancement with graceful degradation for older browsers.
 * 
 * @module main
 * @version 1.0.0
 */

'use strict';

/**
 * Application state and configuration
 */
const APP_CONFIG = Object.freeze({
  DEBOUNCE_DELAY: 300,
  SCROLL_THRESHOLD: 100,
  ANIMATION_DURATION: 300,
  FORM_VALIDATION_DELAY: 500,
});

/**
 * DOM utility functions for safe element selection and manipulation
 */
const DOM = {
  /**
   * Safely query a single element
   * @param {string} selector - CSS selector
   * @param {Element} [context=document] - Context element
   * @returns {Element|null} Found element or null
   */
  query(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`DOM query failed for selector: ${selector}`, error);
      return null;
    }
  },

  /**
   * Safely query multiple elements
   * @param {string} selector - CSS selector
   * @param {Element} [context=document] - Context element
   * @returns {Element[]} Array of found elements
   */
  queryAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`DOM queryAll failed for selector: ${selector}`, error);
      return [];
    }
  },

  /**
   * Add class to element safely
   * @param {Element} element - Target element
   * @param {string} className - Class name to add
   */
  addClass(element, className) {
    if (element && element.classList) {
      element.classList.add(className);
    }
  },

  /**
   * Remove class from element safely
   * @param {Element} element - Target element
   * @param {string} className - Class name to remove
   */
  removeClass(element, className) {
    if (element && element.classList) {
      element.classList.remove(className);
    }
  },

  /**
   * Toggle class on element safely
   * @param {Element} element - Target element
   * @param {string} className - Class name to toggle
   * @returns {boolean} True if class was added, false if removed
   */
  toggleClass(element, className) {
    if (element && element.classList) {
      return element.classList.toggle(className);
    }
    return false;
  },

  /**
   * Check if element has class
   * @param {Element} element - Target element
   * @param {string} className - Class name to check
   * @returns {boolean} True if element has class
   */
  hasClass(element, className) {
    return element && element.classList ? element.classList.contains(className) : false;
  },

  /**
   * Set attribute safely
   * @param {Element} element - Target element
   * @param {string} name - Attribute name
   * @param {string} value - Attribute value
   */
  setAttribute(element, name, value) {
    if (element && element.setAttribute) {
      element.setAttribute(name, value);
    }
  },

  /**
   * Remove attribute safely
   * @param {Element} element - Target element
   * @param {string} name - Attribute name
   */
  removeAttribute(element, name) {
    if (element && element.removeAttribute) {
      element.removeAttribute(name);
    }
  },
};

/**
 * Event handling utilities with delegation support
 */
const Events = {
  /**
   * Add event listener with error handling
   * @param {Element|Window|Document} target - Event target
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} [options] - Event listener options
   */
  on(target, event, handler, options = {}) {
    if (!target || !target.addEventListener) {
      console.error('Invalid event target', target);
      return;
    }

    try {
      target.addEventListener(event, handler, options);
    } catch (error) {
      console.error(`Failed to add event listener for ${event}`, error);
    }
  },

  /**
   * Remove event listener
   * @param {Element|Window|Document} target - Event target
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} [options] - Event listener options
   */
  off(target, event, handler, options = {}) {
    if (!target || !target.removeEventListener) {
      return;
    }

    try {
      target.removeEventListener(event, handler, options);
    } catch (error) {
      console.error(`Failed to remove event listener for ${event}`, error);
    }
  },

  /**
   * Event delegation helper
   * @param {Element} parent - Parent element
   * @param {string} event - Event name
   * @param {string} selector - Child selector
   * @param {Function} handler - Event handler
   */
  delegate(parent, event, selector, handler) {
    this.on(parent, event, (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    });
  },

  /**
   * Trigger custom event
   * @param {Element} element - Target element
   * @param {string} eventName - Event name
   * @param {*} [detail] - Event detail data
   */
  trigger(element, eventName, detail = null) {
    if (!element) return;

    try {
      const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail,
      });
      element.dispatchEvent(event);
    } catch (error) {
      console.error(`Failed to trigger event ${eventName}`, error);
    }
  },
};

/**
 * Utility functions for common operations
 */
const Utils = {
  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay = APP_CONFIG.DEBOUNCE_DELAY) {
    let timeoutId = null;

    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  },

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit = APP_CONFIG.DEBOUNCE_DELAY) {
    let inThrottle = false;

    return function throttled(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  /**
   * Check if element is in viewport
   * @param {Element} element - Element to check
   * @returns {boolean} True if element is in viewport
   */
  isInViewport(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   * @param {Element|string} target - Target element or selector
   * @param {number} [offset=0] - Offset from top
   */
  scrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? DOM.query(target) : target;
    
    if (!element) {
      console.warn('Scroll target not found', target);
      return;
    }

    try {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } catch (error) {
      console.error('Scroll failed', error);
      element.scrollIntoView({ behavior: 'smooth' });
    }
  },

  /**
   * Sanitize HTML string to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Format phone number
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  },
};

/**
 * Form validation utilities
 */
const Validation = {
  /**
   * Email validation regex
   */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /**
   * Phone validation regex (US format)
   */
  PHONE_REGEX: /^[\d\s\-\(\)]+$/,

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    return typeof email === 'string' && this.EMAIL_REGEX.test(email.trim());
  },

  /**
   * Validate phone number
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    if (!phone) return true;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && this.PHONE_REGEX.test(phone);
  },

  /**
   * Validate required field
   * @param {string} value - Value to validate
   * @returns {boolean} True if valid
   */
  isRequired(value) {
    return typeof value === 'string' && value.trim().length > 0;
  },

  /**
   * Show error message for field
   * @param {Element} field - Form field
   * @param {string} message - Error message
   */
  showError(field, message) {
    if (!field) return;

    const errorId = field.getAttribute('aria-describedby');
    const errorElement = errorId ? DOM.query(`#${errorId}`) : null;

    DOM.addClass(field, 'error');
    DOM.setAttribute(field, 'aria-invalid', 'true');

    if (errorElement) {
      errorElement.textContent = message;
      DOM.addClass(errorElement, 'visible');
    }
  },

  /**
   * Clear error message for field
   * @param {Element} field - Form field
   */
  clearError(field) {
    if (!field) return;

    const errorId = field.getAttribute('aria-describedby');
    const errorElement = errorId ? DOM.query(`#${errorId}`) : null;

    DOM.removeClass(field, 'error');
    DOM.removeAttribute(field, 'aria-invalid');

    if (errorElement) {
      errorElement.textContent = '';
      DOM.removeClass(errorElement, 'visible');
    }
  },

  /**
   * Validate form field
   * @param {Element} field - Form field to validate
   * @returns {boolean} True if valid
   */
  validateField(field) {
    if (!field) return false;

    const value = field.value;
    const type = field.type;
    const required = field.hasAttribute('required');

    this.clearError(field);

    if (required && !this.isRequired(value)) {
      this.showError(field, 'This field is required');
      return false;
    }

    if (value && type === 'email' && !this.isValidEmail(value)) {
      this.showError(field, 'Please enter a valid email address');
      return false;
    }

    if (value && type === 'tel' && !this.isValidPhone(value)) {
      this.showError(field, 'Please enter a valid phone number');
      return false;
    }

    return true;
  },

  /**
   * Validate entire form
   * @param {HTMLFormElement} form - Form to validate
   * @returns {boolean} True if all fields valid
   */
  validateForm(form) {
    if (!form) return false;

    const fields = DOM.queryAll('input[required], textarea[required], select[required]', form);
    let isValid = true;

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  },
};

/**
 * Initialize hero section functionality with error handling
 */
function initHeroSection() {
  try {
    const heroSection = DOM.query('.hero-section');
    
    if (!heroSection) {
      console.warn('[Main] Hero section not found in DOM');
      return;
    }

    const heroImages = DOM.queryAll('img[data-src], img[data-srcset]', heroSection);
    
    if (heroImages.length > 0) {
      heroImages.forEach((image) => {
        const handleImageLoad = () => {
          console.log('[Main] Hero image loaded successfully');
        };

        const handleImageError = (error) => {
          console.error('[Main] Hero image failed to load', error);
        };

        Events.on(image, 'load', handleImageLoad, { once: true });
        Events.on(image, 'error', handleImageError, { once: true });
      });
    }

    console.log('[Main] Hero section functionality initialized');
  } catch (error) {
    console.error('[Main] Hero section initialization failed', error);
  }
}

/**
 * Initialize curriculum section functionality
 */
function initCurriculumSection() {
  try {
    const curriculumSection = DOM.query('.curriculum-section, [data-curriculum-section]');
    
    if (!curriculumSection) {
      console.warn('[Main] Curriculum section not found in DOM');
      return;
    }

    const curriculumItems = DOM.queryAll('[data-curriculum-item]', curriculumSection);
    
    if (curriculumItems.length === 0) {
      console.warn('[Main] No curriculum items found');
      return;
    }

    console.log('[Main] Curriculum section functionality initialized', {
      itemCount: curriculumItems.length,
    });
  } catch (error) {
    console.error('[Main] Curriculum section initialization failed', error);
  }
}

/**
 * Smooth scroll navigation handler
 */
function initSmoothScroll() {
  Events.delegate(document, 'click', 'a[href^="#"]', function(e) {
    const href = this.getAttribute('href');
    
    if (href === '#' || href === '#main') {
      return;
    }

    e.preventDefault();
    Utils.scrollTo(href, 80);
  });
}

/**
 * Form submission handler
 */
function initFormHandling() {
  const form = DOM.query('.contact-form');
  
  if (!form) return;

  const fields = DOM.queryAll('input, textarea, select', form);
  
  fields.forEach((field) => {
    const validateDebounced = Utils.debounce(() => {
      Validation.validateField(field);
    }, APP_CONFIG.FORM_VALIDATION_DELAY);

    Events.on(field, 'blur', () => {
      Validation.validateField(field);
    });

    Events.on(field, 'input', validateDebounced);
  });

  Events.on(form, 'submit', (e) => {
    e.preventDefault();

    if (!Validation.validateForm(form)) {
      const firstError = DOM.query('.error', form);
      if (firstError) {
        firstError.focus();
      }
      return;
    }

    console.log('Form validation passed - ready for submission');
    Events.trigger(form, 'formValidated', { form });
  });
}

/**
 * Scroll-based header behavior
 */
function initHeaderBehavior() {
  const header = DOM.query('header');
  
  if (!header) return;

  let lastScroll = 0;

  const handleScroll = Utils.throttle(() => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > APP_CONFIG.SCROLL_THRESHOLD) {
      DOM.addClass(header, 'scrolled');
    } else {
      DOM.removeClass(header, 'scrolled');
    }

    lastScroll = currentScroll;
  }, 100);

  Events.on(window, 'scroll', handleScroll, { passive: true });
}

/**
 * Skip link functionality for accessibility
 */
function initSkipLink() {
  const skipLink = DOM.query('.skip-link');
  
  if (!skipLink) return;

  Events.on(skipLink, 'click', (e) => {
    e.preventDefault();
    const target = DOM.query('#main');
    
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.removeAttribute('tabindex');
    }
  });
}

/**
 * Initialize all interactive components
 */
function init() {
  try {
    initSkipLink();
    initSmoothScroll();
    initHeaderBehavior();
    initFormHandling();
    initHeroSection();
    initCurriculumSection();

    console.log('HomeschoolHub application initialized successfully');
  } catch (error) {
    console.error('Application initialization failed', error);
  }
}

if (document.readyState === 'loading') {
  Events.on(document, 'DOMContentLoaded', init);
} else {
  init();
}