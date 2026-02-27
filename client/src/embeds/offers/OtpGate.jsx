import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../../utils/apiClient';

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN = 30;

const ShieldIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 4L6 12V22C6 33.1 13.68 43.42 24 46C34.32 43.42 42 33.1 42 22V12L24 4Z"
      className="fill-primary/10 stroke-primary"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <rect x="18" y="19" width="12" height="10" rx="2" className="stroke-primary" strokeWidth="2" fill="none" />
    <path d="M20 19V16C20 13.79 21.79 12 24 12C26.21 12 28 13.79 28 16V19" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="24.5" r="1.5" className="fill-primary" />
  </svg>
);

const OtpGate = ({ phone, maskedPhone, applicationId, onVerified, onError }) => {
  const [stage, setStage] = useState('initial');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  const sendOtp = useCallback(async () => {
    if (!phone) {
      console.warn('[PW:OTP] sendOtp called but phone is missing');
      setError('Phone number is required');
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      console.warn('[PW:OTP] Max OTP attempts reached', { attempts, maxAttempts: MAX_ATTEMPTS });
      setError('Too many attempts. Please try again later.');
      return;
    }

    console.log('[PW:OTP] Sending OTP', { maskedPhone: maskedPhone || phone, attemptNumber: attempts + 1, applicationId });
    setSending(true);
    setError('');

    try {
      await apiClient.post('/api/auth/send-otp', { phone });
      console.log('[PW:OTP] OTP sent successfully', { maskedPhone: maskedPhone || phone });
      setStage('otp');
      setOtp(['', '', '', '', '', '']);
      setCountdown(RESEND_COOLDOWN);
      setAttempts((prev) => prev + 1);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      const msg = err?.message || 'Failed to send OTP. Please try again.';
      console.error('[PW:OTP] Failed to send OTP', { error: msg, maskedPhone: maskedPhone || phone });
      setError(msg);
      if (onError) onError(err);
    } finally {
      setSending(false);
    }
  }, [phone, maskedPhone, attempts, applicationId, onError]);

  useEffect(() => {
    console.log('[PW:OTP] OTP gate mounted — initiating OTP send', { maskedPhone: maskedPhone || phone, applicationId });
    sendOtp();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyOtp = useCallback(async (otpString) => {
    if (attempts >= MAX_ATTEMPTS) {
      console.warn('[PW:OTP] Max OTP verify attempts reached — blocking verification', { attempts, maxAttempts: MAX_ATTEMPTS });
      setError('Too many attempts. Please try again later.');
      return;
    }

    console.log('[PW:OTP] Verifying OTP', { maskedPhone: maskedPhone || phone, applicationId, attemptNumber: attempts + 1 });
    setVerifying(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/verify-otp', {
        phone,
        otp: otpString,
        applicationId,
      });
      const sessionToken = response?.sessionToken || response?.token;
      const maskedToken = sessionToken ? `${sessionToken.slice(0, 8)}...` : null;
      console.log('[PW:OTP] OTP verified successfully — session token received', { maskedToken, applicationId });
      if (onVerified) onVerified(sessionToken);
    } catch (err) {
      const msg = err?.message || 'Invalid OTP. Please try again.';
      console.error('[PW:OTP] OTP verification failed', { error: msg, attemptNumber: attempts + 1, remainingAttempts: MAX_ATTEMPTS - attempts - 1 });
      setError(msg);
      setAttempts((prev) => prev + 1);
      if (onError) onError(err);
    } finally {
      setVerifying(false);
    }
  }, [phone, maskedPhone, applicationId, attempts, onVerified, onError]);

  const handleDigitChange = useCallback((index, value) => {
    if (attempts >= MAX_ATTEMPTS) return;

    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;

      if (digit && index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      }

      const otpString = next.join('');
      if (otpString.length === 6 && next.every((d) => d !== '')) {
        setTimeout(() => verifyOtp(otpString), 50);
      }

      return next;
    });

    setError('');
  }, [attempts, verifyOtp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    setOtp((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      if (digits.length === 6) {
        setTimeout(() => verifyOtp(next.join('')), 50);
      }
      return next;
    });

    const focusIndex = Math.min(digits.length, 5);
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
  }, [verifyOtp]);

  const handleResend = useCallback(() => {
    if (countdown > 0 || sending) return;
    console.log('[PW:OTP] User requested OTP resend', { maskedPhone: maskedPhone || phone, applicationId });
    setOtp(['', '', '', '', '', '']);
    setError('');
    sendOtp();
  }, [countdown, sending, sendOtp, maskedPhone, phone, applicationId]);

  const handleVerifyClick = useCallback(() => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    verifyOtp(otpString);
  }, [otp, verifyOtp]);

  const tooManyAttempts = attempts >= MAX_ATTEMPTS;

  return (
    <div
      data-testid="otp-gate-backdrop"
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xl z-50 font-sans p-4"
    >
      <div
        data-testid="otp-gate-modal"
        className="bg-background rounded-3xl p-8 w-full max-w-[400px] shadow-xl flex flex-col items-center gap-5"
      >
        <div className="mb-1">
          <ShieldIcon />
        </div>

        <h2
          data-testid="text-otp-heading"
          className="text-2xl font-bold text-foreground m-0 text-center leading-tight"
        >
          Verify Your Identity
        </h2>

        <p
          data-testid="text-otp-subtext"
          className="text-sm text-muted-foreground m-0 text-center leading-relaxed"
        >
          For your security, please verify your phone number{' '}
          <span className="font-semibold text-foreground/70">
            {maskedPhone || phone}
          </span>{' '}
          to view your loan offers
        </p>

        {tooManyAttempts && (
          <div
            data-testid="text-too-many-attempts"
            className="w-full py-3 px-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm text-center font-medium"
          >
            Too many attempts. Please try again later.
          </div>
        )}

        {stage === 'initial' && !tooManyAttempts && (
          <button
            data-testid="button-send-otp"
            onClick={sendOtp}
            disabled={sending}
            className={`w-full py-3 px-6 text-white border-none rounded-full text-base font-semibold font-sans flex items-center justify-center gap-2 min-h-[48px] transition-colors duration-150 ${
              sending ? 'bg-muted-foreground cursor-not-allowed' : 'bg-primary cursor-pointer hover:bg-primary/90'
            }`}
          >
            {sending ? (
              <>
                <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-[otpGateSpin_0.8s_linear_infinite]" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        )}

        {stage === 'otp' && !tooManyAttempts && (
          <>
            <div className="flex gap-2 justify-center w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  data-testid={`input-otp-digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={verifying}
                  className={`w-12 h-14 text-center text-xl font-bold font-sans rounded-xl bg-muted outline-none transition-all duration-150 border-2 ${
                    error
                      ? 'border-destructive'
                      : digit
                        ? 'border-primary'
                        : 'border-border'
                  } text-foreground caret-primary focus:border-primary focus:ring-2 focus:ring-primary/20`}
                />
              ))}
            </div>

            <button
              data-testid="button-verify-otp"
              onClick={handleVerifyClick}
              disabled={verifying || otp.join('').length !== 6}
              className={`w-full py-3 px-6 text-white border-none rounded-full text-base font-semibold font-sans flex items-center justify-center gap-2 min-h-[48px] transition-colors duration-150 ${
                verifying || otp.join('').length !== 6
                  ? 'bg-muted-foreground cursor-not-allowed'
                  : 'bg-primary cursor-pointer hover:bg-primary/90'
              }`}
            >
              {verifying ? (
                <>
                  <span className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-[otpGateSpin_0.8s_linear_infinite]" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>

            <div className="flex items-center justify-center gap-1 w-full">
              {countdown > 0 ? (
                <span
                  data-testid="text-resend-countdown"
                  className="text-sm text-muted-foreground"
                >
                  Resend OTP in {countdown}s
                </span>
              ) : (
                <button
                  data-testid="button-resend-otp"
                  onClick={handleResend}
                  disabled={sending}
                  className={`bg-transparent border-none text-primary text-sm font-semibold font-sans p-1 underline ${
                    sending ? 'cursor-not-allowed' : 'cursor-pointer hover:text-primary/80'
                  }`}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}

        {error && !tooManyAttempts && (
          <p
            data-testid="text-otp-error"
            className="w-full m-0 text-sm text-destructive text-center font-medium"
          >
            {error}
          </p>
        )}
      </div>

      <style>{`
        @keyframes otpGateSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OtpGate;
