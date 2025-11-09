import React, { useState } from 'react';
import { tokens } from '../../design-system/tokens';
import Button from '../../components/ui/Button';
import apiClient from '../../utils/apiClient';
import { webflowBridge } from '../../embed/webflowBridge';

/**
 * OfferCard Component
 * Displays individual loan offer details in a card format matching the reference design
 */
const OfferCard = ({ offer, applicationId }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleCheckRate = async () => {
    try {
      webflowBridge.postMessage('offerApplied', {
        applicationId,
        lenderName: offer.lender || offer.lenderName,
        offerId: offer.id || offer._id,
      });
      
      // If there's a CTA URL, open it
      if (offer.ctaUrl) {
        window.open(offer.ctaUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Offer CTA error:', error);
    }
  };

  const formatCurrency = (amount) => {
    // Format in Indian Rupees
    if (amount >= 100000) {
      // Show in lakhs for amounts >= 1 lakh
      const lakhs = amount / 100000;
      return `₹${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)} Lakh${lakhs !== 1 ? 's' : ''}`;
    } else {
      // Show in thousands for smaller amounts
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };

  // Get lender initial for logo
  const getLenderInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'L';
  };

  // Generate lender color based on name
  const getLenderColor = (name) => {
    const colors = [
      '#1c3693', // Blue
      '#16a34a', // Green
      '#ec3957', // Red/Pink
      '#f59e0b', // Orange
      '#6366f1', // Indigo
    ];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  };

  const lenderName = offer.lender || offer.lenderName || 'Lender';
  const lenderColor = getLenderColor(lenderName);
  const minCreditScore = offer.minCreditScore || 680;
  const apr = offer.apr || offer.interestRate || 0;
  const aprRange = offer.aprRange || `${apr}%`;
  const termMonths = offer.term || offer.termMonths || 36;
  const termYears = Math.floor(termMonths / 12);
  const termDisplay = termMonths >= 12 
    ? `${termYears} - ${termYears + 1} years`
    : `${termMonths} mo`;
  const maxLoan = offer.amount || offer.loanAmount || 0;
  const rating = offer.rating || 4.5;
  const reviewCount = offer.reviewCount || Math.floor(Math.random() * 500) + 100;
  const features = offer.features || offer.offerData?.features || [];
  const pros = offer.pros || ['No fees', 'Fast approval', 'Quick funding'];
  const cons = offer.cons || [];

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: tokens.borderRadius.lg,
        padding: tokens.spacing.xl,
        border: `1px solid ${tokens.colors.gray[200]}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: tokens.spacing.lg,
        transition: `all ${tokens.transitions.normal} ease-in-out`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.md, flex: 1 }}>
          {/* Logo */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: tokens.borderRadius.md,
              backgroundColor: lenderColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold,
              flexShrink: 0,
            }}
          >
            {getLenderInitial(lenderName)}
          </div>

          {/* Lender Name and Description */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.xs, marginBottom: tokens.spacing.xs }}>
              <h3
                style={{
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: tokens.colors.gray[900],
                  margin: 0,
                }}
              >
                {lenderName}
              </h3>
              <span
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.success[600],
                  backgroundColor: tokens.colors.success[50],
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  borderRadius: tokens.borderRadius.sm,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                ✓ Verified
              </span>
            </div>
            <p
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.gray[600],
                margin: 0,
              }}
            >
              Best personal loans in India for your needs
            </p>
          </div>
        </div>

        {/* CHECK RATE Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button
            onClick={handleCheckRate}
            style={{
              backgroundColor: tokens.colors.success[600],
              color: '#ffffff',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.normal} ease-in-out`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.success[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.success[600];
            }}
          >
            CHECK RATE
          </button>
          <p
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[500],
              margin: `${tokens.spacing.xs} 0 0 0`,
              textAlign: 'right',
            }}
          >
            on {lenderName.toLowerCase()}'s website
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: tokens.spacing.md,
          marginBottom: tokens.spacing.lg,
          padding: `${tokens.spacing.md} 0`,
          borderTop: `1px solid ${tokens.colors.gray[200]}`,
          borderBottom: `1px solid ${tokens.colors.gray[200]}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[600],
              marginBottom: tokens.spacing.xs,
            }}
          >
            Min. Credit Score
          </div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
            }}
          >
            {minCreditScore}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[600],
              marginBottom: tokens.spacing.xs,
            }}
          >
            Est. APR
          </div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
            }}
          >
            {aprRange}
          </div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[500],
            }}
          >
            Fixed Interest Rate
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[600],
              marginBottom: tokens.spacing.xs,
            }}
          >
            Loan Term
          </div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
            }}
          >
            {termDisplay}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[600],
              marginBottom: tokens.spacing.xs,
            }}
          >
            Max Loan
          </div>
          <div
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
            }}
          >
            {formatCurrency(maxLoan)}
          </div>
        </div>
      </div>

      {/* Rating and Reviews */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
          <span
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
            }}
          >
            {rating}
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                style={{
                  color: i < Math.floor(rating) ? tokens.colors.success[600] : tokens.colors.gray[300],
                  fontSize: tokens.typography.fontSize.base,
                }}
              >
                ★
              </span>
            ))}
          </div>
          <span
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.gray[600],
            }}
          >
            {reviewCount} Reviews
          </span>
        </div>
      </div>

      {/* Key Facts / Pros / Cons */}
      {showDetails && (features.length > 0 || pros.length > 0 || cons.length > 0) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: tokens.spacing.lg,
            marginBottom: tokens.spacing.lg,
            padding: `${tokens.spacing.md} 0`,
            borderTop: `1px solid ${tokens.colors.gray[200]}`,
          }}
        >
          {/* Key Facts */}
          {features.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: tokens.spacing.sm,
                }}
              >
                Key Facts
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {features.slice(0, 4).map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.gray[700],
                      marginBottom: tokens.spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <span style={{ color: tokens.colors.primary[600] }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pros */}
          {pros.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: tokens.spacing.sm,
                }}
              >
                Pros
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pros.slice(0, 3).map((pro, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.gray[700],
                      marginBottom: tokens.spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <span style={{ color: tokens.colors.success[600] }}>✓</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {cons.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  color: tokens.colors.gray[900],
                  marginBottom: tokens.spacing.sm,
                }}
              >
                Cons
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cons.slice(0, 3).map((con, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: tokens.colors.gray[700],
                      marginBottom: tokens.spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                    }}
                  >
                    <span style={{ color: tokens.colors.error[600] }}>✗</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: tokens.spacing.md,
          paddingTop: tokens.spacing.md,
          borderTop: `1px solid ${tokens.colors.gray[200]}`,
        }}
      >
        <button
          style={{
            backgroundColor: 'transparent',
            color: tokens.colors.primary[600],
            border: `1px solid ${tokens.colors.primary[600]}`,
            borderRadius: tokens.borderRadius.md,
            padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${tokens.transitions.normal} ease-in-out`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = tokens.colors.primary[50];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Read Review
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            backgroundColor: 'transparent',
            color: tokens.colors.gray[700],
            border: 'none',
            borderRadius: tokens.borderRadius.md,
            padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: tokens.spacing.xs,
          }}
        >
          View Details
          <span style={{ fontSize: tokens.typography.fontSize.xs }}>
            {showDetails ? '▲' : '▼'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default OfferCard;

