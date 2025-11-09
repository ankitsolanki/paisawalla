/**
 * Webflow Bridge - Handles communication with Webflow host page
 */

export const webflowBridge = {
  /**
   * Post a message to the parent window (Webflow page)
   */
  postMessage: (eventType, data) => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          type: 'pw-form-event',
          event: eventType,
          data,
        },
        '*' // In production, specify the Webflow domain
      );
    }
  },

  /**
   * Listen for messages from Webflow host
   */
  onMessage: (callback) => {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'pw-form-event') {
          callback(event.data);
        }
      });
    }
  },

  /**
   * Get configuration from data attributes
   */
  getConfig: () => {
    if (typeof document !== 'undefined') {
      const script = document.currentScript || 
        document.querySelector('script[data-form]');
      
      if (script) {
        return {
          formType: script.getAttribute('data-form') || 'form1',
          theme: script.getAttribute('data-theme') || 'light',
          apiUrl: script.getAttribute('data-api-url') || '',
        };
      }
    }
    return {
      formType: 'form1',
      theme: 'light',
      apiUrl: '',
    };
  },
};

