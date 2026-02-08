'use client';

import React, { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ChatHeader, MessageBubble, MessageInput } from '@/components/chat';
import { useChatStore } from '@/store';
import { useSocket } from '@/hooks';

export default function ChatPage() {
  const { chatId } = useParams();
  const { activeChat, messages, fetchMessages, setActiveChat } = useChatStore();
  const { joinChat, leaveChat } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const chatMessages = chatId ? messages[chatId as string] || [] : [];

  useEffect(() => {
    if (chatId) {
      setActiveChat(chatId as string);
      fetchMessages(chatId as string);
      joinChat(chatId as string);

      return () => {
        leaveChat(chatId as string);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length]);

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--background-primary)]">
        <div className="text-center px-4">
          <svg
            className="w-24 h-24 text-[var(--text-muted)] mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Welcome to Chat App
          </h2>
          <p className="text-[var(--text-secondary)]">
            Select a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" role="main" aria-label="Chat conversation">
      {/* Header */}
      <ChatHeader chat={activeChat} />

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-[var(--background-primary)]"
        role="log"
        aria-label="Message history"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" role="status" aria-live="polite">
              <p className="text-[var(--text-muted)]">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </>
        )}
      </div>

      {/* Message Input */}
      {chatId && <MessageInput chatId={chatId as string} />}
    </div>
  );
}
