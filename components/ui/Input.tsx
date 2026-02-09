'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isLoading,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-light tracking-tight text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <div className={cn(
            "flex items-center bg-[var(--background-secondary)] rounded-sm px-4 py-2.5 border border-[var(--border-color)] focus-within:border-[var(--accent-primary)]/40 transition-colors shadow-sm",
            disabled && "opacity-50 cursor-not-allowed",
            error && 'border-[var(--danger)] focus-within:border-[var(--danger)]'
          )}>
            {leftIcon && (
              <div className="text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors mr-3">
                {leftIcon}
              </div>
            )}
            <input
              id={inputId}
              ref={ref}
              className={cn(
                'flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 text-[15px] text-[var(--text-primary)] font-light tracking-tight placeholder:text-[var(--text-muted)]',
                className
              )}
              disabled={disabled || isLoading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
              }
              {...props}
            />
            {(rightIcon || isLoading) && (
              <div className="text-[var(--text-muted)] ml-3">
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  rightIcon
                )}
              </div>
            )}
          </div>
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs text-[var(--danger)] font-light tracking-tight"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-[var(--text-muted)] font-light tracking-tight"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
