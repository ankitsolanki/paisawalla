import { useMemo, useState } from 'react';
import { webflowBridge } from '../../embed/webflowBridge';
import { getLenderLogo } from './lenderLogos';

const LENDER_DETAILS = {
  poonawalla: {
    processingFee: '1.7% to 3.5% + applicable taxes',
    foreclosureLabel: 'Prepayment Charges',
    foreclosure: 'Nil',
    age: '22 - 58 years',
    minIncome: '20,000 & above',
  },
  poonawaala: {
    processingFee: '1.7% to 3.5% + applicable taxes',
    foreclosureLabel: 'Prepayment Charges',
    foreclosure: 'Nil',
    age: '22 - 58 years',
    minIncome: '20,000 & above',
  },
  prefr: {
    processingFee: '3% to 5% of the loan amount',
    foreclosure: '5% of Principal Outstanding',
    age: '22 - 55 years',
    minIncome: '18,000 & above',
  },
  prefer: {
    processingFee: '3% to 5% of the loan amount',
    foreclosure: '5% of Principal Outstanding',
    age: '22 - 55 years',
    minIncome: '18,000 & above',
  },
  abfl: {
    processingFee: 'Up to 2% of the loan amount',
    foreclosure: '4% of the principal outstanding + applicable GST',
    age: '23 - 60 years',
    minIncome: '20,000 & above',
  },
  hero_fincorp: {
    processingFee: '2.5% of the loan amount',
    foreclosure: '4-5% of the principal outstanding + applicable GST',
    age: '21 - 58 years',
    minIncome: '15,000 & above',
  },
  'hero fincorp': {
    processingFee: '2.5% of the loan amount',
    foreclosure: '4-5% of the principal outstanding + applicable GST',
    age: '21 - 58 years',
    minIncome: '15,000 & above',
  },
  herofincorp: {
    processingFee: '2.5% of the loan amount',
    foreclosure: '4-5% of the principal outstanding + applicable GST',
    age: '21 - 58 years',
    minIncome: '15,000 & above',
  },
  mpokket: {
    processingFee: '4% of the loan amount + Applicable GST',
    foreclosure: '3% of Principal Outstanding',
    age: '22 - 55 years',
    minIncome: '15,000 & above',
  },
};

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

const getLenderDetails = (name) => {
  if (!name) return null;
  const key = name.toLowerCase().replace(/[\s_-]+/g, '_').trim();
  if (LENDER_DETAILS[key]) return LENDER_DETAILS[key];
  const keyNoSep = name.toLowerCase().replace(/[\s_-]+/g, '').trim();
  if (LENDER_DETAILS[keyNoSep]) return LENDER_DETAILS[keyNoSep];
  for (const [k, v] of Object.entries(LENDER_DETAILS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
};

const OfferCardV2 = ({ offer, applicationId, rank, isCompareSelected, onToggleCompare, isBestOffer }) => {
  const [expanded, setExpanded] = useState(false);

  const lenderName = offer.lender || offer.lenderName || 'Lender';
  const lenderColor = getLenderColor(lenderName);
  const apr = offer.apr || offer.interestRate || 0;
  const termMonths = offer.term || offer.termMonths || 36;
  const features = offer.features || offer.offerData?.features || [];
  const lenderLogo = getLenderLogo(lenderName);

  const processingLabel = useMemo(() => {
    const info = offer.offerData?.processingTime || '';
    if (typeof info === 'string' && info.length > 0) return info;
    if (offer.offerData?.disbursalTimeHours) return `${offer.offerData.disbursalTimeHours} hrs`;
    return 'Instant';
  }, [offer]);

  const lenderDetails = useMemo(() => getLenderDetails(lenderName), [lenderName]);

  const handleApply = () => {
    webflowBridge.postMessage('offerApplied', {
      applicationId,
      lenderName: offer.lender || offer.lenderName,
      offerId: offer.id || offer._id,
    });
    const applyUrl = offer.ctaUrl || getLenderApplyUrl(lenderName);
    if (applyUrl) window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  const tenureLabel = termMonths >= 12
    ? `${Math.round(termMonths / 12 * 10) / 10} yrs`
    : `${termMonths} mo`;

  const lenderAvatar = lenderLogo ? (
    <img src={lenderLogo} alt={lenderName} className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-gray-50 p-0.5" />
  ) : (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ backgroundColor: lenderColor }}
    >
      {lenderName.charAt(0).toUpperCase()}
    </div>
  );

  const expandedContent = expanded && (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex flex-col gap-1.5">
        {lenderDetails ? (
          <>
            {[
              ['Processing Fee', lenderDetails.processingFee],
              [lenderDetails.foreclosureLabel || 'Foreclosure Charges', lenderDetails.foreclosure],
              ['Age', lenderDetails.age],
              ['Minimum Income', lenderDetails.minIncome],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between py-1.5 px-2.5 bg-gray-50 rounded-md gap-3">
                <span className="text-[11px] text-gray-500 shrink-0">{label}</span>
                <span className="text-[11px] font-semibold text-gray-900 text-right">{value}</span>
              </div>
            ))}
          </>
        ) : (
          <p className="text-[11px] text-gray-400 m-0 py-1">Details not available for this lender.</p>
        )}
      </div>
      {features.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Features</p>
          <div className="flex flex-col gap-1">
            {features.map((feat, i) => (
              <div key={`${feat}-${i}`} className="flex items-start gap-1.5">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                  <circle cx="7" cy="7" r="7" fill="#EEF2FF" />
                  <path d="M4 7L6 9L10 5" stroke="#4A40EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[11px] text-gray-600">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      data-testid={`card-offer-v2-${offer.id || offer._id}`}
      className={`relative bg-white border rounded-xl font-sans transition-all duration-200 shadow-sm hover:shadow-md ${isBestOffer ? 'border-primary/40 ring-1 ring-primary/10' : 'border-gray-200'}`}
    >
      {/* ===== MOBILE LAYOUT (< 900px) ===== */}
      <div className="pw-md:hidden p-3.5">
        <div className="flex items-center gap-2.5 mb-3">
          {lenderAvatar}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p data-testid={`text-lender-${offer.id || offer._id}`} className="text-[14px] font-bold text-gray-900 m-0 truncate">{lenderName}</p>
              {isBestOffer && (
                <span
                  className="text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-px rounded shrink-0"
                  style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
                >
                  Best
                </span>
              )}
              {offer.offerType === 'pre-approved' && (
                <span className="bg-green-50 text-green-600 text-[8px] font-bold px-1.5 py-px rounded shrink-0">
                  Pre-approved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2.5 border-y border-gray-100">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Amount</span>
            <span data-testid={`text-amount-${offer.id || offer._id}`} className="text-[13px] font-semibold text-gray-900">{formatCurrency(offer.amount || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Tenure</span>
            <span data-testid={`text-tenure-${offer.id || offer._id}`} className="text-[13px] font-semibold text-gray-900">{tenureLabel}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Disbursal</span>
            <span data-testid={`text-disbursal-${offer.id || offer._id}`} className="text-[13px] font-semibold text-gray-900">{processingLabel}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-0.5">Rate</span>
            <span data-testid={`text-rate-${offer.id || offer._id}`} className="text-[13px] font-semibold text-gray-900">{apr ? `${apr}%` : '--'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2.5">
          <button
            data-testid={`button-apply-v2-${offer.id || offer._id}`}
            onClick={handleApply}
            className="flex-1 py-2 text-white border-none rounded-lg text-xs font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
          >
            Apply Now
          </button>
          <button
            data-testid={`button-compare-v2-${offer.id || offer._id}`}
            onClick={() => onToggleCompare && onToggleCompare(offer)}
            className={`px-3 py-2 min-w-[76px] border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              isCompareSelected
                ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                : 'bg-transparent border-gray-200 text-gray-500'
            }`}
          >
            {isCompareSelected ? 'Added' : 'Compare'}
          </button>
          <button
            data-testid={`button-expand-v2-${offer.id || offer._id}`}
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-600 p-1.5 cursor-pointer bg-transparent border-none hover:bg-indigo-50 rounded-md transition-colors flex items-center shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="M3.5 5.25L7 8.75L10.5 5.25" className="stroke-indigo-600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {expandedContent}
      </div>

      {/* ===== DESKTOP LAYOUT (>= 900px) ===== */}
      <div className="pw-md:block">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5 w-[180px] shrink-0">
            {lenderAvatar}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p data-testid={`text-lender-desktop-${offer.id || offer._id}`} className="text-sm font-bold text-gray-900 m-0 truncate">{lenderName}</p>
                {isBestOffer && (
                  <span
                    className="text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-px rounded shrink-0"
                    style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
                  >
                    Best
                  </span>
                )}
              </div>
              {offer.offerType === 'pre-approved' && (
                <span className="text-green-600 text-[10px] font-bold">Pre-approved</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Loan Amount</p>
              <p className="text-sm font-bold text-gray-900 m-0">{formatCurrency(offer.amount || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Tenure</p>
              <p className="text-sm font-bold text-gray-900 m-0">{tenureLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Disbursal</p>
              <p className="text-sm font-bold text-gray-900 m-0">{processingLabel}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider m-0 mb-0.5">Interest Rate</p>
              <p className="text-sm font-bold text-gray-900 m-0">{apr ? `${apr}% p.a.` : '--'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              data-testid={`button-apply-v2-${offer.id || offer._id}`}
              onClick={handleApply}
              className="px-5 py-2 text-white border-none rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 hover:opacity-90"
              style={{ background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' }}
            >
              Apply Now
            </button>
            <button
              data-testid={`button-compare-v2-${offer.id || offer._id}`}
              onClick={() => onToggleCompare && onToggleCompare(offer)}
              className={`px-3 py-2 min-w-[76px] border rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isCompareSelected
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
                  : 'bg-transparent border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {isCompareSelected ? 'Added' : 'Compare'}
            </button>
            <button
              data-testid={`button-expand-v2-${offer.id || offer._id}`}
              onClick={() => setExpanded(!expanded)}
              className="text-indigo-600 p-1.5 cursor-pointer bg-transparent border-none hover:bg-indigo-50 rounded-md transition-colors flex items-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
                <path d="M3.5 5.25L7 8.75L10.5 5.25" className="stroke-indigo-600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-3">
            {expandedContent}
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

export default OfferCardV2;
