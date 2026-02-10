'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  MessageSquare,
  Shield,
  Menu,
  X,
  Command,
  ArrowRight,
  Twitter,
  Github,
  Disc as Discord
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeroSection } from '@/components/landing/HeroSection';

// --- Utility Components ---

const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(124, 93, 250, 0.1)" }: { children: React.ReactNode, className?: string, spotlightColor?: string }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-md bg-[var(--background-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/20 transition-colors duration-300",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative h-full z-10">{children}</div>
    </div>
  );
};

const DotGlobe = () => {
  return (
    <div className="relative flex items-center justify-center w-full h-full perspective-1000">
      <div className="w-48 h-48 relative animate-spin-slow preserve-3d">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/10" style={{ transform: `rotateY(${i * 60}deg)` }}></div>
        ))}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="absolute inset-0 rounded-full border border-[var(--accent-primary)]/10" style={{ transform: `rotateX(${i * 60}deg)` }}></div>
        ))}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--accent-primary)]/5 to-transparent blur-xl"></div>
      </div>
    </div>
  );
};


const LandingPageDark = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background-primary)] font-sans text-[var(--text-primary)] overflow-x-hidden selection:bg-[var(--accent-primary)]/30 brand-theme">

      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-[var(--background-primary)]/80 backdrop-blur-lg border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--accent-primary)] rounded-sm flex items-center justify-center text-white shadow-lg shadow-[var(--accent-primary)]/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="sm:w-6 sm:h-6">
                  <path d="M12 3L4 7L12 11L20 7L12 3Z" />
                  <path d="M12 9L4 13L12 17L20 13L12 9Z" />
                </svg>
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

      <HeroSection />

      {/* --- Bento Grid Features --- */}
      <section className="py-24 sm:py-32 bg-[var(--background-primary)] border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight text-[var(--text-primary)]">
              Built for the <span className="text-[var(--accent-primary)]">flow state.</span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-light">
              Every pixel is designed to keep you focused. We removed the clutter so you can remove the friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {/* 1. Large Card: Fluid Conversations */}
            <SpotlightCard className="md:col-span-4 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-[var(--background-primary)] border border-[var(--border-color)] rounded-sm flex items-center justify-center text-[var(--accent-primary)] mb-6">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-white mb-3">Fluid Conversations</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
                  Real-time messaging engine that handles millions of events per second with zero latency.
                </p>
              </div>

              <div className="w-full h-40 bg-black/40 rounded border border-white/5 flex items-center justify-center relative overflow-hidden group/graph">
                <div className="flex items-end space-x-1.5 h-20">
                  {[40, 65, 30, 85, 50, 95, 70, 45, 60, 80, 55, 90].map((h, i) => (
                    <div
                      key={i}
                      className="w-2.5 bg-[#7c5dfa]/20 group-hover/graph:bg-[#7c5dfa]/40 transition-colors duration-500"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
                <div className="absolute top-4 right-6 text-[10px] font-mono text-[var(--status-online)] uppercase tracking-wider">
                  Latency: 12ms
                </div>
              </div>
            </SpotlightCard>

            {/* 2. Tall Card: Universal Search */}
            <SpotlightCard className="md:col-span-2 md:row-span-2 p-8 sm:p-10 flex flex-col h-full">
              <div className="w-12 h-12 bg-[var(--background-primary)] border border-[var(--border-color)] rounded-sm flex items-center justify-center text-[var(--accent-primary)] mb-6">
                <Menu size={24} />
              </div>
              <h3 className="text-xl sm:text-2xl font-light text-white mb-3">Universal Search</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-10">
                Find any message, file, or link instantly across your entire workspace.
              </p>

              <div className="space-y-4 mt-auto">
                {[
                  { color: 'text-purple-500', w: 'w-24' },
                  { color: 'text-blue-500', w: 'w-40', opacity: 'opacity-60' },
                  { color: 'text-[var(--status-online)]', w: 'w-20', opacity: 'opacity-40' }
                ].map((item, i) => (
                  <div key={i} className={cn("bg-white/5 p-4 rounded-sm border border-white/5 flex items-center space-x-3", item.opacity)}>
                    <div className={cn("w-2 h-2 rounded-full bg-current", item.color)}></div>
                    <div className={cn("h-1.5 bg-white/10 rounded-full", item.w)}></div>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* 3. Small Card: Enterprise Security */}
            <SpotlightCard className="md:col-span-2 p-8 sm:p-10">
              <div className="w-12 h-12 bg-[var(--background-primary)] border border-[var(--border-color)] rounded-sm flex items-center justify-center text-[var(--accent-primary)] mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl sm:text-2xl font-light text-white mb-3 tracking-tight">Enterprise Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                SOC2 Type II certified. End-to-end encryption by default for all communication.
              </p>
            </SpotlightCard>

            {/* 4. Small Card: Global Network */}
            <SpotlightCard className="md:col-span-2 p-8 sm:p-10 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[var(--background-primary)] border border-[var(--border-color)] rounded-sm flex items-center justify-center text-[var(--accent-primary)] mb-6">
                  <div className="w-6 h-6 rounded-full border border-current opacity-40"></div>
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-white mb-3 tracking-tight">Global Edge</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Optimized message routing through 35 cities worldwide for zero lag.
                </p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-20 pointer-events-none">
                <DotGlobe />
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--background-primary)] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
            {/* Logo & Newsletter */}
            <div className="col-span-2 space-y-8">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-sm flex items-center justify-center text-white shadow-lg shadow-[var(--accent-primary)]/20">
                  <Command size={20} />
                </div>
                <span className="text-xl font-light tracking-tight text-[var(--text-primary)]">Prism</span>
              </div>

              <div className="space-y-4">
                <p className="text-[var(--text-secondary)] text-sm font-light leading-relaxed max-w-xs">
                  A high-fidelity communication workspace designed for the dark mode generation.
                </p>
                <div className="relative max-w-xs">
                  <input
                    type="email"
                    placeholder="Join the newsletter"
                    className="w-full bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-sm py-3 pl-4 pr-12 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors placeholder:text-gray-600"
                  />
                  <button className="absolute right-1 top-1 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Nav Columns */}
            <div>
              <h4 className="text-[var(--text-primary)] font-medium text-sm mb-6 uppercase tracking-[0.2em]">Product</h4>
              <ul className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--text-primary)] font-medium text-sm mb-6 uppercase tracking-[0.2em]">Company</h4>
              <ul className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--text-primary)] font-medium text-sm mb-6 uppercase tracking-[0.2em]">Resources</h4>
              <ul className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--text-primary)] font-medium text-sm mb-6 uppercase tracking-[0.2em]">Legal</h4>
              <ul className="space-y-4 text-sm font-light text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[var(--accent-primary)] transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-light tracking-widest text-[var(--text-muted)] uppercase">
            <p className="mb-4 md:mb-0">© 2026 Prism Inc. All rights reserved.</p>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-2">
                <Twitter size={14} /> <span>Twitter</span>
              </a>
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-2">
                <Github size={14} /> <span>GitHub</span>
              </a>
              <a href="#" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-2">
                <Discord size={14} /> <span>Discord</span>
              </a>
            </div>
          </div>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        .perspective-1000 {
           perspective: 1000px;
        }
        .preserve-3d {
           transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default LandingPageDark;
