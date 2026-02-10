'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore, useUserStore, useUIStore, useAuthStore } from '@/store';
import { UserAvatar } from '@/components/user';
import { UserPlus, X, Trash2 } from 'lucide-react';
import { AddMemberModal } from './AddMemberModal';

interface GroupInfoPanelProps {
    chatId: string;
    className?: string;
}

export const GroupInfoPanel: React.FC<GroupInfoPanelProps> = ({ chatId, className }) => {
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { activeChat, messages, removeMember } = useChatStore();
    const { onlineUsers } = useUserStore();
    const { toggleGroupInfoPanel } = useUIStore();
    const { user: currentUser } = useAuthStore();

    if (!activeChat || activeChat.id !== chatId) return null;

    // Filter media from messages
    const chatMessages = messages[chatId] || [];
    const photos = chatMessages.filter(m => m.type === 'IMAGE').map(m => m.content);
    const videos = chatMessages.filter(m => m.type === 'VIDEO').length;
    const files = chatMessages.filter(m => m.type === 'FILE').length;
    const audioFiles = chatMessages.filter(m => m.type === 'AUDIO').length;

    const members = activeChat.users || [];

    return (
        <div className={cn("h-full w-full flex flex-col bg-[var(--background-secondary)] border-l border-[var(--border-color)]", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--divider-color)]">
                <h2 className="text-lg font-light tracking-tight text-[var(--text-primary)]">Group Info</h2>
                <button
                    onClick={toggleGroupInfoPanel}
                    className="p-2 rounded-md hover:bg-[var(--background-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Content Section */}
                <div className="p-6 border-b border-[var(--divider-color)]">
                    <h3 className="text-xs font-light tracking-tight text-[var(--text-muted)] uppercase tracking-wider mb-4">Content</h3>

                    {/* Media Grid - Photos */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowAllPhotos(!showAllPhotos)}
                            className="flex items-center justify-between w-full text-left group"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-light tracking-tight text-[var(--text-secondary)]">{photos.length} photos</span>
                            </div>
                            <svg
                                className={cn(
                                    "w-4 h-4 text-[var(--text-muted)] transition-transform",
                                    showAllPhotos && "rotate-180"
                                )}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showAllPhotos && photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {photos.slice(0, 6).map((photo, idx) => (
                                    <div
                                        key={idx}
                                        className="aspect-square rounded-md overflow-hidden bg-[var(--background-primary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer"
                                    >
                                        <img src={photo} alt="" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {showAllPhotos && photos.length === 0 && (
                            <p className="text-xs text-[var(--text-muted)] mt-2 italic text-center py-2">No photos shared yet</p>
                        )}
                    </div>

                    {/* Videos */}
                    <MediaItem
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        }
                        count={videos}
                        label="videos"
                    />

                    {/* Files */}
                    <MediaItem
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                        count={files}
                        label="files"
                    />

                    {/* Audio Files */}
                    <MediaItem
                        icon={
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                        }
                        count={audioFiles}
                        label="audio files"
                    />
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-light tracking-tight text-[var(--text-primary)]">{members.length} members</h3>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="p-1 rounded-md hover:bg-[var(--accent-soft)] text-[var(--accent-primary)] transition-all hover:scale-110"
                                title="Add member"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAllMembers(!showAllMembers)}
                            className="p-1 px-2 rounded-md hover:bg-[var(--background-hover)] text-[var(--accent-primary)] text-xs font-light tracking-tight transition-colors"
                        >
                            {showAllMembers ? 'Show Less' : 'See All'}
                        </button>
                    </div>

                    <div className={cn(
                        "space-y-4 transition-all overflow-hidden",
                        !showAllMembers && "max-h-[300px]"
                    )}>
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 group/member">
                                <UserAvatar
                                    user={member}
                                    size="md"
                                    showStatus
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-light tracking-tight text-[var(--text-primary)] truncate">{member.name}</div>
                                    <div className="text-[11px] text-[var(--text-muted)] font-light tracking-tight">
                                        {onlineUsers.has(member.id) ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                                {member.id !== currentUser?.id && (
                                    <button
                                        onClick={() => removeMember(chatId, member.id)}
                                        className="opacity-0 group-hover/member:opacity-100 p-1.5 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                                        title="Remove member"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                chatId={chatId}
                existingMemberIds={members.map(m => m.id)}
            />
        </div>
    );
};

// Helper Component for Media Items
const MediaItem: React.FC<{ icon: React.ReactNode; count: number; label: string }> = ({ icon, count, label }) => (
    <button className="flex items-center justify-between w-full text-left group py-2.5 px-0 hover:bg-[var(--background-hover)] rounded-md transition-colors">
        <div className="flex items-center gap-3">
            <div className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors">
                {icon}
            </div>
            <span className="text-sm font-light tracking-tight text-[var(--text-secondary)]">{count} {label}</span>
        </div>
        <svg className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all transform translate-x-[-4px] group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </button>
);
