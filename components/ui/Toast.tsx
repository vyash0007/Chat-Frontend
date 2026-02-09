'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        setToasts(prev => [...prev, { id, message, type, duration }]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Container
const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[var(--z-tooltip)] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const typeStyles: Record<ToastType, { bg: string; icon: React.ReactNode; border: string }> = {
        success: {
            bg: 'bg-[var(--success-light)]',
            border: 'border-[var(--success)]',
            icon: (
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
        error: {
            bg: 'bg-[var(--danger-light)]',
            border: 'border-[var(--danger)]',
            icon: (
                <svg className="w-5 h-5 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
        },
        warning: {
            bg: 'bg-[var(--warning-light)]',
            border: 'border-[var(--warning)]',
            icon: (
                <svg className="w-5 h-5 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
        info: {
            bg: 'bg-[var(--info-light)]',
            border: 'border-[var(--info)]',
            icon: (
                <svg className="w-5 h-5 text-[var(--info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
    };

    const style = typeStyles[toast.type];

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-md border shadow-lg backdrop-blur-sm animate-slide-in-right',
                style.bg,
                style.border,
                'bg-[var(--background-modal)]'
            )}
            role="alert"
        >
            <div className="flex-shrink-0">{style.icon}</div>
            <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--background-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Dismiss"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default ToastProvider;
