import React from 'react';
import { tokens } from '../design-system/tokens';
import { useTheme } from '../design-system/ThemeProvider';

const ProgressBar = ({ current, total }) => {
  const { colors, theme } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px', // gap-2
        marginBottom: tokens.spacing.lg,
      }}
    >
      {Array.from({ length: total }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        const isCompleted = stepNumber < current;

        return (
          <div
            key={stepNumber}
            style={{
              flex: 1,
              height: '6px', // h-1.5
              backgroundColor: isActive || isCompleted
                ? tokens.colors.primary[500] // bg-primary
                : theme === 'dark' ? tokens.colors.gray[700] : tokens.colors.gray[200], // bg-gray-200 or bg-gray-700 for dark
              borderRadius: tokens.borderRadius.full,
              transition: `background-color ${tokens.transitions.normal} ease-in-out`,
            }}
          />
        );
      })}
    </div>
  );
};

export default ProgressBar;

