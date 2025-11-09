/**
 * Analytics Service
 * Centralized event tracking and analytics
 */

import apiClient from './apiClient';

class AnalyticsService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.utmParams = this.parseUTMParams();
    this.pageLoadTime = Date.now();
    this.events = [];
    this.flushInterval = null;
    this.flushDelay = 5000; // Flush events every 5 seconds
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
      await apiClient.post('/api/analytics/events', {
        events: eventsToSend,
        sessionId: this.sessionId,
      });
    } catch (error) {
      // Re-queue events on failure
      this.events.unshift(...eventsToSend);
      console.error('[Analytics] Failed to send events:', error);
    }
  }

  /**
   * Track form view
   */
  trackFormView(formType, formId = null) {
    this.track('form_view', {
      formType,
      formId,
      pageLoadTime: Date.now() - this.pageLoadTime,
    });
  }

  /**
   * Track form field interaction
   */
  trackFieldInteraction(formType, fieldName, action, value = null) {
    this.track('field_interaction', {
      formType,
      fieldName,
      action, // 'focus', 'blur', 'change', 'error'
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
    const data = JSON.stringify({
      eventType: 'form_abandonment',
      formType,
      sessionId: this.sessionId,
      utmParams: this.utmParams,
      formData: this.sanitizeFormData(formData),
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      navigator.sendBeacon(`${apiUrl}/api/analytics/events/beacon`, data);
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

