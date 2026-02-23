const FormStepper = ({ currentStep, totalSteps, steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep}/{totalSteps}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="contents">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base transition-all duration-300
                    ${isActive ? 'bg-primary text-primary-foreground' : ''}
                    ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                    ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <div
                  className={`mt-2 text-sm font-medium
                    ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-300
                    ${isCompleted ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormStepper;
