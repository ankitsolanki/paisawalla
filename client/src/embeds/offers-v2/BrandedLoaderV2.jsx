import { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Analyzing your profile', icon: 'profile' },
  { label: 'Checking with lending partners', icon: 'search' },
  { label: 'Matching best offers', icon: 'match' },
  { label: 'Preparing your results', icon: 'results' },
];

const BrandedLoaderV2 = ({ message }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      data-testid="branded-loader-v2"
      className="flex flex-col items-center justify-center px-6 py-12 min-h-[450px] font-sans"
    >
      <div className="relative w-24 h-24 mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="none" className="stroke-muted" strokeWidth="4" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            className="stroke-primary"
            strokeWidth="4"
            strokeDasharray="276.46"
            strokeDashoffset="69.12"
            strokeLinecap="round"
            style={{ animation: 'v2LoaderSpin 1.2s linear infinite', transformOrigin: 'center' }}
          />
          <circle
            cx="50" cy="50" r="34" fill="none"
            className="stroke-primary/40"
            strokeWidth="3"
            strokeDasharray="213.63"
            strokeDashoffset="106.81"
            strokeLinecap="round"
            style={{ animation: 'v2LoaderSpin 2s linear infinite reverse', transformOrigin: 'center' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" className="fill-primary/30 stroke-primary" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" className="stroke-primary/60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {message ? (
        <p className="text-base font-semibold text-foreground mb-6 text-center">{message}</p>
      ) : (
        <div className="w-full max-w-[280px] mb-6">
          {STEPS.map((step, i) => {
            const isActive = i === activeStep;
            const isDone = i < activeStep;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 py-2.5 transition-all duration-300 ${
                  isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isDone ? 'bg-primary' : isActive ? 'bg-primary/20 border-2 border-primary' : 'bg-muted border border-border'
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span className={`text-sm transition-colors duration-300 ${
                  isActive ? 'text-foreground font-semibold' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="w-[200px] h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ease-out"
          style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground/60 mt-4">This usually takes a few seconds</p>

      <style>{`
        @keyframes v2LoaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BrandedLoaderV2;
