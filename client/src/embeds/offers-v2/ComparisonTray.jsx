import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getLenderLogo } from './lenderLogos';

const ComparisonTray = ({ selectedOffers, onRemove, onClear, onCompare }) => {
  if (!selectedOffers || selectedOffers.length === 0) return null;

  return (
    <div
      data-testid="comparison-tray"
      className="fixed bottom-0 left-0 right-0 z-40 font-sans"
    >
      <div className="max-w-[600px] mx-auto px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="bg-background border border-border rounded-2xl shadow-lg p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-foreground">
              Compare ({selectedOffers.length}/3)
            </span>
            <button
              data-testid="button-clear-compare"
              onClick={onClear}
              className="bg-transparent border-none text-xs text-destructive font-medium cursor-pointer p-0"
            >
              Clear All
            </button>
          </div>

          <div className="hidden sm:flex gap-2 mb-3">
            {selectedOffers.map((offer) => {
              const name = offer.lender || offer.lenderName || 'Lender';
              const color = getLenderColor(name);
              const logo = getLenderLogo(name);
              return (
                <div
                  key={offer.id || offer._id}
                  className="flex-1 flex items-center gap-2 bg-accent/50 rounded-lg p-2 min-w-0"
                >
                  {logo ? (
                    <img src={logo} alt={name} className="w-7 h-7 rounded-lg object-contain border border-gray-100 bg-white p-0.5 shrink-0" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground truncate flex-1">{name}</span>
                  <button
                    data-testid={`button-remove-compare-${offer.id || offer._id}`}
                    onClick={() => onRemove(offer)}
                    className="bg-transparent border-none text-muted-foreground text-sm cursor-pointer p-0 leading-none shrink-0"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
            {Array.from({ length: 3 - selectedOffers.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex-1 border border-dashed border-border rounded-lg p-2 flex items-center justify-center min-h-[40px]"
              >
                <span className="text-[10px] text-muted-foreground/50">Add offer</span>
              </div>
            ))}
          </div>

          <div className="flex sm:hidden flex-col gap-1.5 mb-2">
            {selectedOffers.map((offer) => {
              const name = offer.lender || offer.lenderName || 'Lender';
              const color = getLenderColor(name);
              const logo = getLenderLogo(name);
              const apr = offer.apr || offer.interestRate || 0;
              return (
                <div
                  key={offer.id || offer._id}
                  className="flex items-center gap-2 bg-accent/50 rounded-lg px-2.5 py-1.5"
                >
                  {logo ? (
                    <img src={logo} alt={name} className="w-6 h-6 rounded-md object-contain border border-gray-100 bg-white p-0.5 shrink-0" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {name.charAt(0)}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-foreground truncate flex-1">{name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{apr ? `${apr}%` : '--'}</span>
                  <button
                    data-testid={`button-remove-compare-mobile-${offer.id || offer._id}`}
                    onClick={() => onRemove(offer)}
                    className="bg-transparent border-none text-muted-foreground text-xs cursor-pointer p-0 leading-none shrink-0 ml-1"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          <button
            data-testid="button-compare-now"
            onClick={onCompare}
            disabled={selectedOffers.length < 2}
            className={`w-full py-2.5 border-none rounded-xl text-sm font-bold cursor-pointer transition-colors ${
              selectedOffers.length >= 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Compare {selectedOffers.length >= 2 ? `${selectedOffers.length} Offers` : '(Select at least 2)'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ComparisonSheet = ({ offers, open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open || !offers || offers.length < 2) return null;

  const metrics = [
    { label: 'Interest Rate', getValue: (o) => o.apr ? `${o.apr}% p.a.` : '--' },
    { label: 'Monthly EMI', getValue: (o) => formatCurrency(o.monthlyPayment || Math.round((o.amount || 0) / Math.max(o.term || 36, 1))) },
    { label: 'Loan Amount', getValue: (o) => formatCurrency(o.amount || 0) },
    { label: 'Tenure', getValue: (o) => `${o.term || 36} mo` },
    { label: 'Processing Fee', getValue: (o) => o.offerData?.charges?.processingFee || o.offerData?.processingFee || '4.5%' },
    { label: 'Foreclosure', getValue: (o) => o.offerData?.charges?.foreclosure || o.offerData?.foreclosure || '3%' },
    { label: 'Part Prepayment', getValue: (o) => o.offerData?.charges?.partPrepayment || o.offerData?.partPrepayment || 'NIL' },
    { label: 'Disbursal', getValue: (o) => o.offerData?.processingTime || 'Instant' },
    { label: 'Type', getValue: (o) => o.offerType === 'pre-approved' ? 'Pre-approved' : o.offerType === 'conditional' ? 'Conditional' : 'Standard' },
  ];

  const getBestForMetric = (metric) => {
    if (metric.label === 'Interest Rate') {
      const rates = offers.map((o) => o.apr || Infinity);
      return rates.indexOf(Math.min(...rates));
    }
    if (metric.label === 'Monthly EMI') {
      const emis = offers.map((o) => o.monthlyPayment || Math.round((o.amount || 0) / Math.max(o.term || 36, 1)));
      return emis.indexOf(Math.min(...emis));
    }
    if (metric.label === 'Loan Amount') {
      const amounts = offers.map((o) => o.amount || 0);
      return amounts.indexOf(Math.max(...amounts));
    }
    return -1;
  };

  return createPortal(
    <div
      data-testid="comparison-sheet"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center font-sans"
      onClick={onClose}
    >
      <div
        className="bg-background w-full max-w-[640px] rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background z-10 p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 rounded-t-3xl">
          <h3 className="text-base sm:text-lg font-bold text-foreground m-0">Compare Offers</h3>
          <button
            data-testid="button-close-comparison"
            onClick={onClose}
            className="bg-transparent border-none text-2xl text-muted-foreground cursor-pointer p-1 leading-none"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <div className="hidden sm:block">
            <div className="sticky top-0 bg-background z-10 border-b border-border">
              <div className="grid" style={{ gridTemplateColumns: `120px repeat(${offers.length}, 1fr)` }}>
                <div className="p-3" />
                {offers.map((offer) => {
                  const name = offer.lender || offer.lenderName || 'Lender';
                  const color = getLenderColor(name);
                  const logo = getLenderLogo(name);
                  return (
                    <div key={offer.id || offer._id} className="p-3 text-center border-l border-border">
                      {logo ? (
                        <img src={logo} alt={name} className="w-9 h-9 rounded-lg mx-auto object-contain border border-gray-100 bg-white p-0.5 mb-1.5" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-sm mb-1.5"
                          style={{ backgroundColor: color }}
                        >
                          {name.charAt(0)}
                        </div>
                      )}
                      <p className="text-xs font-bold text-foreground m-0 truncate">{name}</p>
                      {offer.offerType === 'pre-approved' && (
                        <span className="text-[9px] text-[#22c55e] font-medium">Pre-approved</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {metrics.map((metric, mi) => {
                const bestIdx = getBestForMetric(metric);
                return (
                  <div
                    key={metric.label}
                    className={`grid border-b border-border ${mi % 2 === 0 ? 'bg-accent/20' : ''}`}
                    style={{ gridTemplateColumns: `120px repeat(${offers.length}, 1fr)` }}
                  >
                    <div className="p-3 flex items-center">
                      <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
                    </div>
                    {offers.map((offer, oi) => (
                      <div key={offer.id || offer._id} className="p-3 text-center border-l border-border flex items-center justify-center">
                        <span className={`text-xs font-semibold ${bestIdx === oi ? 'text-[#22c55e]' : 'text-foreground'}`}>
                          {metric.getValue(offer)}
                          {bestIdx === oi && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="inline ml-1">
                              <path d="M2 5L4 7L8 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sm:hidden">
            <div className="flex border-b border-border bg-accent/20">
              {offers.map((offer) => {
                const name = offer.lender || offer.lenderName || 'Lender';
                const color = getLenderColor(name);
                const logo = getLenderLogo(name);
                return (
                  <div key={offer.id || offer._id} className="flex-1 p-3 text-center border-l border-border first:border-l-0">
                    {logo ? (
                      <img src={logo} alt={name} className="w-8 h-8 rounded-lg mx-auto object-contain border border-gray-100 bg-white p-0.5 mb-1" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-white font-bold text-xs mb-1"
                        style={{ backgroundColor: color }}
                      >
                        {name.charAt(0)}
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-foreground m-0 truncate">{name}</p>
                    {offer.offerType === 'pre-approved' && (
                      <span className="text-[8px] text-[#22c55e] font-medium">Pre-approved</span>
                    )}
                  </div>
                );
              })}
            </div>

            {metrics.map((metric, mi) => {
              const bestIdx = getBestForMetric(metric);
              return (
                <div key={metric.label} className={`border-b border-border ${mi % 2 === 0 ? 'bg-accent/10' : ''}`}>
                  <div className="px-3 pt-2 pb-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <div className="flex">
                    {offers.map((offer, oi) => (
                      <div key={offer.id || offer._id} className="flex-1 px-3 pb-2 text-center border-l border-border first:border-l-0">
                        <span className={`text-xs font-semibold ${bestIdx === oi ? 'text-[#22c55e]' : 'text-foreground'}`}>
                          {metric.getValue(offer)}
                          {bestIdx === oi && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="inline ml-0.5">
                              <path d="M2 5L4 7L8 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-[10px] text-muted-foreground text-center">
              Green values indicate the best option for that metric. Final rates may vary based on lender assessment.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const formatCurrency = (amount) => {
  if (!amount) return '\u20B90';
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `\u20B9${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const getLenderColor = (name) => {
  const colors = ['#1c3693', '#16a34a', '#ec3957', '#f59e0b', '#6366f1', '#0891b2', '#dc2626'];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

export { ComparisonTray, ComparisonSheet };
export default ComparisonTray;
