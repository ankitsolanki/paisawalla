/**
 * injectForm.js - Webflow embedding script
 * 
 * Usage in Webflow:
 * <div id="pw-form"></div>
 * <script 
 *   src="https://app-paisawalla.gofo.app/injectForm.js"
 *   data-form="form1"
 *   data-theme="light"
 *   data-api-url="https://api-paisawalla.gofo.app"
 * ></script>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import Form1 from '../forms/form1/index.jsx';
import Form2 from '../forms/form2/index.jsx';
import Form3 from '../forms/form3/index.jsx';
import './embed-styles.css';

// Provide minimal process polyfill for libraries expecting process.env
if (typeof window !== 'undefined') {
  const globalProcess = window.process || {};
  globalProcess.env = globalProcess.env || {};
  if (!globalProcess.env.NODE_ENV) {
    globalProcess.env.NODE_ENV = 'production';
  }
  window.process = globalProcess;
}

// Set global config values based on script attributes (before IIFE runs)
const script = document.currentScript || document.querySelector('script[data-form]');
if (script) {
  const apiUrl = script.getAttribute('data-api-url');
  if (apiUrl) {
    // Set API URL in window for apiClient to use
    window.VITE_API_BASE_URL = apiUrl;
  }

  const recaptchaSiteKey = script.getAttribute('data-recaptcha-site-key') || script.getAttribute('data-recaptcha');
  
  // Only set if key exists and looks valid (reCAPTCHA keys are typically 40 characters)
  if (recaptchaSiteKey && recaptchaSiteKey.trim() !== '' && recaptchaSiteKey.length > 20) {
    window.VITE_RECAPTCHA_SITE_KEY = recaptchaSiteKey.trim();
  } else {
    // Explicitly clear it to avoid stale values
    if (window.VITE_RECAPTCHA_SITE_KEY) {
      delete window.VITE_RECAPTCHA_SITE_KEY;
    }
  }
}

(function() {
  'use strict';

  // Get configuration from script tag
  const scriptTag = document.currentScript || 
    document.querySelector('script[data-form]');
  
  if (!scriptTag) {
    console.error('PW Forms: Script tag not found');
    return;
  }

  const formType = scriptTag.getAttribute('data-form') || 'form1';
  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const containerId = scriptTag.getAttribute('data-container') || 'pw-form';

  // Find container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`PW Forms: Container element #${containerId} not found`);
    return;
  }

  // Map form types to components
  const formComponents = {
    'form1': Form1,
    'form2': Form2,
    'form3': Form3,
  };

  const FormComponent = formComponents[formType];
  
  if (!FormComponent) {
    container.innerHTML = `
      <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
        <h3 style="margin-top: 0; color: #dc2626;">Error Loading Form</h3>
        <p>Unknown form type: ${formType}</p>
        <p style="font-size: 0.9em; margin-top: 10px;">Available forms: form1, form2, form3</p>
      </div>
    `;
    return;
  }

  // Load CSS if it exists (for library builds)
  const loadCSS = () => {
    const scriptSrc = scriptTag.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
    const cssUrl = `${baseUrl}/injectForm.css`;
    
    // Check if CSS is already loaded
    if (document.querySelector(`link[href="${cssUrl}"]`)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.onerror = () => {
      // CSS file not found, that's okay - styles might be inline
      console.warn('PW Forms: CSS file not found, styles may be inline');
    };
    // Add scoped attribute to prevent affecting host page
    link.setAttribute('data-pw-form-styles', 'true');
    document.head.appendChild(link);
  };

  // Render the form
  const loadForm = () => {
    try {
      // Load CSS first
      loadCSS();
      
      // Show loading state
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px; color: #6b7280;">Loading form...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // Add scoped container class to prevent style leakage
      container.classList.add('pw-form-container');
      
      // Create React root and render form
      const root = createRoot(container);
      root.render(React.createElement(FormComponent, { theme }));

      // Post message to Webflow that form is ready
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-form-event',
          event: 'formLoaded',
          data: { formType, theme, containerId },
        }, '*');
      }

    } catch (error) {
      console.error('PW Forms: Error loading form', error);
      container.innerHTML = `
        <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Loading Form</h3>
          <p>Failed to load form: ${error.message}</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Please try refreshing the page or contact support.</p>
        </div>
      `;

      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-form-event',
          event: 'formError',
          data: { error: error.message, formType },
        }, '*');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadForm);
  } else {
    loadForm();
  }
})();
