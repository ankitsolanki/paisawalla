import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

const ErrorState = ({ error, onRetry, onRequestAssistance }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleAssistance = () => {
    if (onRequestAssistance) {
      onRequestAssistance();
    } else {
      webflowBridge.postMessage('requestAssistance', {
        reason: 'bre_failed',
        error: error?.message || 'Unknown error',
      });
    }
  };

  return (
    <div className="text-center p-10 bg-destructive/10 rounded-lg border-2 border-destructive/30">
      <div className="text-5xl mb-4">
        &#9888;&#65039;
      </div>
      <h3 className="text-xl font-bold text-destructive mb-2">
        We couldn't complete the eligibility check
      </h3>
      <p className="text-base text-destructive/80 mb-6 max-w-[400px] mx-auto">
        {error?.message || 'Something went wrong while processing your application. Please try again later or request assistance.'}
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        {onRetry && (
          <Button
            variant="outline"
            onClick={handleRetry}
          >
            Try Again
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleAssistance}
        >
          Request Assistance
        </Button>
      </div>
    </div>
  );
};

export default ErrorState;
