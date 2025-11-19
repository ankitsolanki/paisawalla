import React, { useState, useCallback } from 'react';
import { ThemeProvider } from '../design-system/ThemeProvider';
import ErrorBoundary from './ui/ErrorBoundary';
import Button from './ui/Button';
import Input from './ui/Input';
import { validateField } from '../utils/validationRules';
import apiClient from '../utils/apiClient';
import { buildUrlWithAuthParams } from '../utils/queryEncoder';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Standalone Authentication Form Component
 * 
 * Handles phone number input, OTP sending, and OTP verification.
 * After successful authentication, redirects to the configured redirectUrl
 * with encoded authentication parameters.
 * 
 * @param {string} redirectUrl - URL to redirect to after successful authentication
 * @param {string} theme - Theme ('light' or 'dark')
 */
const AuthForm = ({ redirectUrl, theme = 'light' }) => {
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

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <div
          style={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '32rem',
            margin: '0 auto',
            padding: isMobile ? '1rem' : '1.25rem',
          }}
        >
          {stage === 'phone' && (
            <>
              <h2
                style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: 700,
                  marginBottom: isMobile ? '0.5rem' : '0.5rem',
                  textAlign: isMobile ? 'center' : 'left',
                  color: '#000000',
                }}
              >
                Verify Your Number
              </h2>
              <p
                style={{
                  color: '#656c77',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  fontSize: isMobile ? '0.875rem' : '0.875rem',
                  textAlign: isMobile ? 'center' : 'left',
                }}
              >
                Enter your mobile number to receive a verification code
              </p>
            </>
          )}

          {stage === 'otp' && (
            <>
              <h2
                style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: 700,
                  marginBottom: isMobile ? '0.5rem' : '0.5rem',
                  textAlign: isMobile ? 'center' : 'left',
                  color: '#000000',
                }}
              >
                Enter Verification Code
              </h2>
              <p
                style={{
                  color: '#656c77',
                  marginBottom: isMobile ? '1rem' : '1.25rem',
                  fontSize: isMobile ? '0.875rem' : '0.875rem',
                  textAlign: isMobile ? 'center' : 'left',
                }}
              >
                We've sent a one-time code to {phone || 'your number'}. Please enter it below.
              </p>
            </>
          )}

          <form onSubmit={stage === 'phone' ? handleSendOtp : handleVerifyOtp}>
            {stage === 'phone' && (
              <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
                <Input
                  name="phone"
                  label="Mobile Number"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="10-digit mobile number"
                  required
                  error={errors.phone}
                  fullWidth
                />
              </div>
            )}

            {stage === 'otp' && (
              <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
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
                  marginBottom: '1rem',
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
              disabled={otpSending || otpVerifying}
              loading={otpSending || otpVerifying}
            >
              {stage === 'phone' && (otpSending ? 'Sending OTP...' : 'Send OTP')}
              {stage === 'otp' && (otpVerifying ? 'Verifying...' : 'Verify OTP')}
            </Button>

            {stage === 'otp' && (
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#656c77',
                  textAlign: 'center',
                }}
              >
                Didn't receive the code?{' '}
                <span
                  style={{
                    color: '#160E7A',
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
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default React.memo(AuthForm);

