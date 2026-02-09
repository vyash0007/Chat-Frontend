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
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center">
            {/* Backdrop with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-indigo-900/90 to-purple-900/95 backdrop-blur-md" />

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
                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${outgoingCall.status === 'rejected'
                            ? 'bg-red-500'
                            : 'bg-gradient-to-br from-indigo-400 to-purple-600 animate-pulse'
                        }`} />
                    <div className={`relative w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${outgoingCall.status === 'rejected'
                            ? 'bg-red-500/20 border-red-500/40'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white/20'
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
                <h2 className="text-3xl font-bold text-white mb-2">
                    {outgoingCall.isVideoCall ? 'Video Call' : 'Voice Call'}
                </h2>
                <p className={`text-lg mb-10 ${outgoingCall.status === 'rejected' ? 'text-red-400' : 'text-white/70'
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
                        <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-500/40">
                            <svg className="w-8 h-8 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="mt-3 text-sm text-white/60 font-medium">Cancel</span>
                    </button>
                )}
            </div>
        </div>
    );
};
