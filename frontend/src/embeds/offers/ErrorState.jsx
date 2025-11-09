import React from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * ErrorState Component
 * Displayed when BRE fails or API error occurs
 */
const ErrorState = ({ error, onRetry, onRequestAssistance }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleAssistance = () => {
    if (onRequestAssistance) {
      onRequestAssistance();
    } else {
      webflowBridge.postMessage('requestAssistance', {
        reason: 'bre_failed',
        error: error?.message || 'Unknown error',
      });
    }
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: tokens.spacing['2xl'],
        backgroundColor: tokens.colors.error[50],
        borderRadius: tokens.borderRadius.lg,
        border: `2px solid ${tokens.colors.error[300]}`,
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: tokens.spacing.md,
        }}
      >
        ⚠️
      </div>
      <h3
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.error[700],
          marginBottom: tokens.spacing.sm,
        }}
      >
        We couldn't complete the eligibility check
      </h3>
      <p
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.error[600],
          marginBottom: tokens.spacing.lg,
          maxWidth: '400px',
          margin: `0 auto ${tokens.spacing.lg} auto`,
        }}
      >
        {error?.message || 'Something went wrong while processing your application. Please try again later or request assistance.'}
      </p>
      <div
        style={{
          display: 'flex',
          gap: tokens.spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {onRetry && (
          <Button
            variant="outline"
            onClick={handleRetry}
          >
            Try Again
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleAssistance}
        >
          Request Assistance
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;

