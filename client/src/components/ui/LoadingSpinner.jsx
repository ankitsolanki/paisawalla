const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size] || sizeClasses.md}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/90 dark:bg-background/90 z-[1040]">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
