import { useState } from 'react';
import { webflowBridge } from '../../embed/webflowBridge';
import apiClient from '../../utils/apiClient';

const EmptyStateV2 = ({ onRequestCallback, applicationId, leadId }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentSubmitted, setConsentSubmitted] = useState(false);

  const handleCallback = () => {
    if (onRequestCallback) {
      onRequestCallback();
    } else {
      webflowBridge.postMessage('requestCallback', { reason: 'no_offers' });
    }
  };

  const handleConsentSubmit = async () => {
    if (!consentGiven) return;
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
      <div data-testid="empty-state-v2-submitted" className="text-center px-6 py-14 font-sans">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L20 7" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Thank you!</h3>
        <p className="text-sm text-muted-foreground max-w-[360px] mx-auto leading-relaxed">
          We'll share your information with our partner lenders and reach out to you if we find matching offers.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="empty-state-v2" className="px-6 py-10 font-sans">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M9 12H15M12 9V15" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10" className="stroke-muted-foreground" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No offers available right now</h3>
        <p className="text-sm text-muted-foreground max-w-[400px] mx-auto leading-relaxed">
          We couldn't find loan offers matching your profile at this time. But don't worry, we have options for you.
        </p>
      </div>

      <div className="max-w-[440px] mx-auto">
        <div className="bg-accent/50 border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="7" r="4" className="stroke-primary" strokeWidth="1.5" fill="none" />
                <line x1="20" y1="8" x2="20" y2="14" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="23" y1="11" x2="17" y2="11" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground m-0 mb-1">Share with more lenders</p>
              <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                Let us share your profile with additional lending partners. We'll contact you if matching offers become available.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              data-testid="checkbox-consent-v2"
              className="mt-0.5 cursor-pointer w-[16px] h-[16px] accent-primary"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I consent to share my information with additional lenders to find better loan offers.
            </span>
          </label>

          <button
            data-testid="button-consent-submit-v2"
            onClick={handleConsentSubmit}
            disabled={!consentGiven || isSubmitting}
            className={`w-full py-3 border-none rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              consentGiven && !isSubmitting
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Share with More Lenders'}
          </button>
        </div>

        <button
          data-testid="button-callback-v2"
          onClick={handleCallback}
          className="w-full py-3 bg-transparent border border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer"
        >
          Request a Callback Instead
        </button>
      </div>
    </div>
  );
};

export default EmptyStateV2;
