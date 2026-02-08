'use client';

import { useUIStore } from '@/store';

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

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <svg
            className="w-24 h-24 text-[var(--text-muted)] mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Welcome to Chat App
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            Select a conversation from the sidebar to start messaging
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Or create a new chat to get started
          </p>
        </div>
      </div>
    </div>
  );
}
