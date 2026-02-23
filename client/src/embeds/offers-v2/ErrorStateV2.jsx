import { webflowBridge } from '../../embed/webflowBridge';

const ErrorStateV2 = ({ error, onRetry }) => {
  const handleAssistance = () => {
    webflowBridge.postMessage('requestAssistance', {
      reason: 'bre_failed',
      error: error?.message || 'Unknown error',
    });
  };

  return (
    <div data-testid="error-state-v2" className="px-6 py-14 font-sans">
      <div className="text-center max-w-[420px] mx-auto">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" className="stroke-destructive" strokeWidth="1.5" fill="none" />
            <path d="M12 8V12" className="stroke-destructive" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" className="fill-destructive" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {error?.message || 'We couldn\'t complete the eligibility check. This might be a temporary issue.'}
        </p>

        <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
          {onRetry && (
            <button
              data-testid="button-retry-v2"
              onClick={onRetry}
              className="w-full py-3 bg-primary text-primary-foreground border-none rounded-xl text-sm font-bold cursor-pointer"
            >
              Try Again
            </button>
          )}
          <button
            data-testid="button-assistance-v2"
            onClick={handleAssistance}
            className="w-full py-3 bg-transparent border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
          >
            Request Assistance
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-6">
          If the issue persists, our team will be happy to assist you.
        </p>
      </div>
    </div>
  );
};

export default ErrorStateV2;
