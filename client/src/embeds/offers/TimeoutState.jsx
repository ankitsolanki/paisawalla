import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';

const TimeoutState = ({ onWait, onEmailMe }) => {
  const handleEmailMe = () => {
    if (onEmailMe) {
      onEmailMe();
    } else {
      webflowBridge.postMessage('emailOffers', {
        reason: 'timeout',
      });
    }
  };

  return (
    <div className="text-center p-10 bg-warning/10 rounded-lg border-2 border-warning/30">
      <div className="text-5xl mb-4">
        &#9201;&#65039;
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        This is taking longer than usual
      </h3>
      <p className="text-base text-muted-foreground mb-6 max-w-[400px] mx-auto">
        Your eligibility check is still processing. You can wait a bit longer, 
        or we'll email you when your offers are ready.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        {onWait && (
          <Button
            variant="outline"
            onClick={onWait}
          >
            Wait a Bit Longer
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleEmailMe}
        >
          Email Me When Ready
        </Button>
      </div>
    </div>
  );
};

export default TimeoutState;
