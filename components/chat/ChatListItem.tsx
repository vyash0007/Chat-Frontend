'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { Chat } from '@/types';
import { formatDate, truncate, cn } from '@/lib/utils';
import { useUIStore, useAuthStore } from '@/store';

interface ChatListItemProps {
  chat: Chat;
  isActive?: boolean;
  isTyping?: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive = false,
  isTyping = false,
}) => {
  const router = useRouter();
  const { isMobile, setSidebarOpen } = useUIStore();
  const { user: currentUser } = useAuthStore();

  // For 1-on-1 chats, find the OTHER user (not the current user)
  const otherUser = chat.isGroup
    ? null
    : chat.users?.find(u => u.id !== currentUser?.id);
  const displayName = chat.name || otherUser?.name || 'Unknown';
  const lastMessageContent = chat.lastMessage?.content || 'No messages yet';
  const lastMessageTime = chat.lastMessage?.createdAt;
  const hasUnread = chat.unreadCount > 0;

  const handleClick = () => {
    router.push(`/chats/${chat.id}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
      aria-label={`${displayName}${hasUnread ? `, ${chat.unreadCount} unread messages` : ''}${isTyping ? ', typing' : ''}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2',
        isActive
          ? 'bg-[var(--accent-primary)]/10 shadow-sm'
          : 'hover:bg-[var(--background-hover)] hover:shadow-sm',
        hasUnread && !isActive && 'bg-[var(--background-secondary)]'
      )}
    >
      {/* Avatar with status */}
      <div className="relative flex-shrink-0">
        {chat.isGroup ? (
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-semibold flex items-center justify-center text-sm shadow-md"
            aria-hidden="true"
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <UserAvatar user={otherUser} size="md" showStatus />
        )}

        {/* Unread indicator dot */}
        {hasUnread && !isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[var(--accent-primary)] rounded-full border-2 border-[var(--background-primary)] animate-pulse" />
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3
            className={cn(
              'font-semibold text-sm truncate transition-colors',
              hasUnread
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]',
              isActive && 'text-[var(--accent-primary)]'
            )}
            aria-hidden="true"
          >
            {displayName}
          </h3>
          {lastMessageTime && (
            <span
              className={cn(
                'text-[11px] flex-shrink-0 transition-colors',
                hasUnread
                  ? 'text-[var(--accent-primary)] font-medium'
                  : 'text-[var(--text-muted)]'
              )}
              aria-hidden="true"
            >
              {formatDate(lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--accent-primary)] font-medium">typing</span>
              <div className="flex gap-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          ) : (
            <p
              className={cn(
                'text-xs truncate transition-colors',
                hasUnread
                  ? 'text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-muted)]'
              )}
              aria-hidden="true"
            >
              {truncate(lastMessageContent, 45)}
            </p>
          )}

          {hasUnread && (
            <span className="unread-badge flex-shrink-0 animate-scale-in" aria-hidden="true">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
