import React from 'react';
import { tokens } from '../../design-system/tokens';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to analytics
    if (window.analytics) {
      window.analytics.track('error_boundary', {
        error: error.message,
        errorInfo: errorInfo.componentStack,
      });
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: tokens.spacing.xl,
            textAlign: 'center',
            color: tokens.colors.error[600],
          }}
        >
          <h2 style={{ fontSize: tokens.typography.fontSize['2xl'], marginBottom: tokens.spacing.md }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: tokens.spacing.lg }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
              backgroundColor: tokens.colors.primary[600],
              color: '#ffffff',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.base,
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

