'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular'
}) => {
    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-md',
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
