import Button from '../../components/ui/CustomButton';
import { webflowBridge } from '../../embed/webflowBridge';

const BreFailureState = ({ onRetry, requestId }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleCallback = () => {
    webflowBridge.postMessage('requestCallback', {
      reason: 'bre_failed',
      requestId,
    });
  };

  return (
    <div className="text-center p-10 bg-background rounded-lg border border-destructive/20 max-w-[500px] mx-auto">
      <div className="text-5xl mb-4">
        &#10060;
      </div>
      <h3 className="text-xl font-bold text-destructive mb-2">
        We couldn't complete your eligibility check
      </h3>
      <p className="text-base text-muted-foreground mb-6">
        There was an issue processing your eligibility. Please try again later or request a callback from our team.
      </p>
      <div className="flex flex-col gap-4 items-stretch">
        <Button
          variant="primary"
          onClick={handleRetry}
          fullWidth
        >
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={handleCallback}
          fullWidth
        >
          Request Callback
        </Button>
      </div>
    </div>
  );
};

export default BreFailureState;
