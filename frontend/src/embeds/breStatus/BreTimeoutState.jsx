import React from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * BreTimeoutState Component
 * Displayed when BRE request times out
 */
const BreTimeoutState = ({ onWait, requestId }) => {
  const handleWait = () => {
    if (onWait) {
      onWait();
    } else {
      // Reload page to continue polling
      window.location.reload();
    }
  };

  const handleEmailMe = () => {
    webflowBridge.postMessage('emailOffers', {
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
        border: `1px solid ${tokens.colors.gray[200]}`,
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
        ⏱️
      </div>
      <h3
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.gray[700],
          marginBottom: tokens.spacing.sm,
        }}
      >
        This is taking longer than usual
      </h3>
      <p
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.gray[600],
          marginBottom: tokens.spacing.lg,
        }}
      >
        Your eligibility check is still processing. You can wait a bit longer, or we'll email you when offers are ready.
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
          onClick={handleWait}
          fullWidth
        >
          Continue Waiting
        </Button>
        <Button
          variant="outline"
          onClick={handleEmailMe}
          fullWidth
        >
          Email Me When Ready
        </Button>
      </div>
    </div>
  );
};

export default BreTimeoutState;

