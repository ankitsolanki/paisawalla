import { useEffect, useState, useCallback } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import Loader from './Loader';
import PollingIndicator from './PollingIndicator';
import BreFailureState from './BreFailureState';
import BreTimeoutState from './BreTimeoutState';

const BreStatusEmbed = ({ requestId, theme = 'light', onStateChange }) => {
  const [status, setStatus] = useState('queued');
  const [applicationId, setApplicationId] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState(null);

  const MAX_POLLS = 30;
  const INTERVAL = 3000;
  const MAX_TIME = MAX_POLLS * INTERVAL;

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

        if (response.ok === false) {
          throw new Error(response.message || 'BRE request failed');
        }

        const currentStatus = response.status;
        const appId = response.applicationId;

        if (!isMounted) return;

        setStatus(currentStatus);
        if (appId) {
          setApplicationId(appId);
        }

        if (currentStatus === 'complete' && appId) {
          if (pollInterval) clearInterval(pollInterval);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          
          notifyStateChange('complete', { applicationId: appId });
          
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

    const startPolling = () => {
      pollStatus();

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

      timeoutHandle = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        if (isMounted) {
          setStatus('timeout');
          notifyStateChange('timeout');
        }
      }, MAX_TIME);
    };

    startPolling();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [requestId, notifyStateChange]);

  const handleRetry = useCallback(() => {
    setStatus('queued');
    setPollCount(0);
    setError(null);
  }, []);

  const handleWait = useCallback(() => {
    setStatus('queued');
    setPollCount(0);
  }, []);

  if (status === 'queued' || status === 'in_progress' || status === 'initiated') {
    return (
      <ErrorBoundary>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <Loader message="Checking your eligibility..." />
          <PollingIndicator pollCount={pollCount} maxPolls={MAX_POLLS} />
        </div>
      </ErrorBoundary>
    );
  }

  if (status === 'timeout') {
    return (
      <ErrorBoundary>
        <BreTimeoutState
          onWait={handleWait}
          requestId={requestId}
        />
      </ErrorBoundary>
    );
  }

  if (status === 'failed') {
    return (
      <ErrorBoundary>
        <BreFailureState
          onRetry={handleRetry}
          requestId={requestId}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Loader message="Loading..." />
    </ErrorBoundary>
  );
};

export default BreStatusEmbed;
