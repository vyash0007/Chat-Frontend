'use client';

import React, { useEffect } from 'react';
import { Message, MessageType, MessageStatus } from '@/types';
import { UserAvatar } from '@/components/user';
import { ImagePreview, VideoPreview } from '@/components/media';
import { formatTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { emitMarkRead } from '@/lib/socket';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { user } = useAuthStore();
  const isSent = message.senderId === user?.id;

  useEffect(() => {
    // Only mark as read if it's not our own message and not already read
    if (!isSent && message.status !== MessageStatus.READ) {
      emitMarkRead(message.chatId, message.id);
    }
  }, [isSent, message.id, message.chatId, message.status]);


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
          <div className="relative overflow-hidden rounded-md">
            <ImagePreview
              src={message.content}
              alt="Shared image"
              className="max-w-xs sm:max-w-sm"
            />
          </div>
        );

      case MessageType.VIDEO:
        return (
          <div className="relative overflow-hidden rounded-md">
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
            className="flex items-center gap-3 p-3 bg-[#2d2d3a] rounded-md hover:bg-[#353545] transition-all duration-200 group hover-lift"
          >
            <div className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold block truncate text-white">Download File</span>
              <span className="text-xs text-white/50">Click to open</span>
            </div>
            <svg className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        );

      case MessageType.AUDIO:
        return (
          <div className="flex flex-col gap-2 p-2 min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.478 7.478 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z" />
                  <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z" />
                  <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182l-.707.707A3.489 3.489 0 0 1 9.025 8a3.489 3.489 0 0 1-1.025 2.475l.707.707z" />
                  <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z" />
                </svg>
              </div>
              <audio
                src={message.content}
                controls
                className="h-8 w-full filter invert brightness-200"
              />
            </div>
          </div>
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
        'flex items-end gap-2 md:gap-3 mb-2 px-3 md:px-6 animate-fade-in-up',
        isSent ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar for received messages - Rounded Square */}
      {!isSent && message.sender && (
        <UserAvatar
          user={message.sender}
          size="sm"
          className="flex-shrink-0 mb-1 scale-90 md:scale-100 origin-bottom-left"
        />
      )}

      {/* Message Bubble */}
      <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]">
        {/* Sender name for group chats */}
        {!isSent && message.sender && (
          <span className="text-xs font-light tracking-tight text-[var(--text-secondary)] ml-1">
            {message.sender.name}
          </span>
        )}

        <div
          className={cn(
            'relative transition-all duration-200 shadow-sm overflow-hidden',
            (message.type === MessageType.IMAGE || message.type === MessageType.VIDEO) ? 'p-0' : (message.type === MessageType.FILE ? 'p-1' : 'px-3.5 py-2'),
            isSent
              ? 'text-white rounded-md rounded-br-md'
              : 'bg-[var(--message-received-bg)] text-[var(--message-received-text)] rounded-md rounded-bl-md'
          )}
          style={isSent ? { background: 'var(--message-sent-bg)' } : {}}
        >
          {/* Message content */}
          <div className="w-full">
            {renderContent()}
          </div>

          {/* Message footer - Floating relative or below */}
          <div
            className={cn(
              'flex items-center gap-1.5',
              (message.type === MessageType.IMAGE || message.type === MessageType.VIDEO)
                ? 'absolute bottom-2 right-3'
                : 'mt-0.5',
              isSent ? 'justify-end' : 'justify-start'
            )}
          >
            <span className={cn(
              "text-[11px] font-light tracking-tight",
              (isSent || message.type === MessageType.IMAGE || message.type === MessageType.VIDEO) ? "text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]" : "text-[var(--text-muted)]"
            )}>
              {formatTime(message.createdAt)}
            </span>
            {isSent && (
              <span className="shrink-0">
                {renderStatus()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for alignment if no avatar */}
      {isSent && <div className="w-8 flex-shrink-0 lg:hidden" />}
    </div >
  );
};
