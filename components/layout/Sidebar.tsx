'use client';

import React, { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { ChatList } from '@/components/chat/ChatList';
import { CallList } from '@/components/chat/CallList';
import { useUIStore, useChatStore, useCategoryStore } from '@/store';
import { UserPanel } from './UserPanel';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { NewGroupModal } from '@/components/chat/NewGroupModal';

export const Sidebar: React.FC = () => {
  const { isMobile, setSidebarOpen, openModal } = useUIStore();
  const { activeChat } = useChatStore();
  const { activeCategory } = useCategoryStore();

  return (
    <div className="h-full flex flex-col bg-[var(--background-secondary)]">
      {/* Header with actions */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight text-[var(--text-primary)]">Chat</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => openModal('createChat')}
            className="p-2 text-gray-400 hover:text-[#7c5dfa] hover:bg-[#7c5dfa]/5 rounded-md transition-all"
            title="New Chat"
          >
            <UserPlus size={20} />
          </button>
          <button
            onClick={() => openModal('createGroup')}
            className="p-2 text-gray-400 hover:text-[#7c5dfa] hover:bg-[#7c5dfa]/5 rounded-md transition-all"
            title="Create Group"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
        {activeCategory === 'calls' ? (
          <CallList />
        ) : (
          <ChatList />
        )}
      </div>

      {/* User Panel */}
      <UserPanel />
    </div>
  );
};
