import { useMemo, useState } from 'react';
import { webflowBridge } from '../../embed/webflowBridge';
import { getLenderLogo } from './lenderLogos';

const LENDER_APPLY_URLS = {
  poonawalla: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PTG00338&UTM_Partner_Name=KARIX&UTM_Partner_Medium=P01&UTM_Partner_AgentCode=PFLKARIX&UTM_Partner_ReferenceID=KARIXPFL00000001',
  poonawaala: 'https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PTG00338&UTM_Partner_Name=KARIX&UTM_Partner_Medium=P01&UTM_Partner_AgentCode=PFLKARIX&UTM_Partner_ReferenceID=KARIXPFL00000001',
  prefr: 'https://marketplace.prefr.com/karixweb?utm_source=k1&utm_medium=P01',
  prefer: 'https://marketplace.prefr.com/karixweb?utm_source=k1&utm_medium=P01',
  mpokket: 'https://web.mpokket.in/?utm_source=karix&utm_medium=P01',
  hero_fincorp: 'https://hipl.onelink.me/S7fO?af_ios_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_android_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_xp=custom&pid=karix_int&is_retargeting=true&af_reengagement_window=30d&c=Karix_ACQ_22042025&utm_source=partnership&utm_campaign=karix_int&clickid=clickid&utm_campaignid=PP01',
  'hero fincorp': 'https://hipl.onelink.me/S7fO?af_ios_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_android_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_xp=custom&pid=karix_int&is_retargeting=true&af_reengagement_window=30d&c=Karix_ACQ_22042025&utm_source=partnership&utm_campaign=karix_int&clickid=clickid&utm_campaignid=PP01',
  herofincorp: 'https://hipl.onelink.me/S7fO?af_ios_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_android_url=https%3A%2F%2Floans.apps.herofincorp.com%2Fen%2Fpersonal-loan&af_xp=custom&pid=karix_int&is_retargeting=true&af_reengagement_window=30d&c=Karix_ACQ_22042025&utm_source=partnership&utm_campaign=karix_int&clickid=clickid&utm_campaignid=PP01',
};

const getLenderApplyUrl = (name) => {
  if (!name) return null;
  const key = name.toLowerCase().replace(/[\s_-]+/g, '_').trim();
  if (LENDER_APPLY_URLS[key]) return LENDER_APPLY_URLS[key];
  const keyNoSep = name.toLowerCase().replace(/[\s_-]+/g, '').trim();
  if (LENDER_APPLY_URLS[keyNoSep]) return LENDER_APPLY_URLS[keyNoSep];
  return null;
};

const HeroOfferCard = ({ offer, applicationId, isCompareSelected, onToggleCompare }) => {
  const [expanded, setExpanded] = useState(false);

  const lenderName = offer.lender || offer.lenderName || 'Lender';
  const lenderColor = getLenderColor(lenderName);
  const lenderLogo = getLenderLogo(lenderName);
  const apr = offer.apr || offer.interestRate || 0;
  const termMonths = offer.term || offer.termMonths || 36;
  const features = offer.features || offer.offerData?.features || [];

  const processingLabel = useMemo(() => {
    const info = offer.offerData?.processingTime || '';
    if (typeof info === 'string' && info.length > 0) return info;
    if (offer.offerData?.disbursalTimeHours) return `${offer.offerData.disbursalTimeHours} hrs`;
    return 'Instant';
  }, [offer]);

  const tenureLabel = termMonths >= 12
    ? `${Math.round(termMonths / 12 * 10) / 10} yrs`
    : `${termMonths} mo`;

  const charges = {
    partPrepayment: offer.offerData?.charges?.partPrepayment ?? offer.offerData?.partPrepayment ?? 'NIL',
    processingFee: offer.offerData?.charges?.processingFee ?? offer.offerData?.processingFee ?? '4.5%',
    foreclosure: offer.offerData?.charges?.foreclosure ?? offer.offerData?.foreclosure ?? '3%',
    interestRate: apr ? `${apr}% p.a.` : 'As per lender',
  };

  const handleApply = () => {
    webflowBridge.postMessage('offerApplied', {
      applicationId,
      lenderName: offer.lender || offer.lenderName,
      offerId: offer.id || offer._id,
    });
    const applyUrl = offer.ctaUrl || getLenderApplyUrl(lenderName);
    if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      data-testid={`card-hero-offer-${offer.id || offer._id}`}
      className="relative bg-white border-2 border-primary/30 rounded-xl overflow-visible font-sans shadow-sm"
    >
      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <div className="md:hidden p-3">
        <div className="flex items-center gap-2 mb-2">
          {lenderLogo ? (
            <img src={lenderLogo} alt={lenderName} className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-white p-0.5 shrink-0" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: lenderColor }}
            >
              {lenderName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold text-foreground m-0 truncate">{lenderName}</p>
              <span
                className="text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-px rounded shrink-0"
                style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
              >
                Best Match
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground m-0">
              {offer.offerType === 'pre-approved' ? 'Pre-approved for you' : 'Curated for your profile'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 py-2 border-y border-gray-100">
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Amount</span>
            <span className="text-[12px] font-semibold text-foreground">{formatCurrency(offer.amount || 0)}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Tenure</span>
            <span className="text-[12px] font-semibold text-foreground">{tenureLabel}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Disbursal</span>
            <span className="text-[12px] font-semibold text-foreground">{processingLabel}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Rate</span>
            <span className="text-[12px] font-semibold text-foreground">{apr ? `${apr}%` : '--'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            data-testid={`button-apply-hero-${offer.id || offer._id}`}
            onClick={handleApply}
            className="flex-1 py-1.5 bg-primary text-primary-foreground border-none rounded-lg text-[11px] font-bold cursor-pointer"
          >
            Apply Now
          </button>
          <button
            data-testid={`button-compare-hero-${offer.id || offer._id}`}
            onClick={() => onToggleCompare && onToggleCompare(offer)}
            className={`px-3 py-1.5 min-w-[76px] border rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
              isCompareSelected
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-transparent border-border text-muted-foreground'
            }`}
          >
            {isCompareSelected ? 'Added' : 'Compare'}
          </button>
          <button
            data-testid={`button-expand-hero-${offer.id || offer._id}`}
            onClick={() => setExpanded(!expanded)}
            className="text-primary text-[11px] font-medium cursor-pointer bg-transparent border-none p-0 shrink-0 flex items-center gap-0.5"
          >
            {expanded ? 'Less' : 'More'}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="M2.5 3.75L5 6.25L7.5 3.75" className="stroke-primary" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex flex-col gap-1.5">
              {[
                ['Interest Rate', charges.interestRate],
                ['Processing Fee', charges.processingFee],
                ['Part Prepayment', charges.partPrepayment],
                ['Foreclosure', charges.foreclosure],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded-md">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            {features.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-col gap-1">
                  {features.map((feat, i) => (
                    <div key={`${feat}-${i}`} className="flex items-start gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                        <path d="M2 7L5.5 10.5L12 3.5" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[11px] text-muted-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>Redirects to {lenderName.toLowerCase()}'s site</span>
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1L1 3.5V6.5C1 8.1 2.7 9.5 5 10C7.3 9.5 9 8.1 9 6.5V3.5L5 1Z" className="fill-muted-foreground/30 stroke-muted-foreground" strokeWidth="0.8" />
                </svg>
                RBI Registered
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===== DESKTOP LAYOUT (>= md) ===== */}
      <div className="hidden md:block">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5 w-[200px] shrink-0">
            {lenderLogo ? (
              <img src={lenderLogo} alt={lenderName} className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-white p-0.5 shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: lenderColor }}
              >
                {lenderName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground m-0 truncate">{lenderName}</p>
                <span
                  className="text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-px rounded shrink-0"
                  style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
                >
                  Best Match
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground m-0">
                {offer.offerType === 'pre-approved' ? 'Pre-approved for you' : 'Curated for your profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Loan Amount</p>
              <p className="text-sm font-bold text-foreground m-0">{formatCurrency(offer.amount || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Tenure</p>
              <p className="text-sm font-bold text-foreground m-0">{tenureLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Disbursal</p>
              <p className="text-sm font-bold text-foreground m-0">{processingLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Interest Rate</p>
              <p className="text-sm font-bold text-foreground m-0">{apr ? `${apr}% p.a.` : '--'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              data-testid={`button-apply-hero-${offer.id || offer._id}`}
              onClick={handleApply}
              className="px-5 py-2 bg-primary text-primary-foreground border-none rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              Apply Now
            </button>
            <button
              data-testid={`button-compare-hero-${offer.id || offer._id}`}
              onClick={() => onToggleCompare && onToggleCompare(offer)}
              className={`px-3 py-2 min-w-[76px] border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isCompareSelected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {isCompareSelected ? 'Added' : 'Compare'}
            </button>
            <button
              data-testid={`button-expand-hero-${offer.id || offer._id}`}
              onClick={() => setExpanded(!expanded)}
              className="text-primary text-xs font-medium cursor-pointer bg-transparent border-none hover:bg-primary/5 rounded-md transition-colors flex items-center gap-0.5 px-2 py-1.5"
            >
              {expanded ? 'Less' : 'More'}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                <path d="M3 4.5L6 7.5L9 4.5" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-3 pt-0 border-t border-border">
            <div className="mt-3 flex flex-col gap-1.5">
              {[
                ['Interest Rate', charges.interestRate],
                ['Processing Fee', charges.processingFee],
                ['Part Prepayment', charges.partPrepayment],
                ['Foreclosure', charges.foreclosure],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded-md">
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                  <span className="text-[11px] font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            {features.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {features.map((feat, i) => (
                  <span key={`${feat}-${i}`} className="bg-primary/8 text-primary text-[10px] font-medium px-2 py-0.5 rounded-full border border-primary/15">
                    {feat}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>Redirects to {lenderName.toLowerCase()}'s site</span>
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1L1 3.5V6.5C1 8.1 2.7 9.5 5 10C7.3 9.5 9 8.1 9 6.5V3.5L5 1Z" className="fill-muted-foreground/30 stroke-muted-foreground" strokeWidth="0.8" />
                </svg>
                RBI Registered
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
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

export default HeroOfferCard;
