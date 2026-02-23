import { useEffect, useState, useCallback, useMemo } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import apiClient from '../../utils/apiClient';
import { mapErrorToState, getErrorMessage } from '../../utils/errorMapper';
import { TIMEOUTS } from '../../utils/timeouts';
import { webflowBridge } from '../../embed/webflowBridge';
import OfferCard from './OfferCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import TimeoutState from './TimeoutState';
import Loader from './Loader';

const OffersListing = ({ 
  applicationId,
  leadId,
  theme = 'light',
  timeout = TIMEOUTS.OFFERS_FETCH,
  onStateChange,
}) => {
  const [allOffers, setAllOffers] = useState([]);
  const [visibleOffers, setVisibleOffers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('approval');
  const [filters, setFilters] = useState({
    quickDisbursal: false,
    noForeclosure: false,
  });
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setSortSheetOpen] = useState(false);

  const SORT_OPTIONS = [
    { id: 'approval', label: 'Approval Chances (Default)', helper: 'High to Low' },
    { id: 'disbursal', label: 'Disbursal Time', helper: 'Low to High' },
    { id: 'monthly', label: 'Monthly Payment', helper: 'Low to High' },
    { id: 'rate', label: 'Rate of Interest', helper: 'Low to High' },
  ];

  const FILTER_PRESETS = [
    { id: 'quickDisbursal', label: 'Quick Disbursal' },
    { id: 'noForeclosure', label: 'No Foreclosure Charges' },
  ];

  const computeApprovalScore = useCallback((offer) => {
    if (!offer) return 0;
    const base =
      offer.offerType === 'pre-approved' ? 900 :
      offer.offerType === 'conditional' ? 780 : 700;
    const aprWeight = offer.apr ? Math.max(0, 100 - offer.apr * 2) : 50;
    return base + aprWeight;
  }, []);

  const computeDisbursalTime = useCallback((offer) => {
    if (!offer) return Infinity;
    const offerData = offer.offerData || {};
    if (typeof offerData.disbursalTimeHours === 'number') {
      return offerData.disbursalTimeHours;
    }
    const processing = (offerData.processingTime || '').toString().toLowerCase();
    if (processing.includes('instant')) return 1;
    if (processing.includes('day')) return 24;
    return 72;
  }, []);

  const applyFiltersAndSort = useCallback((offersList, sortKey, activeFilters) => {
    if (!Array.isArray(offersList)) {
      return [];
    }

    const filtered = offersList.filter((offer) => {
      if (activeFilters.quickDisbursal) {
        const processing = offer.offerData?.processingTime?.toLowerCase() || '';
        const hasQuickBadge = offer.features?.some((feature) =>
          feature?.toLowerCase().includes('quick')
        );
        if (!processing.includes('instant') && !hasQuickBadge) {
          return false;
        }
      }

      if (activeFilters.noForeclosure) {
        const foreclosureCharge =
          offer.offerData?.charges?.foreclosure ||
          offer.offerData?.foreclosureCharges ||
          offer.offerData?.fees?.foreclosure ||
          null;
        if (!(foreclosureCharge === 0 || foreclosureCharge === 'NIL')) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'approval':
          return computeApprovalScore(b) - computeApprovalScore(a);
        case 'disbursal':
          return computeDisbursalTime(a) - computeDisbursalTime(b);
        case 'monthly':
          return (a.monthlyPayment || Infinity) - (b.monthlyPayment || Infinity);
        case 'rate':
          return (a.apr || Infinity) - (b.apr || Infinity);
        default:
          return 0;
      }
    });

    return sorted;
  }, [computeApprovalScore, computeDisbursalTime]);

  const notifyStateChange = useCallback((newStatus, data = {}) => {
    webflowBridge.postMessage('offersStateChange', {
      status: newStatus,
      applicationId,
      ...data,
    });
    if (onStateChange) {
      onStateChange(newStatus, data);
    }
  }, [applicationId, onStateChange]);

  const fetchOffers = useCallback(async () => {
    if (!applicationId) {
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
      timeoutHandle = setTimeout(() => {
        reject(new Error('BRE_TIMEOUT'));
      }, timeout);
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
      setVisibleOffers(applyFiltersAndSort(offersList, sortBy, filters));
      setStatus('success');
      notifyStateChange('success', { 
        count: offersList.length,
        offers: offersList,
      });

    } catch (err) {
      clearTimeout(timeoutHandle);
      
      const errorState = mapErrorToState(err);
      const errorMessage = getErrorMessage(err);
      
      setError(err);
      setStatus(errorState);
      notifyStateChange(errorState, { 
        error: errorMessage,
        code: err.code,
      });
    }
  }, [applicationId, timeout, sortBy, filters, notifyStateChange, applyFiltersAndSort]);

  useEffect(() => {
    fetchOffers();
  }, [applicationId]);

  const handleRetry = useCallback(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    setVisibleOffers(applyFiltersAndSort(allOffers, sortBy, filters));
  }, [allOffers, sortBy, filters, applyFiltersAndSort]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const handleFilterToggle = (id) => {
    setFilters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      quickDisbursal: false,
      noForeclosure: false,
    });
  };

  const currentSortLabel = useMemo(() => {
    const option = SORT_OPTIONS.find((opt) => opt.id === sortBy);
    return option ? option.label : 'Sort';
  }, [sortBy, SORT_OPTIONS]);

  if (status === 'loading') {
    return (
      <ErrorBoundary>
        <Loader />
      </ErrorBoundary>
    );
  }

  if (status === 'timeout') {
    return (
      <ErrorBoundary>
        <TimeoutState
          onWait={handleRetry}
          onEmailMe={() => {
            webflowBridge.postMessage('emailOffers', { applicationId });
          }}
        />
      </ErrorBoundary>
    );
  }

  if (status === 'error') {
    return (
      <ErrorBoundary>
        <ErrorState
          error={error}
          onRetry={handleRetry}
        />
      </ErrorBoundary>
    );
  }

  if (status === 'empty') {
    return (
      <ErrorBoundary>
        <EmptyState
          applicationId={applicationId}
          leadId={leadId}
          onRequestCallback={() => {
            webflowBridge.postMessage('requestCallback', { applicationId });
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="font-sans pb-6">
        <section className="mx-4 md:mx-6 mt-4 p-4 bg-accent rounded-2xl border border-border">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground m-0 uppercase tracking-wider">You Need a loan of</p>
              <p className="text-xl font-bold text-foreground m-0 mt-1">
                {'\u20B9'}{(allOffers[0]?.amount || 200000).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              data-testid="button-edit-preferences"
              onClick={() => webflowBridge.postMessage('editLoanPreferences', { applicationId })}
              className="bg-transparent border border-border rounded-full px-4 py-1.5 text-sm font-semibold text-primary cursor-pointer"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground m-0 uppercase tracking-wider">Loan Period</p>
              <p className="text-xl font-bold text-foreground m-0 mt-1">
                {Math.max(1, Math.round((allOffers[0]?.term || 36) / 12))} years
              </p>
            </div>
            <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
              Matching the best lenders for you
            </div>
          </div>
        </section>

        <div className="flex gap-2 px-4 mt-4 md:hidden">
          <button
            data-testid="button-filters-mobile"
            className="flex-1 bg-background border border-border rounded-full py-2 text-sm font-medium text-foreground cursor-pointer"
            onClick={() => setFilterSheetOpen(true)}
          >
            Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
          </button>
          <button
            data-testid="button-sort-mobile"
            className="flex-1 bg-background border border-border rounded-full py-2 text-sm font-medium text-foreground cursor-pointer"
            onClick={() => setSortSheetOpen(true)}
          >
            {currentSortLabel}
          </button>
        </div>

        <div className="hidden md:flex items-center justify-between px-6 mt-4 gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            {visibleOffers.length} {visibleOffers.length === 1 ? 'Result' : 'Results'}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground cursor-pointer"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Filters</label>
              <div className="flex gap-2">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    data-testid={`button-filter-${preset.id}`}
                    className={`border rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                      filters[preset.id]
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-foreground border-border'
                    }`}
                    onClick={() => handleFilterToggle(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="hidden md:flex items-center gap-2 px-6 mt-2">
            {FILTER_PRESETS.filter((preset) => filters[preset.id]).map((preset) => (
              <span key={preset.id} className="bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                {preset.label}
                <button
                  onClick={() => handleFilterToggle(preset.id)}
                  className="bg-transparent border-none text-accent-foreground/60 cursor-pointer p-0 text-sm leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="bg-transparent border-none text-destructive text-xs font-medium cursor-pointer p-0"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="md:hidden px-4 mt-3 text-sm text-muted-foreground font-medium">
          {visibleOffers.length} {visibleOffers.length === 1 ? 'Result' : 'Results'}
        </div>

        <div className="px-4 md:px-6 mt-4 flex flex-col gap-0">
          {visibleOffers.length === 0 && activeFilterCount > 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="mb-3">No offers match the selected filters.</p>
              <button
                onClick={handleClearFilters}
                className="bg-transparent border-none text-primary font-semibold cursor-pointer underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            visibleOffers.map((offer, index) => (
              <OfferCard
                key={offer.id || offer._id || `offer-${index}`}
                offer={offer}
                applicationId={applicationId}
              />
            ))
          )}
        </div>
      </div>

      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setFilterSheetOpen(false)}
        >
          <div
            className="bg-background w-full max-w-[500px] rounded-t-3xl font-sans"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground m-0">Filters</h3>
              <button
                onClick={handleClearFilters}
                className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Key Features</p>
              <div className="flex flex-col gap-3">
                {FILTER_PRESETS.map((preset) => (
                  <label key={preset.id} className="flex items-center gap-3 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={filters[preset.id]}
                      onChange={() => handleFilterToggle(preset.id)}
                      className="w-[18px] h-[18px] cursor-pointer"
                    />
                    <span>{preset.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-3">
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 py-2.5 border border-border rounded-full text-sm font-semibold text-muted-foreground bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 py-2.5 bg-primary text-primary-foreground border-none rounded-full text-sm font-semibold cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {isSortSheetOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setSortSheetOpen(false)}
        >
          <div
            className="bg-background w-full max-w-[500px] rounded-t-3xl font-sans"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-lg font-bold text-foreground m-0">Sort by</h3>
              <button
                onClick={() => setSortSheetOpen(false)}
                className="bg-transparent border-none text-muted-foreground text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-3">
                {SORT_OPTIONS.map((option) => (
                  <label key={option.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={sortBy === option.id}
                      onChange={() => setSortBy(option.id)}
                      className="w-[18px] h-[18px] cursor-pointer"
                    />
                    <div>
                      <span className="text-sm text-foreground font-medium block">{option.label}</span>
                      <small className="text-xs text-muted-foreground">{option.helper}</small>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <button
                onClick={() => setSortSheetOpen(false)}
                className="w-full py-2.5 bg-primary text-primary-foreground border-none rounded-full text-sm font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default OffersListing;
