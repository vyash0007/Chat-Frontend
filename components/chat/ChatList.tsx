'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatListItem, ChatListItemSkeleton } from './ChatListItem';
import { useChatStore, useUIStore, useAuthStore, useCategoryStore } from '@/store';
import { Input } from '@/components/ui';

export const ChatList: React.FC = () => {
  const { chatId } = useParams();
  const { chats, fetchChats, typingUsers, isLoading } = useChatStore();
  const { openModal } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { activeCategory } = useCategoryStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const filteredChats = chats.filter(chat => {
    // Archive Filtering
    if (activeCategory === 'archive') {
      if (!chat.isArchived) return false;
    } else {
      if (chat.isArchived) return false;
    }

    // Category Filtering
    if (activeCategory === 'friends' && chat.isGroup) return false;
    if (activeCategory === 'work' && !chat.isGroup) return false;

    // Search Filtering
    const otherUser = chat.isGroup
      ? null
      : chat.users?.find(u => u.id !== currentUser?.id);
    const chatName = chat.name || otherUser?.name || '';
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar - Modern rounded style */}
      <div className="px-6 py-2">
        <div className="relative group flex items-center bg-[var(--background-primary)] rounded-md border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-all px-4 py-3 shadow-sm hover:shadow-md">
          <svg className="w-5 h-5 text-[var(--text-muted)] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent w-full outline-none border-none ring-0 focus:ring-0 text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto mt-2 custom-scrollbar" role="navigation">
        {isLoading && chats.length === 0 ? (
          <div className="px-3 space-y-1">
            {[...Array(6)].map((_, i) => (
              <ChatListItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-[var(--text-secondary)] font-medium">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="px-3 pb-6 space-y-1" role="list">
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
    </div>
  );
};
