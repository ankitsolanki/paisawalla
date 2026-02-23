import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { webflowBridge } from '../../embed/webflowBridge';

const OfferCard = ({ offer, applicationId }) => {
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);

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
    if (approvalScore > 900) return { label: 'EXCELLENT', progress: 95, colorClass: 'text-success bg-success' };
    if (approvalScore > 820) return { label: 'VERY GOOD', progress: 80, colorClass: 'text-primary bg-primary' };
    if (approvalScore > 760) return { label: 'GOOD', progress: 65, colorClass: 'text-warning bg-warning' };
    return { label: 'FAIR', progress: 45, colorClass: 'text-muted-foreground bg-muted-foreground' };
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
      <div
        data-testid={`card-offer-${offer.id || offer._id}`}
        className="bg-background border border-border rounded-3xl p-5 mb-4 font-sans"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ backgroundColor: lenderColor }}
            >
              {getLenderInitial(lenderName)}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground m-0 leading-tight">{lenderName}</p>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">
                {offer.offerType === 'pre-approved' ? 'Pre-approved offer' : 'Curated for you'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              data-testid={`button-apply-${offer.id || offer._id}`}
              onClick={handleCheckRate}
              className="bg-primary text-primary-foreground border-none rounded-full px-5 py-2 text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              Apply Now
            </button>
            <span className="text-[10px] text-muted-foreground">
              on {lenderName.toLowerCase()}'s site
            </span>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {badges.map((badge, index) => (
              <span
                key={`${badge}-${index}`}
                className="bg-accent text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Processing Time</span>
            <span className="text-sm font-semibold text-foreground">{processingLabel}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Chances of Approval</span>
            <div>
              <span className={`text-xs font-bold ${approvalMeta.colorClass.split(' ')[0]}`}>
                {approvalMeta.label}
              </span>
              <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-[width] duration-300 ${approvalMeta.colorClass.split(' ')[1]}`}
                  style={{ width: `${approvalMeta.progress}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">EMI</span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(emiAmount)}</span>
            <small className="text-[10px] text-muted-foreground block">onwards</small>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Rate of Interest</span>
            <p className="text-sm font-semibold text-foreground m-0">{apr ? `${apr}% p.a.` : 'As per lender'}</p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Loan Amount</span>
            <p className="text-sm font-semibold text-foreground m-0">
              {formatCurrency(offer.amount || offer.loanAmount || 0)}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Tenure</span>
            <p className="text-sm font-semibold text-foreground m-0">
              {Math.max(1, Math.round(termMonths / 12))} years
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <button
            data-testid={`button-details-${offer.id || offer._id}`}
            onClick={() => setDetailSheetOpen(true)}
            className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer p-0 underline"
          >
            + Show Details
          </button>
          <button className="bg-accent text-accent-foreground border-none rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer">
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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-[500px] rounded-t-3xl md:rounded-3xl max-h-[85vh] overflow-y-auto font-sans"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-2xl text-muted-foreground cursor-pointer p-1 leading-none"
        >
          &times;
        </button>
        <header className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ backgroundColor: lenderColor }}
            >
              {getLenderInitial(lenderName)}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground m-0">{lenderName}</p>
              <p className="text-xs text-muted-foreground m-0 mt-0.5">Processing Time: {processingLabel}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Loan Amount</span>
              <p className="text-base font-bold text-foreground m-0">{formatCurrency(offer.amount || 0)}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">EMI</span>
              <p className="text-base font-bold text-foreground m-0">{formatCurrency(emiAmount)}</p>
            </div>
          </div>
        </header>

        <section className="p-5">
          <h4 className="text-sm font-bold text-foreground mb-3">Summary of Charges</h4>
          <div className="flex flex-col gap-2.5">
            {[
              ['Part Prepayment', charges.partPrepayment],
              ['Processing Fee', charges.processingFee],
              ['Foreclosure', charges.foreclosure],
              ['Interest Rate', charges.interestRate],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <strong className="text-sm font-semibold text-foreground">{value}</strong>
              </div>
            ))}
          </div>

          {offer.features?.length > 0 && (
            <>
              <h4 className="text-sm font-bold text-foreground mt-5 mb-3">Loan Details</h4>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 m-0">
                {offer.features.map((feature, index) => (
                  <li key={`${feature}-${index}`} className="text-sm text-muted-foreground">{feature}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <footer className="p-5 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-full text-sm font-semibold text-muted-foreground bg-transparent cursor-pointer"
          >
            Maybe Later
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-2.5 bg-primary text-primary-foreground border-none rounded-full text-sm font-semibold cursor-pointer"
          >
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
    return '\u20B90';
  }

  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `\u20B9${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)} Lakh${lakhs !== 1 ? 's' : ''}`;
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
