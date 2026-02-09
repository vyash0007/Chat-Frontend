'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { Chat } from '@/types';
import { formatDate, truncate, cn } from '@/lib/utils';
import { useUIStore, useAuthStore, useChatStore } from '@/store';
import { Pin, CheckCheck, Check, Archive } from 'lucide-react';

interface ChatListItemProps {
  chat: Chat;
  isActive?: boolean;
  isTyping?: boolean;
  isPinned?: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isActive = false,
  isTyping = false,
  isPinned = false,
}) => {
  const router = useRouter();
  const { isMobile, setSidebarOpen } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { archiveChat } = useChatStore();

  // For 1-on-1 chats, find the OTHER user (not the current user)
  const otherUser = chat.isGroup
    ? null
    : chat.users?.find(u => u.id !== currentUser?.id);
  const displayName = chat.name || otherUser?.name || 'Unknown';

  const getPreviewText = () => {
    if (!chat.lastMessage) return 'No messages yet';
    switch (chat.lastMessage.type) {
      case 'IMAGE': return 'Sent an image';
      case 'VIDEO': return 'Sent a video';
      case 'AUDIO': return 'Sent an audio message';
      case 'FILE': return 'Sent a file';
      case 'LOCATION': return 'Sent a location';
      default: return chat.lastMessage.content;
    }
  };

  const lastMessageContent = getPreviewText();
  const lastMessageTime = chat.lastMessage?.createdAt;
  const hasUnread = chat.unreadCount > 0;

  const handleClick = () => {
    router.push(`/chats/${chat.id}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      className={cn(
        'flex items-center p-2 mb-1 rounded-md cursor-pointer transition-all w-full text-left group outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]',
        isActive ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--background-hover)]'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <UserAvatar
          user={chat.isGroup ? null : otherUser}
          name={chat.isGroup ? displayName : undefined}
          size="mdl"
          showStatus={!chat.isGroup}
        />
      </div>

      {/* Content */}
      <div className="ml-3 flex-1 min-w-0">
        {/* Name and Time */}
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={cn(
            'text-sm font-light tracking-tight truncate leading-tight',
            isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
          )}>
            {displayName}
          </h3>
          <span className="text-[10px] font-light tracking-tight text-[var(--text-muted)] flex-shrink-0 ml-2">
            {lastMessageTime ? formatDate(lastMessageTime) : ''}
          </span>
        </div>

        {/* Last Message and Indicators */}
        <div className="flex justify-between items-center">
          <p className={cn(
            'text-xs truncate max-w-[160px] leading-tight',
            hasUnread ? 'font-light tracking-tight text-[var(--text-primary)]' : 'text-[var(--text-secondary)] font-light tracking-tight'
          )}>
            {lastMessageContent}
          </p>
          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
            {/* Pinned Indicator */}
            {isPinned && (
              <Pin size={12} className="text-[var(--accent-primary)] fill-[var(--accent-primary)]" />
            )}
            {/* Unread Badge */}
            {hasUnread && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-light tracking-tight text-white bg-[var(--badge-unread)] rounded-full shadow-sm">
                {chat.unreadCount}
              </span>
            )}
            {/* Read Status - only show if no unread and I sent the last message */}
            {!hasUnread && chat.lastMessage && chat.lastMessage.senderId === currentUser?.id && (
              <CheckCheck size={14} className="text-[#a78bfa]" />
            )}
            {/* Archive Button - Hover Only */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveChat(chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--accent-primary)]/10 rounded-sm transition-all text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
              title={chat.isArchived ? "Unarchive chat" : "Archive chat"}
            >
              <Archive size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
