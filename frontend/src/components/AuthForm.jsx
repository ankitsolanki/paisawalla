import React, { useState, useCallback } from 'react';
import { ThemeProvider, useTheme } from '../design-system/ThemeProvider';
import ErrorBoundary from './ui/ErrorBoundary';
import Button from './ui/Button';
import Input from './ui/Input';
import { validateField } from '../utils/validationRules';
import apiClient from '../utils/apiClient';
import { buildUrlWithAuthParams } from '../utils/queryEncoder';
import { useResponsive } from '../hooks/useResponsive';
import { tokens } from '../design-system/tokens';

/**
 * Standalone Authentication Form Component
 * 
 * Handles phone number input, OTP sending, and OTP verification.
 * After successful authentication, redirects to the configured redirectUrl
 * with encoded authentication parameters.
 * 
 * @param {string} redirectUrl - URL to redirect to after successful authentication
 * @param {string} theme - Theme ('light' or 'dark')
 * @param {string} title - Main heading text (default: "Get a Personal loan in 10 mins")
 * @param {string} description - Subtitle text (default: "Apply for Instant Loans up to ₹10 Lakhs")
 */
const AuthForm = ({ 
  redirectUrl, 
  theme = 'light',
  title = 'Get a Personal loan in 10 mins',
  description = 'Apply for Instant Loans up to ₹10 Lakhs'
}) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('phone'); // 'phone' | 'otp'
  const [errors, setErrors] = useState({});
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const { windowWidth } = useResponsive();
  const isMobile = windowWidth < 640;

  // Validate phone number (Indian format: 10 digits starting with 6-9)
  const validatePhone = useCallback((phoneValue) => {
    const cleaned = phoneValue.replace(/\D/g, '');
    
    // Remove country code +91 or leading 0 if present
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

  // Validate OTP (6 digits)
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
    
    // Clear phone error when user types
    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  }, [errors.phone]);

  const handleOtpChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
    setOtp(value);
    
    // Clear OTP error when user types
    if (errors.otp) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.otp;
        return newErrors;
      });
    }
  }, [errors.otp]);

  const handleSendOtp = useCallback(async (e) => {
    e?.preventDefault();
    
    // Validate phone
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setErrors((prev) => ({ ...prev, phone: phoneError }));
      return;
    }

    setOtpSending(true);
    setErrors({});

    try {
      // Clean phone number (remove non-digits, handle country code)
      const cleaned = phone.replace(/\D/g, '');
      let phoneDigits = cleaned;
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        phoneDigits = cleaned.substring(2);
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        phoneDigits = cleaned.substring(1);
      }

      // Call send OTP API
      await apiClient.post('/api/auth/send-otp', { 
        phone: phoneDigits 
      });

      // Move to OTP stage
      setStage('otp');
      setOtp('');
    } catch (error) {
      const errorMessage = error?.message || 'Failed to send OTP. Please try again.';
      setErrors((prev) => ({ ...prev, phone: errorMessage }));
    } finally {
      setOtpSending(false);
    }
  }, [phone, validatePhone]);

  const handleVerifyOtp = useCallback(async (e) => {
    e?.preventDefault();
    
    // Validate OTP
    const otpError = validateOtp(otp);
    if (otpError) {
      setErrors((prev) => ({ ...prev, otp: otpError }));
      return;
    }

    setOtpVerifying(true);
    setErrors({});

    try {
      // Clean phone number
      const cleaned = phone.replace(/\D/g, '');
      let phoneDigits = cleaned;
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        phoneDigits = cleaned.substring(2);
      } else if (cleaned.startsWith('0') && cleaned.length === 11) {
        phoneDigits = cleaned.substring(1);
      }

      // Call verify OTP API
      await apiClient.post('/api/auth/verify-otp', {
        phone: phoneDigits,
        otp: otp.trim(),
      });

      // Build redirect URL with encoded auth params
      if (redirectUrl) {
        const redirectUrlWithParams = buildUrlWithAuthParams(
          redirectUrl,
          phoneDigits,
          true // authenticated
        );
        
        // Redirect to target form
        window.location.href = redirectUrlWithParams;
      } else {
        setErrors((prev) => ({ 
          ...prev, 
          submit: 'Redirect URL not configured. Please contact support.' 
        }));
      }
    } catch (error) {
      const errorMessage = error?.message || 'Invalid OTP. Please try again.';
      setErrors((prev) => ({ ...prev, otp: errorMessage }));
    } finally {
      setOtpVerifying(false);
    }
  }, [otp, phone, redirectUrl]);

  const handleResendOtp = useCallback(() => {
    setStage('phone');
    setOtp('');
    setErrors({});
  }, []);

  const [termsAccepted, setTermsAccepted] = useState(true);
  const [whatsappConsent, setWhatsappConsent] = useState(true);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            backgroundColor: tokens.colors.background.light,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem', // max-w-md
              padding: '2rem', // p-8
              backgroundColor: '#ffffff',
              borderRadius: '1rem', // rounded-2xl
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem', // space-y-8
            }}
          >
            {/* Header Section */}
            <div style={{ textAlign: 'left' }}>
          {stage === 'phone' && (
            <>
                  <h1
                style={{
                      fontSize: isMobile ? '2.25rem' : '3rem', // text-4xl md:text-5xl
                      fontWeight: tokens.typography.fontWeight.extrabold || 800, // font-extrabold
                      color: tokens.colors.gray[900],
                      lineHeight: '1.2', // leading-tight
                      margin: 0,
                    }}
                  >
                    {title}
                  </h1>
              <p
                style={{
                      marginTop: '1rem', // mt-4
                      fontSize: '1.125rem', // text-lg
                      color: tokens.colors.gray[600],
                      margin: 0,
                    }}
                  >
                    {description}
              </p>
            </>
          )}

          {stage === 'otp' && (
            <>
                  <h1
                style={{
                      fontSize: isMobile ? '2.25rem' : '3rem',
                      fontWeight: tokens.typography.fontWeight.extrabold || 800,
                      color: tokens.colors.gray[900],
                      lineHeight: '1.2',
                      margin: 0,
                }}
              >
                Enter Verification Code
                  </h1>
              <p
                style={{
                      marginTop: '1rem',
                      fontSize: '1.125rem',
                      color: tokens.colors.gray[600],
                      margin: 0,
                }}
              >
                We've sent a one-time code to {phone || 'your number'}. Please enter it below.
              </p>
            </>
          )}
            </div>

            {/* Form Section */}
            <form
              onSubmit={stage === 'phone' ? handleSendOtp : handleVerifyOtp}
              style={{
                marginTop: '2rem', // mt-8
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem', // space-y-6
              }}
            >
            {stage === 'phone' && (
                <>
                  {/* Phone Input with +91 prefix */}
                  <div>
                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: '1rem', // pl-4
                          color: tokens.colors.gray[500],
                          fontSize: tokens.typography.fontSize.base,
                        }}
                      >
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
                        style={{
                          width: '100%',
                          paddingLeft: '3rem', // pl-12 (for +91)
                          paddingRight: '1rem', // pr-4
                          paddingTop: '0.75rem', // py-3
                          paddingBottom: '0.75rem',
                          border: `1px solid ${errors.phone ? tokens.colors.error[500] : tokens.colors.gray[300]}`,
                          borderRadius: tokens.borderRadius.lg, // rounded-lg
                          fontSize: tokens.typography.fontSize.base,
                          color: tokens.colors.gray[900],
                          backgroundColor: tokens.colors.gray[50],
                          fontFamily: tokens.typography.fontFamily.sans.join(', '),
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = tokens.colors.primary[500];
                          e.target.style.boxShadow = `0 0 0 3px ${tokens.colors.primary[50]}`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.phone ? tokens.colors.error[500] : tokens.colors.gray[300];
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    {errors.phone && (
                      <p
                        style={{
                          marginTop: '0.5rem',
                          fontSize: tokens.typography.fontSize.sm,
                          color: tokens.colors.error[600],
                        }}
                      >
                        {errors.phone}
                      </p>
                    )}
                    <p
                      style={{
                        marginTop: '0.5rem', // mt-2
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.gray[500],
                      }}
                    >
                      An OTP will be sent for verification
                    </p>
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Terms & Conditions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', height: '1.25rem' }}>
                        <input
                          type="checkbox"
                          id="terms"
                          name="terms"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          style={{
                            height: '1.25rem', // h-5
                            width: '1.25rem', // w-5
                            borderRadius: tokens.borderRadius.sm,
                            border: `1px solid ${tokens.colors.gray[300]}`,
                            accentColor: tokens.colors.primary[500],
                            cursor: 'pointer',
                          }}
                        />
                      </div>
                      <div style={{ marginLeft: '0.75rem' }}>
                        <label
                          htmlFor="terms"
                          style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.gray[600],
                            cursor: 'pointer',
                          }}
                        >
                          By proceeding, you agree with our{' '}
                          <a
                            href="#"
                            style={{
                              fontWeight: tokens.typography.fontWeight.semibold,
                              color: tokens.colors.gray[800],
                              textDecoration: 'underline',
                            }}
                          >
                            Terms & Conditions
                          </a>{' '}
                          &{' '}
                          <a
                            href="#"
                            style={{
                              fontWeight: tokens.typography.fontWeight.semibold,
                              color: tokens.colors.gray[800],
                              textDecoration: 'underline',
                            }}
                          >
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                    </div>

                    {/* WhatsApp Consent */}
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', height: '1.25rem' }}>
                        <input
                          type="checkbox"
                          id="whatsapp"
                          name="whatsapp"
                          checked={whatsappConsent}
                          onChange={(e) => setWhatsappConsent(e.target.checked)}
                          style={{
                            height: '1.25rem',
                            width: '1.25rem',
                            borderRadius: tokens.borderRadius.sm,
                            border: `1px solid ${tokens.colors.gray[300]}`,
                            accentColor: tokens.colors.primary[500],
                            cursor: 'pointer',
                          }}
                />
              </div>
                      <div style={{ marginLeft: '0.75rem' }}>
                        <label
                          htmlFor="whatsapp"
                          style={{
                            fontSize: tokens.typography.fontSize.sm,
                            color: tokens.colors.gray[600],
                            cursor: 'pointer',
                          }}
                        >
                          I agree to receive updates on Whatsapp
                        </label>
                      </div>
                    </div>
                  </div>
                </>
            )}

            {stage === 'otp' && (
                <div>
                <Input
                  name="otp"
                  label="Enter Verification Code"
                  type="text"
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
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '0.375rem',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                }}
              >
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
                disabled={otpSending || otpVerifying || (stage === 'phone' && !termsAccepted)}
              loading={otpSending || otpVerifying}
            >
                {stage === 'phone' && (otpSending ? 'Sending...' : 'Apply Now')}
              {stage === 'otp' && (otpVerifying ? 'Verifying...' : 'Verify OTP')}
            </Button>

            {stage === 'otp' && (
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                    color: tokens.colors.gray[500],
                  textAlign: 'center',
                }}
              >
                Didn't receive the code?{' '}
                <span
                  style={{
                      color: tokens.colors.primary[600],
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </span>
              </p>
            )}
          </form>
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(AuthForm);

