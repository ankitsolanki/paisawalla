import { useState, useCallback, useEffect, useRef } from 'react';
import ErrorBoundary from './ui/ErrorBoundary';
import Button from './ui/CustomButton';
import Input from './ui/CustomInput';
import { validateField } from '../utils/validationRules';
import apiClient from '../utils/apiClient';
import { buildUrlWithAuthParams } from '../utils/queryEncoder';

const SectionHeading = ({ number, title }) => (
  <h4 className="text-inherit font-semibold text-foreground mt-4 mb-2">
    {number}. {title}
  </h4>
);

const SubItem = ({ number, text }) => (
  <p className="my-1 ml-4">
    <strong>{number}</strong> {text}
  </p>
);

const ConsentNoticePanel = ({ isOpen, onToggle }) => {
  if (!isOpen) return null;

  return (
    <div className="mt-3 border border-border rounded-md bg-muted overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted border-none cursor-pointer text-left sticky top-0 z-10 border-b border-border"
        aria-expanded={isOpen}
        data-testid="button-close-consent-panel"
      >
        <h3 className="text-[0.9375rem] sm:text-lg font-semibold text-foreground m-0 leading-snug">
          Consent to Access and Use of Credit Information, Contact Preferences and Data Processing
        </h3>
        <span className="text-xl text-muted-foreground shrink-0 ml-3 font-medium" aria-hidden="true">
          X
        </span>
      </button>

      <div className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto p-4 sm:p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words" style={{ overflowWrap: 'anywhere' }}>
        <div className="mb-4 p-3 bg-accent rounded-sm">
          <p className="m-0 mb-1 font-semibold text-foreground">
            Data Fiduciary: Unimobile Messaging Solutions LLP ("Paisawaala")
          </p>
          <p className="my-0.5 text-xs">Registered Address: B 18, Infocity 1, Sector 34, Gurgaon, Haryana, 122001</p>
          <p className="my-0.5 text-xs">General Email: contactus@theunimobile.com</p>
          <p className="my-0.5 text-xs">Data Protection Officer (DPO): dpo@theunimobile.com</p>
          <p className="my-0.5 text-xs">Grievance Officer: grievance@theunimobile.com</p>
        </div>

        <SectionHeading number="1" title="What personal data we collect & why" />

        <p className="mt-2 mb-1 font-semibold">1.1 Identity & KYC</p>
        <SubItem number="1.1.1" text="Full name - Identify you; pre-fill lender applications; generate contracts" />
        <SubItem number="1.1.2" text="Date of birth - Eligibility checks; age verification" />
        <SubItem number="1.1.3" text="Gender - Product suitability disclosures (where relevant)" />
        <SubItem number="1.1.4" text="PAN - KYC with lenders/NBFCs for regulatory purposes" />
        <SubItem number="1.1.5" text="Aadhaar (optional; collected only where required by law or chosen by you) - e-KYC/identity verification via permitted routes" />

        <p className="mt-2 mb-1 font-semibold">1.2 Contact & Communication</p>
        <SubItem number="1.2.1" text="Email address - Account setup; service updates; statutory notices" />
        <SubItem number="1.2.2" text="Mobile number - OTP, two-factor authentication; status alerts; Service SMS; Customer support" />
        <SubItem number="1.2.3" text="Residential address - Correspondence" />

        <p className="mt-2 mb-1 font-semibold">1.3 Financial & Employment</p>
        <SubItem number="1.3.1" text="Income details - Product suitability & eligibility assessment" />
        <SubItem number="1.3.2" text="Employment status & employer details - Underwriting; eligibility confirmation" />
        <SubItem number="1.3.3" text="Credit Information - Risk assessment; matching with suitable lenders/products" />

        <p className="mt-2 mb-1 font-semibold">1.4 Preferences & Interaction</p>
        <SubItem number="1.4.1" text="Product preferences - Tailored recommendations (only if you opt in)" />
        <SubItem number="1.4.2" text="Interaction metadata (timestamps, channel, consent logs) - Compliance evidence; service diagnostics" />

        <p className="mt-2 mb-1 font-semibold">1.5 Generated/Observed during service</p>
        <SubItem number="1.5.1" text="Application identifiers; status updates; lender decisions/notifications - Processing your applications and informing you" />
        <SubItem number="1.5.2" text="Behavioural data (clickstream, usage patterns) - Improve app performance & UX (only if you opt in for analytics/personalization)" />
        <SubItem number="1.5.3" text="Device & network data (IP, browser, device IDs, coarse location) - Security (fraud detection, session integrity), diagnostics" />

        <SectionHeading number="2" title="Lawful Purposes" />
        <p className="my-1 italic text-muted-foreground">
          Under the DPDP Act, consent must be free, specific, informed, unconditional, unambiguous, through a clear affirmative action; and limited to data necessary for that purpose.
        </p>

        <p className="mt-2 mb-1 font-semibold">(A) Experian Credit Information</p>
        <p className="my-1 ml-4">
          I consent that Paisawaala acts as my authorised representative to obtain my credit report from Experian for loan eligibility assessment and display such products as per eligibility.
        </p>
        <p className="my-0.5 ml-4 italic text-muted-foreground">
          Purpose limitation: Obtain report from Experian; assess eligibility.
        </p>

        <p className="mt-2 mb-1 font-semibold">(B) Onboarding & Sharing with Paisawaala and Lenders/NBFCs</p>
        <p className="my-1 ml-4">
          I consent to share my necessary data as mentioned in clause 1.1 to 1.4 with Paisawaala and lenders/NBFCs solely to process my application(s) and provide the product/service I request, except for information mentioned in clause 1.3.3, which will not be shared with lenders/NBFCs.
        </p>
        <p className="my-0.5 ml-4 italic text-muted-foreground">
          Purpose limitation: Application submission, status updates, legal/regulatory compliance.
        </p>

        <p className="mt-2 mb-1 font-semibold">(C) Personalization & Analytics</p>
        <p className="my-1 ml-4">
          I consent to Paisawaala using product preferences, interaction and behavioural data to personalise recommendations and improve user experience.
        </p>
        <p className="my-0.5 ml-4 italic text-muted-foreground">
          Purpose limitation: Tailored offers; UX improvements (no third-party advertising; can be turned off anytime).
        </p>

        <p className="mt-2 mb-1 font-semibold">(D) Marketing & Contact</p>
        <p className="my-1 ml-4">
          I consent to Paisawaala and Lenders/NBFCs to contact me via communication channels including but not limited to Call, SMS, RCS, Truecaller, Email, WhatsApp.
        </p>
        <p className="my-0.5 ml-4 italic text-muted-foreground">
          Purpose limitation: Marketing about Paisawaala and linked financial products/services.
        </p>

        <SectionHeading number="3" title="Use & Sharing (purpose limited)" />
        <SubItem number="3.1" text="We use your data only for: (a) obtaining Experian credit info (if you opted in A); (b) assessing eligibility; (c) facilitating onboarding with lenders/financial institutions (if you opted in B); (d) keeping you informed of application status; (e) complying with legal/contractual requirements." />
        <SubItem number="3.2" text="We share minimally necessary data not including the credit information with listed lenders/financial institutions and service providers only to achieve your selected purpose(s) and under contractual safeguards." />
        <p className="my-1 ml-4">
          <strong>3.3</strong> Policy links:{' '}
          <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">Paisawaala Terms &amp; Conditions</a>
          {' | '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">Privacy Policy</a>
          {' | '}
          <a href="/grievance-redressal-mechanism" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">Grievance Redressal Mechanism</a>
          {' | '}
          <a href="/experian-consumer-consent" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">Experian Consumer Consent</a>
          {' | '}
          <a href="/disclaimer" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">Disclaimer</a>
          {' |'}
        </p>

        <SectionHeading number="4" title="Duration" />
        <p className="my-1">
          Processing for each selected purpose continues until that purpose is completed or for up to 6 months from your consent date - whichever is earlier - unless a longer retention is required by law/regulation.
        </p>

        <SectionHeading number="5" title="Retention, Erasure & Logs" />
        <p className="my-1">
          We retain personal data only as long as necessary for the Purpose mentioned herein and erase it upon purpose completion or withdrawal of consent, unless retention is required by law.
        </p>

        <SectionHeading number="6" title="Your Rights & How to Exercise Them" />
        <p className="my-1 ml-4">- Access information about processing</p>
        <p className="my-1 ml-4">- Correction/Erasure of inaccurate or unnecessary data</p>
        <p className="my-1 ml-4">- Withdrawal of Consent. You may withdraw consent at any time by contacting support. Upon withdrawal, we will cease processing and erase the relevant data unless retention is legally required. Withdrawal is as easy as giving consent.</p>
        <p className="mt-2 mb-1 font-semibold">How to reach us:</p>
        <p className="my-1 ml-4">(a) Manage/withdraw consent: email to dpo@theunimobile.com or missed call from registered mobile number on +918693042186.</p>
        <p className="my-1 ml-4">(b) Grievance Redressal: grievance@theunimobile.com (10 AM - 5 PM IST) or Escalation per published Grievance Redressal Mechanism.</p>
        <p className="my-1 ml-4">(c) Records: You may request a copy of your consent and this notice at any time by emailing us at dpo@theunimobile.com.</p>

        <SectionHeading number="7" title="Security Safeguards & Breach Notification" />
        <p className="my-1">
          We implement reasonable technical and organizational measures (including encryption, role-based access controls, logging, audits, and incident response). In the event of a personal data breach, we will notify the Data Protection Board of India and each affected individual in the prescribed manner.
        </p>

        <SectionHeading number="8" title="Children & Persons with Disabilities" />
        <p className="my-1">
          This service is intended for adults. If you are a person with disability unable to act independently, consent must be provided by a parent/lawful guardian in accordance with the DPDP Act.
        </p>

        <SectionHeading number="9" title="Governing Law & Jurisdiction" />
        <p className="my-1">
          This shall be governed by and construed in accordance with the laws of India. Any disputes arising under or in connection with these shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana.
        </p>

        <SectionHeading number="10" title="Records & Audit" />
        <p className="my-1">
          Paisawaala maintains verifiable, time-stamped records of the notice presented and your affirmative actions for audit/compliance.
        </p>
        <p className="my-1">
          We may amend this Notice; material changes will be communicated via email/in-product notice. Continued use after such changes constitutes acceptance.
        </p>

        <SectionHeading number="11" title="Updates to this Notice" />
        <p className="my-1">
          We will notify you of material changes or any new purpose, and seek fresh consent if needed, before processing under the new terms.
        </p>

        <SectionHeading number="12" title="Consent Captured" />
        <p className="my-1">
          By selecting "I consent" to any purpose, you authorise Paisawaala to process/share data solely for that selected purpose, subject to this Notice, Privacy Policy and applicable terms. You can withdraw each consent individually, by following the withdrawal process.
        </p>
      </div>
    </div>
  );
};

const AuthForm = ({ 
  redirectUrl, 
  onAuthComplete,
  theme = 'light',
  title = 'Get a Personal loan in 10 mins',
  description = 'Apply for Instant Loans up to ₹10 Lakhs'
}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('phone');
  const [errors, setErrors] = useState({});
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);
  const [consentC, setConsentC] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);
  const mandatoryConsentsGiven = consentA && consentB;

  const startResendTimer = useCallback(() => {
    setResendTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const validatePhone = useCallback((phoneValue) => {
    const cleaned = phoneValue.replace(/\D/g, '');
    
    let digits = cleaned;
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      digits = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      digits = cleaned.substring(1);
    }
    
    if (digits.length !== 10) {
      return 'Please enter a valid 10-digit mobile number';
    }
    if (!/^[6-9]/.test(digits)) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }
    return null;
  }, []);

  const validateOtp = useCallback((otpValue) => {
    if (!otpValue || otpValue.trim() === '') {
      return 'Please enter the OTP';
    }
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otpValue.trim())) {
      return 'Please enter a valid 6-digit OTP';
    }
    return null;
  }, []);

  const handlePhoneChange = useCallback((e) => {
    const value = e.target.value;
    setPhone(value);
    
    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  }, [errors.phone]);

  const handleOtpChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    
    if (errors.otp) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.otp;
        return newErrors;
      });
    }
  }, [errors.otp]);

  const cleanPhone = useCallback((raw) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.substring(2);
    if (cleaned.startsWith('0') && cleaned.length === 11) return cleaned.substring(1);
    return cleaned;
  }, []);

  const handleSendOtp = useCallback(async (e) => {
    e?.preventDefault();
    
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    setOtpSending(true);
    setErrors({});

    try {
      const phoneDigits = cleanPhone(phone);
      const maskedPhone = phoneDigits.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
      console.log('[PW:OTP] AuthForm sending OTP', { caller: 'AuthForm', maskedPhone, pageUrl: window.location.href, timestamp: new Date().toISOString() });
      await apiClient.post('/api/auth/send-otp', { phone: phoneDigits });
      console.log('[PW:OTP] AuthForm OTP sent successfully', { caller: 'AuthForm', maskedPhone });

      setStage('otp');
      setOtp('');
      startResendTimer();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send OTP. Please try again.';
      console.error('[PW:OTP] AuthForm OTP send FAILED', { caller: 'AuthForm', error: errorMessage, pageUrl: window.location.href });
      setErrors((prev) => ({ ...prev, phone: errorMessage }));
    } finally {
      setOtpSending(false);
    }
  }, [phone, validatePhone, cleanPhone, startResendTimer]);

  const handleVerifyOtp = useCallback(async (e) => {
    e?.preventDefault();
    
    const otpError = validateOtp(otp);
    if (otpError) {
      setErrors((prev) => ({ ...prev, otp: otpError }));
      return;
    }

    setOtpVerifying(true);
    setErrors({});

    try {
      const phoneDigits = cleanPhone(phone);

      await apiClient.post('/api/auth/verify-otp', {
        phone: phoneDigits,
        otp: otp.trim(),
      });

      const consents = { consentA, consentB, consentC };

      if (onAuthComplete) {
        onAuthComplete({
          phone: phoneDigits,
          verified: true,
          consents,
        });
      } else if (redirectUrl) {
        const redirectUrlWithParams = buildUrlWithAuthParams(
          redirectUrl,
          phoneDigits,
          true,
          consents
        );
        window.location.href = redirectUrlWithParams;
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: 'Redirect URL not configured. Please contact support.',
        }));
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Invalid OTP. Please try again.';
      setErrors((prev) => ({ ...prev, otp: errorMessage }));
    } finally {
      setOtpVerifying(false);
    }
  }, [otp, phone, redirectUrl, onAuthComplete, consentA, consentB, consentC, cleanPhone]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setOtp('');
    setErrors({});
    try {
      const phoneDigits = cleanPhone(phone);
      await apiClient.post('/api/auth/resend-otp', { phone: phoneDigits });
      startResendTimer();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to resend OTP.';
      setErrors((prev) => ({ ...prev, otp: errorMessage }));
    }
  }, [phone, cleanPhone, resendTimer, startResendTimer]);

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md p-8 flex flex-col gap-8">
          <div className="text-left">
            {stage === 'phone' && (
              <>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-snug m-0">
                  {title}
                </h2>
                <p className="mt-2 text-sm sm:text-[0.9375rem] text-muted-foreground m-0">
                  {description}
                </p>
              </>
            )}

            {stage === 'otp' && (
              <>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground leading-snug m-0">
                  Enter Verification Code
                </h2>
                <p className="mt-2 text-sm sm:text-[0.9375rem] text-muted-foreground m-0">
                  We've sent a one-time code to {phone || 'your number'}. Please enter it below.
                </p>
              </>
            )}
          </div>

          <form
            onSubmit={stage === 'phone' ? handleSendOtp : handleVerifyOtp}
            className="flex flex-col gap-6"
          >
            {stage === 'phone' && (
              <>
                <div>
                  <div className="relative">
                    <span className="absolute top-0 left-0 bottom-0 flex items-center pl-3.5 md:pl-4 text-muted-foreground text-base">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="Enter mobile number"
                      required
                      autoComplete="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      data-testid="input-phone"
                      className={`w-full pl-11 md:pl-12 pr-3.5 md:pr-4 py-3 border ${errors.phone ? 'border-destructive' : 'border-border'} rounded-lg text-base text-foreground bg-transparent outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20`}
                    />
                  </div>
                  <p className={`mt-2 text-sm min-h-[1.25rem] ${errors.phone ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {errors.phone
                      ? errors.phone
                      : 'An OTP will be sent for verification'}
                  </p>
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  I agree to give consent.{' '}
                  <button
                    type="button"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    data-testid="button-read-more-consent"
                    className="bg-transparent border-none text-primary cursor-pointer underline font-semibold text-xs sm:text-sm p-0 inline hover:opacity-80"
                  >
                    {isAccordionOpen ? 'Read Less' : 'Read More'}
                  </button>
                </div>

                <ConsentNoticePanel 
                  isOpen={isAccordionOpen} 
                  onToggle={() => setIsAccordionOpen(!isAccordionOpen)} 
                />

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consentA"
                      name="consentA"
                      checked={consentA}
                      onChange={(e) => setConsentA(e.target.checked)}
                      data-testid="checkbox-consent-experian"
                      className="h-[1.125rem] w-[1.125rem] rounded-sm border border-border accent-primary cursor-pointer shrink-0 mt-0.5"
                    />
                    <label
                      htmlFor="consentA"
                      className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I consent to Paisawaala as my authorized representative, to fetch my Credit Report from Experian, for credit assessment and provide loan/credit offers{' '}
                      <a
                        href="https://www.paisawaala.com/experian-consumer-consent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="link-experian-consent"
                      >
                        T&C
                      </a>
                      <span className="text-destructive ml-1">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consentB"
                      name="consentB"
                      checked={consentB}
                      onChange={(e) => setConsentB(e.target.checked)}
                      data-testid="checkbox-consent-onboarding"
                      className="h-[1.125rem] w-[1.125rem] rounded-sm border border-border accent-primary cursor-pointer shrink-0 mt-0.5"
                    />
                    <label
                      htmlFor="consentB"
                      className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I Consent to Onboarding & Sharing with Paisawaala and Lenders/NBFCs
                      <span className="text-destructive ml-1">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="consentC"
                      name="consentC"
                      checked={consentC}
                      onChange={(e) => setConsentC(e.target.checked)}
                      data-testid="checkbox-consent-marketing"
                      className="h-[1.125rem] w-[1.125rem] rounded-sm border border-border accent-primary cursor-pointer shrink-0 mt-0.5"
                    />
                    <label
                      htmlFor="consentC"
                      className="text-xs sm:text-sm text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I Consent to Marketing Channels, Personalization & Analytics
                      <span className="text-xs italic text-muted-foreground/70 ml-1">(optional)</span>
                    </label>
                  </div>

                  {!mandatoryConsentsGiven && (consentA || consentB) && (
                    <p className="m-0 text-xs text-destructive" data-testid="text-consent-validation">
                      Both Experian Credit Information and Onboarding consents are required to proceed.
                    </p>
                  )}
                </div>
              </>
            )}

            {stage === 'otp' && (
              <div>
                <Input
                  name="otp"
                  label="Enter Verification Code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Enter the 6-digit code"
                  required
                  error={errors.otp}
                  fullWidth
                  maxLength={6}
                />
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm" data-testid="text-submit-error">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={otpSending || otpVerifying || (stage === 'phone' && !mandatoryConsentsGiven)}
              loading={otpSending || otpVerifying}
              data-testid="button-submit"
            >
              {stage === 'phone' && (otpSending ? 'Sending...' : 'Apply Now')}
              {stage === 'otp' && (otpVerifying ? 'Verifying...' : 'Verify OTP')}
            </Button>

            {stage === 'otp' && (
              <p className="mt-3 text-sm text-muted-foreground text-center">
                {resendTimer > 0 ? (
                  <>
                    Resend OTP in{' '}
                    <span className="font-semibold text-foreground" data-testid="text-resend-timer">
                      {resendTimer}s
                    </span>
                  </>
                ) : (
                  <>
                    Didn't receive the code?{' '}
                    <span
                      className="text-primary cursor-pointer underline font-semibold"
                      onClick={handleResendOtp}
                      data-testid="link-resend-otp"
                    >
                      Resend OTP
                    </span>
                  </>
                )}
              </p>
            )}
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AuthForm;
