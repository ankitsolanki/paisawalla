/**
 * injectAuth.js - Webflow embedding script for Auth Form
 * 
 * Usage in Webflow:
 * <div id="pw-auth"></div>
 * <script 
 *   src="https://app-paisawalla.gofo.app/injectAuth.js"
 *   data-redirect-url="https://example.com/form?form=form1"
 *   data-theme="light"
 *   data-api-url="https://api-paisawalla.gofo.app"
 *   data-title="Get a Personal loan in 10 mins" (optional)
 *   data-description="Apply for Instant Loans up to ₹10 Lakhs" (optional)
 * ></script>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthForm from '../components/AuthForm';
import { getAuthParamsFromUrl, buildUrlWithAuthParams } from '../utils/queryEncoder';
import '../index.css';
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
const script = document.currentScript || document.querySelector('script[data-redirect-url]');
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
    document.querySelector('script[data-redirect-url]');
  
  if (!scriptTag) {
    console.error('PW Auth: Script tag not found');
    return;
  }

  const redirectUrl = scriptTag.getAttribute('data-redirect-url');
  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const containerId = scriptTag.getAttribute('data-container') || 'pw-auth';
  const title = scriptTag.getAttribute('data-title') || undefined; // Use default if not provided
  const description = scriptTag.getAttribute('data-description') || undefined; // Use default if not provided

  // Validate redirect URL
  if (!redirectUrl || redirectUrl.trim() === '') {
    console.error('PW Auth: data-redirect-url attribute is required');
    return;
  }

  // Find container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`PW Auth: Container element #${containerId} not found`);
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
      console.warn('PW Auth: CSS file not found, styles may be inline');
    };
    // Add scoped attribute to prevent affecting host page
    link.setAttribute('data-pw-form-styles', 'true');
    document.head.appendChild(link);
  };

  // Check if user is already authenticated
  const checkExistingAuth = () => {
    const authParams = getAuthParamsFromUrl();
    
    // If user is already authenticated, skip auth and redirect
    if (authParams && authParams.authenticated && authParams.phone) {
      // Check if redirectUrl already has auth params
      try {
        const redirectUrlObj = new URL(redirectUrl, window.location.origin);
        const existingAuth = redirectUrlObj.searchParams.get('auth');
        
        // If redirectUrl doesn't have auth params, add them
        let finalRedirectUrl = redirectUrl;
        if (!existingAuth) {
          finalRedirectUrl = buildUrlWithAuthParams(
            redirectUrl,
            authParams.phone,
            true // authenticated
          );
        }
        
        // Show message and redirect
        container.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #10b981; border-top: 4px solid #10b981; border-radius: 50%; margin-bottom: 1rem;"></div>
            <p style="color: #059669; font-weight: 600; margin-bottom: 0.5rem;">Already Authenticated</p>
            <p style="color: #6b7280; font-size: 0.875rem;">Redirecting to form...</p>
          </div>
        `;
        
        // Post message that auth was skipped
        if (window.parent) {
          window.parent.postMessage({
            type: 'pw-form-event',
            event: 'authSkipped',
            data: { redirectUrl: finalRedirectUrl, phone: authParams.phone, containerId },
          }, '*');
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = finalRedirectUrl;
        }, 500);
        
        return true; // Auth was skipped
      } catch (error) {
        console.warn('PW Auth: Error processing redirect URL, proceeding with auth form', error);
        return false; // Continue with auth form
      }
    }
    
    return false; // Not authenticated, proceed with auth form
  };

  // Render the auth form
  const loadAuthForm = () => {
    // Check if user is already authenticated first
    if (checkExistingAuth()) {
      return; // Auth was skipped, exit early
    }
    
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
          data: { redirectUrl, theme, containerId },
        }, '*');
      }

    } catch (error) {
      console.error('PW Auth: Error loading auth form', error);
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAuthForm);
  } else {
    loadAuthForm();
  }
})();

