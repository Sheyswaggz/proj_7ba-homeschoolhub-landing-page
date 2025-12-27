/**
 * HomeschoolHub Landing Page - Performance Optimization Module
 * 
 * Implements comprehensive performance optimization utilities including:
 * - Intersection Observer-based lazy loading for images and iframes
 * - Critical CSS loading and resource prioritization
 * - Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
 * - Resource preloading and prefetching utilities
 * - Performance monitoring and reporting
 * 
 * @module performance
 * @version 1.0.0
 */

'use strict';

/**
 * Performance configuration constants
 */
const PERFORMANCE_CONFIG = Object.freeze({
  LAZY_LOAD_ROOT_MARGIN: '50px',
  LAZY_LOAD_THRESHOLD: 0.01,
  CRITICAL_CSS_TIMEOUT: 3000,
  PRELOAD_DELAY: 100,
  METRICS_BUFFER_SIZE: 100,
  VITALS_REPORT_INTERVAL: 30000,
  IMAGE_QUALITY_THRESHOLD: 0.8,
  OBSERVER_DISCONNECT_DELAY: 100,
});

/**
 * Performance metrics storage
 */
const performanceMetrics = {
  lazyLoadedImages: 0,
  lazyLoadedIframes: 0,
  preloadedResources: 0,
  criticalCSSLoaded: false,
  vitals: {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  },
  customMetrics: new Map(),
};

/**
 * Lazy loading implementation using Intersection Observer
 */
const LazyLoader = {
  /**
   * Observer instance for lazy loading
   * @type {IntersectionObserver|null}
   */
  observer: null,

  /**
   * Set of elements being observed
   * @type {Set<Element>}
   */
  observedElements: new Set(),

  /**
   * Initialize lazy loading observer
   * @returns {IntersectionObserver|null} Observer instance or null if not supported
   */
  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('[Performance] IntersectionObserver not supported, falling back to immediate loading');
      this.loadAllImagesImmediately();
      return null;
    }

    try {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          rootMargin: PERFORMANCE_CONFIG.LAZY_LOAD_ROOT_MARGIN,
          threshold: PERFORMANCE_CONFIG.LAZY_LOAD_THRESHOLD,
        }
      );

      this.observeImages();
      this.observeIframes();

      console.log('[Performance] Lazy loading initialized', {
        imageCount: document.querySelectorAll('img[data-src], img[data-srcset]').length,
        iframeCount: document.querySelectorAll('iframe[data-src]').length,
      });

      return this.observer;
    } catch (error) {
      console.error('[Performance] Failed to initialize lazy loading', error);
      this.loadAllImagesImmediately();
      return null;
    }
  },

  /**
   * Handle intersection observer entries
   * @param {IntersectionObserverEntry[]} entries - Intersection entries
   */
  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        if (element.tagName === 'IMG') {
          this.loadImage(element);
        } else if (element.tagName === 'IFRAME') {
          this.loadIframe(element);
        }

        this.observer.unobserve(element);
        this.observedElements.delete(element);
      }
    });
  },

  /**
   * Observe all images with data-src or data-srcset attributes
   */
  observeImages() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    
    images.forEach((img) => {
      if (this.observer && !this.observedElements.has(img)) {
        this.observer.observe(img);
        this.observedElements.add(img);
      }
    });
  },

  /**
   * Observe all iframes with data-src attribute
   */
  observeIframes() {
    const iframes = document.querySelectorAll('iframe[data-src]');
    
    iframes.forEach((iframe) => {
      if (this.observer && !this.observedElements.has(iframe)) {
        this.observer.observe(iframe);
        this.observedElements.add(iframe);
      }
    });
  },

  /**
   * Load image with proper error handling
   * @param {HTMLImageElement} img - Image element to load
   */
  loadImage(img) {
    const dataSrc = img.getAttribute('data-src');
    const dataSrcset = img.getAttribute('data-srcset');

    if (!dataSrc && !dataSrcset) {
      console.warn('[Performance] Image has no data-src or data-srcset', img);
      return;
    }

    const handleLoad = () => {
      img.classList.add('loaded');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
      performanceMetrics.lazyLoadedImages++;
      
      console.log('[Performance] Image loaded successfully', {
        src: img.src,
        totalLoaded: performanceMetrics.lazyLoadedImages,
      });
    };

    const handleError = (error) => {
      img.classList.add('error');
      console.error('[Performance] Image failed to load', {
        src: dataSrc || dataSrcset,
        error,
      });
    };

    img.addEventListener('load', handleLoad, { once: true });
    img.addEventListener('error', handleError, { once: true });

    if (dataSrcset) {
      img.srcset = dataSrcset;
    }
    
    if (dataSrc) {
      img.src = dataSrc;
    }
  },

  /**
   * Load iframe with proper error handling
   * @param {HTMLIFrameElement} iframe - Iframe element to load
   */
  loadIframe(iframe) {
    const dataSrc = iframe.getAttribute('data-src');

    if (!dataSrc) {
      console.warn('[Performance] Iframe has no data-src', iframe);
      return;
    }

    const handleLoad = () => {
      iframe.classList.add('loaded');
      iframe.removeAttribute('data-src');
      performanceMetrics.lazyLoadedIframes++;
      
      console.log('[Performance] Iframe loaded successfully', {
        src: iframe.src,
        totalLoaded: performanceMetrics.lazyLoadedIframes,
      });
    };

    const handleError = (error) => {
      iframe.classList.add('error');
      console.error('[Performance] Iframe failed to load', {
        src: dataSrc,
        error,
      });
    };

    iframe.addEventListener('load', handleLoad, { once: true });
    iframe.addEventListener('error', handleError, { once: true });

    iframe.src = dataSrc;
  },

  /**
   * Fallback: Load all images immediately if IntersectionObserver not supported
   */
  loadAllImagesImmediately() {
    const images = document.querySelectorAll('img[data-src], img[data-srcset]');
    const iframes = document.querySelectorAll('iframe[data-src]');

    images.forEach((img) => this.loadImage(img));
    iframes.forEach((iframe) => this.loadIframe(iframe));

    console.log('[Performance] Loaded all images immediately (fallback mode)');
  },

  /**
   * Disconnect observer and clean up
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedElements.clear();
    console.log('[Performance] Lazy loader destroyed');
  },
};

/**
 * Critical CSS loading utilities
 */
const CriticalCSS = {
  /**
   * Load critical CSS inline for above-the-fold content
   * @param {string} cssText - Critical CSS text
   */
  loadInline(cssText) {
    if (!cssText || typeof cssText !== 'string') {
      console.warn('[Performance] Invalid critical CSS text provided');
      return;
    }

    try {
      const style = document.createElement('style');
      style.textContent = cssText;
      style.setAttribute('data-critical', 'true');
      
      const firstLink = document.querySelector('link[rel="stylesheet"]');
      if (firstLink && firstLink.parentNode) {
        firstLink.parentNode.insertBefore(style, firstLink);
      } else {
        document.head.appendChild(style);
      }

      performanceMetrics.criticalCSSLoaded = true;
      console.log('[Performance] Critical CSS loaded inline', {
        size: cssText.length,
      });
    } catch (error) {
      console.error('[Performance] Failed to load critical CSS', error);
    }
  },

  /**
   * Load non-critical CSS asynchronously
   * @param {string} href - CSS file URL
   * @param {string} [media='all'] - Media query
   */
  loadAsync(href, media = 'all') {
    if (!href) {
      console.warn('[Performance] No href provided for async CSS');
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = 'print';
      link.onload = function() {
        this.media = media;
        console.log('[Performance] Non-critical CSS loaded', { href });
      };
      link.onerror = function(error) {
        console.error('[Performance] Failed to load non-critical CSS', { href, error });
      };

      document.head.appendChild(link);

      setTimeout(() => {
        if (link.media === 'print') {
          link.media = media;
        }
      }, PERFORMANCE_CONFIG.CRITICAL_CSS_TIMEOUT);
    } catch (error) {
      console.error('[Performance] Failed to create async CSS link', error);
    }
  },
};

/**
 * Resource preloading utilities
 */
const ResourcePreloader = {
  /**
   * Preload critical resources
   * @param {Array<{href: string, as: string, type?: string}>} resources - Resources to preload
   */
  preload(resources) {
    if (!Array.isArray(resources) || resources.length === 0) {
      console.warn('[Performance] No resources provided for preloading');
      return;
    }

    resources.forEach((resource, index) => {
      setTimeout(() => {
        this.preloadResource(resource);
      }, index * PERFORMANCE_CONFIG.PRELOAD_DELAY);
    });
  },

  /**
   * Preload single resource
   * @param {{href: string, as: string, type?: string, crossorigin?: string}} resource - Resource to preload
   */
  preloadResource(resource) {
    if (!resource.href || !resource.as) {
      console.warn('[Performance] Invalid resource for preloading', resource);
      return;
    }

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;

      if (resource.type) {
        link.type = resource.type;
      }

      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }

      link.onload = () => {
        performanceMetrics.preloadedResources++;
        console.log('[Performance] Resource preloaded', {
          href: resource.href,
          as: resource.as,
          total: performanceMetrics.preloadedResources,
        });
      };

      link.onerror = (error) => {
        console.error('[Performance] Failed to preload resource', {
          href: resource.href,
          error,
        });
      };

      document.head.appendChild(link);
    } catch (error) {
      console.error('[Performance] Failed to create preload link', error);
    }
  },

  /**
   * Prefetch resources for future navigation
   * @param {string[]} urls - URLs to prefetch
   */
  prefetch(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
      console.warn('[Performance] No URLs provided for prefetching');
      return;
    }

    urls.forEach((url) => {
      try {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
        
        console.log('[Performance] Resource prefetched', { url });
      } catch (error) {
        console.error('[Performance] Failed to prefetch resource', { url, error });
      }
    });
  },

  /**
   * DNS prefetch for external domains
   * @param {string[]} domains - Domains to prefetch
   */
  dnsPrefetch(domains) {
    if (!Array.isArray(domains) || domains.length === 0) {
      console.warn('[Performance] No domains provided for DNS prefetch');
      return;
    }

    domains.forEach((domain) => {
      try {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
        
        console.log('[Performance] DNS prefetched', { domain });
      } catch (error) {
        console.error('[Performance] Failed to DNS prefetch', { domain, error });
      }
    });
  },
};

/**
 * Web Vitals tracking implementation
 */
const WebVitals = {
  /**
   * Track Largest Contentful Paint (LCP)
   */
  trackLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        performanceMetrics.vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        
        console.log('[Performance] LCP measured', {
          value: performanceMetrics.vitals.lcp,
          element: lastEntry.element,
        });
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.error('[Performance] Failed to track LCP', error);
    }
  },

  /**
   * Track First Input Delay (FID)
   */
  trackFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          performanceMetrics.vitals.fid = entry.processingStart - entry.startTime;
          
          console.log('[Performance] FID measured', {
            value: performanceMetrics.vitals.fid,
            name: entry.name,
          });
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.error('[Performance] Failed to track FID', error);
    }
  },

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  trackCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMetrics.vitals.cls = clsValue;
          }
        });

        console.log('[Performance] CLS measured', {
          value: performanceMetrics.vitals.cls,
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.error('[Performance] Failed to track CLS', error);
    }
  },

  /**
   * Track First Contentful Paint (FCP)
   */
  trackFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            performanceMetrics.vitals.fcp = entry.startTime;
            
            console.log('[Performance] FCP measured', {
              value: performanceMetrics.vitals.fcp,
            });
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.error('[Performance] Failed to track FCP', error);
    }
  },

  /**
   * Track Time to First Byte (TTFB)
   */
  trackTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      
      if (navigationEntry) {
        performanceMetrics.vitals.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        
        console.log('[Performance] TTFB measured', {
          value: performanceMetrics.vitals.ttfb,
        });
      }
    } catch (error) {
      console.error('[Performance] Failed to track TTFB', error);
    }
  },

  /**
   * Initialize all Web Vitals tracking
   */
  init() {
    if (!('PerformanceObserver' in window)) {
      console.warn('[Performance] PerformanceObserver not supported, Web Vitals tracking disabled');
      return;
    }

    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackFCP();
    this.trackTTFB();

    console.log('[Performance] Web Vitals tracking initialized');
  },

  /**
   * Get current Web Vitals metrics
   * @returns {Object} Current vitals metrics
   */
  getMetrics() {
    return { ...performanceMetrics.vitals };
  },
};

/**
 * Performance monitoring utilities
 */
const PerformanceMonitor = {
  /**
   * Mark performance timing point
   * @param {string} name - Mark name
   */
  mark(name) {
    if (!name) {
      console.warn('[Performance] Mark name required');
      return;
    }

    try {
      performance.mark(name);
      console.log('[Performance] Mark created', { name });
    } catch (error) {
      console.error('[Performance] Failed to create mark', { name, error });
    }
  },

  /**
   * Measure performance between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number|null} Duration in milliseconds
   */
  measure(name, startMark, endMark) {
    if (!name || !startMark || !endMark) {
      console.warn('[Performance] Measure requires name, startMark, and endMark');
      return null;
    }

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      
      if (measure) {
        performanceMetrics.customMetrics.set(name, measure.duration);
        
        console.log('[Performance] Measure created', {
          name,
          duration: measure.duration,
        });
        
        return measure.duration;
      }
    } catch (error) {
      console.error('[Performance] Failed to create measure', { name, error });
    }

    return null;
  },

  /**
   * Get all performance metrics
   * @returns {Object} All performance metrics
   */
  getAllMetrics() {
    return {
      ...performanceMetrics,
      customMetrics: Object.fromEntries(performanceMetrics.customMetrics),
    };
  },

  /**
   * Log performance report
   */
  logReport() {
    const metrics = this.getAllMetrics();
    
    console.log('[Performance] Performance Report', {
      lazyLoading: {
        images: metrics.lazyLoadedImages,
        iframes: metrics.lazyLoadedIframes,
      },
      resources: {
        preloaded: metrics.preloadedResources,
        criticalCSS: metrics.criticalCSSLoaded,
      },
      webVitals: metrics.vitals,
      customMetrics: metrics.customMetrics,
    });
  },
};

/**
 * Initialize all performance optimizations
 */
function initPerformance() {
  try {
    console.log('[Performance] Initializing performance optimizations');

    LazyLoader.init();
    WebVitals.init();

    setInterval(() => {
      PerformanceMonitor.logReport();
    }, PERFORMANCE_CONFIG.VITALS_REPORT_INTERVAL);

    console.log('[Performance] Performance optimizations initialized successfully');
  } catch (error) {
    console.error('[Performance] Failed to initialize performance optimizations', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPerformance);
} else {
  initPerformance();
}

if (typeof window !== 'undefined') {
  window.LazyLoader = LazyLoader;
  window.CriticalCSS = CriticalCSS;
  window.ResourcePreloader = ResourcePreloader;
  window.WebVitals = WebVitals;
  window.PerformanceMonitor = PerformanceMonitor;
}