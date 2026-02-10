'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button } from '@/components/ui';
import { UserAvatar } from '@/components/user';
import { useChatStore, useUserStore } from '@/store';
import { User } from '@/types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { createChat } = useChatStore();
  const { searchUsers, searchUsersByEmail, isLoading } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError('');

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search by phone if it looks like a phone number, otherwise search by email
      const isPhone = /^\d+$/.test(query.trim());
      const results = isPhone
        ? await searchUsers(query.trim())
        : await searchUsersByEmail(query.trim());

      setSearchResults(results || []);
    } catch (err) {
      setError('Failed to search users');
      setSearchResults([]);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedUser) return;

    setIsCreating(true);
    setError('');

    try {
      // Check if a chat already exists with this user
      const { chats } = useChatStore.getState();
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.users?.some((u) => u.id === selectedUser.id)
      );

      if (existingChat) {
        // Navigate to existing chat instead of creating a new one
        handleClose();
        router.push(`/chats/${existingChat.id}`);
        return;
      }

      // Create new chat if none exists
      const chat = await createChat([selectedUser.id], undefined, false);

      // Close modal and navigate to chat
      handleClose();
      router.push(`/chats/${chat.id}`);
    } catch (err) {
      setError('Failed to create chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Chat"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="px-2">
          <label className="block text-[10px] font-light text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
            Find Someone
          </label>
          <div className="relative group">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Enter phone or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[var(--background-secondary)] rounded-md border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none text-[var(--text-primary)] font-light tracking-tight placeholder:text-[var(--text-muted)] transition-all"
              disabled={isLoading || isCreating}
            />
          </div>
        </div>

        {/* Selected User Card */}
        {selectedUser && (
          <div className="px-2">
            <div className="bg-[var(--background-tertiary)] p-5 rounded-md border border-[var(--accent-primary)]/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar user={selectedUser} size="mdl" />
                  <div className="min-w-0">
                    <p className="font-light tracking-tight text-[var(--text-primary)] text-lg">
                      {selectedUser.name || 'Unknown'}
                    </p>
                    <p className="text-sm font-light tracking-tight text-[var(--text-muted)]">
                      {selectedUser.phone || selectedUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-10 h-10 flex items-center justify-center bg-[var(--background-modal)] rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-all hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {!selectedUser && searchResults.length > 0 && (
          <div className="px-2">
            <div className="bg-[var(--background-modal)] rounded-md overflow-hidden border border-[var(--border-color)] divide-y divide-[var(--divider-color)]">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-4 p-5 hover:bg-[var(--background-hover)] transition-all text-left group"
                >
                  <UserAvatar user={user} size="mdl" />
                  <div className="flex-1 min-w-0">
                    <p className="font-light tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                      {user.name || 'Unknown'}
                    </p>
                    <p className="text-sm font-light tracking-tight text-[var(--text-muted)] truncate">
                      {user.phone || user.email}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-md bg-[var(--background-secondary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-primary)] transition-all opacity-0 group-hover:opacity-100 border border-[var(--border-color)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!selectedUser && searchQuery && !isLoading && searchResults.length === 0 && (
          <div className="text-center py-4 text-[var(--text-muted)] text-sm">
            No users found
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Modern Action Buttons */}
        <div className="flex items-center gap-4 pt-4 px-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1 py-4 rounded-md font-light tracking-tight"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateChat}
            disabled={!selectedUser || isCreating}
            className="flex-[2] py-4 rounded-md font-light tracking-tight shadow-glow"
          >
            {isCreating ? 'Creating...' : 'Start Conversation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
