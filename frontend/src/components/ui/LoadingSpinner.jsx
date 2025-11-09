import React from 'react';
import { tokens } from '../../design-system/tokens';

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeMap = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem',
  };

  const spinner = (
    <div
      style={{
        display: 'inline-block',
        width: sizeMap[size],
        height: sizeMap[size],
        border: `3px solid ${tokens.colors.gray[200]}`,
        borderTop: `3px solid ${tokens.colors.primary[600]}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: tokens.zIndex.modal,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default LoadingSpinner;

