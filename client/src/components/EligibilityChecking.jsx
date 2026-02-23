import { useState, useEffect, useRef } from 'react';
import ErrorBoundary from './ui/ErrorBoundary';
import LoadingSpinner from './ui/LoadingSpinner';

const EligibilityChecking = ({ leadId, onComplete, onError, theme = 'light' }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const hasStarted = useRef(false);

  const messages = [
    { text: 'Submitting your application...', duration: 2500 },
    { text: 'Running credit check...', duration: 3000 },
    { text: 'Evaluating lender eligibility...', duration: 3000 },
    { text: 'Finding best offers for you...', duration: 3000 },
    { text: 'Almost there...', duration: 2000 },
  ];

  useEffect(() => {
    let messageTimer;
    let currentIndex = 0;

    const showNextMessage = () => {
      if (currentIndex < messages.length) {
        setCurrentMessage(currentIndex);
        messageTimer = setTimeout(() => {
          currentIndex++;
          showNextMessage();
        }, messages[currentIndex].duration);
      }
    };

    showNextMessage();

    return () => {
      if (messageTimer) {
        clearTimeout(messageTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const checkEligibility = async () => {
      try {
        const { default: apiClient } = await import('../utils/apiClient');

        const response = await apiClient.post('/api/eligibility/check', { leadId });

        const applicationId = response.data?.applicationId;

        if (!applicationId) {
          throw new Error('Could not process your application');
        }

        if (onComplete) {
          onComplete(applicationId);
        }
      } catch (error) {
        console.error('Eligibility check error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    const timer = setTimeout(checkEligibility, 500);
    return () => clearTimeout(timer);
  }, [leadId, onComplete, onError]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
        <LoadingSpinner />
        
        <div className="mt-6 min-h-[60px] flex items-center justify-center">
          <p
            key={currentMessage}
            className="text-xl text-muted-foreground font-semibold animate-fadeIn"
            data-testid="text-eligibility-message"
          >
            {messages[currentMessage]?.text || messages[messages.length - 1].text}
          </p>
        </div>

        <p className="mt-4 text-sm text-muted-foreground" data-testid="text-eligibility-wait">
          Please wait while we process your information
        </p>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
};

export default EligibilityChecking;
