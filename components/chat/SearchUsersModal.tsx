'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button } from '@/components/ui';
import { useUserStore, useChatStore, useUIStore } from '@/store';
import { User } from '@/types';

export const SearchUsersModal: React.FC = () => {
  const router = useRouter();
  const { currentModal, closeModal } = useUIStore();
  const { searchUsers } = useUserStore();
  const { createChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isOpen = currentModal === 'createChat';

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateChat = async (otherUserId: string) => {
    setIsCreating(true);
    try {
      const chat = await createChat([otherUserId]);
      closeModal();
      setSearchQuery('');
      setSearchResults([]);
      router.push(`/chats/${chat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    closeModal();
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Chat"
      size="md"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter phone number (e.g., +1234567890)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1"
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
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            variant="primary"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        <div className="mt-4">
          {searchResults.length === 0 && !isSearching && searchQuery && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              No users found
            </div>
          )}

          {isSearching && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[var(--divider-color)] hover:bg-[var(--background-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-medium">
                          {(user.name || user.phone || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {user.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {user.phone}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Start Chat Button */}
                  <Button
                    onClick={() => handleCreateChat(user.id)}
                    disabled={isCreating}
                    variant="primary"
                    size="sm"
                  >
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
