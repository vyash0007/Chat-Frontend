'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Input, Button } from '@/components/ui';
import { UserAvatar } from '@/components/user';
import { useChatStore, useUserStore } from '@/store';
import { User } from '@/types';
import { Plus } from 'lucide-react';

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
        {/* Inputs Group */}
        <div className="space-y-6 px-2">
          <div>
            <label className="block text-[10px] font-light text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
              Group Identity
            </label>
            <input
              type="text"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-6 py-4 bg-[var(--background-secondary)] rounded-md border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none text-[var(--text-primary)] font-light tracking-tight placeholder:text-[var(--text-muted)] transition-all text-lg shadow-inner"
              disabled={isCreating}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-light text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
              Add Members
            </label>
            <div className="relative group">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by phone or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-[var(--background-secondary)] rounded-md border border-[var(--border-color)] focus:border-[var(--accent-primary)] outline-none text-[var(--text-primary)] font-light tracking-tight placeholder:text-[var(--text-muted)] transition-all"
                disabled={isLoading || isCreating}
              />
            </div>
          </div>
        </div>

        {/* Selected Members Cards */}
        {selectedUsers.length > 0 && (
          <div className="px-2">
            <label className="block text-[10px] font-light text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
              Members ({selectedUsers.length})
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[var(--background-tertiary)] pl-2 pr-4 py-2 rounded-md border border-[var(--border-color)] flex items-center gap-2 group animate-scale-in"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="text-sm font-light tracking-tight text-[var(--text-primary)]">
                    {user.name?.split(' ')[0] || 'Unknown'}
                  </span>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-red-500 transition-all"
                    disabled={isCreating}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        {searchResults.length > 0 && (
          <div className="px-2">
            <div className="bg-[var(--background-modal)] rounded-md overflow-hidden border border-[var(--border-color)] divide-y divide-[var(--divider-color)]">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddUser(user)}
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
                    <Plus size={20} />
                  </div>
                </button>
              ))}
            </div>
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
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isCreating}
            className="flex-[2] py-4 rounded-md font-light tracking-tight shadow-glow"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
