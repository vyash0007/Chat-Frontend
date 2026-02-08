'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  error?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
  error,
}) => {
  const [countryCode, setCountryCode] = useState('+1');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const phone = e.target.value.replace(/\D/g, '');
    onChange(phone);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Format as (XXX) XXX-XXXX for US numbers
    if (phone.length === 0) return '';
    if (phone.length <= 3) return `(${phone}`;
    if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        Phone Number
      </label>
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--background-primary)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] disabled:opacity-50"
        >
          <option value="+1">+1 (US)</option>
          <option value="+44">+44 (UK)</option>
          <option value="+91">+91 (IN)</option>
        </select>
        <Input
          type="tel"
          value={formatPhoneDisplay(value)}
          onChange={handlePhoneChange}
          onKeyDown={handleKeyDown}
          placeholder="(555) 123-4567"
          disabled={disabled}
          error={error}
          maxLength={14}
          aria-label="Phone number"
        />
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        We'll send you a verification code via SMS
      </p>
    </div>
  );
};
