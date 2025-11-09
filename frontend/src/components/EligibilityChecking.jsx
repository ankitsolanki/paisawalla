import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../design-system/ThemeProvider';
import ErrorBoundary from './ui/ErrorBoundary';
import LoadingSpinner from './ui/LoadingSpinner';
import { tokens } from '../design-system/tokens';

/**
 * EligibilityChecking Component
 * Shows progressive messages while checking eligibility and finding offers
 */
const EligibilityChecking = ({ leadId, onComplete, onError, theme = 'light' }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [applicationId, setApplicationId] = useState(null);

  const messages = [
    { text: 'Checking your eligibility...', duration: 2000 },
    { text: 'Analyzing your profile...', duration: 2000 },
    { text: 'Finding best offers for you...', duration: 2000 },
    { text: 'Almost there...', duration: 1500 },
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
    // Start the eligibility check process
    const checkEligibility = async () => {
      try {
        // Import apiClient dynamically to avoid circular dependencies
        const { default: apiClient } = await import('../utils/apiClient');
        
        // Step 1: Create application from lead
        const applicationResponse = await apiClient.post('/api/applications', {
          leadId,
        });

        // Response structure: { success, message, data: { _id, applicationNumber, ... } }
        const appId = applicationResponse.data?._id || applicationResponse.data?.applicationNumber;
        
        if (!appId) {
          throw new Error('Application ID not found in response');
        }

        setApplicationId(appId);

        // Step 2: Wait a bit for BRE processing (simulate)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Complete and pass applicationId to parent
        if (onComplete) {
          onComplete(appId);
        }
      } catch (error) {
        console.error('Eligibility check error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    // Start checking after a short delay to show first message
    const checkTimer = setTimeout(() => {
      checkEligibility();
    }, 500);

    return () => {
      clearTimeout(checkTimer);
    };
  }, [leadId, onComplete, onError]);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: tokens.spacing['2xl'],
            minHeight: '400px',
            textAlign: 'center',
          }}
        >
          <LoadingSpinner />
          
          <div
            style={{
              marginTop: tokens.spacing.xl,
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p
              key={currentMessage}
              style={{
                fontSize: tokens.typography.fontSize.xl,
                color: tokens.colors.gray[700],
                fontWeight: tokens.typography.fontWeight.semibold,
                animation: 'fadeIn 0.5s ease-in',
              }}
            >
              {messages[currentMessage]?.text || messages[messages.length - 1].text}
            </p>
          </div>

          <p
            style={{
              marginTop: tokens.spacing.md,
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.gray[500],
            }}
          >
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
          `}</style>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default EligibilityChecking;

