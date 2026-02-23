import { useState, useMemo, useCallback } from 'react';

const EMICalculator = ({ loanAmount = 500000, interestRate = 12, tenure = 36, onValuesChange }) => {
  const [amount, setAmount] = useState(loanAmount);
  const [rate, setRate] = useState(interestRate);
  const [months, setMonths] = useState(tenure);

  const emi = useMemo(() => {
    const monthlyRate = rate / 12 / 100;
    if (monthlyRate === 0) return Math.round(amount / months);
    const emi = amount * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
  }, [amount, rate, months]);

  const totalPayment = emi * months;
  const totalInterest = totalPayment - amount;
  const interestPercent = totalPayment > 0 ? Math.round((totalInterest / totalPayment) * 100) : 0;

  const handleAmountChange = useCallback((val) => {
    const v = Number(val);
    setAmount(v);
    if (onValuesChange) onValuesChange({ amount: v, rate, months });
  }, [rate, months, onValuesChange]);

  const handleTenureChange = useCallback((val) => {
    const v = Number(val);
    setMonths(v);
    if (onValuesChange) onValuesChange({ amount, rate, months: v });
  }, [amount, rate, onValuesChange]);

  return (
    <div
      data-testid="emi-calculator"
      className="mx-4 md:mx-6 mt-4 p-5 bg-background border border-border rounded-2xl font-sans"
    >
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-sm font-bold text-foreground m-0">
          EMI Calculator
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="12" y2="14" />
            </svg>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider m-0">Monthly EMI</p>
            <p data-testid="text-emi-value" className="text-lg font-bold text-primary m-0">{formatCurrency(emi)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground font-medium">Loan Amount</label>
            <span data-testid="text-calc-amount" className="text-xs font-semibold text-foreground">{formatCurrency(amount)}</span>
          </div>
          <input
            data-testid="slider-loan-amount"
            type="range"
            min={50000}
            max={5000000}
            step={10000}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-muted-foreground/60">{'\u20B9'}50K</span>
            <span className="text-[10px] text-muted-foreground/60">{'\u20B9'}50L</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tenure</label>
            <span data-testid="text-calc-tenure" className="text-xs font-semibold text-foreground">{months} months ({Math.round(months / 12 * 10) / 10} yrs)</span>
          </div>
          <input
            data-testid="slider-tenure"
            type="range"
            min={6}
            max={84}
            step={6}
            value={months}
            onChange={(e) => handleTenureChange(e.target.value)}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-0.5">
            <span className="text-[10px] text-muted-foreground/60">6 mo</span>
            <span className="text-[10px] text-muted-foreground/60">84 mo</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[140px]">
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${(100 - interestPercent) * 0.942} 94.2`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider m-0">Total Payment</p>
            <p data-testid="text-total-payment" className="text-sm font-bold text-foreground m-0">{formatCurrency(totalPayment)}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground m-0">Principal</p>
            <p className="text-xs font-semibold text-foreground m-0">{formatCurrency(amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground m-0">Interest</p>
            <p className="text-xs font-semibold text-foreground/70 m-0">{formatCurrency(totalInterest)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatCurrency = (amount) => {
  if (!amount) return '\u20B90';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `\u20B9${cr.toFixed(cr % 1 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `\u20B9${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default EMICalculator;
