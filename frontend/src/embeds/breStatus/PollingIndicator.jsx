import React from 'react';
import { tokens } from '../../design-system/tokens';

/**
 * PollingIndicator Component
 * Shows progress bar and percentage for BRE polling
 */
const PollingIndicator = ({ pollCount, maxPolls = 30 }) => {
  const progress = Math.min((pollCount / maxPolls) * 100, 100);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
        marginTop: tokens.spacing.lg,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: tokens.colors.gray[200],
          borderRadius: tokens.borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: tokens.colors.primary[600],
            borderRadius: tokens.borderRadius.full,
            transition: 'width 0.3s ease-in-out',
          }}
        />
      </div>
      <p
        style={{
          marginTop: tokens.spacing.sm,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.gray[600],
          textAlign: 'center',
        }}
      >
        Progress: {Math.round(progress)}%
      </p>
    </div>
  );
};

export default PollingIndicator;

