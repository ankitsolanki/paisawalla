import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { webflowBridge } from '../../embed/webflowBridge';
import { useResponsive } from '../../hooks/useResponsive';

const OfferCard = ({ offer, applicationId }) => {
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const { isMobile } = useResponsive();

  const lenderName = offer.lender || offer.lenderName || 'Lender';
  const lenderColor = useMemo(() => getLenderColor(lenderName), [lenderName]);
  const apr = offer.apr || offer.interestRate || 0;
  const termMonths = offer.term || offer.termMonths || 36;
  const emiAmount = offer.monthlyPayment || Math.round((offer.amount || 0) / Math.max(termMonths, 1));
  const features = offer.features || offer.offerData?.features || [];
  const badges = features.slice(0, 2);

  const approvalScore = useMemo(() => {
    const base =
      offer.offerType === 'pre-approved' ? 920 :
      offer.offerType === 'conditional' ? 800 : 720;
    const aprWeight = apr ? Math.max(0, 120 - apr * 2) : 60;
    return Math.min(990, base + aprWeight);
  }, [offer.offerType, apr]);

  const approvalMeta = useMemo(() => {
    if (approvalScore > 900) return { label: 'EXCELLENT', progress: 95, level: 'excellent' };
    if (approvalScore > 820) return { label: 'VERY GOOD', progress: 80, level: 'good' };
    if (approvalScore > 760) return { label: 'GOOD', progress: 65, level: 'ok' };
    return { label: 'FAIR', progress: 45, level: 'fair' };
  }, [approvalScore]);

  const processingLabel = useMemo(() => {
    const info = offer.offerData?.processingTime || '';
    if (typeof info === 'string' && info.length > 0) return info;
    if (offer.offerData?.disbursalTimeHours) {
      return `${offer.offerData.disbursalTimeHours} hrs`;
    }
    return 'Instant';
  }, [offer]);

  const charges = {
    partPrepayment: offer.offerData?.charges?.partPrepayment ?? offer.offerData?.partPrepayment ?? 'NIL',
    processingFee: offer.offerData?.charges?.processingFee ?? offer.offerData?.processingFee ?? '4.5%',
    foreclosure: offer.offerData?.charges?.foreclosure ?? offer.offerData?.foreclosure ?? '3%',
    interestRate: apr ? `${apr}% onwards` : 'As per lender',
  };

  const handleCheckRate = async () => {
    try {
      webflowBridge.postMessage('offerApplied', {
        applicationId,
        lenderName: offer.lender || offer.lenderName,
        offerId: offer.id || offer._id,
      });

      if (offer.ctaUrl) {
        window.open(offer.ctaUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Offer CTA error:', error);
    }
  };

  return (
    <>
      <div className="offer-card">
        <div className="offer-card__header">
          <div className="offer-card__identity">
            <div
              className="offer-card__logo"
              style={{ backgroundColor: lenderColor }}
            >
              {getLenderInitial(lenderName)}
            </div>
            <div>
              <p className="offer-card__name">{lenderName}</p>
              <p className="offer-card__type">
                {offer.offerType === 'pre-approved' ? 'Pre-approved offer' : 'Curated for you'}
              </p>
            </div>
          </div>
          <div className="offer-card__cta-group">
            <button className="offer-card__cta" onClick={handleCheckRate}>
              Apply Now
            </button>
            <span className="offer-card__cta-helper">
              on {lenderName.toLowerCase()}'s site
            </span>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="offer-card__badges">
            {badges.map((badge, index) => (
              <span key={`${badge}-${index}`} className="offer-card__badge">
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="offer-card__metrics">
          <div className="offer-card__metric">
            <span className="offer-card__metric-label">Processing Time</span>
            <span className="offer-card__metric-value">{processingLabel}</span>
          </div>
          <div className="offer-card__metric">
            <span className="offer-card__metric-label">Chances of Approval</span>
            <div className="offer-card__approval">
              <span className={`offer-card__approval-label offer-card__approval-label--${approvalMeta.level}`}>
                {approvalMeta.label}
              </span>
              <div className="offer-card__approval-gauge">
                <span style={{ width: `${approvalMeta.progress}%` }} />
              </div>
            </div>
          </div>
          <div className="offer-card__metric">
            <span className="offer-card__metric-label">EMI</span>
            <span className="offer-card__metric-value">{formatCurrency(emiAmount)}</span>
            <small>onwards</small>
          </div>
        </div>

        <div className="offer-card__details">
          <div>
            <span className="offer-card__metric-label">Rate of Interest</span>
            <p className="offer-card__metric-value">{apr ? `${apr}% p.a.` : 'As per lender'}</p>
          </div>
          <div>
            <span className="offer-card__metric-label">Loan Amount</span>
            <p className="offer-card__metric-value">
              {formatCurrency(offer.amount || offer.loanAmount || 0)}
            </p>
          </div>
          <div>
            <span className="offer-card__metric-label">Tenure</span>
            <p className="offer-card__metric-value">
              {Math.max(1, Math.round(termMonths / 12))} years
            </p>
          </div>
        </div>

        <div className="offer-card__footer">
          <button
            className="offer-card__link-btn"
            onClick={() => setDetailSheetOpen(true)}
          >
            + Show Details
          </button>
          <button className="offer-card__secondary-cta">
            Quick Disbursal
          </button>
        </div>
      </div>

      <OfferDetailsSheet
        open={isDetailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        lenderName={lenderName}
        lenderColor={lenderColor}
        offer={offer}
        charges={charges}
        processingLabel={processingLabel}
        emiAmount={emiAmount}
        onApply={handleCheckRate}
      />
    </>
  );
};

const OfferDetailsSheet = ({
  open,
  onClose,
  lenderName,
  lenderColor,
  offer,
  charges,
  processingLabel,
  emiAmount,
  onApply,
}) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="offer-details-backdrop" onClick={onClose}>
      <div className="offer-details" onClick={(event) => event.stopPropagation()}>
        <button className="offer-details__close" onClick={onClose}>
          ×
        </button>
        <header className="offer-details__header">
          <div
            className="offer-card__logo"
            style={{ backgroundColor: lenderColor }}
          >
            {getLenderInitial(lenderName)}
          </div>
          <div>
            <p className="offer-card__name">{lenderName}</p>
            <p className="offer-card__type">Processing Time: {processingLabel}</p>
          </div>
          <div className="offer-details__summary">
            <div>
              <span className="offer-card__metric-label">Loan Amount</span>
              <p className="offer-card__metric-value">{formatCurrency(offer.amount || 0)}</p>
            </div>
            <div>
              <span className="offer-card__metric-label">EMI</span>
              <p className="offer-card__metric-value">{formatCurrency(emiAmount)}</p>
            </div>
          </div>
        </header>

        <section className="offer-details__body">
          <h4>Summary of Charges</h4>
          <div className="offer-details__charges">
            <div>
              <span>Part Prepayment</span>
              <strong>{charges.partPrepayment}</strong>
            </div>
            <div>
              <span>Processing Fee</span>
              <strong>{charges.processingFee}</strong>
            </div>
            <div>
              <span>Foreclosure</span>
              <strong>{charges.foreclosure}</strong>
            </div>
            <div>
              <span>Interest Rate</span>
              <strong>{charges.interestRate}</strong>
            </div>
          </div>

          {offer.features?.length > 0 && (
            <>
              <h4>Loan Details</h4>
              <ul className="offer-details__list">
                {offer.features.map((feature, index) => (
                  <li key={`${feature}-${index}`}>{feature}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <footer className="offer-details__footer">
          <button className="offer-card__secondary-cta" onClick={onClose}>
            Maybe Later
          </button>
          <button className="offer-card__cta" onClick={onApply}>
            Apply Now
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

const formatCurrency = (amount) => {
  if (!amount) {
    return '₹0';
  }

  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)} Lakh${lakhs !== 1 ? 's' : ''}`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getLenderInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'L';
};

const getLenderColor = (name) => {
  const colors = ['#1c3693', '#16a34a', '#ec3957', '#f59e0b', '#6366f1'];
  const index = (name?.length || 0) % colors.length;
  return colors[index];
};

export default OfferCard;

