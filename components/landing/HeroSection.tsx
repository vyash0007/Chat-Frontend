'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Video,
    Zap,
    Play,
    Maximize2,
    Grid,
    CheckCircle,
    X
} from 'lucide-react';

const TypingIndicator = () => (
    <div className="flex space-x-1.5 p-3 sm:p-4 bg-[#15151a] rounded-md rounded-tl-none border border-white/5 w-fit items-center h-8 sm:h-12 shadow-lg shadow-black/20 animate-fade-in-up">
        <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
    </div>
);

const IncomingCallCard = () => (
    <div className="bg-[#15151a] backdrop-blur-2xl text-white p-3.5 sm:p-5 rounded-md shadow-2xl border border-white/10 flex flex-col items-center w-full relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 ring-1 ring-[var(--accent-primary)]/20 animate-fade-in-up">
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative mb-2.5 sm:mb-4 mt-1 sm:mt-2 flex items-center justify-center">
            {/* Universal calling animation rings */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-12 sm:w-16 h-12 sm:h-16 bg-[var(--accent-primary)]/20 rounded-full animate-ping [animation-duration:2s]"></div>
                <div className="absolute w-12 sm:w-16 h-12 sm:h-16 bg-[var(--accent-primary)]/10 rounded-full animate-ping [animation-duration:2.5s] [animation-delay:0.5s]"></div>
            </div>

            <div className="p-3 sm:p-4 bg-black rounded-full border border-white/10 text-[var(--accent-primary)] relative z-10 shadow-lg">
                <Video size={20} className="sm:w-6 sm:h-6" />
            </div>
        </div>

        <h3 className="text-xs sm:text-base font-bold tracking-wide text-white">Incoming call...</h3>
        <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 mb-3.5 sm:mb-5 uppercase tracking-[0.2em] font-medium">DESIGN TEAM</p>

        <div className="flex space-x-2 sm:space-x-3 w-full px-1">
            <button className="flex-1 h-8 sm:h-10 rounded-sm bg-red-500/15 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors border border-red-500/30">
                <X size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button className="flex-1 h-8 sm:h-10 rounded-sm bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30 flex items-center justify-center hover:opacity-90 transition-opacity">
                <Video size={16} className="sm:w-5 sm:h-5" />
            </button>
        </div>
    </div>
);

const FloatingToolbar = () => (
    <div className="bg-[#1a1b26]/80 backdrop-blur-md p-2 rounded-md flex flex-col items-center space-y-4 shadow-2xl border border-white/5 text-gray-400 ring-1 ring-white/5">
        <div className="p-3 hover:bg-white/10 rounded-sm cursor-pointer hover:text-white transition-colors">
            <Grid size={18} />
        </div>
        <div className="p-3 hover:bg-white/10 rounded-sm cursor-pointer hover:text-white transition-colors">
            <Zap size={18} />
        </div>
        <div className="p-3 hover:bg-white/10 rounded-sm cursor-pointer hover:text-white transition-colors">
            <Maximize2 size={18} />
        </div>
    </div>
);

export const HeroSection = () => {
    const router = useRouter();
    const [animationStep, setAnimationStep] = useState(0);

    useEffect(() => {
        const sequence = [
            { step: 1, delay: 1000 },  // Sarah Typing
            { step: 2, delay: 2500 },  // Sarah Message
            { step: 3, delay: 4000 },  // me Typing
            { step: 4, delay: 5500 },  // me Message
            { step: 0, delay: 9000 },  // Reset
        ];

        let timeouts: NodeJS.Timeout[] = [];

        const scheduleStep = (index: number) => {
            if (index >= sequence.length) return;

            const timeout = setTimeout(() => {
                setAnimationStep(sequence[index].step);
                scheduleStep(index + 1);
            }, index === 0 ? sequence[index].delay : sequence[index].delay - sequence[index - 1].delay);

            timeouts.push(timeout);
        };

        scheduleStep(0);

        const loop = setInterval(() => {
            timeouts.forEach(clearTimeout);
            timeouts = [];
            setAnimationStep(0);
            scheduleStep(0);
        }, 10000);

        return () => {
            clearInterval(loop);
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return (
        <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-32 lg:pt-44 overflow-visible">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] sm:h-[500px] bg-purple-900/5 blur-[120px] rounded-full pointer-events-none opacity-30"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-5xl mx-auto mb-16 sm:mb-24">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1 mb-8 sm:mb-14 backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        <span className="text-[10px] sm:text-xs font-normal text-gray-400 tracking-[0.2em] uppercase">V2.0 is now live</span>
                    </div>

                    <h1 className="text-4xl sm:text-7xl lg:text-[7.5rem] font-extralight text-white tracking-[-0.04em] mb-6 sm:mb-10 leading-[0.95] sm:leading-[0.9] text-balance">
                        Prism. Chat in <span className="text-[var(--accent-primary)] font-light">its purest form.</span>
                    </h1>

                    <p className="text-base sm:text-xl lg:text-[1.375rem] text-gray-400/90 mb-10 sm:mb-14 font-light tracking-tight leading-relaxed max-w-2xl mx-auto px-4">
                        A high-fidelity communication workspace designed for the dark mode generation. Experience real-time collaboration with zero clutter and maximum contrast.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 px-4 mb-10">
                        <button
                            onClick={() => router.push('/login')}
                            className="px-10 py-4 bg-[var(--accent-primary)] text-white rounded-sm font-light text-lg tracking-tight hover:opacity-90 hover:scale-[1.02] transition-all duration-300 w-full sm:w-auto shadow-xl shadow-[var(--accent-primary)]/20"
                        >
                            Get Started for Free
                        </button>
                        <button className="px-10 py-4 bg-transparent text-white border border-white/10 rounded-sm font-light text-lg tracking-tight hover:bg-white/5 transition-all flex items-center justify-center group w-full sm:w-auto">
                            <Play size={20} className="mr-3 fill-white" /> Watch Product Demo
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-[10px] sm:text-xs text-gray-500 tracking-widest uppercase font-light">
                        <div className="flex items-center"><CheckCircle size={14} className="text-[var(--success)] mr-2" /> No credit card required</div>
                        <div className="flex items-center"><CheckCircle size={14} className="text-[var(--success)] mr-2" /> Instant access</div>
                    </div>
                </div>

                <div className="relative max-w-6xl mx-auto mt-10 sm:mt-16 group/interface">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-[var(--accent-primary)]/5 to-blue-500/5 blur-[100px] -z-10 rounded-full opacity-60"></div>

                    {/* Main Window Container */}
                    <div className="bg-[#0a0a0a] rounded-md shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 ring-1 ring-white/5 aspect-[16/11] sm:aspect-[16/9] relative overflow-hidden transform transition-transform duration-700 sm:hover:scale-[1.01]">

                        {/* Grid texture for desktop content background - spans entire window */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:25px_25px] pointer-events-none opacity-20 z-0"></div>

                        {/* Desktop Header (Hidden on Mobile) */}
                        <div className="h-14 border-b border-white/5 bg-black/20 hidden sm:flex items-center justify-between px-8 z-20 relative">
                            <div className="flex space-x-2.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm"></div>
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
                                <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm"></div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 px-1 bg-black/40 backdrop-blur-md rounded-sm border border-white/5 flex items-center">
                                <div className="px-5 py-1.5 bg-white/10 rounded-sm text-xs font-bold text-white shadow-sm">Chat</div>
                                <div className="px-5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Shared Media</div>
                                <div className="px-5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Team Tasks</div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase">LIVE</span>
                            </div>
                        </div>

                        {/* Mobile Header (Hidden on Desktop) as per screenshot */}
                        <div className="h-10 border-b border-white/5 bg-black/20 flex sm:hidden items-center justify-between px-4 z-20 relative">
                            <div className="w-24 h-2.5 bg-white/10 rounded-full"></div>
                            <div className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase">LIVE</span>
                            </div>
                        </div>

                        {/* Sidebar Skeleton (Primary - Icons) */}
                        <div className="absolute left-0 top-14 bottom-0 w-24 border-r border-white/5 bg-[#0a0a0a]/30 hidden sm:flex flex-col items-center py-10 space-y-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-12 h-12 rounded-lg cursor-pointer transition-all hover:scale-105 ${i === 1 ? 'bg-[#7c5dfa] shadow-lg shadow-[#7c5dfa]/20' : 'bg-white/10 hover:bg-white/15'}`}>
                                </div>
                            ))}
                            <div className="mt-auto w-12 h-12 rounded-full bg-[var(--accent-gradient)] border-2 border-white/10 shadow-lg shadow-[var(--accent-primary)]/20 mb-6"></div>
                        </div>

                        {/* Conversation Sidebar Skeleton (Secondary - Hidden on Mobile/Tablet) */}
                        <div className="absolute left-24 top-14 bottom-0 w-64 lg:w-72 border-r border-white/5 bg-[#0f1115]/80 backdrop-blur-sm hidden lg:block px-8 py-10">
                            <div className="h-4 w-32 bg-white/5 rounded-full mb-12"></div>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center space-x-4 mb-8 opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/5 border border-white/5"></div>
                                    <div className="space-y-2">
                                        <div className="w-24 lg:w-32 h-2 bg-white/10 rounded-full"></div>
                                        <div className="w-16 lg:w-20 h-1.5 bg-white/5 rounded-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="absolute inset-x-0 bottom-0 top-10 sm:top-14 sm:left-24 lg:left-[384px] bg-transparent overflow-hidden">


                            {/* Desktop/Tablet/Mobile Animated UI */}
                            <div className="flex flex-col space-y-4 sm:space-y-10 max-w-2xl mx-auto h-full justify-center relative z-10 px-4 sm:px-12">
                                {/* Incoming Message Block */}
                                <div className="flex flex-col space-y-4">
                                    {animationStep >= 2 && (
                                        <div className="flex items-start animate-fade-in-up">
                                            {/* Avatar: Scaled down for mobile */}
                                            <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-gray-800 mr-3 sm:mr-5 shrink-0 border border-white/5 relative">
                                                <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 bg-[var(--status-online)] rounded-full border-2 border-[#0f1115] shadow-lg hidden sm:block"></div>
                                            </div>
                                            <div className="w-full max-w-[180px] sm:max-w-lg">
                                                <div className="hidden sm:flex items-baseline space-x-3 mb-2">
                                                    <span className="text-[15px] font-bold text-gray-300">Sarah Jenkins</span>
                                                    <span className="text-xs text-gray-600">10:23 AM</span>
                                                </div>
                                                <div className="bg-[#1a1b26] rounded-md rounded-tl-none border border-white/5 p-2.5 sm:p-6 shadow-xl text-left">
                                                    <div className="h-2 w-3/4 bg-white/10 rounded-full mb-2 sm:mb-3"></div>
                                                    <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {animationStep === 1 && (
                                        <div className="flex items-start">
                                            <div className="w-9 sm:w-12 mr-4 sm:mr-5"></div>
                                            <TypingIndicator />
                                        </div>
                                    )}
                                </div>

                                {/* Outgoing Message Block */}
                                <div className="flex flex-col space-y-4 items-end">
                                    {animationStep >= 4 && (
                                        <div className="flex items-end justify-end animate-fade-in-up">
                                            {/* Outgoing Bubble: Tighter padding and smaller text on mobile */}
                                            <div className="bg-[var(--accent-gradient)] p-3 sm:p-7 rounded-md rounded-tr-none shadow-2xl shadow-[var(--accent-primary)]/30 text-white max-w-[180px] sm:max-w-md cursor-default relative text-left">
                                                <p className="text-[10px] sm:text-[15px] font-medium leading-relaxed">Prism's new design system looks incredible! The minimalist layout really lets the content breathe. 🎨</p>
                                                <div className="mt-3 sm:mt-5 hidden sm:flex items-center space-x-4">
                                                    <div className="h-24 w-1/2 bg-white/20 rounded-sm border border-white/10"></div>
                                                    <div className="h-24 w-1/2 bg-white/20 rounded-sm border border-white/10"></div>
                                                </div>
                                            </div>
                                            <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-gray-800 ml-3 sm:ml-5 shrink-0 border border-white/5 hidden sm:block"></div>
                                        </div>
                                    )}
                                    {animationStep === 3 && (
                                        <div className="flex items-end justify-end">
                                            <TypingIndicator />
                                            <div className="w-7 sm:w-12 ml-3 sm:mr-5"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Floating Components --- */}

                            {/* 1. Floating Toolbar (Right Side - Hidden on Mobile) */}
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block z-50">
                                <FloatingToolbar />
                            </div>

                            {/* 2. Incoming Call Card Section (Always Visible) */}
                            <div className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 z-40 w-[140px] sm:w-[320px] animate-bounce-slow origin-bottom-right">
                                <IncomingCallCard />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
