'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Menu,
  X,
  Play,
  Maximize2,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';

const IncomingCallCard = () => (
  <div className="bg-[var(--background-modal)]/90 backdrop-blur-xl text-[var(--text-primary)] p-4 sm:p-5 rounded-md shadow-2xl border border-[var(--border-color)] flex flex-col items-center w-48 sm:w-64 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 ring-1 ring-[var(--accent-primary)]/20 scale-75 sm:scale-100 origin-bottom-right">
    {/* Subtle Top Gradient Line */}
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-70"></div>

    {/* Ambient Background Glow */}
    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/10 blur-3xl rounded-full pointer-events-none"></div>

    {/* Pulsing Icon */}
    <div className="relative mb-3 mt-1 sm:mb-4 sm:mt-2">
      <div className="absolute inset-0 bg-[var(--accent-primary)]/30 rounded-full animate-ping opacity-20 duration-1000"></div>
      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[var(--background-secondary)] rounded-full flex items-center justify-center border border-[var(--border-color)] relative z-10 text-[var(--text-primary)] shadow-lg shadow-[var(--accent-primary)]/10">
        <Video size={18} className="text-[var(--accent-primary)] sm:w-6 sm:h-6" />
      </div>
    </div>

    {/* Text Content */}
    <h3 className="text-sm sm:text-base font-light tracking-tight text-[var(--text-primary)]">Incoming call...</h3>
    <p className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] mt-0.5 sm:mt-1 mb-4 sm:mb-5 uppercase tracking-widest font-light text-center">Design Team</p>

    {/* Minimalist Action Indicators */}
    <div className="flex space-x-2 sm:space-x-3 w-full px-1">
      <button className="flex-1 h-8 sm:h-9 rounded-sm bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] flex items-center justify-center transition-colors border border-[var(--danger)]/20">
        <X size={14} />
      </button>
      <button className="flex-1 h-8 sm:h-9 rounded-sm bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20 flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors animate-pulse">
        <Video size={14} />
      </button>
    </div>
  </div>
);

const FloatingToolbar = () => (
  <div className="bg-[var(--background-modal)]/80 backdrop-blur-md p-2 rounded-md flex flex-col items-center space-y-2 shadow-2xl border border-[var(--border-color)] text-[var(--text-muted)] ring-1 ring-white/5">
    <div className="p-3 hover:bg-[var(--background-hover)] rounded-sm cursor-pointer hover:text-[var(--text-primary)] transition-colors">
      <Grid size={18} />
    </div>
    <div className="p-3 hover:bg-[var(--background-hover)] rounded-sm cursor-pointer hover:text-[var(--text-primary)] transition-colors">
      <Zap size={18} />
    </div>
    <div className="p-3 hover:bg-[var(--background-hover)] rounded-sm cursor-pointer hover:text-[var(--text-primary)] transition-colors">
      <Maximize2 size={18} />
    </div>
  </div>
);

const LandingPageDark = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background-primary)] font-sans text-[var(--text-primary)] overflow-x-hidden selection:bg-[var(--accent-primary)]/30">

      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-[var(--background-primary)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--accent-primary)] rounded-sm flex items-center justify-center text-white shadow-lg shadow-[var(--accent-primary)]/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="sm:w-6 sm:h-6"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
              </div>
              <span className="text-lg sm:text-xl font-light tracking-tight text-[var(--text-primary)]">Prism</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Product</a>
              <a href="#" className="text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Solutions</a>
              <a href="#" className="text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-[var(--text-primary)] text-[var(--background-primary)] rounded-sm text-sm font-light tracking-tight hover:opacity-90 transition-all"
              >
                Get Started
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[var(--background-secondary)] border-b border-[var(--border-color)] py-4 px-6 space-y-4 animate-fade-in-down">
            <a href="#" className="block text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Product</a>
            <a href="#" className="block text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Solutions</a>
            <a href="#" className="block text-sm font-light tracking-tight text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 bg-[var(--accent-primary)] text-white rounded-sm text-sm font-light tracking-tight hover:bg-[var(--accent-hover)] transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-28 pb-16 lg:pt-40 lg:pb-32 overflow-visible">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[var(--accent-primary)]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-6 backdrop-blur-md">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--success)]"></span>
              </span>
              <span className="text-[10px] font-light tracking-widest text-gray-300 uppercase">v2.0 is now available</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extralight tracking-tighter text-[var(--text-primary)] mb-6 sm:mb-8 leading-[1.1]">
              Focus on the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-purple-400 to-indigo-400 animate-gradient">work that matters.</span>
            </h1>
            <p className="text-base sm:text-xl text-[var(--text-secondary)] mb-8 sm:mb-10 font-light tracking-tight leading-relaxed max-w-2xl mx-auto">
              A minimalist workspace designed for the dark mode generation. Experience team communication with zero clutter and maximum contrast.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto px-8 py-3 bg-[var(--accent-primary)] text-white rounded-sm font-light tracking-tight shadow-lg shadow-[var(--accent-primary)]/20 hover:bg-[var(--accent-hover)] hover:scale-[1.02] transition-all duration-300"
              >
                Start Free Trial
              </button>
              <button className="w-full sm:w-auto px-8 py-3 bg-[var(--background-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-sm font-light tracking-tight hover:bg-[var(--background-hover)] transition-all flex items-center justify-center group">
                <Play size={18} className="mr-2 fill-[var(--text-primary)] group-hover:scale-110 transition-transform" /> Watch Demo
              </button>
            </div>
          </div>

          {/* --- Abstract App Interface Showcase --- */}
          <div className="relative max-w-5xl mx-auto mt-12 sm:mt-20">
            {/* Background Glows Behind Interface */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-[var(--accent-primary)]/10 to-blue-500/5 blur-[80px] -z-10 rounded-full"></div>

            {/* Main Window Container */}
            <div className="bg-[var(--background-secondary)] rounded-md shadow-2xl border border-[var(--border-color)] ring-1 ring-white/5 aspect-[16/10] sm:aspect-video lg:aspect-[16/10] relative overflow-hidden">

              {/* Sidebar Skeleton */}
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 border-r border-[var(--border-color)] bg-[var(--background-primary)] hidden sm:flex flex-col items-center py-20 space-y-6">
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-sm bg-[var(--background-tertiary)] animate-pulse"></div>
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-sm bg-[var(--background-tertiary)]/50 hover:bg-[var(--background-hover)] transition-colors cursor-pointer"></div>
                <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-sm bg-[var(--background-tertiary)]/50 hover:bg-[var(--background-hover)] transition-colors cursor-pointer"></div>
                <div className="mt-auto w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-indigo-500"></div>
              </div>

              {/* Header Skeleton */}
              <div className="absolute top-0 left-0 sm:left-20 right-0 h-12 sm:h-16 border-b border-[var(--border-color)] flex items-center px-4 sm:px-8 bg-[var(--background-secondary)]/80 backdrop-blur-sm z-10">
                <div className="h-2.5 sm:h-3 w-24 sm:w-32 bg-[var(--background-tertiary)] rounded-full"></div>
                <div className="ml-auto flex items-center space-x-3">
                  <div className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                  <div className="text-[8px] sm:text-[10px] text-[var(--text-muted)] tracking-widest uppercase font-light">LIVE</div>
                </div>
              </div>

              {/* Content Area */}
              <div className="absolute inset-0 top-12 sm:top-16 left-0 sm:left-20 p-4 sm:p-12 bg-[var(--background-secondary)]">
                <div className="flex flex-col space-y-4 sm:space-y-6 max-w-2xl mx-auto h-full justify-center">
                  {/* Incoming Message Skeleton */}
                  <div className="flex items-start">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[var(--background-tertiary)] mr-3 sm:mr-4 shrink-0 border border-[var(--border-color)]"></div>
                    <div className="space-y-1.5 sm:space-y-2 w-full max-w-[180px] sm:max-w-md">
                      <div className="h-8 sm:h-10 w-full bg-[var(--background-primary)] rounded-sm rounded-tl-none border border-[var(--border-color)] p-3 sm:p-4 flex items-center">
                        <div className="h-1 sm:h-1.5 w-3/4 bg-[var(--background-tertiary)] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing Message (Accent Bubble) */}
                  <div className="flex items-end justify-end">
                    <div className="bg-gradient-to-br from-[var(--accent-primary)] to-[#5b37d8] p-3 sm:p-4 rounded-sm rounded-tr-none shadow-lg shadow-[var(--accent-primary)]/20 text-white max-w-[200px] sm:max-w-md transform transition-all hover:scale-[1.01] cursor-default border border-white/10">
                      <div className="flex items-center space-x-2 mb-1.5 sm:mb-2 opacity-70">
                        <div className="w-12 sm:w-16 h-1 sm:h-1.5 bg-white rounded-full"></div>
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="w-full h-1 sm:h-1.5 bg-white/90 rounded-full"></div>
                        <div className="w-2/3 h-1 sm:h-1.5 bg-white/90 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Floating Toolbar (Right Side) */}
                <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 hidden lg:block animate-fade-in-up">
                  <FloatingToolbar />
                </div>

                {/* 2. Incoming Call Card (Bottom Right) */}
                <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-20 z-20 animate-bounce-slow">
                  <IncomingCallCard />
                </div>

              </div>

              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] sm:bg-[size:32px_32px] pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features Strip --- */}
      <section className="py-20 sm:py-24 bg-[var(--background-primary)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { title: "Fluid Conversations", desc: "No more refresh. Messages flow in real-time with zero latency.", icon: MessageSquare },
              { title: "Crystal Clear Video", desc: "4k supported video calls that feel like you're in the same room.", icon: Video },
              { title: "Secure by Default", desc: "End-to-end encryption for every single interaction.", icon: Shield }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-start p-6 rounded-md bg-[var(--background-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-hover)] transition-all group cursor-default">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-primary)]/10 rounded-sm flex items-center justify-center text-[var(--accent-primary)] mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={20} className="sm:w-5.5 sm:h-5.5" />
                </div>
                <h3 className="text-lg sm:text-xl font-light tracking-tight text-[var(--text-primary)] mb-2 sm:mb-3">{f.title}</h3>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] font-light tracking-tight leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--background-primary)] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[var(--text-muted)] font-light tracking-widest text-[10px] sm:text-xs uppercase">© 2026 Prism Inc. Designed for the dark.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 6s ease-in-out infinite;
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient {
            background-size: 200% auto;
            animation: gradient 3s linear infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPageDark;
