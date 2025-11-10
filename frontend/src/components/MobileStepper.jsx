import React from 'react';
import { tokens } from '../design-system/tokens';

/**
 * MobileStepper - Modern, compact stepper optimized for mobile
 * Features:
 * - Compact design with current step highlighted
 * - Smooth animations
 * - Better visual hierarchy
 * - Touch-friendly
 */
const MobileStepper = ({ currentStep, totalSteps, steps }) => {
  if (!steps || steps.length === 0) return null;

  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div style={{ marginBottom: tokens.spacing.lg }}>
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing.sm,
        }}
      >
        <div
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.gray[600],
          }}
        >
          Step {currentStep} of {totalSteps}
        </div>
        <div
          style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.gray[500],
            fontWeight: tokens.typography.fontWeight.medium,
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: tokens.colors.gray[200],
          borderRadius: tokens.borderRadius.full,
          overflow: 'hidden',
          marginBottom: tokens.spacing.md,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: tokens.colors.cta.primary, // Paisawaala brand color
            borderRadius: tokens.borderRadius.full,
            transition: `width ${tokens.transitions.normal} ease-out`,
            boxShadow: `0 2px 8px ${tokens.colors.cta.primary}40`,
          }}
        />
      </div>

      {/* Current step card */}
      <div
        style={{
          backgroundColor: tokens.colors.primary[50], // Light blue background
          border: `2px solid ${tokens.colors.primary[400]}`,
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing.md,
          marginBottom: tokens.spacing.sm,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.sm,
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: tokens.colors.cta.primary,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: tokens.typography.fontWeight.bold,
              fontSize: tokens.typography.fontSize.base,
              flexShrink: 0,
              boxShadow: `0 2px 8px ${tokens.colors.cta.primary}40`,
            }}
          >
            {currentStep}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.gray[900],
                marginBottom: '2px',
              }}
            >
              {steps[currentStep - 1]?.label || `Step ${currentStep}`}
            </div>
            <div
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: tokens.colors.gray[500],
              }}
            >
              {currentStep === totalSteps ? 'Final step' : 'Complete this step to continue'}
            </div>
          </div>
        </div>
      </div>

      {/* Step dots indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: tokens.spacing.xs,
          flexWrap: 'wrap',
        }}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={stepNumber}
              style={{
                width: isActive ? '10px' : '6px',
                height: isActive ? '10px' : '6px',
                borderRadius: '50%',
                backgroundColor: isActive
                  ? tokens.colors.cta.primary
                  : isCompleted
                  ? tokens.colors.success[500]
                  : tokens.colors.gray[300],
                transition: `all ${tokens.transitions.normal} ease-in-out`,
                boxShadow: isActive ? `0 0 0 3px ${tokens.colors.cta.primary}20` : 'none',
              }}
              title={step.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MobileStepper;


