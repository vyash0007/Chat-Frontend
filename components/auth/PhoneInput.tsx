'use client';

import React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string; // E.164 format: +14155552671
  onChange: (value: string | undefined) => void;
  onSubmit?: () => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="phone-input">
        Phone Number
      </label>

      <div onKeyDown={handleKeyDown}>
        <PhoneInputWithCountry
          international
          defaultCountry="US"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'phone-input',
            error && 'phone-input-error'
          )}
          id="phone-input"
          placeholder="Enter phone number"
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--danger)] mt-1" role="alert">
          {error}
        </p>
      )}

      <p className="text-sm text-[var(--text-muted)]">
        We'll send you a verification code via SMS
      </p>
    </div>
  );
};
