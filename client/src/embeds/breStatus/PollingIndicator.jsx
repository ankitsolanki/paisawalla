const PollingIndicator = ({ pollCount, maxPolls = 30 }) => {
  const progress = Math.min((pollCount / maxPolls) * 100, 100);

  return (
    <div className="w-full max-w-[400px] mt-6">
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground text-center">
        Progress: {Math.round(progress)}%
      </p>
    </div>
  );
};

export default PollingIndicator;
