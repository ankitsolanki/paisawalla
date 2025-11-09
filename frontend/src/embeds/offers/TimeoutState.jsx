import React from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * TimeoutState Component
 * Displayed when BRE takes too long
 */
const TimeoutState = ({ onWait, onEmailMe }) => {
  const handleEmailMe = () => {
    if (onEmailMe) {
      onEmailMe();
    } else {
      webflowBridge.postMessage('emailOffers', {
        reason: 'timeout',
      });
    }
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: tokens.spacing['2xl'],
        backgroundColor: tokens.colors.warning[50],
        borderRadius: tokens.borderRadius.lg,
        border: `2px solid ${tokens.colors.warning[300]}`,
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
          color: tokens.colors.gray[900],
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
          maxWidth: '400px',
          margin: `0 auto ${tokens.spacing.lg} auto`,
        }}
      >
        Your eligibility check is still processing. You can wait a bit longer, 
        or we'll email you when your offers are ready.
      </p>
      <div
        style={{
          display: 'flex',
          gap: tokens.spacing.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {onWait && (
          <Button
            variant="outline"
            onClick={onWait}
          >
            Wait a Bit Longer
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleEmailMe}
        >
          Email Me When Ready
        </Button>
      </div>
    </div>
  );
};

export default TimeoutState;

