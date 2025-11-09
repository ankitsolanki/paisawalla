import React from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * BreFailureState Component
 * Displayed when BRE request fails
 */
const BreFailureState = ({ onRetry, requestId }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Reload page to restart
      window.location.reload();
    }
  };

  const handleCallback = () => {
    webflowBridge.postMessage('requestCallback', {
      reason: 'bre_failed',
      requestId,
    });
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: tokens.spacing['2xl'],
        backgroundColor: tokens.colors.background.light,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.error[200]}`,
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: tokens.spacing.md,
        }}
      >
        ❌
      </div>
      <h3
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.error[700],
          marginBottom: tokens.spacing.sm,
        }}
      >
        We couldn't complete your eligibility check
      </h3>
      <p
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.gray[600],
          marginBottom: tokens.spacing.lg,
        }}
      >
        There was an issue processing your eligibility. Please try again later or request a callback from our team.
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.md,
          alignItems: 'stretch',
        }}
      >
        <Button
          variant="primary"
          onClick={handleRetry}
          fullWidth
        >
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={handleCallback}
          fullWidth
        >
          Request Callback
        </Button>
      </div>
    </div>
  );
};

export default BreFailureState;

