'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCallStore } from '@/store';
import { acceptCall, rejectCall } from '@/lib/socket';

export const IncomingCallModal: React.FC = () => {
    const router = useRouter();
    const { incomingCall, setIncomingCall } = useCallStore();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Play ringtone when incoming call appears
    useEffect(() => {
        if (incomingCall) {
            // Try to play a ringtone (browser audio context)
            try {
                // You could add a custom ringtone here using Web Audio API or HTML audio  
                // For now, use browser notification if available
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Incoming Call', {
                        body: `${incomingCall.callerName} is calling on Prism...`,
                        icon: incomingCall.callerAvatar || undefined,
                    });
                }
            } catch (e) {
                console.log('Could not show notification');
            }
        }
    }, [incomingCall]);

    if (!incomingCall) return null;

    const handleAccept = () => {
        acceptCall(incomingCall.chatId, incomingCall.callerId);
        setIncomingCall(null);
        router.push(`/call?chatId=${incomingCall.chatId}${!incomingCall.isVideoCall ? '&audio=true' : ''}`);
    };

    const handleDecline = () => {
        rejectCall(incomingCall.chatId, incomingCall.callerId);
        setIncomingCall(null);
    };

    return (
        <div className="fixed inset-0 z-[var(--z-call)] flex items-center justify-center font-light tracking-tight">
            {/* Backdrop with extreme depth */}
            <div className="absolute inset-0 bg-[#0a0a0c]/98 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-primary)]/5" />

            {/* Animated rings behind avatar */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-64 h-64 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute w-80 h-80 rounded-full border border-white/5 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-96 h-96 rounded-full border border-white/[0.03] animate-ping" style={{ animationDuration: '4s' }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8">
                {/* Avatar with pulse animation */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)] animate-pulse blur-2xl opacity-30" />
                    {incomingCall.callerAvatar ? (
                        <img
                            src={incomingCall.callerAvatar}
                            alt={incomingCall.callerName}
                            className="relative w-32 h-32 rounded-md object-cover border-4 border-[var(--glass-border)] shadow-glow"
                        />
                    ) : (
                        <div className="relative w-32 h-32 rounded-md bg-[var(--accent-gradient)] flex items-center justify-center border-4 border-[var(--glass-border)] shadow-glow">
                            <span className="text-4xl font-light tracking-tight text-white">
                                {incomingCall.callerName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Video/Audio indicator */}
                    <div className="absolute -bottom-2 -right-2 p-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                        {incomingCall.isVideoCall ? (
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Caller info */}
                <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                    {incomingCall.callerName}
                </h2>
                <p className="text-lg text-[var(--text-muted)] mb-12 font-light tracking-tight">
                    Incoming {incomingCall.isVideoCall ? 'video' : 'voice'} call...
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-8">
                    {/* Decline button */}
                    <button
                        onClick={handleDecline}
                        className="group relative flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-sm bg-[var(--danger)] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[var(--danger)]/40 active:scale-95">
                            <svg className="w-8 h-8 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="mt-4 text-[10px] text-[var(--text-muted)] font-light tracking-[0.2em] uppercase">Decline</span>
                    </button>

                    {/* Accept button */}
                    <button
                        onClick={handleAccept}
                        className="group relative flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-sm bg-[var(--success)] text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[var(--success)]/40 animate-pulse active:scale-95">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <span className="mt-4 text-[10px] text-[var(--accent-primary)] font-light tracking-[0.2em] uppercase">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
