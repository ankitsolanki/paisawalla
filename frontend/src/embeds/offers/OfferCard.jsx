import React from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * OfferCard Component
 * Displays individual loan offer details
 */
const OfferCard = ({ offer, applicationId }) => {
  const handleOfferCTA = async () => {
    try {
      if (offer.ctaType === 'apply') {
        // Open apply URL in new tab
        if (offer.ctaUrl) {
          window.open(offer.ctaUrl, '_blank', 'noopener,noreferrer');
          webflowBridge.postMessage('offerApplied', {
            applicationId,
            lenderName: offer.lenderName,
            offerId: offer.id || offer._id,
          });
        }
      } else if (offer.ctaType === 'callback') {
        // Request callback
        try {
          const offerId = offer.id || offer._id || 'unknown';
          await apiClient.post(`/api/offers/${offerId}/callback-request`, {
            applicationId,
          });
          webflowBridge.postMessage('callbackRequested', {
            applicationId,
            lenderName: offer.lenderName,
            offerId: offer.id || offer._id,
          });
          alert('Callback requested successfully! Our team will contact you soon.');
        } catch (error) {
          console.error('Callback request failed:', error);
          alert('Failed to request callback. Please try again.');
        }
      } else if (offer.ctaType === 'email') {
        // Email offer
        try {
          const offerId = offer.id || offer._id || 'unknown';
          await apiClient.post(`/api/offers/${offerId}/email-offer`, {
            applicationId,
          });
          webflowBridge.postMessage('offerEmailed', {
            applicationId,
            lenderName: offer.lenderName,
            offerId: offer.id || offer._id,
          });
          alert('Offer details have been sent to your email!');
        } catch (error) {
          console.error('Email offer failed:', error);
          alert('Failed to email offer. Please try again.');
        }
      }
    } catch (error) {
      console.error('Offer CTA error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: tokens.borderRadius.xl,
        padding: tokens.spacing.lg,
        border: `1px solid ${tokens.colors.gray[200]}`,
        boxShadow: tokens.shadows.md,
        transition: `all ${tokens.transitions.normal} ease-in-out`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadows.lg;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = tokens.shadows.md;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Lender Name */}
      <div
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.colors.gray[900],
          marginBottom: tokens.spacing.sm,
        }}
      >
        {offer.lenderName}
      </div>

      {/* Key Details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.xs,
          marginBottom: tokens.spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.primary[600],
            }}
          >
            APR: {offer.apr}%
          </div>
          <span style={{ color: tokens.colors.gray[400] }}>•</span>
          <div
            style={{
              fontSize: tokens.typography.fontSize.base,
              color: tokens.colors.gray[700],
            }}
          >
            {offer.tenureMonths} months
          </div>
        </div>

        <div
          style={{
            fontSize: tokens.typography.fontSize.lg,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.colors.gray[900],
            marginTop: tokens.spacing.xs,
          }}
        >
          {formatCurrency(offer.amount)}
        </div>

        {offer.processingFee && (
          <div
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.gray[500],
              marginTop: tokens.spacing.xs,
            }}
          >
            Processing Fee: {formatCurrency(offer.processingFee)}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <Button
        variant="primary"
        onClick={handleOfferCTA}
        fullWidth
        style={{
          marginTop: tokens.spacing.md,
          fontSize: tokens.typography.fontSize.base,
          fontWeight: tokens.typography.fontWeight.semibold,
        }}
      >
        {offer.ctaLabel || 'Apply Now'}
      </Button>
    </div>
  );
};

export default OfferCard;

