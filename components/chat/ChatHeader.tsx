'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { FaVideo, FaSearch } from 'react-icons/fa';
import { MdCall, MdClose } from 'react-icons/md';
import { Chat } from '@/types';
import { useUIStore, useAuthStore, useUserStore, useCallStore, useChatStore } from '@/store';
import { InviteModal } from './InviteModal';
import { cn } from '@/lib/utils';
import { initiateCall } from '@/lib/socket';

interface ChatHeaderProps {
  chat: Chat | null;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const router = useRouter();
  const { isMobile, setSidebarOpen, groupInfoPanelOpen, toggleGroupInfoPanel } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const { setOutgoingCall } = useCallStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // For 1-on-1 chats, find the OTHER user (not the current user)
  const otherUser = useMemo(() => {
    if (chat?.isGroup) return null;
    return chat?.users?.find(u => u.id !== currentUser?.id) || null;
  }, [chat?.isGroup, chat?.users, currentUser?.id]);

  const otherUserId = otherUser?.id;

  // Use stable selector with primitive dependency
  const onlineStatus = useUserStore(
    useCallback((state) => otherUserId ? state.onlineUsers.has(otherUserId) : false, [otherUserId])
  );

  const displayName = chat?.name || otherUser?.name || 'Unknown';

  const { searchQuery, setSearchQuery } = useChatStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (!chat) return null;

  const handleVideoCall = () => {
    initiateCall(chat.id, true);
    setOutgoingCall({ chatId: chat.id, isVideoCall: true, status: 'ringing' });
  };

  const handleAudioCall = () => {
    initiateCall(chat.id, false);
    setOutgoingCall({ chatId: chat.id, isVideoCall: false, status: 'ringing' });
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) setSearchQuery('');
  };

  return (
    <>
      <header className="h-[64px] md:h-[72px] flex items-center justify-between px-4 md:px-6 bg-[var(--background-secondary)] border-b border-[var(--border-color)] sticky top-0 z-[var(--z-header)]">
        {/* Left Section - Mobile Menu + Chat Info */}
        {!isSearchOpen ? (
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1 mr-2">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 -ml-1 rounded-md hover:bg-[var(--background-hover)] text-[var(--text-primary)] transition-colors flex-shrink-0"
                aria-label="Open sidebar"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Chat Info */}
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg md:text-xl font-light tracking-tight text-[var(--text-primary)] truncate">{displayName}</h2>
              <p className="text-[12px] md:text-sm font-light tracking-tight text-[var(--text-secondary)] truncate">
                {chat.isGroup ? (
                  <>
                    {chat.users?.length || 0} members, {
                      chat.users?.filter(u => useUserStore.getState().onlineUsers.has(u.id)).length || 0
                    } online
                  </>
                ) : (
                  onlineStatus ? 'Online' : 'Offline'
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 mr-4 bg-[var(--background-primary)] bg-opacity-50 rounded-full px-4 py-1.5 border border-[var(--border-color)]">
            <FaSearch className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..."
              className="bg-transparent border-none focus:outline-none text-sm w-full text-[var(--text-primary)]"
            />
            <button
              onClick={toggleSearch}
              className="p-1 hover:bg-[var(--background-hover)] rounded-full transition-colors"
            >
              <MdClose className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        )}

        {/* Right Section - Action Buttons */}
        {!isSearchOpen && (
          <div className="flex items-center space-x-4 md:space-x-6 text-gray-400 flex-shrink-0">
            <button
              onClick={toggleSearch}
              className="cursor-pointer hover:text-[var(--accent-primary)] transition-colors p-1"
              aria-label="Search"
              title="Search messages"
            >
              <FaSearch className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={handleVideoCall}
              className="cursor-pointer hover:text-[var(--accent-primary)] transition-colors p-1"
              aria-label="Video call"
              title="Start video call"
            >
              <FaVideo className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
            </button>

            <button
              onClick={handleAudioCall}
              className="cursor-pointer hover:text-[var(--accent-primary)] transition-colors p-1"
              aria-label="Audio call"
              title="Start voice call"
            >
              <MdCall className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            {chat.isGroup && (
              <button
                onClick={toggleGroupInfoPanel}
                className={cn(
                  "cursor-pointer transition-colors p-1",
                  groupInfoPanelOpen ? "text-[var(--accent-primary)]" : "hover:text-gray-600"
                )}
                aria-label="Group info"
              >
                <svg className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Invite Modal */}
      {chat.isGroup && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          chatId={chat.id}
          chatName={chat.name}
        />
      )}
    </>
  );
};
