/**
 * Offers Embed Script
 * Dynamically loads and renders OffersListing component in Webflow
 * 
 * Usage in Webflow:
 * <div id="offers-listing"></div>
 * <script
 *   src="https://cdn.pw.com/embeds/offersEmbed.js"
 *   data-application-id="A12345"
 *   data-theme="light">
 * </script>
 */

(function() {
  'use strict';

  // Get configuration from script tag
  function getConfig() {
    const script = document.currentScript || 
      document.querySelector('script[data-application-id]');
    
    if (!script) {
      console.error('Offers embed script: Could not find script tag');
      return null;
    }

    return {
      applicationId: script.getAttribute('data-application-id'),
      theme: script.getAttribute('data-theme') || 'light',
      containerId: script.getAttribute('data-container-id') || 'offers-listing',
      apiUrl: script.getAttribute('data-api-url') || '',
    };
  }

  // Find or create container
  function getContainer(containerId) {
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    return container;
  }

  // Initialize the embed
  async function init() {
    const config = getConfig();
    
    if (!config) {
      console.error('Offers embed: Configuration not found');
      return;
    }

    if (!config.applicationId) {
      console.error('Offers embed: application-id is required');
      const container = getContainer(config.containerId);
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          <p>Error: Application ID is required</p>
        </div>
      `;
      return;
    }

    const container = getContainer(config.containerId);

    // Show loading state
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: #1c3693; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 1rem; color: #6b7280;">Loading offers...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    try {
      // Dynamically import React and the component
      // In production, these would be bundled separately
      const { createRoot } = await import('react-dom/client');
      const { default: OffersListing } = await import('./OffersListing.jsx');
      const React = await import('react');

      // Render the component
      const root = createRoot(container);
      root.render(
        React.createElement(OffersListing, {
          applicationId: config.applicationId,
          theme: config.theme,
          onStateChange: (status, data) => {
            // Post message to Webflow host
            if (window.parent) {
              window.parent.postMessage({
                type: 'pw-offers-event',
                event: 'stateChange',
                status,
                data,
              }, '*');
            }
          },
        })
      );

      // Post success message
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-offers-event',
          event: 'loaded',
          applicationId: config.applicationId,
        }, '*');
      }

    } catch (error) {
      console.error('Offers embed error:', error);
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
            Failed to load offers
          </h3>
          <p style="color: #6b7280;">${error.message || 'An error occurred'}</p>
        </div>
      `;

      // Post error message
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-offers-event',
          event: 'error',
          error: error.message,
        }, '*');
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

