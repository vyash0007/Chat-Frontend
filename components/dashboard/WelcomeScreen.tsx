'use client';

import React from 'react';

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--background-primary)] relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-primary)]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="text-center px-4 z-10 animate-in fade-in zoom-in duration-700">
                <div className="relative mb-8 inline-block">
                    <div className="absolute inset-0 bg-[var(--accent-primary)]/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--background-secondary)] to-[var(--background-primary)] rounded-sm flex items-center justify-center border border-[var(--border-color)] shadow-2xl">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent-primary)]">
                            <path d="M12 3L4 7L12 11L20 7L12 3Z" />
                            <path d="M12 9L4 13L12 17L20 13L12 9Z" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-light tracking-tight text-[var(--text-primary)] mb-3">
                    Welcome to Prism
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-8 font-light tracking-tight max-w-xs mx-auto leading-relaxed opacity-80">
                    Your minimalist workspace for team communication.
                    Select a conversation from the sidebar to start messaging.
                </p>

                <div className="flex items-center justify-center space-x-2 text-[var(--text-muted)] animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300 fill-mode-both">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-light">Authenticated & Secure</span>
                </div>
            </div>

            {/* Visual subtle grid decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"></div>
        </div>
    );
};
