const MobileStepper = ({ currentStep, totalSteps, steps }) => {
  if (!steps || steps.length === 0) return null;

  const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="text-sm font-semibold text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {Math.round(percentage)}%
        </div>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4 relative">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="bg-primary/5 border-2 border-primary/40 rounded-lg p-4 mb-2 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shrink-0">
            {currentStep}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground mb-0.5">
              {steps[currentStep - 1]?.label || `Step ${currentStep}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentStep === totalSteps ? 'Final step' : 'Complete this step to continue'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-1.5 flex-wrap">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div
              key={stepNumber}
              className={`rounded-full transition-all duration-300
                ${isActive ? 'w-2.5 h-2.5 bg-primary ring-2 ring-primary/20' : ''}
                ${isCompleted ? 'w-1.5 h-1.5 bg-primary' : ''}
                ${!isActive && !isCompleted ? 'w-1.5 h-1.5 bg-muted' : ''}`}
              title={step.label}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MobileStepper;
