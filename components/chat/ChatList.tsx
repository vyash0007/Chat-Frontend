'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatListItem } from './ChatListItem';
import { useChatStore, useUIStore } from '@/store';
import { Input } from '@/components/ui';

export const ChatList: React.FC = () => {
  const { chatId } = useParams();
  const { chats, fetchChats, typingUsers } = useChatStore();
  const { openModal } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter(chat => {
    const chatName = chat.name || chat.users[0]?.name || '';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-[var(--divider-color)]">
        <Input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto" role="navigation" aria-label="Conversation list">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <svg
              className="w-16 h-16 text-[var(--text-muted)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-[var(--text-secondary)] font-medium" role="status">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {searchQuery
                ? 'Try a different search term'
                : 'Start a new chat to begin messaging'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1" role="list" aria-label="Chats">
            {filteredChats.map(chat => {
              const isTyping = typingUsers.some(t => t.chatId === chat.id);
              return (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === chatId}
                  isTyping={isTyping}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-[var(--divider-color)]">
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
          onClick={() => openModal('createChat')}
          aria-label="Create new conversation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Chat</span>
        </button>
      </div>
    </div>
  );
};
