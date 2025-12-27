/**
 * HomeschoolHub Landing Page - Hero Section Module
 * 
 * Manages hero section interactive elements including CTA tracking, smooth scrolling,
 * lazy loading, and animation triggers. Implements analytics tracking and performance
 * optimization for the hero section.
 * 
 * @module hero
 * @version 1.0.0
 */

'use strict';

/**
 * Hero section configuration
 */
const HERO_CONFIG = Object.freeze({
  LAZY_LOAD_THRESHOLD: 50,
  ANIMATION_DELAY: 100,
  ANIMATION_STAGGER: 150,
  SCROLL_OFFSET: 80,
  INTERSECTION_THRESHOLD: 0.1,
  IMAGE_LOAD_TIMEOUT: 5000,
});

/**
 * Analytics event types for hero section
 */
const ANALYTICS_EVENTS = Object.freeze({
  CTA_CLICK: 'hero_cta_click',
  IMAGE_LOADED: 'hero_image_loaded',
  IMAGE_ERROR: 'hero_image_error',
  SECTION_VIEWED: 'hero_section_viewed',
  ANIMATION_COMPLETE: 'hero_animation_complete',
});

/**
 * Hero section state management
 */
const heroState = {
  initialized: false,
  imageLoaded: false,
  animationTriggered: false,
  sectionViewed: false,
  ctaClicks: new Map(),
};

/**
 * Log analytics event with structured data
 * @param {string} eventName - Event name
 * @param {Object} eventData - Event metadata
 */
function logAnalyticsEvent(eventName, eventData = {}) {
  const timestamp = new Date().toISOString();
  const event = {
    event: eventName,
    timestamp,
    section: 'hero',
    ...eventData,
  };

  console.log('[Hero Analytics]', JSON.stringify(event));

  if (window.dataLayer) {
    window.dataLayer.push(event);
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventData);
  }
}

/**
 * Track CTA button click with detailed context
 * @param {Event} event - Click event
 * @param {Element} button - CTA button element
 */
function trackCTAClick(event, button) {
  if (!button) {
    console.error('[Hero] Invalid CTA button for tracking');
    return;
  }

  const buttonText = button.textContent.trim();
  const buttonHref = button.getAttribute('href') || button.dataset.target || '';
  const buttonId = button.id || 'unnamed-cta';

  const clickCount = (heroState.ctaClicks.get(buttonId) || 0) + 1;
  heroState.ctaClicks.set(buttonId, clickCount);

  const eventData = {
    button_text: buttonText,
    button_id: buttonId,
    button_href: buttonHref,
    click_count: clickCount,
    timestamp: Date.now(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  };

  logAnalyticsEvent(ANALYTICS_EVENTS.CTA_CLICK, eventData);

  console.log(`[Hero] CTA clicked: ${buttonText} (${clickCount} times)`);
}

/**
 * Initialize CTA button click tracking
 */
function initCTATracking() {
  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    console.warn('[Hero] Hero section not found for CTA tracking');
    return;
  }

  const ctaButtons = heroSection.querySelectorAll('.cta-button, .hero-cta, [data-cta]');

  if (ctaButtons.length === 0) {
    console.warn('[Hero] No CTA buttons found in hero section');
    return;
  }

  ctaButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      trackCTAClick(event, button);
    });
  });

  console.log(`[Hero] Initialized tracking for ${ctaButtons.length} CTA button(s)`);
}

/**
 * Smooth scroll to contact section with offset
 * @param {string} targetSelector - Target section selector
 */
function scrollToContact(targetSelector = '#contact') {
  const targetSection = document.querySelector(targetSelector);

  if (!targetSection) {
    console.warn(`[Hero] Target section not found: ${targetSelector}`);
    return;
  }

  try {
    const elementPosition = targetSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - HERO_CONFIG.SCROLL_OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });

    logAnalyticsEvent('hero_scroll_to_contact', {
      target: targetSelector,
      scroll_distance: offsetPosition,
    });

    console.log(`[Hero] Scrolling to ${targetSelector}`);
  } catch (error) {
    console.error('[Hero] Smooth scroll failed, using fallback', error);
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Initialize smooth scroll for contact links
 */
function initSmoothScroll() {
  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    return;
  }

  const contactLinks = heroSection.querySelectorAll('a[href^="#contact"], a[href^="#form"]');

  contactLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = link.getAttribute('href');
      scrollToContact(href);
    });
  });

  if (contactLinks.length > 0) {
    console.log(`[Hero] Initialized smooth scroll for ${contactLinks.length} contact link(s)`);
  }
}

/**
 * Lazy load hero image with error handling and timeout
 * @param {Element} imageElement - Image element to lazy load
 */
function lazyLoadHeroImage(imageElement) {
  if (!imageElement) {
    console.error('[Hero] Invalid image element for lazy loading');
    return;
  }

  const dataSrc = imageElement.dataset.src;
  const dataSrcset = imageElement.dataset.srcset;

  if (!dataSrc && !dataSrcset) {
    console.warn('[Hero] No data-src or data-srcset found for lazy loading');
    return;
  }

  const loadStartTime = performance.now();
  let timeoutId = null;

  const handleImageLoad = () => {
    clearTimeout(timeoutId);
    const loadTime = performance.now() - loadStartTime;

    heroState.imageLoaded = true;
    imageElement.classList.add('loaded');
    imageElement.classList.remove('loading');

    logAnalyticsEvent(ANALYTICS_EVENTS.IMAGE_LOADED, {
      load_time_ms: Math.round(loadTime),
      image_src: dataSrc || dataSrcset,
      image_width: imageElement.naturalWidth,
      image_height: imageElement.naturalHeight,
    });

    console.log(`[Hero] Image loaded successfully in ${Math.round(loadTime)}ms`);
  };

  const handleImageError = (error) => {
    clearTimeout(timeoutId);
    const loadTime = performance.now() - loadStartTime;

    imageElement.classList.add('error');
    imageElement.classList.remove('loading');

    logAnalyticsEvent(ANALYTICS_EVENTS.IMAGE_ERROR, {
      load_time_ms: Math.round(loadTime),
      image_src: dataSrc || dataSrcset,
      error_message: error?.message || 'Image load failed',
    });

    console.error('[Hero] Image load failed', error);
  };

  timeoutId = setTimeout(() => {
    handleImageError(new Error('Image load timeout'));
  }, HERO_CONFIG.IMAGE_LOAD_TIMEOUT);

  imageElement.addEventListener('load', handleImageLoad, { once: true });
  imageElement.addEventListener('error', handleImageError, { once: true });

  imageElement.classList.add('loading');

  if (dataSrcset) {
    imageElement.srcset = dataSrcset;
  }
  if (dataSrc) {
    imageElement.src = dataSrc;
  }

  console.log('[Hero] Started lazy loading image');
}

/**
 * Initialize lazy loading for hero images
 */
function initLazyLoading() {
  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    return;
  }

  const lazyImages = heroSection.querySelectorAll('img[data-src], img[data-srcset]');

  if (lazyImages.length === 0) {
    console.log('[Hero] No lazy-loadable images found');
    return;
  }

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target;
            lazyLoadHeroImage(image);
            observer.unobserve(image);
          }
        });
      },
      {
        rootMargin: `${HERO_CONFIG.LAZY_LOAD_THRESHOLD}px`,
        threshold: HERO_CONFIG.INTERSECTION_THRESHOLD,
      }
    );

    lazyImages.forEach((image) => {
      imageObserver.observe(image);
    });

    console.log(`[Hero] Initialized IntersectionObserver for ${lazyImages.length} image(s)`);
  } else {
    lazyImages.forEach((image) => {
      lazyLoadHeroImage(image);
    });

    console.log('[Hero] IntersectionObserver not supported, loading images immediately');
  }
}

/**
 * Trigger entrance animations for hero elements
 */
function triggerAnimations() {
  if (heroState.animationTriggered) {
    return;
  }

  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    return;
  }

  const animatedElements = heroSection.querySelectorAll('[data-animate], .hero-title, .hero-subtitle, .hero-cta');

  if (animatedElements.length === 0) {
    console.log('[Hero] No animated elements found');
    return;
  }

  heroState.animationTriggered = true;

  animatedElements.forEach((element, index) => {
    const delay = HERO_CONFIG.ANIMATION_DELAY + (index * HERO_CONFIG.ANIMATION_STAGGER);

    setTimeout(() => {
      element.classList.add('animate-in');
      
      if (index === animatedElements.length - 1) {
        logAnalyticsEvent(ANALYTICS_EVENTS.ANIMATION_COMPLETE, {
          element_count: animatedElements.length,
          total_duration_ms: delay,
        });
      }
    }, delay);
  });

  console.log(`[Hero] Triggered animations for ${animatedElements.length} element(s)`);
}

/**
 * Initialize animation triggers based on viewport visibility
 */
function initAnimationTriggers() {
  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    return;
  }

  if ('IntersectionObserver' in window) {
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !heroState.animationTriggered) {
            triggerAnimations();
          }
        });
      },
      {
        threshold: HERO_CONFIG.INTERSECTION_THRESHOLD,
      }
    );

    animationObserver.observe(heroSection);
    console.log('[Hero] Initialized animation observer');
  } else {
    setTimeout(triggerAnimations, HERO_CONFIG.ANIMATION_DELAY);
    console.log('[Hero] IntersectionObserver not supported, triggering animations immediately');
  }
}

/**
 * Track hero section viewport visibility
 */
function initSectionViewTracking() {
  const heroSection = document.querySelector('.hero-section');
  
  if (!heroSection) {
    return;
  }

  if ('IntersectionObserver' in window) {
    const viewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !heroState.sectionViewed) {
            heroState.sectionViewed = true;

            logAnalyticsEvent(ANALYTICS_EVENTS.SECTION_VIEWED, {
              viewport_width: window.innerWidth,
              viewport_height: window.innerHeight,
              intersection_ratio: entry.intersectionRatio,
            });

            console.log('[Hero] Section viewed by user');
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    viewObserver.observe(heroSection);
    console.log('[Hero] Initialized section view tracking');
  }
}

/**
 * Initialize all hero section functionality
 */
function initHero() {
  if (heroState.initialized) {
    console.warn('[Hero] Already initialized, skipping');
    return;
  }

  try {
    const heroSection = document.querySelector('.hero-section');

    if (!heroSection) {
      console.warn('[Hero] Hero section not found in DOM');
      return;
    }

    initCTATracking();
    initSmoothScroll();
    initLazyLoading();
    initAnimationTriggers();
    initSectionViewTracking();

    heroState.initialized = true;

    console.log('[Hero] Hero section initialized successfully');
  } catch (error) {
    console.error('[Hero] Initialization failed', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHero);
} else {
  initHero();
}