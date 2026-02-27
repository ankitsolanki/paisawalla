import { useEffect, useState, useCallback, useMemo } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { mapErrorToState, getErrorMessage } from '../../utils/errorMapper';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import OfferCardV2 from './OfferCardV2';
import { ComparisonTray, ComparisonSheet } from './ComparisonTray';
import EmptyStateV2 from './EmptyStateV2';
import ErrorStateV2 from './ErrorStateV2';
import TimeoutStateV2 from './TimeoutStateV2';
import BrandedLoaderV2 from './BrandedLoaderV2';

const FILTER_CHIPS = [
  { id: 'all', label: 'All Offers' },
  { id: 'preApproved', label: 'Pre-approved' },
  { id: 'quickDisbursal', label: 'Quick Disbursal' },
  { id: 'lowInterest', label: 'Low Interest' },
  { id: 'noForeclosure', label: 'No Foreclosure' },
];

const SORT_OPTIONS = [
  { id: 'approval', label: 'Best Match' },
  { id: 'rate', label: 'Lowest Rate' },
  { id: 'emi', label: 'Lowest EMI' },
  { id: 'disbursal', label: 'Fastest Disbursal' },
];

const LENDER_ATTRIBUTES = {
  poonawalla: { preApproved: false, quickDisbursal: false },
  poonawaala: { preApproved: false, quickDisbursal: false },
  prefr: { preApproved: false, quickDisbursal: false },
  prefer: { preApproved: false, quickDisbursal: false },
  abfl: { preApproved: false, quickDisbursal: false },
  hero_fincorp: { preApproved: false, quickDisbursal: false },
  herofincorp: { preApproved: false, quickDisbursal: false },
  mpokket: { preApproved: false, quickDisbursal: false },
};

const LENDER_FORECLOSURE = {
  poonawalla: 'Nil',
  poonawaala: 'Nil',
  prefr: '5% of Principal Outstanding',
  prefer: '5% of Principal Outstanding',
  abfl: '4% of the principal outstanding + applicable GST',
  hero_fincorp: '4-5% of the principal outstanding + applicable GST',
  herofincorp: '4-5% of the principal outstanding + applicable GST',
  mpokket: '3% of Principal Outstanding',
};

const normalizeLenderKey = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/[\s_-]+/g, '_').trim();
};

const checkForeclosureNil = (value) => {
  if (value === 0 || value === '0') return true;
  if (!value || typeof value !== 'string') return false;
  const normalized = value.toLowerCase().trim();
  return normalized === 'nil' || normalized === 'none' || normalized === 'no charges' || normalized === 'zero' || normalized === 'na' || normalized === 'n/a';
};

const isNoForeclosure = (offer) => {
  const lenderName = offer.lender || offer.lenderName;
  const key = normalizeLenderKey(lenderName);
  const mappedFc = LENDER_FORECLOSURE[key];
  if (mappedFc !== undefined) return checkForeclosureNil(mappedFc);
  const offerFc = offer.offerData?.charges?.foreclosure ?? offer.offerData?.foreclosure;
  if (offerFc !== undefined) return checkForeclosureNil(offerFc);
  return false;
};

const getLenderAttr = (lenderName, attr) => {
  const key = normalizeLenderKey(lenderName);
  return LENDER_ATTRIBUTES[key]?.[attr] ?? false;
};

const OffersListingV2 = ({
  applicationId,
  leadId,
  theme = 'light',
  timeout = TIMEOUTS.OFFERS_FETCH,
  onStateChange,
}) => {
  const [allOffers, setAllOffers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('approval');
  const [compareOffers, setCompareOffers] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const computeApprovalScore = useCallback((offer) => {
    if (!offer) return 0;
    const base = offer.offerType === 'pre-approved' ? 920 : offer.offerType === 'conditional' ? 800 : 720;
    const aprWeight = (offer.apr || 0) ? Math.max(0, 120 - (offer.apr || 0) * 2) : 60;
    return Math.min(990, base + aprWeight);
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...allOffers];

    if (activeFilter === 'preApproved') {
      list = list.filter((o) => getLenderAttr(o.lender || o.lenderName, 'preApproved'));
    } else if (activeFilter === 'quickDisbursal') {
      list = list.filter((o) => getLenderAttr(o.lender || o.lenderName, 'quickDisbursal'));
    } else if (activeFilter === 'lowInterest') {
      list = list.filter((o) => (o.apr || 99) <= 14);
    } else if (activeFilter === 'noForeclosure') {
      list = list.filter((o) => isNoForeclosure(o));
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'approval':
          return computeApprovalScore(b) - computeApprovalScore(a);
        case 'rate':
          return (a.apr || Infinity) - (b.apr || Infinity);
        case 'emi': {
          const emiA = a.monthlyPayment || Math.round((a.amount || 0) / Math.max(a.term || 36, 1));
          const emiB = b.monthlyPayment || Math.round((b.amount || 0) / Math.max(b.term || 36, 1));
          return emiA - emiB;
        }
        case 'disbursal': {
          const dA = a.offerData?.disbursalTimeHours || 72;
          const dB = b.offerData?.disbursalTimeHours || 72;
          return dA - dB;
        }
        default:
          return 0;
      }
    });

    return list;
  }, [allOffers, activeFilter, sortBy, computeApprovalScore]);

  const notifyStateChange = useCallback((newStatus, data = {}) => {
    webflowBridge.postMessage('offersStateChange', { status: newStatus, applicationId, ...data });
    if (onStateChange) onStateChange(newStatus, data);
  }, [applicationId, onStateChange]);

  const fetchOffers = useCallback(async () => {
    if (!applicationId) {
      console.warn('[PW:Listing] fetchOffers — no applicationId');
      setError(new Error('Application ID is required'));
      setStatus('error');
      notifyStateChange('error', { error: 'Application ID is required' });
      return;
    }

    setStatus('loading');
    setError(null);
    notifyStateChange('loading');

    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('BRE_TIMEOUT')), timeout);
    });

    try {
      const response = await Promise.race([
        apiClient.post(`/api/applications/${applicationId}/offers`),
        timeoutPromise,
      ]);
      clearTimeout(timeoutHandle);


      if (response?.ok === false) {
        const errorState = mapErrorToState({ code: response.code, message: response.message });
        console.warn('[PW:Listing] fetchOffers api error', { code: response.code, message: response.message, errorState });
        setStatus(errorState);
        setError(new Error(response.message || 'Failed to fetch offers'));
        notifyStateChange(errorState, { error: response.message });
        return;
      }

      const offersList = response?.offers || [];
      if (offersList.length === 0) {
        setStatus('empty');
        notifyStateChange('empty', { count: 0 });
        return;
      }

      setAllOffers(offersList);
      setStatus('success');
      notifyStateChange('success', { count: offersList.length, offers: offersList });
    } catch (err) {
      clearTimeout(timeoutHandle);
      const errorState = mapErrorToState(err);
      console.error('[PW:Listing] fetchOffers error', { message: err.message, code: err.code, errorState });
      setError(err);
      setStatus(errorState);
      notifyStateChange(errorState, { error: getErrorMessage(err), code: err.code });
    }
  }, [applicationId, timeout, notifyStateChange]);

  useEffect(() => {
    fetchOffers();
  }, [applicationId]);

  useEffect(() => {
    if (!showSortDropdown) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setShowSortDropdown(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showSortDropdown]);

  const handleRetry = useCallback(() => { fetchOffers(); }, [fetchOffers]);

  const handleToggleCompare = useCallback((offer) => {
    setCompareOffers((prev) => {
      const id = offer.id || offer._id;
      const exists = prev.some((o) => (o.id || o._id) === id);
      if (exists) return prev.filter((o) => (o.id || o._id) !== id);
      if (prev.length >= 3) return prev;
      return [...prev, offer];
    });
  }, []);

  const isCompareSelected = useCallback((offer) => {
    const id = offer.id || offer._id;
    return compareOffers.some((o) => (o.id || o._id) === id);
  }, [compareOffers]);

  if (status === 'loading') {
    return <ErrorBoundary><BrandedLoaderV2 /></ErrorBoundary>;
  }
  if (status === 'timeout') {
    return (
      <ErrorBoundary>
        <TimeoutStateV2
          onWait={handleRetry}
          onEmailMe={() => webflowBridge.postMessage('emailOffers', { applicationId })}
        />
      </ErrorBoundary>
    );
  }
  if (status === 'error') {
    return <ErrorBoundary><ErrorStateV2 error={error} onRetry={handleRetry} /></ErrorBoundary>;
  }
  if (status === 'empty') {
    return (
      <ErrorBoundary>
        <EmptyStateV2
          applicationId={applicationId}
          leadId={leadId}
          onRequestCallback={() => webflowBridge.postMessage('requestCallback', { applicationId })}
        />
      </ErrorBoundary>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label || 'Sort';

  return (
    <ErrorBoundary>
      <div className="font-sans pb-20 overflow-x-hidden">
        <div className="mx-4 md:mx-6 mt-3 flex flex-row items-center gap-2">
          <div className="relative flex-1 min-w-0 overflow-hidden">
            <div
              data-testid="filter-chips-v2"
              className="flex gap-1.5 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  data-testid={`chip-filter-${chip.id}`}
                  onClick={() => { setActiveFilter(chip.id); }}
                  className={`whitespace-nowrap px-3.5 md:px-3 py-2 md:py-1.5 rounded-full text-xs md:text-[11px] font-semibold cursor-pointer border transition-colors shrink-0 ${
                    activeFilter === chip.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground border-border'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-6"
              style={{ background: 'linear-gradient(to right, transparent, var(--background, #fff))' }}
            />
          </div>

          <div className="relative shrink-0">
            <button
              data-testid="button-sort-v2"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 md:gap-1 p-2 md:px-2.5 md:py-1.5 border border-border rounded-full text-xs md:text-[11px] font-semibold text-muted-foreground cursor-pointer bg-transparent"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 3H10M3 6H9M4 9H8" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="hidden md:inline">{currentSortLabel}</span>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className={`hidden md:block transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}>
                <path d="M2.5 3.75L5 6.25L7.5 3.75" className="stroke-current" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {sortBy !== 'approval' && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary border border-background translate-x-0.5 -translate-y-0.5" />
            )}
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg z-20 min-w-[150px] py-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    data-testid={`button-sort-option-${option.id}`}
                    onClick={() => { setSortBy(option.id); setShowSortDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-medium cursor-pointer border-none bg-transparent transition-colors ${
                      sortBy === option.id ? 'text-primary bg-primary/5' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                    {sortBy === option.id && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline ml-1.5">
                        <path d="M2 5L4 7L8 3" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mx-4 md:mx-6 mt-1.5 mb-2">
          <span className="text-[11px] text-muted-foreground font-medium">
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'offer' : 'offers'}
            {activeFilter !== 'all' && (
              <>
                {' '}&middot;{' '}
                <button
                  data-testid="button-clear-filter-v2"
                  onClick={() => setActiveFilter('all')}
                  className="bg-transparent border-none text-[11px] text-primary font-semibold cursor-pointer p-0 inline"
                >
                  Clear filter
                </button>
              </>
            )}
          </span>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-sm text-muted-foreground mb-2">No offers match this filter.</p>
            <button
              onClick={() => setActiveFilter('all')}
              className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer underline"
            >
              Show all offers
            </button>
          </div>
        ) : (
          <div className="px-4 md:px-6 flex flex-col gap-2">
            {filteredAndSorted.map((offer, index) => (
              <OfferCardV2
                key={offer.id || offer._id || `offer-${index}`}
                offer={offer}
                applicationId={applicationId}
                rank={index + 1}
                isCompareSelected={isCompareSelected(offer)}
                onToggleCompare={handleToggleCompare}
                isBestOffer={index === 0}
              />
            ))}
          </div>
        )}

        <div className="mx-4 md:mx-6 mt-4 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L1 3.5V6.5C1 8.1 2.7 9.5 5 10C7.3 9.5 9 8.1 9 6.5V3.5L5 1Z" className="fill-muted-foreground/20 stroke-muted-foreground/40" strokeWidth="0.8" />
            </svg>
            Bank-grade security
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {allOffers.length}+ lending partners checked
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            Rates subject to lender approval
          </span>
        </div>

        <ComparisonTray
          selectedOffers={compareOffers}
          onRemove={(offer) => handleToggleCompare(offer)}
          onClear={() => setCompareOffers([])}
          onCompare={() => setShowComparison(true)}
        />

        <ComparisonSheet
          offers={compareOffers}
          open={showComparison}
          onClose={() => setShowComparison(false)}
        />
      </div>

      {showSortDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </ErrorBoundary>
  );
};

export default OffersListingV2;
