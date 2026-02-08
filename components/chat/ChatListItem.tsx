'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { Chat } from '@/types';
import { formatDate, truncate, cn } from '@/lib/utils';

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

  const otherUser = chat.isGroup ? null : chat.users[0];
  const displayName = chat.name || otherUser?.name || 'Unknown';
  const lastMessageContent = chat.lastMessage?.content || 'No messages yet';
  const lastMessageTime = chat.lastMessage?.createdAt;

  const handleClick = () => {
    router.push(`/chats/${chat.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors',
        isActive
          ? 'bg-[var(--background-active)]'
          : 'hover:bg-[var(--background-hover)]'
      )}
    >
      {/* Avatar */}
      {chat.isGroup ? (
        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center text-sm">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <UserAvatar user={otherUser} size="md" showStatus />
      )}

      {/* Chat Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3
            className={cn(
              'font-semibold text-sm truncate',
              chat.unreadCount > 0
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]'
            )}
          >
            {displayName}
          </h3>
          {lastMessageTime && (
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
              {formatDate(lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate',
              isTyping
                ? 'text-[var(--accent-primary)] italic'
                : chat.unreadCount > 0
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)]'
            )}
          >
            {isTyping ? 'Typing...' : truncate(lastMessageContent, 40)}
          </p>

          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
