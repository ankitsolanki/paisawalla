import React, { useEffect, useState, useCallback } from 'react';
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
import { tokens } from '../../design-system/tokens';

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
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('apr'); // 'apr' or 'amount'

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
      const sortedOffers = [...offersList].sort((a, b) => {
        if (sortBy === 'apr') {
          return a.apr - b.apr; // Lower APR first
        } else if (sortBy === 'amount') {
          return b.amount - a.amount; // Higher amount first
        }
        return 0;
      });

      setOffers(sortedOffers);
      setStatus('success');
      notifyStateChange('success', { 
        count: sortedOffers.length,
        offers: sortedOffers,
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
  }, [applicationId, timeout, sortBy, notifyStateChange]);

  // Initial fetch
  useEffect(() => {
    fetchOffers();
  }, [applicationId]); // Only re-fetch if applicationId changes

  // Retry handler
  const handleRetry = useCallback(() => {
    fetchOffers();
  }, [fetchOffers]);

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
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: tokens.spacing.lg,
          }}
        >
          {/* Header */}
          <div
            style={{
              marginBottom: tokens.spacing.xl,
            }}
          >
            <h2
              style={{
                fontSize: tokens.typography.fontSize['2xl'],
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.colors.gray[900],
                marginBottom: tokens.spacing.sm,
              }}
            >
              Your Loan Offers
            </h2>
            <p
              style={{
                fontSize: tokens.typography.fontSize.base,
                color: tokens.colors.gray[600],
              }}
            >
              We found {offers.length} {offers.length === 1 ? 'offer' : 'offers'} for you
            </p>
          </div>

          {/* Sort Controls */}
          {offers.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: tokens.spacing.md,
                marginBottom: tokens.spacing.lg,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.gray[600],
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Sort by:
              </span>
              <button
                onClick={() => setSortBy('apr')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                  fontSize: tokens.typography.fontSize.sm,
                  backgroundColor: sortBy === 'apr' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: sortBy === 'apr' ? '#ffffff' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  transition: `all ${tokens.transitions.normal} ease-in-out`,
                }}
              >
                Lowest APR
              </button>
              <button
                onClick={() => setSortBy('amount')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
                  fontSize: tokens.typography.fontSize.sm,
                  backgroundColor: sortBy === 'amount' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: sortBy === 'amount' ? '#ffffff' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  transition: `all ${tokens.transitions.normal} ease-in-out`,
                }}
              >
                Highest Amount
              </button>
            </div>
          )}

          {/* Offers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: tokens.spacing.lg,
            }}
          >
            {offers.map((offer, index) => (
              <OfferCard
                key={offer.id || offer._id || `offer-${index}`}
                offer={offer}
                applicationId={applicationId}
              />
            ))}
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default OffersListing;

