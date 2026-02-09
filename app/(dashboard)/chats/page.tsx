'use client';

import { useUIStore } from '@/store';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';

export default function ChatsPage() {
  const { isMobile, setSidebarOpen } = useUIStore();

  return (
    <div className="flex-1 flex flex-col bg-[var(--background-primary)]">
      {/* Mobile hamburger header */}
      {isMobile && (
        <div className="flex items-center p-4 border-b border-[var(--divider-color)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      )}

      <WelcomeScreen />
    </div>
  );
}
