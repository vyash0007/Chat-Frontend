'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { Chat } from '@/types';
import { useUIStore, useAuthStore, useUserStore } from '@/store';
import { InviteModal } from './InviteModal';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  chat: Chat | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const router = useRouter();
  const { isMobile, setSidebarOpen } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // For 1-on-1 chats, find the OTHER user (not the current user)
  const otherUser = useMemo(() => {
    if (chat?.isGroup) return null;
    return chat?.users?.find(u => u.id !== currentUser?.id) || null;
  }, [chat?.isGroup, chat?.users, currentUser?.id]);

  const otherUserId = otherUser?.id;

  // Use stable selector with primitive dependency
  const onlineStatus = useUserStore(
    useCallback((state) => otherUserId ? state.onlineUsers.has(otherUserId) : false, [otherUserId])
  );

  const displayName = chat?.name || otherUser?.name || 'Unknown';

  if (!chat) return null;

  const handleVideoCall = () => {
    router.push(`/call?chatId=${chat.id}`);
  };

  const handleAudioCall = () => {
    router.push(`/call?chatId=${chat.id}&audio=true`);
  };

  // Action button component for DRY code
  const ActionButton = ({
    onClick,
    label,
    icon,
    hidden = false,
    accent = false
  }: {
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
    hidden?: boolean;
    accent?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-200',
        accent
          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white hover:shadow-lg hover:shadow-[var(--accent-primary)]/25'
          : 'text-[var(--text-secondary)] hover:bg-[var(--background-hover)] hover:text-[var(--text-primary)]',
        hidden && 'hidden sm:flex'
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <>
      <header className="h-[var(--header-height)] flex items-center justify-between px-4 sm:px-6 border-b border-[var(--divider-color)] bg-[var(--background-primary)]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors flex-shrink-0"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Chat Info */}
          <div className="flex items-center gap-3 min-w-0 group cursor-pointer">
            {chat.isGroup ? (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold flex items-center justify-center text-sm flex-shrink-0 shadow-md shadow-[var(--accent-primary)]/20">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <UserAvatar user={otherUser} size="md" showStatus />
            )}

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[var(--text-primary)] truncate text-base group-hover:text-[var(--accent-primary)] transition-colors">
                {displayName}
              </h2>
              {!chat.isGroup && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      onlineStatus ? "bg-[var(--status-online)]" : "bg-[var(--status-offline)]"
                    )}
                  />
                  <p className={cn(
                    "text-xs font-medium truncate transition-colors",
                    onlineStatus ? "text-[var(--status-online)]" : "text-[var(--text-muted)]"
                  )}>
                    {onlineStatus ? 'Online' : 'Offline'}
                  </p>
                </div>
              )}
              {chat.isGroup && (
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {chat.users?.length || 0} members
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Invite button - only for group chats */}
          {chat.isGroup && (
            <ActionButton
              onClick={() => setShowInviteModal(true)}
              label="Invite members"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
          )}

          {/* Audio Call */}
          <ActionButton
            onClick={handleAudioCall}
            label="Audio call"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />

          {/* Video Call */}
          <ActionButton
            onClick={handleVideoCall}
            label="Video call"
            accent
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Search in chat */}
          <ActionButton
            onClick={() => { }}
            label="Search"
            hidden
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          {/* More options */}
          <ActionButton
            onClick={() => { }}
            label="More"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            }
          />
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
