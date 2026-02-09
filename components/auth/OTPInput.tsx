'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update internal state when value prop changes
    const otpArray = value.split('').slice(0, length);
    setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow single digit
    const newDigit = digit.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = newDigit;
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    onChange(otpValue);

    // Auto-focus next input
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all fields are filled
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    const newOtp = [...Array(length)].map((_, i) => pastedData[i] || '');
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    onChange(otpValue);

    // Focus last filled input or first empty
    const lastFilledIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-light tracking-tight text-[var(--text-primary)] text-center">
        Verification Code
      </label>
      <div className="flex gap-2 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={cn(
              'w-12 h-12 text-center text-lg font-light rounded-sm border border-[var(--border-color)] bg-[var(--background-primary)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] disabled:opacity-50 transition-all',
              error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]',
              digit && 'border-[var(--accent-primary)]'
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-[var(--danger)] text-center">{error}</p>
      )}
      <p className="text-sm text-[var(--text-muted)] text-center font-light tracking-tight">
        Enter the 6-digit code sent to your phone
      </p>
    </div>
  );
};
