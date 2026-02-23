import { useState } from 'react';
import Button from '../../components/ui/CustomButton';
import { webflowBridge } from '../../embed/webflowBridge';
import apiClient from '../../utils/apiClient';

const EmptyState = ({ onRequestCallback, applicationId, leadId }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentSubmitted, setConsentSubmitted] = useState(false);

  const handleCallback = () => {
    if (onRequestCallback) {
      onRequestCallback();
    } else {
      webflowBridge.postMessage('requestCallback', {
        reason: 'no_offers',
      });
    }
  };

  const handleConsentSubmit = async () => {
    if (!consentGiven) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (leadId) {
        await apiClient.post(`/api/leads/${leadId}/consent`, {
          consentType: 'share_with_lenders',
          consentGiven: true,
          timestamp: new Date().toISOString(),
        });
      }

      setConsentSubmitted(true);
      webflowBridge.postMessage('consentGiven', {
        leadId,
        applicationId,
        consentType: 'share_with_lenders',
      });
    } catch (error) {
      console.error('Failed to submit consent:', error);
      setConsentSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (consentSubmitted) {
    return (
      <div className="text-center p-10 bg-background rounded-lg border border-border">
        <div className="text-5xl mb-4">
          &#10003;
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Thank you for your consent
        </h3>
        <p className="text-base text-muted-foreground mb-6 max-w-[400px] mx-auto">
          We'll share your information with our partner lenders and reach out to you if we find matching offers.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-10 bg-background rounded-lg border border-border max-w-[500px] mx-auto">
      <div className="text-5xl mb-4">
        &#128203;
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        No eligible offers at this stage
      </h3>
      <p className="text-base text-muted-foreground mb-6">
        We couldn't find any loan offers matching your profile at this time.
      </p>

      <div className="text-left mt-6 mb-6 p-6 bg-muted rounded-md border border-border">
        <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
          Would you like us to share your information with more lenders? We'll reach out if we find offers that match your profile.
        </p>
        
        <label className="flex items-start gap-2 cursor-pointer text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-1 cursor-pointer w-[18px] h-[18px]"
          />
          <span>
            I consent to share my information with additional lenders to find better loan offers. 
            I understand that lenders may contact me with offers if available.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-4 items-stretch">
        <Button
          variant="primary"
          onClick={handleConsentSubmit}
          disabled={!consentGiven || isSubmitting}
          loading={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Submitting...' : 'Share with More Lenders'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleCallback}
          fullWidth
        >
          Request Callback Instead
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
