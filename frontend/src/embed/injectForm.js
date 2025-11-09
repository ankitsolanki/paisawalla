/**
 * injectForm.js - Webflow embedding script
 * 
 * Usage in Webflow:
 * <div id="pw-form"></div>
 * <script 
 *   src="https://cdn.pw.com/forms/injectForm.js"
 *   data-form="form1"
 *   data-theme="light"
 * ></script>
 */

(function() {
  'use strict';

  // Get configuration from script tag
  const script = document.currentScript || 
    document.querySelector('script[data-form]');
  
  if (!script) {
    console.error('PW Forms: Script tag not found');
    return;
  }

  const formType = script.getAttribute('data-form') || 'form1';
  const theme = script.getAttribute('data-theme') || 'light';
  const containerId = script.getAttribute('data-container') || 'pw-form';
  const apiUrl = script.getAttribute('data-api-url') || '';

  // Find container element
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`PW Forms: Container element #${containerId} not found`);
    return;
  }

  // Load React and form components dynamically
  const loadForm = async () => {
    try {
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

      // In production, these would be loaded from CDN
      // For development, we'll use a placeholder that shows the form structure
      
      // Map form types to component paths
      const formMap = {
        'form1': '/src/forms/form1/index.jsx',
        'form2': '/src/forms/form2/index.jsx',
        'form3': '/src/forms/form3/index.jsx',
      };

      const formPath = formMap[formType];
      
      if (!formPath) {
        throw new Error(`Unknown form type: ${formType}`);
      }

      // In production build, forms would be pre-bundled and loaded from CDN
      // For now, we'll create a message indicating the form should be loaded
      container.innerHTML = `
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: white;">
          <h3 style="margin-top: 0;">PW Form: ${formType}</h3>
          <p>Form will be loaded here. In production, this will dynamically load the React form component.</p>
          <p><strong>Theme:</strong> ${theme}</p>
          <p><strong>API URL:</strong> ${apiUrl || 'Default'}</p>
          <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
            <em>Note: In production build, the form component will be loaded from CDN and rendered here.</em>
          </p>
        </div>
      `;

      // Post message to Webflow that form is ready
      if (window.parent) {
        window.parent.postMessage({
          type: 'pw-form-event',
          event: 'formLoaded',
          data: { formType, theme, containerId },
        }, '*');
      }

      // In production, you would:
      // 1. Load React from CDN
      // 2. Load the specific form component bundle
      // 3. Render it into the container
      // Example:
      // const React = await import('https://cdn.pw.com/react/react.production.min.js');
      // const ReactDOM = await import('https://cdn.pw.com/react/react-dom.production.min.js');
      // const FormComponent = await import(`https://cdn.pw.com/forms/${formType}.js`);
      // const root = ReactDOM.createRoot(container);
      // root.render(React.createElement(FormComponent.default, { theme }));

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
