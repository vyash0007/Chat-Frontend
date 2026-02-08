'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneInput } from './PhoneInput';
import { OTPInput } from './OTPInput';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, verifyOtp, isLoading, error, clearError } = useAuthStore();

  const [phone, setPhone] = useState<string>(''); // E.164 format: +14155552671
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [localError, setLocalError] = useState('');

  const handleSendOtp = async () => {
    // Validate phone number using libphonenumber-js
    if (!phone || !isValidPhoneNumber(phone)) {
      setLocalError('Please enter a valid phone number with country code');
      return;
    }

    clearError();
    setLocalError('');

    try {
      await login({ phone }); // Send E.164 format directly
      setStep('otp');
    } catch (err) {
      setLocalError(error || 'Failed to send verification code');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setLocalError('Please enter the complete 6-digit code');
      return;
    }

    clearError();
    setLocalError('');

    try {
      await verifyOtp({ phone, otp }); // Use E.164 format

      // Check if user needs to complete profile
      const { user } = useAuthStore.getState();
      if (!user?.name) {
        router.push('/profile');
      } else {
        router.push('/chats');
      }
    } catch (err) {
      setLocalError(error || 'Invalid verification code');
    }
  };

  const handleResendOtp = async () => {
    clearError();
    setLocalError('');
    setOtp('');

    try {
      await login({ phone }); // Use E.164 format
    } catch (err) {
      setLocalError(error || 'Failed to resend code');
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    clearError();
    setLocalError('');
  };

  const handlePhoneChange = (value: string | undefined) => {
    setPhone(value || '');
    // Clear errors when user types
    if (localError || error) {
      clearError();
      setLocalError('');
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          {step === 'phone' ? 'Welcome Back' : 'Verify Your Phone'}
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          {step === 'phone'
            ? 'Enter your phone number to get started'
            : `We sent a code to ${parsePhoneNumber(phone)?.formatInternational() || phone}`}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {step === 'phone' ? (
          <>
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              onSubmit={handleSendOtp}
              disabled={isLoading}
              error={localError || error || undefined}
            />

            <Button
              onClick={handleSendOtp}
              isLoading={isLoading}
              disabled={!phone || isLoading}
              fullWidth
              size="lg"
            >
              Send Verification Code
            </Button>
          </>
        ) : (
          <>
            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOtp}
              disabled={isLoading}
              error={localError || error || undefined}
            />

            <Button
              onClick={handleVerifyOtp}
              isLoading={isLoading}
              disabled={otp.length !== 6}
              fullWidth
              size="lg"
            >
              Verify Code
            </Button>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                Didn't receive code? Resend
              </button>
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
              >
                ← Change phone number
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-[var(--text-muted)]">
        By continuing, you agree to our{' '}
        <a href="#" className="text-[var(--accent-primary)] hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-[var(--accent-primary)] hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};
