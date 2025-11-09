import React, { useEffect, useState, useCallback } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { poll } from '../../utils/poller';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import Loader from './Loader';
import PollingIndicator from './PollingIndicator';
import BreFailureState from './BreFailureState';
import BreTimeoutState from './BreTimeoutState';
import { tokens } from '../../design-system/tokens';

/**
 * BreStatusEmbed Component
 * Main component that polls BRE status and transitions to offers
 */
const BreStatusEmbed = ({ requestId, theme = 'light', onStateChange }) => {
  const [status, setStatus] = useState('queued');
  const [applicationId, setApplicationId] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState(null);

  const MAX_POLLS = 30;
  const INTERVAL = 3000;
  const MAX_TIME = MAX_POLLS * INTERVAL; // 90 seconds total

  // Notify Webflow of state changes
  const notifyStateChange = useCallback((newStatus, data = {}) => {
    webflowBridge.postMessage('breStatusChange', {
      status: newStatus,
      requestId,
      ...data,
    });
    if (onStateChange) {
      onStateChange(newStatus, data);
    }
  }, [requestId, onStateChange]);

  useEffect(() => {
    if (!requestId) {
      setError(new Error('Request ID is required'));
      setStatus('failed');
      return;
    }

    let isMounted = true;
    let pollInterval = null;
    let timeoutHandle = null;

    const pollStatus = async () => {
      try {
        const response = await apiClient.post(`/api/bre/requests/${requestId}/status`);

        // Check if response indicates error
        if (response.ok === false) {
          throw new Error(response.message || 'BRE request failed');
        }

        // Response format: { ok: true, status: 'in_progress', applicationId: '...' }
        const currentStatus = response.status;
        const appId = response.applicationId;

        if (!isMounted) return;

        setStatus(currentStatus);
        if (appId) {
          setApplicationId(appId);
        }

        // Handle terminal states
        if (currentStatus === 'complete' && appId) {
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          
          notifyStateChange('complete', { applicationId: appId });
          
          // Redirect to offers page
          window.location.href = `/application/${appId}/offers`;
          return;
        }

        if (currentStatus === 'failed') {
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          
          notifyStateChange('failed', { error: response.message });
          return;
        }
      } catch (err) {
        console.error('BRE polling error:', err);
        if (!isMounted) return;

        // Check if it's a timeout or max polls error
        if (err.message === 'Polling timeout' || err.message === 'Max polls reached') {
          setStatus('timeout');
          notifyStateChange('timeout');
        } else {
          setError(err);
          setStatus('failed');
          notifyStateChange('failed', { error: err.message });
        }

        if (pollInterval) clearInterval(pollInterval);
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }
    };

    // Start polling
    const startPolling = () => {
      // Initial poll
      pollStatus();

      // Set up interval polling
      pollInterval = setInterval(() => {
        setPollCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_POLLS) {
            if (pollInterval) clearInterval(pollInterval);
            setStatus('timeout');
            notifyStateChange('timeout');
            return newCount;
          }
          pollStatus();
          return newCount;
        });
      }, INTERVAL);

      // Set up timeout
      timeoutHandle = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        if (isMounted) {
          setStatus('timeout');
          notifyStateChange('timeout');
        }
      }, MAX_TIME);
    };

    startPolling();

    // Cleanup
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [requestId, notifyStateChange]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setStatus('queued');
    setPollCount(0);
    setError(null);
    // The useEffect will restart polling
  }, []);

  // Handle continue waiting
  const handleWait = useCallback(() => {
    setStatus('queued');
    setPollCount(0);
    // The useEffect will restart polling
  }, []);

  // Render based on status
  if (status === 'queued' || status === 'in_progress' || status === 'initiated') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              padding: tokens.spacing.xl,
            }}
          >
            <Loader message="Checking your eligibility..." />
            <PollingIndicator pollCount={pollCount} maxPolls={MAX_POLLS} />
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (status === 'timeout') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <BreTimeoutState
            onWait={handleWait}
            requestId={requestId}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (status === 'failed') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <BreFailureState
            onRetry={handleRetry}
            requestId={requestId}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Default loading state
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Loader message="Loading..." />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default BreStatusEmbed;

