import React, { useState } from 'react';
import OffersListing from '../embeds/offers/OffersListing';
import { tokens } from '../design-system/tokens';

/**
 * Test Page for Offers Listing
 * Used for development and testing
 */
const OffersTestPage = () => {
  const [applicationId, setApplicationId] = useState('');
  const [theme, setTheme] = useState('light');
  const [showOffers, setShowOffers] = useState(false);

  const handleLoad = () => {
    if (applicationId.trim()) {
      setShowOffers(true);
    } else {
      alert('Please enter an Application ID');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.colors.gray[50],
        padding: tokens.spacing.xl,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            padding: tokens.spacing.xl,
            borderRadius: tokens.borderRadius.lg,
            marginBottom: tokens.spacing.xl,
            boxShadow: tokens.shadows.md,
          }}
        >
          <h1
            style={{
              fontSize: tokens.typography.fontSize['3xl'],
              fontWeight: tokens.typography.fontWeight.bold,
              marginBottom: tokens.spacing.lg,
            }}
          >
            Offers Listing Test Page
          </h1>

          <div
            style={{
              display: 'flex',
              gap: tokens.spacing.md,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: tokens.spacing.lg,
            }}
          >
            <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center' }}>
              <label
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Application ID:
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => {
                  setApplicationId(e.target.value);
                  setShowOffers(false);
                }}
                placeholder="e.g., A12345"
                style={{
                  padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                  border: `1px solid ${tokens.colors.gray[300]}`,
                  borderRadius: tokens.borderRadius.md,
                  fontSize: tokens.typography.fontSize.base,
                  minWidth: '200px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center' }}>
              <label
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Theme:
              </label>
              <button
                onClick={() => setTheme('light')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: theme === 'light' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: theme === 'light' ? 'white' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: theme === 'dark' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: theme === 'dark' ? 'white' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                Dark
              </button>
            </div>

            <button
              onClick={handleLoad}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
                backgroundColor: tokens.colors.cta.primary,
                color: 'white',
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontSize: tokens.typography.fontSize.base,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              Load Offers
            </button>
          </div>

          <div
            style={{
              padding: tokens.spacing.md,
              backgroundColor: tokens.colors.gray[100],
              borderRadius: tokens.borderRadius.md,
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.gray[600],
            }}
          >
            <strong>Test Scenarios:</strong>
            <ul style={{ marginTop: tokens.spacing.xs, paddingLeft: tokens.spacing.lg }}>
              <li>Valid ID: Use a real application ID to test success state</li>
              <li>Empty: Use an ID that returns no offers</li>
              <li>Error: Use an invalid ID to test error state</li>
              <li>Timeout: Modify timeout in OffersListing to test timeout state</li>
            </ul>
          </div>
        </div>

        {showOffers && (
          <div
            style={{
              backgroundColor: 'white',
              padding: tokens.spacing.xl,
              borderRadius: tokens.borderRadius.lg,
              boxShadow: tokens.shadows.md,
            }}
          >
            <OffersListing
              applicationId={applicationId}
              theme={theme}
              onStateChange={(status, data) => {
                console.log('Offers state changed:', status, data);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersTestPage;


