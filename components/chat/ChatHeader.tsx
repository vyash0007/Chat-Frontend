'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { Chat, User } from '@/types';
import { useUIStore, useAuthStore } from '@/store';
import { InviteModal } from './InviteModal';

interface ChatHeaderProps {
  chat: Chat | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const router = useRouter();
  const { isMobile, setSidebarOpen } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (!chat) return null;

  // For 1-on-1 chats, find the OTHER user (not the current user)
  const otherUser = chat.isGroup
    ? null
    : chat.users?.find(u => u.id !== currentUser?.id);
  const displayName = chat.name || otherUser?.name || 'Unknown';
  const onlineStatus = otherUser?.status === 'ONLINE';

  const handleVideoCall = () => {
    router.push(`/call?chatId=${chat.id}`);
  };

  return (
    <>
      <header className="h-[var(--header-height)] flex items-center justify-between px-3 sm:px-4 border-b border-[var(--divider-color)] bg-[var(--background-primary)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors flex-shrink-0"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {chat.isGroup ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center text-sm flex-shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <UserAvatar user={otherUser} size="md" showStatus />
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[var(--text-primary)] truncate text-sm sm:text-base">
                {displayName}
              </h2>
              {!chat.isGroup && (
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {onlineStatus ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Invite button - only for group chats */}
          {chat.isGroup && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors items-center justify-center"
              aria-label="Invite members"
              title="Invite to chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </button>
          )}

          {/* Audio Call */}
          <button
            onClick={() => router.push(`/call?chatId=${chat.id}&audio=true`)}
            className="flex p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors items-center justify-center"
            aria-label="Start audio call"
            title="Audio call"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </button>

          {/* Video Call */}
          <button
            onClick={handleVideoCall}
            className="flex p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors items-center justify-center"
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

          {/* Search in chat - hidden on extra small mobile */}
          <button
            className="hidden sm:flex p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors items-center justify-center"
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
            className="flex items-center justify-center p-2 sm:p-2.5 rounded-lg hover:bg-[var(--background-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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

      {/* Invite Modal */}
      {chat.isGroup && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          chatId={chat.id}
          chatName={chat.name}
        />
      )}
    </>
  );
};
