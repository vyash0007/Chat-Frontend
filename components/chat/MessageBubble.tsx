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
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );

      case MessageType.IMAGE:
        return (
          <ImagePreview
            src={message.content}
            alt="Shared image"
            className="max-w-sm"
          />
        );

      case MessageType.VIDEO:
        return (
          <VideoPreview
            src={message.content}
            className="max-w-sm"
          />
        );

      case MessageType.FILE:
        return (
          <a
            href={message.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-[var(--background-hover)] rounded-lg hover:bg-[var(--background-active)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Download File</span>
          </a>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  const renderStatus = () => {
    if (!isSent) return null;

    switch (message.status) {
      case MessageStatus.SENDING:
        return (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case MessageStatus.SENT:
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case MessageStatus.DELIVERED:
      case MessageStatus.READ:
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13l4 4L23 7" />
          </svg>
        );
      case MessageStatus.FAILED:
        return (
           <svg className="w-3 h-3 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        'flex items-end gap-2 mb-3',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar for received messages */}
      {!isSent && message.sender && (
        <UserAvatar user={message.sender} size="sm" />
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
          isSent
            ? 'bg-[var(--accent-primary)] text-white rounded-tr-sm'
            : 'bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-tl-sm'
        )}
      >
        {/* Sender name for group chats */}
        {!isSent && message.sender && (
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">
            {message.sender.name}
          </p>
        )}

        {/* Message content */}
        {renderContent()}

        {/* Message footer */}
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-xs',
              isSent ? 'text-white/70' : 'text-[var(--text-muted)]'
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          <span className={isSent ? 'text-white/70' : 'text-[var(--text-muted)]'}>
            {renderStatus()}
          </span>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <button
                key={index}
                className="flex items-center gap-1 px-2 py-0.5 bg-[var(--background-hover)] rounded-full text-xs hover:bg-[var(--background-active)] transition-colors"
              >
                <span>{reaction.emoji}</span>
                <span className="text-[var(--text-muted)]">
                  {/* Count would go here */}1
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer for sent messages to maintain alignment */}
      {isSent && <div className="w-8" />}
    </div>
  );
};
