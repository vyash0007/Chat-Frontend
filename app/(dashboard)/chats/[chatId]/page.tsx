'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChatHeader, MessageBubble, MessageInput, GroupInfoPanel } from '@/components/chat';
import { WelcomeScreen } from '@/components/dashboard/WelcomeScreen';
import { CallInterface } from '@/components/call';
import { useChatStore, useUIStore, useCallStore } from '@/store';
import { joinChat, leaveChat } from '@/lib/socket';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { chatId } = useParams();
  const { activeChat, messages, fetchMessages, setActiveChat, searchQuery } = useChatStore();
  const { groupInfoPanelOpen } = useUIStore();
  const { incomingCall, outgoingCall, endCall } = useCallStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const chatMessages = useMemo(() => {
    const allMessages = chatId ? messages[chatId as string] || [] : [];
    if (!searchQuery) return allMessages;

    console.log('🔍 Filtering messages for query:', searchQuery);
    return allMessages.filter(m =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatId, messages, searchQuery]);

  // Check if there's an active call for this chat
  const isInCall = (incomingCall?.chatId === chatId) ||
    (outgoingCall?.chatId === chatId && (outgoingCall?.status === 'accepted' || outgoingCall?.status === 'ringing'));
  const isVideoCall = incomingCall?.isVideoCall || outgoingCall?.isVideoCall;

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
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 flex overflow-hidden" role="main" aria-label="Chat conversation">
      {isInCall ? (
        <CallInterface
          isVideoCall={isVideoCall || false}
          onBack={() => endCall()}
        />
      ) : (
        <>
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background-primary)]">
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

          {/* Group Info Panel - Only for group chats */}
          {activeChat?.isGroup && (
            <div
              className={cn(
                "transition-all duration-300 overflow-hidden",
                groupInfoPanelOpen ? "w-80" : "w-0"
              )}
            >
              <GroupInfoPanel chatId={chatId as string} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
