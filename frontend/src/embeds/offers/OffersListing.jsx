import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ThemeProvider } from '../../design-system/ThemeProvider';
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
import { useResponsive } from '../../hooks/useResponsive';
import './offersListing.css';

/**
 * OffersListing Component
 * Main component that fetches and displays loan offers
 */
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
  const { isMobile, isTablet, isDesktop } = useResponsive();

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

  // Notify Webflow of state changes
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

  // Fetch offers from API
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

      // Check if response is valid
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

      // Check if offers exist
      const offersList = response?.offers || [];
      
      if (offersList.length === 0) {
        setStatus('empty');
        notifyStateChange('empty', { count: 0 });
        return;
      }

      // Sort offers
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

  // Initial fetch
  useEffect(() => {
    fetchOffers();
  }, [applicationId]); // Only re-fetch if applicationId changes

  // Retry handler
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

  // Render based on status
  if (status === 'loading') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <Loader />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (status === 'timeout') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <TimeoutState
            onWait={handleRetry}
            onEmailMe={() => {
              webflowBridge.postMessage('emailOffers', { applicationId });
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (status === 'error') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <ErrorState
            error={error}
            onRetry={handleRetry}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  if (status === 'empty') {
    return (
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <EmptyState
            applicationId={applicationId}
            leadId={leadId}
            onRequestCallback={() => {
              webflowBridge.postMessage('requestCallback', { applicationId });
            }}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Success state - render offers
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div className="offers-shell">
          <section className="offers-summary-card">
            <div className="offers-summary-card__row">
              <div>
                <p className="offers-eyebrow">You Need a loan of</p>
                <p className="offers-summary-value">
                  ₹{(allOffers[0]?.amount || 200000).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                className="offers-summary-card__edit"
                onClick={() => webflowBridge.postMessage('editLoanPreferences', { applicationId })}
              >
                Edit
              </button>
            </div>
            <div className="offers-summary-card__row">
              <div>
                <p className="offers-eyebrow">Loan Period</p>
                <p className="offers-summary-value">
                  {Math.max(1, Math.round((allOffers[0]?.term || 36) / 12))} years
                </p>
              </div>
              <div className="offers-summary-card__badge">
                ⭐ Matching the best lenders for you
              </div>
            </div>
          </section>

          {isMobile && (
            <div className="offers-mobile-actions">
              <button
                className="offers-chip"
                onClick={() => setFilterSheetOpen(true)}
              >
                Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
              </button>
              <button
                className="offers-chip"
                onClick={() => setSortSheetOpen(true)}
              >
                {currentSortLabel}
              </button>
            </div>
          )}

          {!isMobile && (
            <div className="offers-desktop-toolbar">
              <div className="offers-results-label">
                {visibleOffers.length} {visibleOffers.length === 1 ? 'Result' : 'Results'}
              </div>
              <div className="offers-desktop-actions">
                <div className="offers-select-wrapper">
                  <label>Sort by</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="offers-select-wrapper">
                  <label>Filters</label>
                  <div className="offers-desktop-filter-pills">
                    {FILTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        className={`offers-filter-pill ${filters[preset.id] ? 'offers-filter-pill--active' : ''}`}
                        onClick={() => handleFilterToggle(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isMobile && activeFilterCount > 0 && (
            <div className="offers-active-filter-row">
              {FILTER_PRESETS.filter((preset) => filters[preset.id]).map((preset) => (
                <span key={preset.id} className="offers-active-filter-chip">
                  {preset.label}
                  <button onClick={() => handleFilterToggle(preset.id)}>×</button>
                </span>
              ))}
              <button className="offers-clear-filter" onClick={handleClearFilters}>
                Clear all
              </button>
            </div>
          )}

          <div className="offers-results-label mobile-only">
            {visibleOffers.length} {visibleOffers.length === 1 ? 'Result' : 'Results'}
          </div>

          {/* Offers List (Vertical) */}
          <div className="offers-list">
            {visibleOffers.length === 0 && activeFilterCount > 0 ? (
              <div className="offers-empty-state">
                <p>No offers match the selected filters.</p>
                <button onClick={handleClearFilters}>Clear Filters</button>
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
          <div className="offers-sheet-backdrop" onClick={() => setFilterSheetOpen(false)}>
            <div
              className="offers-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="offers-sheet__header">
                <h3>Filters</h3>
                <button onClick={handleClearFilters}>Clear All</button>
              </div>
              <div className="offers-sheet__content">
                <div className="offers-filter-section">
                  <p>Key Features</p>
                  <div className="offers-sheet-option-list">
                    {FILTER_PRESETS.map((preset) => (
                      <label key={preset.id} className="offers-checkbox">
                        <input
                          type="checkbox"
                          checked={filters[preset.id]}
                          onChange={() => handleFilterToggle(preset.id)}
                        />
                        <span>{preset.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="offers-sheet__footer">
                <button
                  className="offers-secondary-btn"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="offers-primary-btn"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {isSortSheetOpen && (
          <div className="offers-sheet-backdrop" onClick={() => setSortSheetOpen(false)}>
            <div
              className="offers-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="offers-sheet__header">
                <h3>Sort by</h3>
                <button onClick={() => setSortSheetOpen(false)}>Close</button>
              </div>
              <div className="offers-sheet__content">
                <div className="offers-sheet-option-list">
                  {SORT_OPTIONS.map((option) => (
                    <label key={option.id} className="offers-radio">
                      <input
                        type="radio"
                        checked={sortBy === option.id}
                        onChange={() => setSortBy(option.id)}
                      />
                      <div>
                        <span>{option.label}</span>
                        <small>{option.helper}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="offers-sheet__footer">
                <button
                  className="offers-primary-btn"
                  onClick={() => setSortSheetOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default OffersListing;

