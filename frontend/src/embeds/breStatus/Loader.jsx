import React from 'react';
import { tokens } from '../../design-system/tokens';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/**
 * Loader Component for BRE Status
 * Shows loading state while polling BRE status
 */
const Loader = ({ message = 'Checking your eligibility...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing['2xl'],
        minHeight: '200px',
      }}
    >
      <LoadingSpinner />
      <p
        style={{
          marginTop: tokens.spacing.lg,
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.gray[600],
          fontWeight: tokens.typography.fontWeight.medium,
        }}
      >
        {message}
      </p>
      <p
        style={{
          marginTop: tokens.spacing.sm,
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.gray[500],
        }}
      >
        This may take a few moments
      </p>
    </div>
  );
};

export default Loader;

