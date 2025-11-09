/**
 * breStatusEmbed.js - Webflow embedding script for BRE Status
 * 
 * Usage in Webflow:
 * <div id="bre-status"></div>
 * <script 
 *   src="https://cdn.pw.com/embeds/breStatusEmbed.js"
 *   data-request-id="REQ12345"
 *   data-theme="light"
 * ></script>
 */

(function() {
  'use strict';

  // Get configuration from script tag
  const script = document.currentScript || 
    document.querySelector('script[data-request-id]');
  
  if (!script) {
    console.error('BRE Status Embed: Script tag not found');
    return;
  }

  const requestId = script.getAttribute('data-request-id');
  const theme = script.getAttribute('data-theme') || 'light';
  const containerId = script.getAttribute('data-container') || 'bre-status';

  if (!requestId) {
    console.error('BRE Status Embed: Request ID is required');
    return;
  }

  // Find container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`BRE Status Embed: Container element #${containerId} not found`);
    return;
  }

  // Load React and BRE status component dynamically
  const loadBreStatus = async () => {
    try {
      // Show loading state
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 10px; color: #6b7280;">Loading eligibility check...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      // In production, these would be loaded from CDN
      // For development, we'll use a placeholder that shows the status structure
      
      // Map to component path (in production, this would be a CDN URL)
      const componentPath = '/src/embeds/breStatus/BreStatusEmbed.jsx';

      // In production build, component would be pre-bundled and loaded from CDN
      // For now, we'll create a message indicating the component should be loaded
      container.innerHTML = `
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white;">
          <h3 style="margin-top: 0;">BRE Status Check</h3>
          <p>BRE status component will be loaded here.</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Theme:</strong> ${theme}</p>
          <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
            <em>Note: In production build, the BRE status component will be loaded from CDN and rendered here.</em>
          </p>
        </div>
      `;

      // Post message to Webflow that component is ready
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-bre-status-event',
          event: 'breStatusLoaded',
          data: { requestId, theme, containerId },
        }, '*');
      }

      // In production, you would:
      // 1. Load React from CDN
      // 2. Load the BRE status component bundle
      // 3. Render it into the container
      // Example:
      // const React = await import('https://cdn.pw.com/react/react.production.min.js');
      // const ReactDOM = await import('https://cdn.pw.com/react/react-dom.production.min.js');
      // const BreStatusComponent = await import('https://cdn.pw.com/embeds/breStatus.js');
      // const root = ReactDOM.createRoot(container);
      // root.render(React.createElement(BreStatusComponent.default, { requestId, theme }));

    } catch (error) {
      console.error('BRE Status Embed: Error loading component', error);
      container.innerHTML = `
        <div style="padding: 20px; color: #dc2626; border: 1px solid #dc2626; border-radius: 8px; background: #fee2e2;">
          <h3 style="margin-top: 0; color: #dc2626;">Error Loading BRE Status</h3>
          <p>Failed to load BRE status component: ${error.message}</p>
          <p style="font-size: 0.9em; margin-top: 10px;">Please try refreshing the page or contact support.</p>
        </div>
      `;

      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-bre-status-event',
          event: 'breStatusError',
          data: { error: error.message, requestId },
        }, '*');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBreStatus);
  } else {
    loadBreStatus();
  }
})();

