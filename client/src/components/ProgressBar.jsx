const ProgressBar = ({ current, total }) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        const isCompleted = stepNumber < current;

        return (
          <div
            key={stepNumber}
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300
              ${isActive || isCompleted ? 'bg-primary' : 'bg-muted'}`}
          />
        );
      })}
    </div>
  );
};

export default ProgressBar;
