import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

const BreTimeoutState = ({ onWait, requestId }) => {
  const handleWait = () => {
    if (onWait) {
      onWait();
    } else {
      window.location.reload();
    }
  };

  const handleEmailMe = () => {
    webflowBridge.postMessage('emailOffers', {
      requestId,
    });
  };

  return (
    <div className="text-center p-10 bg-background rounded-lg border border-border max-w-[500px] mx-auto">
      <div className="text-5xl mb-4">
        &#9201;&#65039;
      </div>
      <h3 className="text-xl font-bold text-foreground/70 mb-2">
        This is taking longer than usual
      </h3>
      <p className="text-base text-muted-foreground mb-6">
        Your eligibility check is still processing. You can wait a bit longer, or we'll email you when offers are ready.
      </p>
      <div className="flex flex-col gap-4 items-stretch">
        <Button
          variant="primary"
          onClick={handleWait}
          fullWidth
        >
          Continue Waiting
        </Button>
        <Button
          variant="outline"
          onClick={handleEmailMe}
          fullWidth
        >
          Email Me When Ready
        </Button>
      </div>
    </div>
  );
};

export default BreTimeoutState;
