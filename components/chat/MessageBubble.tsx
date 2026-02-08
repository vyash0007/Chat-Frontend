'use client';

import React from 'react';
import { Message, MessageType, MessageStatus } from '@/types';
import { UserAvatar } from '@/components/user';
import { ImagePreview, VideoPreview } from '@/components/media';
import { formatTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAuthStore();
  const isSent = message.senderId === user?.id;

  const renderContent = () => {
    switch (message.type) {
      case MessageType.TEXT:
        return (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );

      case MessageType.IMAGE:
        return (
          <div className="relative overflow-hidden rounded-xl">
            <ImagePreview
              src={message.content}
              alt="Shared image"
              className="max-w-xs sm:max-w-sm hover:scale-105 transition-transform duration-300"
            />
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="relative overflow-hidden rounded-xl">
            <VideoPreview
              src={message.content}
              className="max-w-xs sm:max-w-sm"
            />
          </div>
        );

      case MessageType.FILE:
        return (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-[var(--background-tertiary)] rounded-xl hover:bg-[var(--background-hover)] transition-all duration-200 group hover-lift"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center group-hover:bg-[var(--accent-primary)]/20 transition-colors">
              <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium block truncate">Download File</span>
              <span className="text-xs text-[var(--text-muted)]">Click to open</span>
            </div>
            <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  const renderStatus = () => {
    if (!isSent) return null;

    const statusClasses = "w-4 h-4 transition-all";

    switch (message.status) {
      case MessageStatus.SENDING:
        return (
          <svg className={cn(statusClasses, "animate-spin opacity-60")} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case MessageStatus.SENT:
        return (
          <svg className={cn(statusClasses, "opacity-60")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        );
      case MessageStatus.DELIVERED:
        return (
          <svg className={cn(statusClasses, "opacity-70")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 13l4 4L26 7" />
          </svg>
        );
      case MessageStatus.READ:
        return (
          <svg className={cn(statusClasses, "text-blue-400")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 13l4 4L26 7" />
          </svg>
        );
      case MessageStatus.FAILED:
        return (
          <svg className={cn(statusClasses, "text-[var(--danger)]")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2 mb-3 px-3 sm:px-4 animate-fade-in-up',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar for received messages */}
      {!isSent && message.sender && (
        <UserAvatar user={message.sender} size="sm" className="flex-shrink-0 mb-1" />
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          'relative max-w-[80%] sm:max-w-[70%] md:max-w-[65%] rounded-2xl px-4 py-3 transition-all duration-200',
          isSent
            ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-br-md shadow-lg shadow-[var(--accent-primary)]/20'
            : 'bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-bl-md shadow-md'
        )}
      >
        {/* Sender name for group chats */}
        {!isSent && message.sender && (
          <p className="text-xs font-semibold text-[var(--accent-primary)] mb-1.5">
            {message.sender.name}
          </p>
        )}

        {/* Message content */}
        <div className="w-full overflow-hidden">
          {renderContent()}
        </div>

        {/* Message footer */}
        <div
          className={cn(
            'flex items-center gap-2 mt-2',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[11px] font-medium',
              isSent ? 'text-white/70' : 'text-[var(--text-muted)]'
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          <span className={isSent ? 'text-white/80' : 'text-[var(--text-muted)]'}>
            {renderStatus()}
          </span>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 -mb-1">
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                className="flex items-center gap-1 px-2.5 py-1 bg-[var(--background-primary)]/80 backdrop-blur-sm rounded-full text-xs hover:scale-110 transition-transform shadow-sm"
              >
                <span className="text-sm">{reaction.emoji}</span>
                <span className="text-[var(--text-muted)] font-medium">1</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer for sent messages */}
      {isSent && <div className="w-8 flex-shrink-0" />}
    </div>
  );
};
