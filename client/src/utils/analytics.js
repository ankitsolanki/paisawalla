/**
 * Analytics Service
 * Centralized event tracking and analytics
 */

import apiClient from './apiClient';
import { debounce } from './debounce';

class AnalyticsService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.utmParams = this.parseUTMParams();
    this.pageLoadTime = Date.now();
    this.events = [];
    this.flushInterval = null;
    this.flushDelay = 5000; // Flush events every 5 seconds
    this.trackedFormViews = new Set(); // Track which forms have been viewed to prevent duplicates
    this.lastFormViewTime = {}; // Track last form view time per form type
    this.fieldChangeDebouncers = {}; // Debouncers for field change events
    this.lastFieldInteraction = {}; // Track last interaction per field to prevent duplicates
  }

  /**
   * Get or create session ID
   */
  getOrCreateSessionId() {
    const sessionKey = 'pw_session_id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Parse UTM parameters from URL
   */
  parseUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_term: params.get('utm_term') || null,
      utm_content: params.get('utm_content') || null,
      referrer: document.referrer || null,
    };
  }

  /**
   * Get user fingerprint for tracking
   */
  getUserFingerprint() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Track an event
   */
  track(eventType, eventData = {}) {
    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      utmParams: this.utmParams,
      userFingerprint: this.getUserFingerprint(),
      ...eventData,
    };

    this.events.push(event);

    // Flush events in batches
    this.scheduleFlush();

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventType, event);
    }
  }

  /**
   * Schedule event flush
   */
  scheduleFlush() {
    if (this.flushInterval) {
      clearTimeout(this.flushInterval);
    }

    this.flushInterval = setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }

  /**
   * Flush events to backend
   */
  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Use shorter timeout for analytics to prevent hanging
      await apiClient.post('/api/analytics/events', {
        events: eventsToSend,
        sessionId: this.sessionId,
      }, {
        timeout: 5000, // 5 second timeout for analytics
      });
    } catch (error) {
      // Re-queue events on failure (but don't log - analytics should be silent)
      // Don't re-queue on timeout/abort errors
      if (error.code !== 'ECONNABORTED' && error.message !== 'timeout of 5000ms exceeded') {
        this.events.unshift(...eventsToSend);
      }
    }
  }

  /**
   * Track form view
   * Prevents duplicate tracking within 2 seconds (handles React Strict Mode double-mount)
   */
  trackFormView(formType, formId = null) {
    const key = `${formType}-${formId || 'default'}`;
    const now = Date.now();
    const lastViewTime = this.lastFormViewTime[key] || 0;
    
    // Prevent duplicate tracking within 2 seconds (React Strict Mode protection)
    if (now - lastViewTime < 2000) {
      if (import.meta.env.DEV) {
        console.log('[Analytics] Skipping duplicate form_view for', formType);
      }
      return;
    }
    
    this.lastFormViewTime[key] = now;
    this.trackedFormViews.add(key);
    
    this.track('form_view', {
      formType,
      formId,
      pageLoadTime: Date.now() - this.pageLoadTime,
    });
  }

  /**
   * Track form field interaction
   * Smart tracking: 
   * - 'focus' and 'blur' are tracked immediately (important for UX)
   * - 'error' is tracked immediately (critical)
   * - 'change' is debounced (only track after user stops typing for 1 second)
   */
  trackFieldInteraction(formType, fieldName, action, value = null) {
    const key = `${formType}-${fieldName}`;
    const now = Date.now();
    
    // Always track focus, blur, and error immediately (these are meaningful events)
    if (action === 'focus' || action === 'blur' || action === 'error') {
      // Prevent duplicate focus/blur within 500ms (handles rapid clicking)
      if (action === 'focus' || action === 'blur') {
        const lastInteraction = this.lastFieldInteraction[key];
        if (lastInteraction && 
            lastInteraction.action === action && 
            now - lastInteraction.time < 500) {
          if (import.meta.env.DEV) {
            console.log(`[Analytics] Skipping duplicate ${action} for ${fieldName}`);
          }
          return;
        }
        this.lastFieldInteraction[key] = { action, time: now };
      }
      
      this.track('field_interaction', {
        formType,
        fieldName,
        action,
        valueLength: value ? value.toString().length : 0,
        hasValue: !!value,
      });
      return;
    }
    
    // For 'change' events, debounce to avoid tracking every keystroke
    if (action === 'change') {
      // Create debouncer for this field if it doesn't exist
      if (!this.fieldChangeDebouncers[key]) {
        this.fieldChangeDebouncers[key] = debounce((formType, fieldName, value) => {
          this.track('field_interaction', {
            formType,
            fieldName,
            action: 'change',
            valueLength: value ? value.toString().length : 0,
            hasValue: !!value,
          });
        }, 1000); // Wait 1 second after user stops typing
      }
      
      // Call debounced function
      this.fieldChangeDebouncers[key](formType, fieldName, value);
      return;
    }
    
    // Fallback for any other action types
    this.track('field_interaction', {
      formType,
      fieldName,
      action,
      valueLength: value ? value.toString().length : 0,
      hasValue: !!value,
    });
  }

  /**
   * Track form step change
   */
  trackStepChange(formType, fromStep, toStep) {
    this.track('step_change', {
      formType,
      fromStep,
      toStep,
    });
  }

  /**
   * Track form submission start
   */
  trackFormSubmitStart(formType, formData) {
    this.track('form_submit_start', {
      formType,
      fieldCount: Object.keys(formData).length,
      filledFields: Object.values(formData).filter(v => v !== null && v !== '').length,
    });
  }

  /**
   * Track form submission success
   */
  trackFormSubmitSuccess(formType, leadId, duration) {
    this.track('form_submit_success', {
      formType,
      leadId,
      duration,
    });
    // Flush immediately on success
    this.flush();
  }

  /**
   * Track form submission error
   */
  trackFormSubmitError(formType, error, duration) {
    this.track('form_submit_error', {
      formType,
      error: error.message || error,
      duration,
    });
  }

  /**
   * Track form abandonment
   */
  trackFormAbandonment(formType, formData, lastInteractionTime) {
    const timeOnForm = Date.now() - this.pageLoadTime;
    const timeSinceLastInteraction = Date.now() - lastInteractionTime;

    this.track('form_abandonment', {
      formType,
      timeOnForm,
      timeSinceLastInteraction,
      filledFields: Object.values(formData).filter(v => v !== null && v !== '').length,
      formData: this.sanitizeFormData(formData), // Remove sensitive data
    });
    // Flush immediately on abandonment
    this.flush();
  }

  /**
   * Track button click
   */
  trackButtonClick(buttonName, context = {}) {
    this.track('button_click', {
      buttonName,
      ...context,
    });
  }

  /**
   * Track page visibility change (for abandonment detection)
   */
  trackVisibilityChange(isVisible) {
    this.track('visibility_change', {
      isVisible,
    });
  }

  /**
   * Sanitize form data (remove sensitive fields)
   */
  sanitizeFormData(formData) {
    const sensitiveFields = ['ssn', 'bankAccountNumber', 'routingNumber', 'password'];
    const sanitized = { ...formData };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Initialize abandonment tracking
   */
  initAbandonmentTracking(formType, getFormData) {
    let lastInteractionTime = Date.now();
    let abandonmentTimeout = null;
    const ABANDONMENT_DELAY = 30000; // 30 seconds of inactivity

    const resetAbandonmentTimer = () => {
      lastInteractionTime = Date.now();
      if (abandonmentTimeout) {
        clearTimeout(abandonmentTimeout);
      }
      abandonmentTimeout = setTimeout(() => {
        const formData = getFormData();
        this.trackFormAbandonment(formType, formData, lastInteractionTime);
      }, ABANDONMENT_DELAY);
    };

    // Track on any user interaction
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(eventType => {
      document.addEventListener(eventType, resetAbandonmentTimer, { passive: true });
    });

    // Track on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const formData = getFormData();
        this.trackFormAbandonment(formType, formData, lastInteractionTime);
      }
    });

    // Track on beforeunload
    window.addEventListener('beforeunload', () => {
      const formData = getFormData();
      this.trackFormAbandonment(formType, formData, lastInteractionTime);
      // Use sendBeacon for reliable tracking on page unload
      this.sendBeacon(formType, formData, lastInteractionTime);
    });

    return () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, resetAbandonmentTimer);
      });
      if (abandonmentTimeout) {
        clearTimeout(abandonmentTimeout);
      }
    };
  }

  /**
   * Send beacon for reliable tracking on page unload
   */
  sendBeacon(formType, formData, lastInteractionTime) {
    try {
      const data = JSON.stringify({
        eventType: 'form_abandonment',
        formType,
        sessionId: this.sessionId,
        utmParams: this.utmParams,
        formData: this.sanitizeFormData(formData),
        timestamp: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        const apiUrl = 
          (typeof window !== 'undefined' && window.VITE_API_BASE_URL) ||
          import.meta.env.VITE_API_BASE_URL || 
          'http://localhost:3000';
        
        // Use Blob with proper content-type to avoid CORS issues
        const blob = new Blob([data], { type: 'application/json' });
        const success = navigator.sendBeacon(`${apiUrl}/api/analytics/events/beacon`, blob);
        
        if (!success) {
          // Fallback to fetch if sendBeacon fails
          fetch(`${apiUrl}/api/analytics/events/beacon`, {
            method: 'POST',
            body: data,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          }).catch(() => {
            // Silently fail - analytics should not block page navigation
          });
        }
      }
    } catch (error) {
      // Silently fail - analytics should not block page navigation
    }
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.flush();
  });
}

