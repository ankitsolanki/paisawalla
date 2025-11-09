import React from 'react';
import { tokens } from '../design-system/tokens';

const ProgressBar = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div style={{ marginBottom: tokens.spacing.lg }}>
      <div
        style={{
          width: '100%',
          backgroundColor: tokens.colors.gray[200],
          borderRadius: tokens.borderRadius.full,
          height: '0.625rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: tokens.colors.primary[600],
            height: '100%',
            borderRadius: tokens.borderRadius.full,
            width: `${percentage}%`,
            transition: `width ${tokens.transitions.normal} ease-in-out`,
          }}
        />
      </div>
      <div
        style={{
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.gray[600],
          marginTop: tokens.spacing.sm,
          textAlign: 'center',
        }}
      >
        Step {current} of {total}
      </div>
    </div>
  );
};

export default ProgressBar;

