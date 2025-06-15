// Enhanced Google Analytics Tracking
// Author: Ömer Kaan Gürbüz
// Last Updated: 2025

// Enhanced tracking configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Enhanced configuration with detailed settings
gtag('config', 'G-700BFM0B8S', {
    // Enhanced measurement
    enhanced_measurement: {
        scrolls: true,
        outbound_clicks: true,
        site_search: true,
        video_engagement: true,
        file_downloads: true
    },
    // Page view settings
    send_page_view: true,
    // Custom parameters
    custom_map: {
        'custom_parameter_1': 'page_section',
        'custom_parameter_2': 'content_type',
        'custom_parameter_3': 'user_engagement_level'
    }
});

// 1. Scroll Depth Tracking
let scrollDepthTracked = {};
function trackScrollDepth() {
    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    
    // Track at 25%, 50%, 75%, 90% milestones
    [25, 50, 75, 90].forEach(milestone => {
        if (scrollPercent >= milestone && !scrollDepthTracked[milestone]) {
            gtag('event', 'scroll_depth', {
                event_category: 'engagement',
                event_label: `${milestone}%`,
                value: milestone,
                page_title: document.title,
                page_location: window.location.href
            });
            scrollDepthTracked[milestone] = true;
        }
    });
}

// 2. Time on Page Tracking
let timeOnPageStart = Date.now();
let timeIntervals = [30, 60, 120, 300, 600]; // 30s, 1m, 2m, 5m, 10m
let timeTracked = {};

function trackTimeOnPage() {
    const timeSpent = Math.floor((Date.now() - timeOnPageStart) / 1000);
    
    timeIntervals.forEach(interval => {
        if (timeSpent >= interval && !timeTracked[interval]) {
            gtag('event', 'time_on_page', {
                event_category: 'engagement',
                event_label: `${interval}s`,
                value: timeSpent,
                page_title: document.title,
                page_section: getPageSection()
            });
            timeTracked[interval] = true;
        }
    });
}

// 3. Project/Blog Post Engagement
function trackContentEngagement(contentType, action, details = {}) {
    gtag('event', 'content_engagement', {
        event_category: 'content',
        event_label: `${contentType}_${action}`,
        content_type: contentType,
        action: action,
        page_title: document.title,
        ...details
    });
}

// 4. External Link Tracking
function trackExternalLinks() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Track external links
        if (href.startsWith('http') && !href.includes('okg21.github.io')) {
            gtag('event', 'click', {
                event_category: 'outbound_link',
                event_label: href,
                link_domain: new URL(href).hostname,
                link_url: href,
                page_section: getPageSection()
            });
        }
        
        // Track specific link types
        if (href.includes('github.com')) {
            gtag('event', 'github_click', {
                event_category: 'social',
                event_label: 'github_profile_click',
                link_url: href
            });
        } else if (href.includes('linkedin.com')) {
            gtag('event', 'linkedin_click', {
                event_category: 'social',
                event_label: 'linkedin_profile_click',
                link_url: href
            });
        } else if (href.includes('mailto:')) {
            gtag('event', 'email_click', {
                event_category: 'contact',
                event_label: 'email_contact',
                contact_method: 'email'
            });
        }
        
        // Track project links
        if (href.includes('marketplace.visualstudio.com')) {
            gtag('event', 'project_link', {
                event_category: 'project',
                event_label: 'vscode_marketplace',
                project_name: 'bigquery_explorer'
            });
        }
    });
}

// 5. Theme Toggle Tracking
function trackThemeToggle(theme) {
    gtag('event', 'theme_toggle', {
        event_category: 'ui_interaction',
        event_label: `switch_to_${theme}`,
        theme: theme,
        page_section: getPageSection()
    });
}

// 6. Navigation Tracking
function trackNavigation() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http')) return;
        
        // Track internal navigation
        if (['/', '/projects/', '/research/', '/blog/'].includes(href)) {
            gtag('event', 'navigation', {
                event_category: 'site_navigation',
                event_label: href.replace('/', '') || 'home',
                navigation_type: 'main_menu',
                from_page: getPageSection()
            });
        }
    });
}

// 7. Code Block Interaction Tracking
function trackCodeBlocks() {
    // Track code block interactions (if Prism.js is loaded)
    document.addEventListener('click', function(e) {
        if (e.target.closest('pre[class*="language-"]')) {
            gtag('event', 'code_interaction', {
                event_category: 'content',
                event_label: 'code_block_click',
                code_language: e.target.closest('pre').className.match(/language-(\w+)/)?.[1] || 'unknown',
                page_section: getPageSection()
            });
        }
    });
}

// 8. Page Performance Tracking
function trackPagePerformance() {
    window.addEventListener('load', function() {
        // Track page load time
        const loadTime = Date.now() - timeOnPageStart;
        
        gtag('event', 'page_load_time', {
            event_category: 'performance',
            event_label: getPageSection(),
            value: Math.round(loadTime),
            load_time_ms: loadTime
        });
        
        // Track web vitals if available
        if ('web-vitals' in window) {
            getCLS(metric => trackWebVital('CLS', metric));
            getFID(metric => trackWebVital('FID', metric));
            getFCP(metric => trackWebVital('FCP', metric));
            getLCP(metric => trackWebVital('LCP', metric));
            getTTFB(metric => trackWebVital('TTFB', metric));
        }
    });
}

function trackWebVital(name, metric) {
    gtag('event', 'web_vital', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(metric.value),
        metric_name: name,
        metric_value: metric.value,
        page_section: getPageSection()
    });
}

// 9. User Engagement Score
function calculateEngagementScore() {
    const timeSpent = Math.floor((Date.now() - timeOnPageStart) / 1000);
    const scrollDepth = Math.max(...Object.keys(scrollDepthTracked).map(Number)) || 0;
    const interactions = document.querySelectorAll('a:hover, button:hover').length;
    
    let score = 0;
    if (timeSpent > 30) score += 1;
    if (timeSpent > 120) score += 1;
    if (scrollDepth > 50) score += 1;
    if (scrollDepth > 75) score += 1;
    if (interactions > 0) score += 1;
    
    return score;
}

// 10. Session Summary (on page unload)
function trackSessionSummary() {
    window.addEventListener('beforeunload', function() {
        const sessionData = {
            event_category: 'session',
            event_label: 'session_summary',
            time_spent: Math.floor((Date.now() - timeOnPageStart) / 1000),
            max_scroll_depth: Math.max(...Object.keys(scrollDepthTracked).map(Number)) || 0,
            engagement_score: calculateEngagementScore(),
            page_section: getPageSection()
        };
        
        gtag('event', 'session_summary', sessionData);
    });
}

// Helper Functions
function getPageSection() {
    const path = window.location.pathname;
    if (path === '/') return 'about';
    if (path.startsWith('/blog/')) return 'blog';
    if (path.startsWith('/projects/')) return 'projects';
    if (path.startsWith('/research/')) return 'research';
    return 'other';
}

// Initialize Enhanced Tracking
function initEnhancedAnalytics() {
    // Set up event listeners
    window.addEventListener('scroll', trackScrollDepth);
    setInterval(trackTimeOnPage, 5000); // Check every 5 seconds
    
    trackExternalLinks();
    trackNavigation();
    trackCodeBlocks();
    trackPagePerformance();
    trackSessionSummary();
    
    // Track initial page data
    gtag('event', 'page_view_enhanced', {
        event_category: 'navigation',
        event_label: getPageSection(),
        page_section: getPageSection(),
        page_title: document.title,
        page_location: window.location.href,
        referrer: document.referrer
    });
    
    console.log('🔍 Enhanced Analytics initialized for:', getPageSection());
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedAnalytics);
} else {
    initEnhancedAnalytics();
}

// Export functions for manual tracking
window.analyticsHelpers = {
    trackContentEngagement,
    trackThemeToggle,
    getPageSection,
    calculateEngagementScore
};

// 11. Rage Click Detection
function initializeRageClickTracking() {
  let clickHistory = new Map();
  
  document.addEventListener('click', function(event) {
    const element = event.target;
    const selector = getElementSelector(element);
    const now = Date.now();
    
    if (!clickHistory.has(selector)) {
      clickHistory.set(selector, []);
    }
    
    const clicks = clickHistory.get(selector);
    clicks.push(now);
    
    // Keep only clicks from last 2 seconds
    const recentClicks = clicks.filter(time => now - time < 2000);
    clickHistory.set(selector, recentClicks);
    
    // Rage click detection (3+ clicks in 2 seconds)
    if (recentClicks.length >= 3) {
      gtag('event', 'rage_click', {
        'event_category': 'User Experience',
        'element_selector': selector,
        'click_count': recentClicks.length,
        'page_url': window.location.href,
        'element_text': element.textContent?.substring(0, 100) || '',
        'element_type': element.tagName?.toLowerCase() || ''
      });
      
      // Clear history to avoid spam
      clickHistory.set(selector, []);
    }
  });
}

// 12. Form Abandonment Tracking
function initializeFormAbandonmentTracking() {
  const formData = new Map();
  
  // Track form starts
  document.addEventListener('focus', function(event) {
    if (event.target.matches('input, textarea, select')) {
      const form = event.target.closest('form');
      if (form && !formData.has(form)) {
        const formId = form.id || form.action || 'unknown';
        formData.set(form, {
          id: formId,
          startTime: Date.now(),
          fieldsInteracted: new Set(),
          submitted: false
        });
        
        gtag('event', 'form_start', {
          'event_category': 'Form Interaction',
          'form_id': formId,
          'page_url': window.location.href
        });
      }
    }
  });
  
  // Track field interactions
  document.addEventListener('input', function(event) {
    if (event.target.matches('input, textarea, select')) {
      const form = event.target.closest('form');
      if (form && formData.has(form)) {
        formData.get(form).fieldsInteracted.add(event.target.name || event.target.id || 'unnamed');
      }
    }
  });
  
  // Track form submissions
  document.addEventListener('submit', function(event) {
    const form = event.target;
    if (formData.has(form)) {
      formData.get(form).submitted = true;
    }
  });
  
  // Track form abandonment on page unload
  window.addEventListener('beforeunload', function() {
    formData.forEach(function(data, form) {
      if (!data.submitted && data.fieldsInteracted.size > 0) {
        const timeSpent = (Date.now() - data.startTime) / 1000;
        
        gtag('event', 'form_abandon', {
          'event_category': 'Form Interaction',
          'form_id': data.id,
          'fields_filled': data.fieldsInteracted.size,
          'time_spent': Math.round(timeSpent),
          'page_url': window.location.href
        });
      }
    });
  });
}

// 13. Enhanced Attribution Tracking
function initializeEnhancedAttribution() {
  // Track UTM parameters
  const urlParams = new URLSearchParams(window.location.search);
  const utmData = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    if (urlParams.has(param)) {
      utmData[param] = urlParams.get(param);
    }
  });
  
  if (Object.keys(utmData).length > 0) {
    gtag('event', 'utm_tracking', {
      'event_category': 'Attribution',
      ...utmData,
      'page_url': window.location.href
    });
  }
  
  // Track referrer information
  if (document.referrer) {
    const referrerDomain = new URL(document.referrer).hostname;
    const currentDomain = window.location.hostname;
    
    if (referrerDomain !== currentDomain) {
      gtag('event', 'external_referrer', {
        'event_category': 'Attribution',
        'referrer_domain': referrerDomain,
        'referrer_url': document.referrer,
        'page_url': window.location.href
      });
    }
  }
}

// 14. Enhanced Error Tracking
function initializeEnhancedErrorTracking() {
  // JavaScript errors
  window.addEventListener('error', function(event) {
    gtag('event', 'javascript_error', {
      'event_category': 'Error Tracking',
      'error_message': event.message,
      'error_source': event.filename,
      'error_line': event.lineno,
      'error_column': event.colno,
      'page_url': window.location.href
    });
  });
  
  // Promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    gtag('event', 'promise_rejection', {
      'event_category': 'Error Tracking',
      'error_message': event.reason?.toString() || 'Unknown promise rejection',
      'page_url': window.location.href
    });
  });
  
  // Resource loading errors
  window.addEventListener('error', function(event) {
    if (event.target !== window && event.target.tagName) {
      gtag('event', 'resource_error', {
        'event_category': 'Error Tracking',
        'resource_type': event.target.tagName.toLowerCase(),
        'resource_url': event.target.src || event.target.href || 'unknown',
        'page_url': window.location.href
      });
    }
  }, true);
}

// 15. Cookieless Fingerprint Tracking (Privacy-Compliant)
function initializeFingerprintTracking() {
  // Create a privacy-compliant device fingerprint
  const fingerprint = {
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  };
  
  // Create hash for session identification (not personal identification)
  const fingerprintString = JSON.stringify(fingerprint);
  const hash = fingerprintString.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  gtag('event', 'session_fingerprint', {
    'event_category': 'Technical Data',
    'session_hash': Math.abs(hash).toString(36),
    'screen_resolution': fingerprint.screen,
    'timezone': fingerprint.timezone,
    'language': fingerprint.language
  });
}

// Helper function to get element selector
function getElementSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(' ')[0]}`;
  return element.tagName?.toLowerCase() || 'unknown';
}

// Add new tracking methods to initialization
function initializeAdvancedTracking() {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(function() {
      initializeRageClickTracking();
      initializeFormAbandonmentTracking();
      initializeEnhancedAttribution();
      initializeEnhancedErrorTracking();
      initializeFingerprintTracking();
    });
  } else {
    setTimeout(function() {
      initializeRageClickTracking();
      initializeFormAbandonmentTracking();
      initializeEnhancedAttribution();
      initializeEnhancedErrorTracking();
      initializeFingerprintTracking();
    }, 100);
  }
}

// Call the new initialization function
initializeAdvancedTracking(); 