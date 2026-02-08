'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button } from '@/components/ui';
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
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Search User
          </label>
          <Input
            type="text"
            placeholder="Search by phone or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isLoading || isCreating}
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Enter phone number or email address
          </p>
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="bg-[var(--background-hover)] p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center">
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {selectedUser.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedUser.phone || selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-[var(--background-secondary)] rounded transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!selectedUser && searchResults.length > 0 && (
          <div className="border border-[var(--divider-color)] rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUser(user);
                  setSearchResults([]);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--background-hover)] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">
                    {user.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {user.phone || user.email}
                  </p>
                </div>
              </button>
            ))}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateChat}
            disabled={!selectedUser || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Chat'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
