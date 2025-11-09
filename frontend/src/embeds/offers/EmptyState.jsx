import React, { useState } from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import { webflowBridge } from '../../embed/webflowBridge';
import apiClient from '../../utils/apiClient';

/**
 * EmptyState Component
 * Displayed when no offers are found
 */
const EmptyState = ({ onRequestCallback, applicationId, leadId }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentSubmitted, setConsentSubmitted] = useState(false);

  const handleCallback = () => {
    if (onRequestCallback) {
      onRequestCallback();
    } else {
      // Default: post message to Webflow
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
      // Store consent evidence
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
      // Still show success message to user
      setConsentSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (consentSubmitted) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: tokens.spacing['2xl'],
          backgroundColor: tokens.colors.background.light,
          borderRadius: tokens.borderRadius.lg,
          border: `1px solid ${tokens.colors.gray[200]}`,
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            marginBottom: tokens.spacing.md,
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontSize: tokens.typography.fontSize.xl,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.gray[900],
            marginBottom: tokens.spacing.sm,
          }}
        >
          Thank you for your consent
        </h3>
        <p
          style={{
            fontSize: tokens.typography.fontSize.base,
            color: tokens.colors.gray[600],
            marginBottom: tokens.spacing.lg,
            maxWidth: '400px',
            margin: `0 auto ${tokens.spacing.lg} auto`,
          }}
        >
          We'll share your information with our partner lenders and reach out to you if we find matching offers.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: tokens.spacing['2xl'],
        backgroundColor: tokens.colors.background.light,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${tokens.colors.gray[200]}`,
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontSize: '3rem',
          marginBottom: tokens.spacing.md,
        }}
      >
        📋
      </div>
      <h3
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.gray[900],
          marginBottom: tokens.spacing.sm,
        }}
      >
        No eligible offers at this stage
      </h3>
      <p
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.gray[600],
          marginBottom: tokens.spacing.lg,
        }}
      >
        We couldn't find any loan offers matching your profile at this time.
      </p>

      {/* Consent Section */}
      <div
        style={{
          textAlign: 'left',
          marginTop: tokens.spacing.xl,
          marginBottom: tokens.spacing.lg,
          padding: tokens.spacing.lg,
          backgroundColor: tokens.colors.gray[50],
          borderRadius: tokens.borderRadius.md,
          border: `1px solid ${tokens.colors.gray[200]}`,
        }}
      >
        <p
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.gray[700],
            marginBottom: tokens.spacing.md,
            lineHeight: '1.6',
          }}
        >
          Would you like us to share your information with more lenders? We'll reach out if we find offers that match your profile.
        </p>
        
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: tokens.spacing.sm,
            cursor: 'pointer',
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.colors.gray[700],
          }}
        >
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            style={{
              marginTop: '4px',
              cursor: 'pointer',
              width: '18px',
              height: '18px',
            }}
          />
          <span>
            I consent to share my information with additional lenders to find better loan offers. 
            I understand that lenders may contact me with offers if available.
          </span>
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.md,
          alignItems: 'stretch',
        }}
      >
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

