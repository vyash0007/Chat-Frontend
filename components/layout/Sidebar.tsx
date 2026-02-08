'use client';

import React from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { UserPanel } from './UserPanel';
import { useUIStore } from '@/store';

export const Sidebar: React.FC = () => {
  const { isMobile, setSidebarOpen } = useUIStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--divider-color)]">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Chats
        </h1>

        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <ChatList />
      </div>

      {/* User Panel */}
      <UserPanel />
    </div>
  );
};
