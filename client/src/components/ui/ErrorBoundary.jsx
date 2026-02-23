import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
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
        <div className="p-8 text-center text-destructive">
          <h2 className="text-2xl mb-4 font-semibold">
            Something went wrong
          </h2>
          <p className="mb-6 text-muted-foreground">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-4 bg-primary text-primary-foreground rounded-md cursor-pointer text-base"
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
