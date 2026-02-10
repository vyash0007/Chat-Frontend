'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { UserAvatar } from '@/components/user';
import { useChatStore, useUserStore } from '@/store';
import { User } from '@/types';
import { Plus, X } from 'lucide-react';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId: string;
    existingMemberIds: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    chatId,
    existingMemberIds,
}) => {
    const { addMembers } = useChatStore();
    const { searchUsers, searchUsersByEmail, isLoading } = useUserStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setError('');

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const isPhone = /^\d+$/.test(query.trim());
            const results = isPhone
                ? await searchUsers(query.trim())
                : await searchUsersByEmail(query.trim());

            // Filter out existing members and already selected users
            const filteredResults = (results || []).filter(
                (user) =>
                    !existingMemberIds.includes(user.id) &&
                    !selectedUsers.some((selected) => selected.id === user.id)
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

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;

        setIsSubmitting(true);
        setError('');

        try {
            const userIds = selectedUsers.map((u) => u.id);
            await addMembers(chatId, userIds);
            handleClose();
        } catch (err) {
            setError('Failed to add members. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
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
            title="Add Members"
        >
            <div className="space-y-4">
                <div className="px-2">
                    <label className="block text-[10px] font-light text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
                        Find People
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
                            disabled={isLoading || isSubmitting}
                        />
                    </div>
                </div>

                {/* Selected Members */}
                {selectedUsers.length > 0 && (
                    <div className="px-2">
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                            {selectedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-[var(--background-tertiary)] pl-1.5 pr-3 py-1.5 rounded-md border border-[var(--border-color)] flex items-center gap-2 animate-scale-in"
                                >
                                    <UserAvatar user={user} size="sm" />
                                    <span className="text-xs font-light tracking-tight text-[var(--text-primary)]">
                                        {user.name?.split(' ')[0] || 'Unknown'}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveUser(user.id)}
                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="px-2">
                        <div className="bg-[var(--background-modal)] rounded-md overflow-hidden border border-[var(--border-color)] divide-y divide-[var(--divider-color)] max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddUser(user)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-[var(--background-hover)] transition-all text-left group"
                                >
                                    <UserAvatar user={user} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-light tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                            {user.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs font-light tracking-tight text-[var(--text-muted)] truncate">
                                            {user.phone || user.email}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-md bg-[var(--background-secondary)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-primary)] transition-all opacity-0 group-hover:opacity-100 border border-[var(--border-color)]">
                                        <Plus size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md text-sm mx-2">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4 px-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 py-4 rounded-md font-light tracking-tight"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAddMembers}
                        disabled={selectedUsers.length === 0 || isSubmitting}
                        className="flex-[2] py-4 rounded-md font-light tracking-tight"
                    >
                        {isSubmitting ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
