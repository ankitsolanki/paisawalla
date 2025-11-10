/**
 * injectOffers.js - Webflow embedding script for Offers Listing Page
 * 
 * Usage in Webflow:
 * <div id="offers-listing"></div>
 * <script 
 *   src="https://YOUR-CDN-URL/injectOffers.js"
 *   data-application-id="YOUR_APPLICATION_ID"
 *   data-theme="light"
 *   data-container="offers-listing"
 *   data-api-url="https://api-paisawalla.gofo.app"
 * ></script>
 * 
 * OR read from URL query parameter:
 * <div id="offers-listing"></div>
 * <script 
 *   src="https://YOUR-CDN-URL/injectOffers.js"
 *   data-theme="light"
 *   data-container="offers-listing"
 *   data-api-url="https://api-paisawalla.gofo.app"
 * ></script>
 * 
 * Then access page with: ?applicationId=YOUR_APPLICATION_ID
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import OffersListing from '../embeds/offers/OffersListing';
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
const script = document.currentScript || document.querySelector('script[data-application-id]');
if (script) {
  const apiUrl = script.getAttribute('data-api-url');
  if (apiUrl) {
    // Set API URL in window for apiClient to use
    window.VITE_API_BASE_URL = apiUrl;
  }
}

(function() {
  'use strict';

  // Get configuration from script tag
  const scriptTag = document.currentScript || 
    document.querySelector('script[data-application-id]');
  
  if (!scriptTag) {
    console.error('PW Offers: Script tag not found');
    return;
  }

  // Get application ID from script attribute OR URL query parameter
  let applicationId = scriptTag.getAttribute('data-application-id');
  
  // If not in script attribute, try to get from URL query parameters
  if (!applicationId) {
    const urlParams = new URLSearchParams(window.location.search);
    applicationId = urlParams.get('applicationId') || urlParams.get('id') || urlParams.get('appId');
  }
  
  const leadId = scriptTag.getAttribute('data-lead-id') || null;
  const theme = scriptTag.getAttribute('data-theme') || 'light';
  const containerId = scriptTag.getAttribute('data-container') || 'offers-listing';

  // Validate required application ID
  if (!applicationId) {
    console.error('PW Offers: Application ID is required');
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Loading Offers</h3>
          <p>Application ID is required. Please provide <code>data-application-id</code> attribute or include it in the URL as <code>?applicationId=YOUR_ID</code>.</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Example: <code>data-application-id="YOUR_APPLICATION_ID"</code> or <code>?applicationId=YOUR_APPLICATION_ID</code></p>
        </div>
      `;
    }
    return;
  }

  // Find container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`PW Offers: Container element #${containerId} not found`);
    return;
  }

  // Load CSS if it exists (for library builds)
  const loadCSS = () => {
    const scriptSrc = scriptTag.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
    const cssUrl = `${baseUrl}/injectOffers.css`;
    
    // Check if CSS is already loaded
    if (document.querySelector(`link[href="${cssUrl}"]`)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    link.onerror = () => {
      // CSS file not found, that's okay - styles might be inline
      console.warn('PW Offers: CSS file not found, styles may be inline');
    };
    // Add scoped attribute to prevent affecting host page
    link.setAttribute('data-pw-offers-styles', 'true');
    document.head.appendChild(link);
  };

  // Render the offers listing
  const loadOffers = () => {
    try {
      // Load CSS first
      loadCSS();
      
      // Show loading state
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px; color: #6b7280;">Loading offers...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // Add scoped container class to prevent style leakage
      container.classList.add('pw-offers-container');
      
      // Create React root and render offers listing
      const root = createRoot(container);
      root.render(
        React.createElement(OffersListing, {
          applicationId,
          leadId,
          theme,
          onStateChange: (status, data) => {
            // Post message to Webflow that state changed
            if (window.parent) {
              window.parent.postMessage({
                type: 'pw-offers-event',
                event: 'stateChange',
                data: { status, applicationId, leadId, ...data },
              }, '*');
            }
          },
        })
      );

      // Post message to Webflow that offers listing is ready
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-offers-event',
          event: 'offersLoaded',
          data: { applicationId, leadId, theme, containerId },
        }, '*');
      }

    } catch (error) {
      console.error('PW Offers: Error loading offers listing', error);
      container.innerHTML = `
        <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Loading Offers</h3>
          <p>Failed to load offers: ${error.message}</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Please try refreshing the page or contact support.</p>
        </div>
      `;

      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-offers-event',
          event: 'offersError',
          data: { error: error.message, applicationId },
        }, '*');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOffers);
  } else {
    loadOffers();
  }
})();

