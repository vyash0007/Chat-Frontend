'use client';

import React from 'react';
import { UserAvatar } from '@/components/user';
import { Chat, User } from '@/types';
import { useUIStore } from '@/store';

interface ChatHeaderProps {
  chat: Chat | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { isMobile, setSidebarOpen } = useUIStore();

  if (!chat) return null;

  const otherUser = chat.isGroup ? null : chat.users[0];
  const displayName = chat.name || otherUser?.name || 'Unknown';
  const onlineStatus = otherUser?.status === 'ONLINE';

  return (
    <header className="h-[var(--header-height)] flex items-center justify-between px-4 border-b border-[var(--divider-color)] bg-[var(--background-primary)]">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors lg:hidden"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {/* Chat Info */}
        {chat.isGroup ? (
          <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center text-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <UserAvatar user={otherUser} size="md" showStatus />
        )}

        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">
            {displayName}
          </h2>
          {!chat.isGroup && (
            <p className="text-xs text-[var(--text-muted)]">
              {onlineStatus ? 'Online' : 'Offline'}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Video Call */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Start video call"
          title="Video call"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Search in chat */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Search in chat"
          title="Search"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* More options */}
        <button
          className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="More options"
          title="More"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
