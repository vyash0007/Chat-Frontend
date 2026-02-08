'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button } from '@/components/ui';
import { useChatStore, useUserStore } from '@/store';
import { User } from '@/types';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { createChat } = useChatStore();
  const { searchUsers, searchUsersByEmail, isLoading } = useUserStore();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
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

      // Filter out already selected users
      const filteredResults = (results || []).filter(
        (user) => !selectedUsers.some((selected) => selected.id === user.id)
      );

      setSearchResults(filteredResults);
    } catch (err) {
      setError('Failed to search users');
      setSearchResults([]);
    }
  };

  const handleAddUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((u) => u.id !== user.id));
    setSearchQuery('');
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please add at least one member');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const userIds = selectedUsers.map((u) => u.id);
      const chat = await createChat(userIds, groupName.trim(), true);

      // Close modal and navigate to chat
      handleClose();
      router.push(`/chats/${chat.id}`);
    } catch (err) {
      setError('Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Group Chat"
    >
      <div className="space-y-4">
        {/* Group Name Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Group Name
          </label>
          <Input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            disabled={isCreating}
            required
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Add Members
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

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Members ({selectedUsers.length})
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[var(--background-hover)] p-2 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white text-sm font-semibold flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {user.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {user.phone || user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="p-1 hover:bg-[var(--background-secondary)] rounded transition-colors"
                    disabled={isCreating}
                  >
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-[var(--divider-color)] rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleAddUser(user)}
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
                <svg className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchQuery && !isLoading && searchResults.length === 0 && (
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
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
