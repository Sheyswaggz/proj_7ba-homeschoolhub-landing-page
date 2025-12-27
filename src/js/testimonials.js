/**
 * HomeschoolHub Landing Page - Testimonials Carousel Module
 * 
 * Implements an accessible, touch-enabled testimonials carousel with auto-play,
 * keyboard navigation, and responsive behavior. Follows progressive enhancement
 * principles with graceful degradation for older browsers.
 * 
 * @module testimonials
 * @version 1.0.0
 */

'use strict';

/**
 * Carousel configuration and state
 */
const CAROUSEL_CONFIG = Object.freeze({
  AUTO_PLAY_INTERVAL: 5000,
  TRANSITION_DURATION: 500,
  SWIPE_THRESHOLD: 50,
  TOUCH_ANGLE_THRESHOLD: 30,
  PRELOAD_ADJACENT: true,
  PAUSE_ON_HOVER: true,
  PAUSE_ON_FOCUS: true,
});

/**
 * Testimonials Carousel Class
 * Manages carousel state, navigation, and interactions
 */
class TestimonialsCarousel {
  /**
   * Initialize carousel with DOM element
   * @param {Element} container - Carousel container element
   */
  constructor(container) {
    if (!container) {
      throw new Error('[Testimonials] Carousel container is required');
    }

    this.container = container;
    this.track = container.querySelector('[data-carousel-track]');
    this.slides = Array.from(container.querySelectorAll('[data-carousel-slide]'));
    this.prevButton = container.querySelector('[data-carousel-prev]');
    this.nextButton = container.querySelector('[data-carousel-next]');
    this.indicators = Array.from(container.querySelectorAll('[data-carousel-indicator]'));

    if (!this.track || this.slides.length === 0) {
      console.warn('[Testimonials] Carousel track or slides not found');
      return;
    }

    this.currentIndex = 0;
    this.isTransitioning = false;
    this.autoPlayTimer = null;
    this.isPaused = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.init();
  }

  /**
   * Initialize carousel functionality
   */
  init() {
    try {
      this.setupAccessibility();
      this.attachEventListeners();
      this.updateCarousel(0, false);
      this.startAutoPlay();

      console.log('[Testimonials] Carousel initialized successfully', {
        slideCount: this.slides.length,
        autoPlay: true,
      });
    } catch (error) {
      console.error('[Testimonials] Carousel initialization failed', error);
    }
  }

  /**
   * Setup ARIA attributes for accessibility
   */
  setupAccessibility() {
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-roledescription', 'carousel');
    this.container.setAttribute('aria-label', 'Family testimonials');

    this.track.setAttribute('role', 'list');

    this.slides.forEach((slide, index) => {
      slide.setAttribute('role', 'listitem');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `Testimonial ${index + 1} of ${this.slides.length}`);
      slide.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false');
      slide.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    if (this.prevButton) {
      this.prevButton.setAttribute('aria-label', 'Previous testimonial');
      this.prevButton.setAttribute('aria-controls', this.track.id || 'carousel-track');
    }

    if (this.nextButton) {
      this.nextButton.setAttribute('aria-label', 'Next testimonial');
      this.nextButton.setAttribute('aria-controls', this.track.id || 'carousel-track');
    }

    this.indicators.forEach((indicator, index) => {
      indicator.setAttribute('role', 'button');
      indicator.setAttribute('aria-label', `Go to testimonial ${index + 1}`);
      indicator.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    });
  }

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.navigate('prev'));
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.navigate('next'));
    }

    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    this.container.addEventListener('keydown', (e) => this.handleKeyboard(e));

    this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

    if (CAROUSEL_CONFIG.PAUSE_ON_HOVER) {
      this.container.addEventListener('mouseenter', () => this.pause());
      this.container.addEventListener('mouseleave', () => this.resume());
    }

    if (CAROUSEL_CONFIG.PAUSE_ON_FOCUS) {
      this.container.addEventListener('focusin', () => this.pause());
      this.container.addEventListener('focusout', () => this.resume());
    }

    window.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
  }

  /**
   * Navigate to previous or next slide
   * @param {string} direction - 'prev' or 'next'
   */
  navigate(direction) {
    if (this.isTransitioning) {
      return;
    }

    const newIndex = direction === 'prev'
      ? (this.currentIndex - 1 + this.slides.length) % this.slides.length
      : (this.currentIndex + 1) % this.slides.length;

    this.goToSlide(newIndex);
  }

  /**
   * Go to specific slide by index
   * @param {number} index - Target slide index
   */
  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex || index < 0 || index >= this.slides.length) {
      return;
    }

    this.updateCarousel(index, true);
    this.resetAutoPlay();
  }

  /**
   * Update carousel to show target slide
   * @param {number} index - Target slide index
   * @param {boolean} animate - Whether to animate transition
   */
  updateCarousel(index, animate = true) {
    if (animate) {
      this.isTransitioning = true;
    }

    const previousIndex = this.currentIndex;
    this.currentIndex = index;

    this.slides.forEach((slide, i) => {
      const isActive = i === index;
      const isPrevious = i === previousIndex;

      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      slide.setAttribute('tabindex', isActive ? '0' : '-1');

      if (isActive) {
        slide.classList.add('active');
        slide.classList.remove('previous', 'next');
      } else if (isPrevious) {
        slide.classList.remove('active');
        slide.classList.add('previous');
      } else {
        slide.classList.remove('active', 'previous');
      }
    });

    this.indicators.forEach((indicator, i) => {
      const isActive = i === index;
      indicator.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      
      if (isActive) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });

    this.updateButtonStates();

    if (CAROUSEL_CONFIG.PRELOAD_ADJACENT) {
      this.preloadAdjacentImages(index);
    }

    if (animate) {
      setTimeout(() => {
        this.isTransitioning = false;
        this.announceSlideChange(index);
      }, CAROUSEL_CONFIG.TRANSITION_DURATION);
    }
  }

  /**
   * Update navigation button states
   */
  updateButtonStates() {
    if (this.prevButton) {
      this.prevButton.disabled = false;
    }

    if (this.nextButton) {
      this.nextButton.disabled = false;
    }
  }

  /**
   * Preload images in adjacent slides
   * @param {number} currentIndex - Current slide index
   */
  preloadAdjacentImages(currentIndex) {
    const prevIndex = (currentIndex - 1 + this.slides.length) % this.slides.length;
    const nextIndex = (currentIndex + 1) % this.slides.length;

    [prevIndex, nextIndex].forEach((index) => {
      const slide = this.slides[index];
      const images = slide.querySelectorAll('img[data-src]');

      images.forEach((img) => {
        if (!img.src && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
    });
  }

  /**
   * Announce slide change to screen readers
   * @param {number} index - Current slide index
   */
  announceSlideChange(index) {
    const liveRegion = this.container.querySelector('[aria-live]');
    
    if (liveRegion) {
      liveRegion.textContent = `Showing testimonial ${index + 1} of ${this.slides.length}`;
    }
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboard(e) {
    const key = e.key;

    switch (key) {
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        this.navigate('prev');
        break;
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        this.navigate('next');
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.slides.length - 1);
        break;
      default:
        break;
    }
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (e.touches.length !== 1) {
      return;
    }

    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.pause();
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (e.touches.length !== 1) {
      return;
    }

    this.touchEndX = e.touches[0].clientX;
    this.touchEndY = e.touches[0].clientY;
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} _e - Touch event
   */
  handleTouchEnd(_e) {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;

    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    const isHorizontalSwipe = angle < CAROUSEL_CONFIG.TOUCH_ANGLE_THRESHOLD || 
                              angle > (180 - CAROUSEL_CONFIG.TOUCH_ANGLE_THRESHOLD);

    if (isHorizontalSwipe && Math.abs(deltaX) > CAROUSEL_CONFIG.SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        this.navigate('prev');
      } else {
        this.navigate('next');
      }
    }

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;

    this.resume();
  }

  /**
   * Start auto-play functionality
   */
  startAutoPlay() {
    if (this.autoPlayTimer) {
      return;
    }

    this.autoPlayTimer = setInterval(() => {
      if (!this.isPaused && !this.isTransitioning) {
        this.navigate('next');
      }
    }, CAROUSEL_CONFIG.AUTO_PLAY_INTERVAL);

    console.log('[Testimonials] Auto-play started');
  }

  /**
   * Stop auto-play functionality
   */
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
      console.log('[Testimonials] Auto-play stopped');
    }
  }

  /**
   * Reset auto-play timer
   */
  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  /**
   * Pause carousel
   */
  pause() {
    this.isPaused = true;
    console.log('[Testimonials] Carousel paused');
  }

  /**
   * Resume carousel
   */
  resume() {
    this.isPaused = false;
    console.log('[Testimonials] Carousel resumed');
  }

  /**
   * Handle visibility change (tab switching)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.updateCarousel(this.currentIndex, false);
  }

  /**
   * Debounce utility function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Destroy carousel and cleanup
   */
  destroy() {
    this.stopAutoPlay();
    
    this.slides.forEach((slide) => {
      slide.removeAttribute('aria-hidden');
      slide.removeAttribute('tabindex');
      slide.classList.remove('active', 'previous', 'next');
    });

    console.log('[Testimonials] Carousel destroyed');
  }
}

/**
 * Initialize testimonials carousel
 */
function initTestimonialsCarousel() {
  try {
    const carouselContainer = document.querySelector('[data-testimonials-carousel]');

    if (!carouselContainer) {
      console.warn('[Testimonials] Carousel container not found in DOM');
      return null;
    }

    const carousel = new TestimonialsCarousel(carouselContainer);

    console.log('[Testimonials] Carousel module initialized successfully');

    return carousel;
  } catch (error) {
    console.error('[Testimonials] Carousel initialization failed', error);
    return null;
  }
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonialsCarousel);
} else {
  initTestimonialsCarousel();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestimonialsCarousel, initTestimonialsCarousel };
}