/**
 * injectFormWithAuth.js - Webflow embedding script with integrated authentication
 * 
 * This script handles the complete auth + form journey:
 * - If user is authenticated: Shows Form1 directly
 * - If user is NOT authenticated: Shows auth form first, then redirects to Form1
 * 
 * Usage in Webflow:
 * <div id="pw-form"></div>
 * <script 
 *   src="https://app-paisawalla.gofo.app/injectFormWithAuth.js"
 *   data-form="form1"
 *   data-theme="light"
 *   data-api-url="https://api-paisawalla.gofo.app"
 *   data-recaptcha-site-key="YOUR_RECAPTCHA_KEY" (optional)
 *   data-title="Get a Personal loan in 10 mins" (optional)
 *   data-description="Apply for Instant Loans up to ₹10 Lakhs" (optional)
 * ></script>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import Form1 from '../forms/form1/index.jsx';
import Form2 from '../forms/form2/index.jsx';
import Form3 from '../forms/form3/index.jsx';
import AuthForm from '../components/AuthForm';
import { getAuthParamsFromUrl, buildUrlWithAuthParams } from '../utils/queryEncoder';
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

  // Helper function to find the correct script tag
  // This is more reliable than just using document.querySelector when multiple script tags exist
  const findScriptTag = () => {
    // First, try document.currentScript (most reliable when available)
    if (document.currentScript) {
      return document.currentScript;
    }

    // If currentScript is not available, find script by source URL
    // This ensures we get the correct script tag even when multiple exist
    const allScripts = Array.from(document.querySelectorAll('script[src*="injectFormWithAuth.js"]'));
    
    if (allScripts.length === 0) {
      // Fallback: try to find any script with data-form attribute
      return document.querySelector('script[data-form]');
    }
    
    if (allScripts.length === 1) {
      // Only one script tag, use it
      return allScripts[0];
    }
    
    // Multiple script tags - try to find the one that matches its container
    // This handles the case where multiple forms are on the same page
    for (const script of allScripts) {
      const containerId = script.getAttribute('data-container') || 'pw-form';
      const container = document.getElementById(containerId);
      
      if (container) {
        // Check if this script is near its container in the DOM
        // This helps identify which script tag belongs to which container
        let current = script;
        let found = false;
        const maxChecks = 100; // Max DOM nodes to check
        
        for (let i = 0; i < maxChecks && current; i++) {
          // Check if container is a sibling or nearby
          if (current.nextElementSibling === container || 
              current.previousElementSibling === container ||
              (current.parentElement && current.parentElement.contains(container))) {
            found = true;
            break;
          }
          current = current.parentElement;
        }
        
        if (found) {
          return script;
        }
      }
    }
    
    // If we can't determine which one, return the last one (most recently added)
    // Log a warning to help debug
    console.warn('PW Forms: Multiple script tags found, using the last one. Consider using unique container IDs for each form.');
    return allScripts[allScripts.length - 1];
  };

  // Get configuration from script tag
  const scriptTag = findScriptTag();
  
  if (!scriptTag) {
    console.error('PW Forms: Script tag not found');
    return;
  }

  // Get form type and normalize to lowercase to handle case sensitivity
  let formType = scriptTag.getAttribute('data-form');
  if (formType) {
    formType = formType.toLowerCase().trim();
  } else {
    formType = 'form1';
  }

  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const containerId = scriptTag.getAttribute('data-container') || 'pw-form';
  const title = scriptTag.getAttribute('data-title') || undefined;
  const description = scriptTag.getAttribute('data-description') || undefined;

  // Debug logging (helpful for troubleshooting)
  console.log('PW Forms: Initializing with:', { formType, theme, containerId });

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

  // Check if user is already authenticated
  const checkAuth = () => {
    const authParams = getAuthParamsFromUrl();
    return authParams && authParams.authenticated && authParams.phone;
  };

  // Build redirect URL (current page with auth params)
  const buildRedirectUrl = () => {
    const currentUrl = window.location.href;
    // Remove existing auth param if present
    const url = new URL(currentUrl);
    url.searchParams.delete('auth');
    return url.toString();
  };

  // Render the auth form
  const loadAuthForm = () => {
    try {
      // Load CSS first
      loadCSS();
      
      // Show loading state
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px; color: #6b7280;">Loading authentication form...</p>
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
      
      // Build redirect URL (current page)
      const redirectUrl = buildRedirectUrl();
      
      // Get optional title and description from script attributes
      const title = scriptTag.getAttribute('data-title') || undefined;
      const description = scriptTag.getAttribute('data-description') || undefined;
      
      // Create React root and render auth form
      const root = createRoot(container);
      const authFormProps = { redirectUrl, theme };
      if (title) authFormProps.title = title;
      if (description) authFormProps.description = description;
      root.render(React.createElement(AuthForm, authFormProps));

      // Post message to Webflow that auth form is ready
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-form-event',
          event: 'authFormLoaded',
          data: { redirectUrl, theme, containerId, formType },
        }, '*');
      }

    } catch (error) {
      console.error('PW Forms: Error loading auth form', error);
      container.innerHTML = `
        <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Loading Auth Form</h3>
          <p>Failed to load auth form: ${error.message}</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Please try refreshing the page or contact support.</p>
        </div>
      `;

      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-form-event',
          event: 'authFormError',
          data: { error: error.message },
        }, '*');
      }
    }
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
      const formProps = { theme };
      if (title) formProps.title = title;
      if (description) formProps.description = description;
      root.render(React.createElement(FormComponent, formProps));

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

  // Main initialization logic
  const initialize = () => {
    // Check if user is authenticated
    if (checkAuth()) {
      // User is authenticated, load form directly
      loadForm();
    } else {
      // User is not authenticated, show auth form first
      loadAuthForm();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();


