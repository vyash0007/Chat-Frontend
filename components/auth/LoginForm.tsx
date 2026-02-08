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
  const { login, verifyOtp, loginWithGoogle, isLoading, error, clearError } = useAuthStore();

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
            {/* Google Sign-In Button */}
            <Button
              onClick={loginWithGoogle}
              variant="outline"
              fullWidth
              size="lg"
              className="border-2 hover:bg-[var(--background-hover)] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--divider-color)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--background-primary)] text-[var(--text-muted)]">
                  Or continue with phone
                </span>
              </div>
            </div>

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
