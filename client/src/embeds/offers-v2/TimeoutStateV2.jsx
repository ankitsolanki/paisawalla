import { webflowBridge } from '../../embed/webflowBridge';

const TimeoutStateV2 = ({ onWait, onEmailMe }) => {
  const handleEmailMe = () => {
    if (onEmailMe) {
      onEmailMe();
    } else {
      webflowBridge.postMessage('emailOffers', { reason: 'timeout' });
    }
  };

  return (
    <div data-testid="timeout-state-v2" className="px-6 py-14 font-sans">
      <div className="text-center max-w-[420px] mx-auto">
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" className="stroke-warning" strokeWidth="1.5" fill="none" />
            <path d="M12 6V12L16 14" className="stroke-warning" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">
          Taking longer than expected
        </h3>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          Your eligibility check is still processing. Our lending partners are reviewing your profile.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-6">
          This usually completes within a few minutes.
        </p>

        <div className="w-full h-1.5 bg-muted rounded-full mb-6 overflow-hidden max-w-[240px] mx-auto">
          <div className="h-full rounded-full bg-gradient-to-r from-warning to-warning/50 animate-[v2TimeoutPulse_2s_ease-in-out_infinite]" />
        </div>

        <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
          {onWait && (
            <button
              data-testid="button-wait-v2"
              onClick={onWait}
              className="w-full py-3 bg-primary text-primary-foreground border-none rounded-xl text-sm font-bold cursor-pointer"
            >
              Check Again
            </button>
          )}
          <button
            data-testid="button-email-v2"
            onClick={handleEmailMe}
            className="w-full py-3 bg-transparent border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
          >
            Email Me When Ready
          </button>
        </div>
      </div>

      <style>{`
        @keyframes v2TimeoutPulse {
          0%, 100% { width: 30%; opacity: 0.7; }
          50% { width: 80%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TimeoutStateV2;
