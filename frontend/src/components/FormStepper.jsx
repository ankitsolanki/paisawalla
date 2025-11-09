import React from 'react';
import { tokens } from '../design-system/tokens';

const FormStepper = ({ currentStep, totalSteps, steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div style={{ marginBottom: tokens.spacing.xl }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.base,
                    backgroundColor: isActive
                      ? tokens.colors.primary[600]
                      : isCompleted
                      ? tokens.colors.success[500]
                      : tokens.colors.gray[200],
                    color: isActive || isCompleted ? '#ffffff' : tokens.colors.gray[600],
                    transition: `all ${tokens.transitions.normal} ease-in-out`,
                  }}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <div
                  style={{
                    marginTop: tokens.spacing.sm,
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: isActive ? tokens.colors.primary[600] : tokens.colors.gray[600],
                  }}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    margin: `0 ${tokens.spacing.md}`,
                    backgroundColor: isCompleted
                      ? tokens.colors.success[500]
                      : tokens.colors.gray[200],
                    transition: `background-color ${tokens.transitions.normal} ease-in-out`,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FormStepper;

