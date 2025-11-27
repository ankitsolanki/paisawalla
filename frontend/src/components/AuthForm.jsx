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
 * ConsentModal Component
 * Displays the consent and authorization terms in a modal
 * Fully responsive across all resolutions
 */
const ConsentModal = ({ isOpen, onClose }) => {
  const { windowWidth } = useResponsive();
  
  if (!isOpen) return null;

  // Responsive values
  const isMobileView = windowWidth < 640;
  const isTabletView = windowWidth >= 640 && windowWidth < 1024;
  
  const modalPadding = isMobileView ? '1.5rem' : isTabletView ? '1.75rem' : '2rem';
  const modalMaxWidth = isMobileView ? 'calc(100vw - 2rem)' : isTabletView ? '90vw' : '500px';
  const titleFontSize = isMobileView ? '1.1rem' : isTabletView ? '1.25rem' : '1.375rem';
  const contentFontSize = isMobileView ? tokens.typography.fontSize.xs : tokens.typography.fontSize.sm;
  const contentLineHeight = isMobileView ? '1.5' : '1.6';
  const contentMargin = isMobileView ? '0 0 1rem 0' : '0 0 1.25rem 0';
  const closeButtonSize = isMobileView ? '1.75rem' : '2rem';
  const closeButtonFontSize = isMobileView ? '1.25rem' : '1.5rem';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: isMobileView ? '0.75rem' : '1rem',
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: tokens.borderRadius.lg,
            padding: modalPadding,
            maxWidth: modalMaxWidth,
            width: '100%',
            maxHeight: isMobileView ? '90vh' : '85vh',
            minHeight: 'auto',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              alignSelf: 'flex-end',
              background: 'none',
              border: 'none',
              fontSize: closeButtonFontSize,
              cursor: 'pointer',
              padding: '0.25rem',
              width: closeButtonSize,
              height: closeButtonSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.gray[500],
              marginBottom: isMobileView ? '0.5rem' : '0.75rem',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = tokens.colors.gray[700];
            }}
            onMouseLeave={(e) => {
              e.target.style.color = tokens.colors.gray[500];
            }}
            aria-label="Close modal"
          >
            ✕
          </button>

          {/* Title */}
          <h2
            style={{
              fontSize: titleFontSize,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.gray[900],
              marginBottom: isMobileView ? '1rem' : isTabletView ? '1.25rem' : '1.5rem',
              marginTop: 0,
              lineHeight: '1.3',
            }}
          >
            Consent & Authorization
          </h2>

          {/* Content */}
          <div
            style={{
              flex: 1,
              fontSize: contentFontSize,
              color: tokens.colors.gray[700],
              lineHeight: contentLineHeight,
              overflowY: 'auto',
              marginBottom: isMobileView ? '1rem' : '1.25rem',
            }}
          >
            <p style={{ margin: contentMargin }}>
              I hereby authorize Paisawaala as my representative to obtain my Credit Information
              from Experian (Experian Terms and Condition) and I authorize Experian to share my
              credit data with Paisawaala. I also agree to be contacted by Paisawaala and its
              representatives via call, SMS, RCS, email and WhatsApp regarding its products and
              other linked products as per the Terms & Conditions and Privacy Policy.
            </p>
          </div>

          {/* Action Button */}
          <div style={{ marginTop: 'auto' }}>
            <Button
              onClick={onClose}
              variant="primary"
              fullWidth
            >
              I Understand
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

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

      // Hardcoded OTP for testing: accept 123456
      const HARDCODED_OTP = '123456';
      
      if (otp.trim() === HARDCODED_OTP) {
        // Hardcoded OTP accepted - skip API verification for testing
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
      } else {
        // Call verify OTP API for non-hardcoded OTPs
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

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '28rem', // max-w-md
              padding: '2rem', // p-8
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem', // space-y-8
            }}
          >
            {/* Header Section */}
            <div style={{ textAlign: 'left' }}>
            {stage === 'phone' && (
            <>
                  <h2
                style={{
                      fontSize: isMobile ? '1.125rem' : '1.5rem', // h2: 1.125rem mobile, 1.5rem desktop (18px/24px)
                      fontWeight: tokens.typography.fontWeight.bold || 700, // font-bold
                      color: tokens.colors.gray[900],
                      lineHeight: '1.3', // leading-snug
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
              <p
                style={{
                      marginTop: '0.5rem', // mt-2
                      fontSize: isMobile ? '0.875rem' : '0.9375rem', // 0.875rem mobile, 0.9375rem desktop (14px/15px)
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
                  <h2
                style={{
                      fontSize: isMobile ? '1.125rem' : '1.5rem', // h2: 1.125rem mobile, 1.5rem desktop (18px/24px)
                      fontWeight: tokens.typography.fontWeight.bold || 700,
                      color: tokens.colors.gray[900],
                      lineHeight: '1.3',
                      margin: 0,
                }}
              >
                Enter Verification Code
                  </h2>
              <p
                style={{
                      marginTop: '0.5rem',
                      fontSize: isMobile ? '0.875rem' : '0.9375rem', // 0.875rem mobile, 0.9375rem desktop (14px/15px)
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
                marginTop: '1.5rem', // Reduced from 2rem for balanced spacing
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem', // space-y-6 - consistent gap
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

                  {/* Single Consent Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      checked={consentAccepted}
                      onChange={(e) => setConsentAccepted(e.target.checked)}
                      style={{
                        height: '1.25rem',
                        width: '1.25rem',
                        borderRadius: tokens.borderRadius.sm,
                        border: `1px solid ${tokens.colors.gray[300]}`,
                        accentColor: tokens.colors.primary[500],
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginTop: '0.125rem',
                      }}
                    />
                    <label
                      htmlFor="consent"
                      style={{
                        fontSize: isMobile ? tokens.typography.fontSize.xs : tokens.typography.fontSize.sm,
                        color: tokens.colors.gray[600],
                        cursor: 'pointer',
                        lineHeight: '1.5',
                      }}
                    >
                      I agree to the terms and provide my consent{' '}
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: tokens.colors.primary[600],
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontWeight: tokens.typography.fontWeight.semibold,
                          fontSize: 'inherit',
                          padding: '0',
                          display: 'inline',
                          verticalAlign: 'baseline',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = tokens.colors.primary[700];
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = tokens.colors.primary[600];
                        }}
                      >
                        (Read terms)
                      </button>
                    </label>
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
              disabled={otpSending || otpVerifying || (stage === 'phone' && !consentAccepted)}
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

        {/* Consent Modal */}
        <ConsentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(AuthForm);

