/**
 * HomeschoolHub Landing Page - SEO Utilities Module
 * 
 * Provides comprehensive SEO functionality including meta tag management,
 * structured data generation, Open Graph tags, and local business schema markup.
 * Implements dynamic meta tag updates with validation and sanitization.
 * 
 * @module seo
 * @version 1.0.0
 */

'use strict';

/**
 * SEO configuration and constants
 */
const SEO_CONFIG = Object.freeze({
  SITE_NAME: 'HomeschoolHub',
  SITE_URL: 'https://homeschoolhub.com',
  DEFAULT_IMAGE: '/images/og-default.jpg',
  DEFAULT_IMAGE_WIDTH: 1200,
  DEFAULT_IMAGE_HEIGHT: 630,
  TWITTER_HANDLE: '@homeschoolhub',
  ORGANIZATION_NAME: 'HomeschoolHub',
  ORGANIZATION_TYPE: 'EducationalOrganization',
  PHONE: '(555) 123-4567',
  EMAIL: 'info@homeschoolhub.com',
  ADDRESS: {
    streetAddress: '123 Education Lane',
    addressLocality: 'Springfield',
    addressRegion: 'IL',
    postalCode: '62701',
    addressCountry: 'US',
  },
  SOCIAL_PROFILES: [
    'https://facebook.com/homeschoolhub',
    'https://twitter.com/homeschoolhub',
    'https://instagram.com/homeschoolhub',
  ],
});

/**
 * Meta tag utilities for safe DOM manipulation
 */
const MetaTags = {
  /**
   * Get or create meta tag by name or property
   * @param {string} attribute - Attribute name ('name' or 'property')
   * @param {string} value - Attribute value
   * @returns {HTMLMetaElement} Meta element
   */
  getOrCreate(attribute, value) {
    try {
      const selector = `meta[${attribute}="${value}"]`;
      let meta = document.querySelector(selector);

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }

      return meta;
    } catch (error) {
      console.error(`[SEO] Failed to get/create meta tag: ${attribute}="${value}"`, error);
      return null;
    }
  },

  /**
   * Set meta tag content
   * @param {string} attribute - Attribute name ('name' or 'property')
   * @param {string} value - Attribute value
   * @param {string} content - Content to set
   */
  set(attribute, value, content) {
    if (!content || typeof content !== 'string') {
      console.warn(`[SEO] Invalid content for meta tag: ${attribute}="${value}"`);
      return;
    }

    const meta = this.getOrCreate(attribute, value);
    if (meta) {
      meta.setAttribute('content', this.sanitize(content));
    }
  },

  /**
   * Remove meta tag
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   */
  remove(attribute, value) {
    try {
      const selector = `meta[${attribute}="${value}"]`;
      const meta = document.querySelector(selector);
      if (meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    } catch (error) {
      console.error(`[SEO] Failed to remove meta tag: ${attribute}="${value}"`, error);
    }
  },

  /**
   * Sanitize content to prevent XSS
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   */
  sanitize(content) {
    const div = document.createElement('div');
    div.textContent = content;
    return div.innerHTML;
  },
};

/**
 * Update page title with proper formatting
 * @param {string} title - Page title
 * @param {boolean} [includeSiteName=true] - Include site name suffix
 */
function updateTitle(title, includeSiteName = true) {
  if (!title || typeof title !== 'string') {
    console.error('[SEO] Invalid title provided');
    return;
  }

  try {
    const sanitizedTitle = MetaTags.sanitize(title.trim());
    const fullTitle = includeSiteName 
      ? `${sanitizedTitle} | ${SEO_CONFIG.SITE_NAME}`
      : sanitizedTitle;

    document.title = fullTitle;
    console.log('[SEO] Title updated:', fullTitle);
  } catch (error) {
    console.error('[SEO] Failed to update title', error);
  }
}

/**
 * Update meta description
 * @param {string} description - Page description (max 160 characters recommended)
 */
function updateDescription(description) {
  if (!description || typeof description !== 'string') {
    console.error('[SEO] Invalid description provided');
    return;
  }

  try {
    const sanitized = MetaTags.sanitize(description.trim());
    const truncated = sanitized.length > 160 
      ? `${sanitized.substring(0, 157)}...`
      : sanitized;

    MetaTags.set('name', 'description', truncated);
    console.log('[SEO] Description updated');
  } catch (error) {
    console.error('[SEO] Failed to update description', error);
  }
}

/**
 * Update canonical URL
 * @param {string} url - Canonical URL
 */
function updateCanonical(url) {
  if (!url || typeof url !== 'string') {
    console.error('[SEO] Invalid canonical URL provided');
    return;
  }

  try {
    let link = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', url);
    console.log('[SEO] Canonical URL updated:', url);
  } catch (error) {
    console.error('[SEO] Failed to update canonical URL', error);
  }
}

/**
 * Update Open Graph meta tags
 * @param {Object} options - Open Graph options
 * @param {string} options.title - OG title
 * @param {string} options.description - OG description
 * @param {string} [options.image] - OG image URL
 * @param {string} [options.url] - OG URL
 * @param {string} [options.type='website'] - OG type
 */
function updateOpenGraph(options) {
  if (!options || typeof options !== 'object') {
    console.error('[SEO] Invalid Open Graph options provided');
    return;
  }

  try {
    const {
      title,
      description,
      image = SEO_CONFIG.DEFAULT_IMAGE,
      url = window.location.href,
      type = 'website',
    } = options;

    if (!title || !description) {
      console.error('[SEO] Title and description required for Open Graph');
      return;
    }

    MetaTags.set('property', 'og:title', title);
    MetaTags.set('property', 'og:description', description);
    MetaTags.set('property', 'og:image', image);
    MetaTags.set('property', 'og:url', url);
    MetaTags.set('property', 'og:type', type);
    MetaTags.set('property', 'og:site_name', SEO_CONFIG.SITE_NAME);
    MetaTags.set('property', 'og:image:width', String(SEO_CONFIG.DEFAULT_IMAGE_WIDTH));
    MetaTags.set('property', 'og:image:height', String(SEO_CONFIG.DEFAULT_IMAGE_HEIGHT));

    console.log('[SEO] Open Graph tags updated');
  } catch (error) {
    console.error('[SEO] Failed to update Open Graph tags', error);
  }
}

/**
 * Update Twitter Card meta tags
 * @param {Object} options - Twitter Card options
 * @param {string} options.title - Card title
 * @param {string} options.description - Card description
 * @param {string} [options.image] - Card image URL
 * @param {string} [options.card='summary_large_image'] - Card type
 */
function updateTwitterCard(options) {
  if (!options || typeof options !== 'object') {
    console.error('[SEO] Invalid Twitter Card options provided');
    return;
  }

  try {
    const {
      title,
      description,
      image = SEO_CONFIG.DEFAULT_IMAGE,
      card = 'summary_large_image',
    } = options;

    if (!title || !description) {
      console.error('[SEO] Title and description required for Twitter Card');
      return;
    }

    MetaTags.set('name', 'twitter:card', card);
    MetaTags.set('name', 'twitter:site', SEO_CONFIG.TWITTER_HANDLE);
    MetaTags.set('name', 'twitter:title', title);
    MetaTags.set('name', 'twitter:description', description);
    MetaTags.set('name', 'twitter:image', image);

    console.log('[SEO] Twitter Card tags updated');
  } catch (error) {
    console.error('[SEO] Failed to update Twitter Card tags', error);
  }
}

/**
 * Generate Organization structured data
 * @returns {Object} Organization schema
 */
function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': SEO_CONFIG.ORGANIZATION_TYPE,
    name: SEO_CONFIG.ORGANIZATION_NAME,
    url: SEO_CONFIG.SITE_URL,
    logo: `${SEO_CONFIG.SITE_URL}/images/logo.png`,
    description: 'Comprehensive homeschool curriculum and resources for families seeking quality education at home',
    telephone: SEO_CONFIG.PHONE,
    email: SEO_CONFIG.EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEO_CONFIG.ADDRESS.streetAddress,
      addressLocality: SEO_CONFIG.ADDRESS.addressLocality,
      addressRegion: SEO_CONFIG.ADDRESS.addressRegion,
      postalCode: SEO_CONFIG.ADDRESS.postalCode,
      addressCountry: SEO_CONFIG.ADDRESS.addressCountry,
    },
    sameAs: SEO_CONFIG.SOCIAL_PROFILES,
  };
}

/**
 * Generate LocalBusiness structured data
 * @param {Object} [options] - Additional business options
 * @returns {Object} LocalBusiness schema
 */
function generateLocalBusinessSchema(options = {}) {
  const baseSchema = generateOrganizationSchema();
  
  return {
    ...baseSchema,
    '@type': 'LocalBusiness',
    priceRange: options.priceRange || '$$',
    openingHoursSpecification: options.hours || [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    geo: options.geo || {
      '@type': 'GeoCoordinates',
      latitude: '39.7817',
      longitude: '-89.6501',
    },
  };
}

/**
 * Generate EducationalOrganization structured data
 * @param {Object} [options] - Additional educational options
 * @returns {Object} EducationalOrganization schema
 */
function generateEducationalOrganizationSchema(options = {}) {
  const baseSchema = generateOrganizationSchema();
  
  return {
    ...baseSchema,
    '@type': 'EducationalOrganization',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Homeschool Curriculum',
      itemListElement: options.courses || [],
    },
    alumni: options.alumni || [],
  };
}

/**
 * Generate Course structured data
 * @param {Object} course - Course information
 * @param {string} course.name - Course name
 * @param {string} course.description - Course description
 * @param {string} course.provider - Provider name
 * @returns {Object} Course schema
 */
function generateCourseSchema(course) {
  if (!course || !course.name || !course.description) {
    console.error('[SEO] Invalid course data for schema generation');
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: course.provider || SEO_CONFIG.ORGANIZATION_NAME,
      sameAs: SEO_CONFIG.SITE_URL,
    },
  };
}

/**
 * Inject structured data into page
 * @param {Object|Object[]} schema - Schema object or array of schemas
 * @param {string} [id='structured-data'] - Script element ID
 */
function injectStructuredData(schema, id = 'structured-data') {
  if (!schema) {
    console.error('[SEO] No schema provided for injection');
    return;
  }

  try {
    let script = document.getElementById(id);
    
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const schemaData = Array.isArray(schema) ? schema : [schema];
    script.textContent = JSON.stringify(schemaData, null, 2);

    console.log('[SEO] Structured data injected:', id);
  } catch (error) {
    console.error('[SEO] Failed to inject structured data', error);
  }
}

/**
 * Generate SEO-friendly URL slug
 * @param {string} text - Text to convert to slug
 * @returns {string} URL slug
 */
function generateSlug(text) {
  if (!text || typeof text !== 'string') {
    console.error('[SEO] Invalid text for slug generation');
    return '';
  }

  try {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  } catch (error) {
    console.error('[SEO] Failed to generate slug', error);
    return '';
  }
}

/**
 * Update all SEO meta tags for a page
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} [options.image] - Page image
 * @param {string} [options.url] - Page URL
 * @param {string} [options.type] - Page type
 * @param {Object} [options.schema] - Structured data schema
 */
function updatePageSEO(options) {
  if (!options || !options.title || !options.description) {
    console.error('[SEO] Title and description required for page SEO update');
    return;
  }

  try {
    updateTitle(options.title);
    updateDescription(options.description);
    
    if (options.url) {
      updateCanonical(options.url);
    }

    updateOpenGraph({
      title: options.title,
      description: options.description,
      image: options.image,
      url: options.url,
      type: options.type,
    });

    updateTwitterCard({
      title: options.title,
      description: options.description,
      image: options.image,
    });

    if (options.schema) {
      injectStructuredData(options.schema);
    }

    console.log('[SEO] Page SEO updated successfully');
  } catch (error) {
    console.error('[SEO] Failed to update page SEO', error);
  }
}

/**
 * Initialize default SEO for the site
 */
function initializeDefaultSEO() {
  try {
    const organizationSchema = generateOrganizationSchema();
    const educationalSchema = generateEducationalOrganizationSchema();

    injectStructuredData([organizationSchema, educationalSchema], 'default-structured-data');

    MetaTags.set('name', 'viewport', 'width=device-width, initial-scale=1.0');
    MetaTags.set('name', 'robots', 'index, follow');
    MetaTags.set('name', 'googlebot', 'index, follow');

    console.log('[SEO] Default SEO initialized');
  } catch (error) {
    console.error('[SEO] Failed to initialize default SEO', error);
  }
}

if (typeof window !== 'undefined') {
  window.SEO = {
    updateTitle,
    updateDescription,
    updateCanonical,
    updateOpenGraph,
    updateTwitterCard,
    updatePageSEO,
    generateOrganizationSchema,
    generateLocalBusinessSchema,
    generateEducationalOrganizationSchema,
    generateCourseSchema,
    injectStructuredData,
    generateSlug,
    initializeDefaultSEO,
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDefaultSEO);
} else {
  initializeDefaultSEO();
}