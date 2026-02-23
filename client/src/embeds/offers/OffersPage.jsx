import { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { mapErrorToState, getErrorMessage } from '../../utils/errorMapper';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import OtpGate from './OtpGate';
import BrandedLoader from './BrandedLoader';
import OffersListing from './OffersListing';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import TimeoutState from './TimeoutState';

const SESSION_KEY_PREFIX = 'pw_session_';

const getSessionKey = (applicationId) => `${SESSION_KEY_PREFIX}${applicationId}`;

const OffersSkeleton = () => (
  <div data-testid="offers-skeleton" className="p-6 flex flex-col gap-4">
    <div className="h-[100px] rounded-[20px] bg-muted" />
    {[0, 1, 2].map((i) => (
      <div key={i} className="h-[200px] rounded-[24px] bg-muted p-6 flex flex-col gap-3">
        <div className="h-5 w-3/5 rounded-lg bg-muted-foreground/10" />
        <div className="h-4 w-2/5 rounded-lg bg-muted-foreground/10" />
        <div className="flex gap-4 mt-auto">
          <div className="flex-1 h-12 rounded-xl bg-muted-foreground/10" />
          <div className="flex-1 h-12 rounded-xl bg-muted-foreground/10" />
          <div className="flex-1 h-12 rounded-xl bg-muted-foreground/10" />
        </div>
      </div>
    ))}
  </div>
);

const RefreshSpinner = () => (
  <span className="inline-block w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-[offersPageSpin_0.8s_linear_infinite]" />
);

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = Date.now();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
};

const OffersPage = ({ applicationId, leadId, theme = 'light', onStateChange }) => {
  const [state, setState] = useState('checking');
  const [phoneData, setPhoneData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [timeAgoText, setTimeAgoText] = useState('');
  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);

  const notifyState = useCallback((newState, data = {}) => {
    webflowBridge.postMessage('offersPageStateChange', {
      state: newState,
      applicationId,
      ...data,
    });
    if (onStateChange) {
      onStateChange(newState, data);
    }
  }, [applicationId, onStateChange]);

  const transitionTo = useCallback((newState, data = {}) => {
    if (!mountedRef.current) return;
    setState(newState);
    notifyState(newState, data);
  }, [notifyState]);

  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => setTimeAgoText(formatTimeAgo(lastUpdated));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const fetchOffers = useCallback(async () => {
    if (!applicationId) return;

    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('BRE_TIMEOUT'));
      }, TIMEOUTS.OFFERS_FETCH);
    });

    try {
      const response = await Promise.race([
        apiClient.post(`/api/applications/${applicationId}/offers`),
        timeoutPromise,
      ]);

      clearTimeout(timeoutHandle);

      if (response?.ok === false) {
        const errorState = mapErrorToState({
          code: response.code,
          message: response.message,
        });
        setError(new Error(response.message || 'Failed to fetch offers'));
        transitionTo(errorState, { error: response.message });
        return;
      }

      const offersList = response?.offers || [];

      if (offersList.length === 0) {
        transitionTo('empty', { count: 0 });
        return;
      }

      setOffers(offersList);
      setLastUpdated(Date.now());
      transitionTo('success', { count: offersList.length });
    } catch (err) {
      clearTimeout(timeoutHandle);
      const errorState = mapErrorToState(err);
      const errorMessage = getErrorMessage(err);
      setError(err);
      transitionTo(errorState, { error: errorMessage, code: err.code });
    }
  }, [applicationId, transitionTo]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatus(null);

    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('BRE_TIMEOUT'));
      }, TIMEOUTS.OFFERS_FETCH);
    });

    try {
      const response = await Promise.race([
        apiClient.post(`/api/applications/${applicationId}/offers`),
        timeoutPromise,
      ]);

      clearTimeout(timeoutHandle);

      const offersList = response?.offers || [];
      if (offersList.length > 0) {
        setOffers(offersList);
        setLastUpdated(Date.now());
        setRefreshStatus('updated');
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setRefreshStatus(null);
        }, 2000);
      }
    } catch (err) {
      setRefreshStatus(null);
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [applicationId, isRefreshing]);

  const fetchPhoneAndShowOtp = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/offers/application/${applicationId}/phone`);
      if (mountedRef.current) {
        setPhoneData(response?.data || response);
        transitionTo('otp_required');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        transitionTo('error', { error: getErrorMessage(err) });
      }
    }
  }, [applicationId, transitionTo]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!applicationId) {
      setError(new Error('Application ID is required'));
      transitionTo('error', { error: 'Application ID is required' });
      return;
    }

    const checkSession = async () => {
      const sessionKey = getSessionKey(applicationId);
      const token = localStorage.getItem(sessionKey);

      if (token) {
        try {
          const response = await apiClient.post('/api/auth/validate-token', {
            token,
            applicationId,
          });

          if (response?.valid) {
            transitionTo('loading');
            fetchOffers();
            return;
          }
        } catch (err) {
          localStorage.removeItem(sessionKey);
        }
      }

      fetchPhoneAndShowOtp();
    };

    checkSession();
  }, [applicationId]);

  const handleOtpVerified = useCallback((sessionToken) => {
    if (!mountedRef.current) return;
    const sessionKey = getSessionKey(applicationId);
    localStorage.setItem(sessionKey, sessionToken);
    transitionTo('loading');
    fetchOffers();
  }, [applicationId, transitionTo, fetchOffers]);

  const handleRetry = useCallback(() => {
    transitionTo('loading');
    fetchOffers();
  }, [transitionTo, fetchOffers]);

  const renderContent = () => {
    switch (state) {
      case 'checking':
        return (
          <div data-testid="offers-checking" className="flex items-center justify-center min-h-[300px]">
            <BrandedLoader message="Verifying your session..." />
          </div>
        );

      case 'otp_required':
        return (
          <div data-testid="offers-otp-required" className="relative min-h-[500px]">
            <div className="blur-[6px] pointer-events-none select-none">
              <OffersSkeleton />
            </div>
            <OtpGate
              phone={phoneData?.phone}
              maskedPhone={phoneData?.maskedPhone}
              applicationId={applicationId}
              onVerified={handleOtpVerified}
              onError={(err) => {
                console.error('OTP error:', err);
              }}
            />
          </div>
        );

      case 'loading':
        return (
          <div data-testid="offers-loading">
            <BrandedLoader />
          </div>
        );

      case 'success':
        return (
          <div data-testid="offers-success">
            <div
              data-testid="offers-header"
              className="p-5 md:px-6 md:pt-6 md:pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans"
            >
              <div>
                <h1
                  data-testid="text-offers-heading"
                  className="text-2xl font-bold text-foreground m-0 leading-tight"
                >
                  Your Loan Offers
                </h1>
                <p
                  data-testid="text-offers-subtitle"
                  className="text-sm text-muted-foreground mt-1 leading-relaxed"
                >
                  Based on your application, here are your personalized loan offers
                </p>
                {lastUpdated && (
                  <p
                    data-testid="text-last-updated"
                    className="text-xs text-muted-foreground/60 mt-1"
                  >
                    Last updated: {timeAgoText}
                  </p>
                )}
              </div>

              <button
                data-testid="button-refresh-offers"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-sm font-semibold font-sans whitespace-nowrap shrink-0 transition-all duration-200 ${
                  refreshStatus === 'updated'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-transparent text-foreground/70'
                } ${isRefreshing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isRefreshing ? (
                  <>
                    <RefreshSpinner />
                    Refreshing...
                  </>
                ) : refreshStatus === 'updated' ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7L5.5 10.5L12 3.5" className="stroke-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Updated!
                  </>
                ) : (
                  'Refresh Offers'
                )}
              </button>
            </div>

            <OffersListing
              applicationId={applicationId}
              leadId={leadId}
              theme={theme}
              onStateChange={onStateChange}
            />
          </div>
        );

      case 'empty':
        return (
          <div data-testid="offers-empty">
            <EmptyState
              applicationId={applicationId}
              leadId={leadId}
              onRequestCallback={() => {
                webflowBridge.postMessage('requestCallback', { applicationId });
              }}
            />
          </div>
        );

      case 'error':
        return (
          <div data-testid="offers-error">
            <ErrorState
              error={error}
              onRetry={handleRetry}
            />
          </div>
        );

      case 'timeout':
        return (
          <div data-testid="offers-timeout">
            <TimeoutState
              onWait={handleRetry}
              onEmailMe={() => {
                webflowBridge.postMessage('emailOffers', { applicationId });
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div
        data-testid="offers-page"
        className="font-sans min-h-[400px]"
      >
        {renderContent()}
      </div>

      <style>{`
        @keyframes offersPageSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default OffersPage;
