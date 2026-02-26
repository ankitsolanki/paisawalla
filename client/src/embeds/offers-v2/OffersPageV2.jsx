import { useState, useEffect, useCallback, useRef } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { mapErrorToState, getErrorMessage } from '../../utils/errorMapper';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import OtpGate from '../offers/OtpGate';
import BrandedLoaderV2 from './BrandedLoaderV2';
import OffersListingV2 from './OffersListingV2';
import EmptyStateV2 from './EmptyStateV2';
import ErrorStateV2 from './ErrorStateV2';
import TimeoutStateV2 from './TimeoutStateV2';

const SESSION_KEY_PREFIX = 'pw_session_';
const getSessionKey = (applicationId) => `${SESSION_KEY_PREFIX}${applicationId}`;

const OffersSkeleton = () => (
  <div data-testid="offers-skeleton-v2" className="p-6 flex flex-col gap-4">
    <div className="h-[80px] rounded-2xl bg-muted" />
    <div className="flex gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-9 w-24 rounded-full bg-muted" />
      ))}
    </div>
    <div className="h-[240px] rounded-2xl bg-muted border-2 border-muted p-5 flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-full bg-muted-foreground/10" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-5 w-3/5 rounded-lg bg-muted-foreground/10" />
          <div className="h-4 w-2/5 rounded-lg bg-muted-foreground/10" />
          <div className="flex gap-2 mt-2">
            <div className="flex-1 h-16 rounded-lg bg-muted-foreground/10" />
            <div className="flex-1 h-16 rounded-lg bg-muted-foreground/10" />
            <div className="flex-1 h-16 rounded-lg bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="h-[160px] rounded-2xl bg-muted p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted-foreground/10" />
          <div className="flex-1">
            <div className="h-4 w-2/5 rounded-lg bg-muted-foreground/10" />
            <div className="h-3 w-1/4 rounded-lg bg-muted-foreground/10 mt-1" />
          </div>
          <div className="w-11 h-11 rounded-full bg-muted-foreground/10" />
        </div>
        <div className="flex gap-3 mt-auto">
          <div className="flex-1 h-10 rounded-xl bg-muted-foreground/10" />
          <div className="w-20 h-10 rounded-xl bg-muted-foreground/10" />
        </div>
      </div>
    ))}
  </div>
);

const formatTimeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

const RefreshSpinner = () => (
  <span className="inline-block w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-[v2PageSpin_0.8s_linear_infinite]" />
);

const OffersPageV2 = ({ applicationId, leadId, theme = 'light', onStateChange }) => {
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
    webflowBridge.postMessage('offersPageStateChange', { state: newState, applicationId, ...data });
    if (onStateChange) onStateChange(newState, data);
  }, [applicationId, onStateChange]);

  const transitionTo = useCallback((newState, data = {}) => {
    if (!mountedRef.current) return;
    console.log(`[PW:Offers] state → ${newState}`, data);
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
    console.log('[PW:Offers] fetchOffers start', { applicationId });
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('BRE_TIMEOUT')), TIMEOUTS.OFFERS_FETCH);
    });

    try {
      const response = await Promise.race([
        apiClient.post(`/api/applications/${applicationId}/offers`),
        timeoutPromise,
      ]);
      clearTimeout(timeoutHandle);

      if (response?.ok === false) {
        const errorState = mapErrorToState({ code: response.code, message: response.message });
        console.warn('[PW:Offers] fetchOffers api error', { code: response.code, message: response.message, errorState });
        setError(new Error(response.message || 'Failed to fetch offers'));
        transitionTo(errorState, { error: response.message });
        return;
      }

      const offersList = response?.offers || [];
      if (offersList.length === 0) {
        console.log('[PW:Offers] fetchOffers empty — no offers returned');
        transitionTo('empty', { count: 0 });
        return;
      }

      console.log('[PW:Offers] fetchOffers success', { count: offersList.length, lenders: offersList.map((o) => o.lender || o.lenderName) });
      setOffers(offersList);
      setLastUpdated(Date.now());
      transitionTo('success', { count: offersList.length });
    } catch (err) {
      clearTimeout(timeoutHandle);
      const errorState = mapErrorToState(err);
      console.error('[PW:Offers] fetchOffers error', { message: err.message, code: err.code, errorState });
      setError(err);
      transitionTo(errorState, { error: getErrorMessage(err), code: err.code });
    }
  }, [applicationId, transitionTo]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    console.log('[PW:Offers] handleRefresh start', { applicationId });
    setIsRefreshing(true);
    setRefreshStatus(null);

    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('BRE_TIMEOUT')), TIMEOUTS.OFFERS_FETCH);
    });

    try {
      const response = await Promise.race([
        apiClient.post(`/api/applications/${applicationId}/offers`),
        timeoutPromise,
      ]);
      clearTimeout(timeoutHandle);

      const offersList = response?.offers || [];
      if (offersList.length > 0) {
        console.log('[PW:Offers] handleRefresh success', { count: offersList.length });
        setOffers(offersList);
        setLastUpdated(Date.now());
        setRefreshStatus('updated');
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setRefreshStatus(null);
        }, 2000);
      } else {
        console.log('[PW:Offers] handleRefresh — no new offers');
      }
    } catch (err) {
      console.warn('[PW:Offers] handleRefresh error', { message: err?.message });
      setRefreshStatus(null);
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [applicationId, isRefreshing]);

  const fetchPhoneAndShowOtp = useCallback(async () => {
    console.log('[PW:Offers] fetchPhone start', { applicationId });
    try {
      const response = await apiClient.get(`/api/offers/application/${applicationId}/phone`);
      if (mountedRef.current) {
        const phoneInfo = response?.data || response;
        console.log('[PW:Offers] fetchPhone success', { maskedPhone: phoneInfo?.maskedPhone });
        setPhoneData(phoneInfo);
        transitionTo('otp_required');
      }
    } catch (err) {
      console.error('[PW:Offers] fetchPhone error', { message: err.message, status: err.status });
      if (mountedRef.current) {
        setError(err);
        transitionTo('error', { error: getErrorMessage(err) });
      }
    }
  }, [applicationId, transitionTo]);

  useEffect(() => {
    mountedRef.current = true;
    console.log('[PW:Offers] mount', { applicationId, leadId, theme });
    console.log('[PW:Offers] viewport', {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      screenWidth: window.screen.width,
      devicePixelRatio: window.devicePixelRatio,
      bodyMinWidth: window.getComputedStyle(document.body).minWidth,
      bodyWidth: window.getComputedStyle(document.body).width,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyOverflowX: window.getComputedStyle(document.body).overflowX,
    });
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!applicationId) {
      console.warn('[PW:Offers] no applicationId — cannot load');
      setError(new Error('Application ID is required'));
      transitionTo('error', { error: 'Application ID is required' });
      return;
    }

    const checkSession = async () => {
      const sessionKey = getSessionKey(applicationId);
      const token = localStorage.getItem(sessionKey);
      console.log('[PW:Offers] checkSession', { applicationId, hasToken: !!token });

      if (token) {
        try {
          const response = await apiClient.post('/api/auth/validate-token', { token, applicationId });
          if (response?.valid) {
            console.log('[PW:Offers] session valid → fetching offers');
            transitionTo('loading');
            fetchOffers();
            return;
          }
          console.log('[PW:Offers] session token invalid → clearing, will request OTP');
        } catch (err) {
          console.warn('[PW:Offers] session validate error', { message: err.message });
          localStorage.removeItem(sessionKey);
        }
      } else {
        console.log('[PW:Offers] no session token → requesting OTP');
      }
      fetchPhoneAndShowOtp();
    };

    checkSession();
  }, [applicationId]);

  const handleOtpVerified = useCallback((sessionToken) => {
    if (!mountedRef.current) return;
    localStorage.setItem(getSessionKey(applicationId), sessionToken);
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
          <div data-testid="offers-checking-v2" className="flex items-center justify-center min-h-[300px]">
            <BrandedLoaderV2 message="Verifying your session..." />
          </div>
        );

      case 'otp_required':
        return (
          <div data-testid="offers-otp-required-v2" className="relative min-h-[500px]">
            <div className="blur-[6px] pointer-events-none select-none">
              <OffersSkeleton />
            </div>
            <OtpGate
              phone={phoneData?.phone}
              maskedPhone={phoneData?.maskedPhone}
              applicationId={applicationId}
              onVerified={handleOtpVerified}
              onError={(err) => console.error('OTP error:', err)}
            />
          </div>
        );

      case 'loading':
        return (
          <div data-testid="offers-loading-v2">
            <BrandedLoaderV2 />
          </div>
        );

      case 'success':
        return (
          <div data-testid="offers-success-v2">
            <div
              data-testid="offers-header-v2"
              className="p-5 md:px-6 md:pt-6 md:pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans"
            >
              <div>
                <h1
                  data-testid="text-offers-heading-v2"
                  className="text-2xl font-bold text-foreground m-0 leading-tight"
                >
                  Your Loan Offers
                </h1>
                <p
                  data-testid="text-offers-subtitle-v2"
                  className="text-sm text-muted-foreground mt-1 leading-relaxed"
                >
                  Personalized offers ranked by approval probability
                </p>
                {lastUpdated && (
                  <p data-testid="text-last-updated-v2" className="text-[10px] text-muted-foreground/50 mt-1">
                    Updated {timeAgoText}
                  </p>
                )}
              </div>

              <button
                data-testid="button-refresh-offers-v2"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center justify-center gap-2 w-full md:w-auto px-5 md:px-4 py-3 md:py-2 border rounded-xl text-sm md:text-xs font-semibold font-sans whitespace-nowrap shrink-0 transition-all duration-200 ${
                  refreshStatus === 'updated'
                    ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                    : 'border-border bg-transparent text-muted-foreground'
                } ${isRefreshing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isRefreshing ? (
                  <>
                    <RefreshSpinner />
                    Refreshing...
                  </>
                ) : refreshStatus === 'updated' ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L4.5 8.5L10 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Updated
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 2V5H7" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 10V7H5" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 4.5A4.5 4.5 0 0 1 10 5" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M9 7.5A4.5 4.5 0 0 1 2 7" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>

            <OffersListingV2
              applicationId={applicationId}
              leadId={leadId}
              theme={theme}
              onStateChange={onStateChange}
            />
          </div>
        );

      case 'empty':
        return (
          <div data-testid="offers-empty-v2">
            <EmptyStateV2
              applicationId={applicationId}
              leadId={leadId}
              onRequestCallback={() => webflowBridge.postMessage('requestCallback', { applicationId })}
            />
          </div>
        );

      case 'error':
        return (
          <div data-testid="offers-error-v2">
            <ErrorStateV2 error={error} onRetry={handleRetry} />
          </div>
        );

      case 'timeout':
        return (
          <div data-testid="offers-timeout-v2">
            <TimeoutStateV2
              onWait={handleRetry}
              onEmailMe={() => webflowBridge.postMessage('emailOffers', { applicationId })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div data-testid="offers-page-v2" className="font-sans min-h-[400px] max-w-full overflow-x-hidden">
        {renderContent()}
      </div>
      <style>{`
        @keyframes v2PageSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default OffersPageV2;
