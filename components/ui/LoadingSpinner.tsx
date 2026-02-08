'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    label = 'Loading...',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)} role="status">
            <div className="relative">
                {/* Outer glow ring */}
                <div
                    className={cn(
                        'absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-20 blur-md',
                        sizeClasses[size]
                    )}
                />
                {/* Spinner */}
                <svg
                    className={cn('animate-spin text-[var(--accent-primary)]', sizeClasses[size])}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
            {label && (
                <span className="text-sm text-[var(--text-muted)] font-medium animate-pulse">
                    {label}
                </span>
            )}
        </div>
    );
};

// Skeleton loader component
interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    return (
        <div
            className={cn(
                'skeleton',
                variantClasses[variant],
                className
            )}
        />
    );
};

// Page loading component
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-primary)]">
        <LoadingSpinner size="lg" label={message} />
    </div>
);

// Inline loading dots
export const LoadingDots: React.FC = () => (
    <span className="inline-flex gap-0.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
    </span>
);
