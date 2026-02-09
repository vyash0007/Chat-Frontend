'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCallStore } from '@/store';
import { cancelCall } from '@/lib/socket';

export const OutgoingCallModal: React.FC = () => {
    const router = useRouter();
    const { outgoingCall, setOutgoingCall } = useCallStore();

    // Navigate to call page when call is accepted
    useEffect(() => {
        if (outgoingCall?.status === 'accepted') {
            setOutgoingCall(null);
            router.push(`/call?chatId=${outgoingCall.chatId}${!outgoingCall.isVideoCall ? '&audio=true' : ''}`);
        }
    }, [outgoingCall, router, setOutgoingCall]);

    if (!outgoingCall) return null;

    const handleCancel = () => {
        cancelCall(outgoingCall.chatId);
        setOutgoingCall(null);
    };

    const getStatusMessage = () => {
        switch (outgoingCall.status) {
            case 'ringing':
                return 'Calling...';
            case 'rejected':
                return 'Call declined';
            case 'cancelled':
                return 'Call cancelled';
            default:
                return 'Connecting...';
        }
    };

    return (
        <div className="fixed inset-0 z-[var(--z-call)] flex items-center justify-center font-light tracking-tight">
            {/* Backdrop with extreme depth */}
            <div className="absolute inset-0 bg-[#0a0a0c]/98 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--accent-primary)]/10" />

            {/* Animated rings */}
            {outgoingCall.status === 'ringing' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="absolute w-48 h-48 rounded-full border-2 border-indigo-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute w-64 h-64 rounded-full border border-indigo-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute w-80 h-80 rounded-full border border-indigo-300/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8">
                {/* Call type icon with animation */}
                <div className="relative mb-8">
                    <div className={`absolute inset-0 rounded-md blur-3xl opacity-30 ${outgoingCall.status === 'rejected'
                        ? 'bg-[var(--danger)]'
                        : 'bg-[var(--accent-primary)] animate-pulse'
                        }`} />
                    <div className={`relative w-28 h-28 rounded-md flex items-center justify-center border-4 transition-all duration-300 ${outgoingCall.status === 'rejected'
                        ? 'bg-[var(--danger)]/20 border-[var(--danger)]/40'
                        : 'bg-[var(--accent-gradient)] border-[var(--glass-border)] shadow-glow'
                        }`}>
                        {outgoingCall.isVideoCall ? (
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Status text */}
                <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                    {outgoingCall.isVideoCall ? 'Video Call' : 'Voice Call'}
                </h2>
                <p className={`text-lg mb-10 font-light tracking-tight ${outgoingCall.status === 'rejected' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
                    }`}>
                    {getStatusMessage()}
                </p>

                {/* Animated dots for ringing state */}
                {outgoingCall.status === 'ringing' && (
                    <div className="flex gap-1.5 mb-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}

                {/* Cancel button */}
                {outgoingCall.status === 'ringing' && (
                    <button
                        onClick={handleCancel}
                        className="group flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-sm bg-[var(--danger)] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[var(--danger)]/40 active:scale-90">
                            <svg className="w-8 h-8 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="mt-4 text-[10px] text-[var(--text-muted)] font-light tracking-[0.2em] uppercase">Cancel</span>
                    </button>
                )}
            </div>
        </div>
    );
};
