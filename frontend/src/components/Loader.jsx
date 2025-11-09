import React from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

/**
 * Loader component - Full page or inline loading state
 */
const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        <LoadingSpinner size="lg" />
        {message && (
          <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <LoadingSpinner size="md" />
      {message && (
        <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;

