/**
 * HomeschoolHub Landing Page - Curriculum Section Module
 * 
 * Manages interactive curriculum content expansion, smooth animations,
 * keyboard navigation, and engagement analytics tracking.
 * 
 * @module curriculum
 * @version 1.0.0
 */

'use strict';

/**
 * Curriculum section configuration
 */
const CURRICULUM_CONFIG = Object.freeze({
  ANIMATION_DURATION: 300,
  SCROLL_OFFSET: 100,
  DEBOUNCE_DELAY: 150,
  ANALYTICS_THROTTLE: 2000,
  KEYBOARD_KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
  },
});

/**
 * Analytics tracking state
 */
const analyticsState = {
  expandedItems: new Set(),
  interactionTimestamps: new Map(),
  sectionViewTime: 0,
  sectionViewStart: null,
};

/**
 * DOM utility functions (lightweight subset for curriculum module)
 */
const CurriculumDOM = {
  query(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error(`[Curriculum] DOM query failed for selector: ${selector}`, error);
      return null;
    }
  },

  queryAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.error(`[Curriculum] DOM queryAll failed for selector: ${selector}`, error);
      return [];
    }
  },

  addClass(element, className) {
    if (element && element.classList) {
      element.classList.add(className);
    }
  },

  removeClass(element, className) {
    if (element && element.classList) {
      element.classList.remove(className);
    }
  },

  toggleClass(element, className) {
    if (element && element.classList) {
      return element.classList.toggle(className);
    }
    return false;
  },

  hasClass(element, className) {
    return element && element.classList ? element.classList.contains(className) : false;
  },

  setAttribute(element, name, value) {
    if (element && element.setAttribute) {
      element.setAttribute(name, value);
    }
  },

  getAttribute(element, name) {
    return element && element.getAttribute ? element.getAttribute(name) : null;
  },
};

/**
 * Debounce utility for performance optimization
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
 * Throttle utility for rate limiting
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
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
}

/**
 * Track curriculum item expansion for analytics
 * @param {string} itemId - Unique identifier for curriculum item
 * @param {boolean} isExpanded - Whether item is expanded
 */
function trackItemExpansion(itemId, isExpanded) {
  try {
    if (isExpanded) {
      analyticsState.expandedItems.add(itemId);
      analyticsState.interactionTimestamps.set(itemId, Date.now());
      
      console.log('[Curriculum] Item expanded', {
        itemId,
        timestamp: new Date().toISOString(),
        totalExpanded: analyticsState.expandedItems.size,
      });
    } else {
      const expandTime = analyticsState.interactionTimestamps.get(itemId);
      const viewDuration = expandTime ? Date.now() - expandTime : 0;
      
      analyticsState.expandedItems.delete(itemId);
      analyticsState.interactionTimestamps.delete(itemId);
      
      console.log('[Curriculum] Item collapsed', {
        itemId,
        viewDuration,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Curriculum] Analytics tracking failed', error);
  }
}

/**
 * Track section view time
 */
function trackSectionView() {
  try {
    if (analyticsState.sectionViewStart) {
      analyticsState.sectionViewTime = Date.now() - analyticsState.sectionViewStart;
      
      console.log('[Curriculum] Section view time', {
        duration: analyticsState.sectionViewTime,
        expandedItems: analyticsState.expandedItems.size,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Curriculum] Section view tracking failed', error);
  }
}

/**
 * Calculate content height for smooth animation
 * @param {Element} content - Content element
 * @returns {number} Content height in pixels
 */
function getContentHeight(content) {
  if (!content) return 0;

  try {
    const clone = content.cloneNode(true);
    clone.style.cssText = 'position: absolute; visibility: hidden; height: auto; display: block;';
    content.parentElement.appendChild(clone);
    
    const height = clone.scrollHeight;
    content.parentElement.removeChild(clone);
    
    return height;
  } catch (error) {
    console.error('[Curriculum] Height calculation failed', error);
    return content.scrollHeight || 0;
  }
}

/**
 * Expand curriculum item with smooth animation
 * @param {Element} item - Curriculum item element
 * @param {Element} content - Content element to expand
 * @param {Element} trigger - Trigger button element
 */
function expandItem(item, content, trigger) {
  if (!item || !content || !trigger) return;

  try {
    const itemId = CurriculumDOM.getAttribute(item, 'data-curriculum-id') || 
                   CurriculumDOM.getAttribute(trigger, 'id') || 
                   `item-${Date.now()}`;

    CurriculumDOM.addClass(item, 'expanded');
    CurriculumDOM.setAttribute(trigger, 'aria-expanded', 'true');
    
    const height = getContentHeight(content);
    content.style.height = '0px';
    content.style.display = 'block';
    
    requestAnimationFrame(() => {
      content.style.transition = `height ${CURRICULUM_CONFIG.ANIMATION_DURATION}ms ease-in-out`;
      content.style.height = `${height}px`;
      
      setTimeout(() => {
        content.style.height = 'auto';
        content.style.transition = '';
      }, CURRICULUM_CONFIG.ANIMATION_DURATION);
    });

    trackItemExpansion(itemId, true);
    
    console.log('[Curriculum] Item expanded successfully', { itemId });
  } catch (error) {
    console.error('[Curriculum] Item expansion failed', error);
    content.style.display = 'block';
    content.style.height = 'auto';
  }
}

/**
 * Collapse curriculum item with smooth animation
 * @param {Element} item - Curriculum item element
 * @param {Element} content - Content element to collapse
 * @param {Element} trigger - Trigger button element
 */
function collapseItem(item, content, trigger) {
  if (!item || !content || !trigger) return;

  try {
    const itemId = CurriculumDOM.getAttribute(item, 'data-curriculum-id') || 
                   CurriculumDOM.getAttribute(trigger, 'id') || 
                   `item-${Date.now()}`;

    CurriculumDOM.removeClass(item, 'expanded');
    CurriculumDOM.setAttribute(trigger, 'aria-expanded', 'false');
    
    const height = content.scrollHeight;
    content.style.height = `${height}px`;
    
    requestAnimationFrame(() => {
      content.style.transition = `height ${CURRICULUM_CONFIG.ANIMATION_DURATION}ms ease-in-out`;
      content.style.height = '0px';
      
      setTimeout(() => {
        content.style.display = 'none';
        content.style.height = '';
        content.style.transition = '';
      }, CURRICULUM_CONFIG.ANIMATION_DURATION);
    });

    trackItemExpansion(itemId, false);
    
    console.log('[Curriculum] Item collapsed successfully', { itemId });
  } catch (error) {
    console.error('[Curriculum] Item collapse failed', error);
    content.style.display = 'none';
    content.style.height = '';
  }
}

/**
 * Toggle curriculum item expansion state
 * @param {Element} item - Curriculum item element
 * @param {Element} content - Content element
 * @param {Element} trigger - Trigger button element
 */
function toggleItem(item, content, trigger) {
  if (!item || !content || !trigger) return;

  const isExpanded = CurriculumDOM.hasClass(item, 'expanded');
  
  if (isExpanded) {
    collapseItem(item, content, trigger);
  } else {
    expandItem(item, content, trigger);
  }
}

/**
 * Handle keyboard navigation for curriculum items
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Element} trigger - Current trigger element
 * @param {Element[]} allTriggers - All trigger elements
 */
function handleKeyboardNavigation(event, trigger, allTriggers) {
  const { key } = event;
  const currentIndex = allTriggers.indexOf(trigger);

  try {
    switch (key) {
      case CURRICULUM_CONFIG.KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        if (currentIndex > 0) {
          allTriggers[currentIndex - 1].focus();
        }
        break;

      case CURRICULUM_CONFIG.KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        if (currentIndex < allTriggers.length - 1) {
          allTriggers[currentIndex + 1].focus();
        }
        break;

      case CURRICULUM_CONFIG.KEYBOARD_KEYS.ESCAPE:
        event.preventDefault();
        const item = trigger.closest('[data-curriculum-item]');
        const content = item ? CurriculumDOM.query('[data-curriculum-content]', item) : null;
        
        if (item && content && CurriculumDOM.hasClass(item, 'expanded')) {
          collapseItem(item, content, trigger);
        }
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('[Curriculum] Keyboard navigation failed', error);
  }
}

/**
 * Initialize curriculum item interactions
 * @param {Element} item - Curriculum item element
 * @param {Element[]} allTriggers - All trigger elements for keyboard navigation
 */
function initCurriculumItem(item, allTriggers) {
  if (!item) return;

  try {
    const trigger = CurriculumDOM.query('[data-curriculum-trigger]', item);
    const content = CurriculumDOM.query('[data-curriculum-content]', item);

    if (!trigger || !content) {
      console.warn('[Curriculum] Item missing trigger or content', item);
      return;
    }

    CurriculumDOM.setAttribute(trigger, 'aria-expanded', 'false');
    CurriculumDOM.setAttribute(trigger, 'aria-controls', 
      CurriculumDOM.getAttribute(content, 'id') || `content-${Date.now()}`);
    
    content.style.display = 'none';
    content.style.overflow = 'hidden';

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      toggleItem(item, content, trigger);
    });

    trigger.addEventListener('keydown', (event) => {
      const { key } = event;
      
      if (key === CURRICULUM_CONFIG.KEYBOARD_KEYS.ENTER || 
          key === CURRICULUM_CONFIG.KEYBOARD_KEYS.SPACE) {
        event.preventDefault();
        toggleItem(item, content, trigger);
      } else {
        handleKeyboardNavigation(event, trigger, allTriggers);
      }
    });

    console.log('[Curriculum] Item initialized', {
      itemId: CurriculumDOM.getAttribute(item, 'data-curriculum-id'),
    });
  } catch (error) {
    console.error('[Curriculum] Item initialization failed', error);
  }
}

/**
 * Initialize intersection observer for section view tracking
 * @param {Element} section - Curriculum section element
 */
function initSectionObserver(section) {
  if (!section || !('IntersectionObserver' in window)) {
    console.warn('[Curriculum] IntersectionObserver not available');
    return;
  }

  try {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!analyticsState.sectionViewStart) {
              analyticsState.sectionViewStart = Date.now();
              console.log('[Curriculum] Section entered viewport');
            }
          } else {
            if (analyticsState.sectionViewStart) {
              trackSectionView();
              analyticsState.sectionViewStart = null;
            }
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px',
      }
    );

    observer.observe(section);
    
    console.log('[Curriculum] Section observer initialized');
  } catch (error) {
    console.error('[Curriculum] Section observer initialization failed', error);
  }
}

/**
 * Initialize expand all / collapse all functionality
 * @param {Element} section - Curriculum section element
 * @param {Element[]} items - All curriculum item elements
 */
function initBulkActions(section, items) {
  if (!section || items.length === 0) return;

  try {
    const expandAllBtn = CurriculumDOM.query('[data-curriculum-expand-all]', section);
    const collapseAllBtn = CurriculumDOM.query('[data-curriculum-collapse-all]', section);

    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        items.forEach((item) => {
          const trigger = CurriculumDOM.query('[data-curriculum-trigger]', item);
          const content = CurriculumDOM.query('[data-curriculum-content]', item);
          
          if (trigger && content && !CurriculumDOM.hasClass(item, 'expanded')) {
            expandItem(item, content, trigger);
          }
        });

        console.log('[Curriculum] Expanded all items');
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        items.forEach((item) => {
          const trigger = CurriculumDOM.query('[data-curriculum-trigger]', item);
          const content = CurriculumDOM.query('[data-curriculum-content]', item);
          
          if (trigger && content && CurriculumDOM.hasClass(item, 'expanded')) {
            collapseItem(item, content, trigger);
          }
        });

        console.log('[Curriculum] Collapsed all items');
      });
    }
  } catch (error) {
    console.error('[Curriculum] Bulk actions initialization failed', error);
  }
}

/**
 * Initialize curriculum section functionality
 */
function initCurriculum() {
  try {
    const section = CurriculumDOM.query('.curriculum-section, [data-curriculum-section]');
    
    if (!section) {
      console.warn('[Curriculum] Section not found in DOM');
      return;
    }

    const items = CurriculumDOM.queryAll('[data-curriculum-item]', section);
    
    if (items.length === 0) {
      console.warn('[Curriculum] No curriculum items found');
      return;
    }

    const triggers = items
      .map(item => CurriculumDOM.query('[data-curriculum-trigger]', item))
      .filter(Boolean);

    items.forEach((item) => {
      initCurriculumItem(item, triggers);
    });

    initBulkActions(section, items);
    initSectionObserver(section);

    const throttledViewTracking = throttle(
      trackSectionView,
      CURRICULUM_CONFIG.ANALYTICS_THROTTLE
    );

    window.addEventListener('beforeunload', () => {
      if (analyticsState.sectionViewStart) {
        trackSectionView();
      }
    });

    window.addEventListener('visibilitychange', () => {
      if (document.hidden && analyticsState.sectionViewStart) {
        throttledViewTracking();
      }
    });

    console.log('[Curriculum] Section initialized successfully', {
      itemCount: items.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Curriculum] Initialization failed', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCurriculum);
} else {
  initCurriculum();
}