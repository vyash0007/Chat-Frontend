'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface MessageReactionProps {
    messageId: string;
    existingReactions?: { emoji: string; count: number; users: string[] }[];
    currentUserId: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageReactions: React.FC<MessageReactionProps> = ({
    messageId,
    existingReactions = [],
    currentUserId,
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const [reactions, setReactions] = useState(existingReactions);

    const handleAddReaction = (emoji: string) => {
        // Check if reaction already exists
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
            // Check if current user already reacted with this emoji
            const hasReacted = reactions[existingIdx].users.includes(currentUserId);

            if (hasReacted) {
                // Remove reaction
                const newReactions = [...reactions];
                newReactions[existingIdx].count--;
                newReactions[existingIdx].users = newReactions[existingIdx].users.filter(
                    (id) => id !== currentUserId
                );

                // Remove emoji if count is 0
                if (newReactions[existingIdx].count === 0) {
                    newReactions.splice(existingIdx, 1);
                }

                setReactions(newReactions);
            } else {
                // Add reaction
                const newReactions = [...reactions];
                newReactions[existingIdx].count++;
                newReactions[existingIdx].users.push(currentUserId);
                setReactions(newReactions);
            }
        } else {
            // New reaction
            setReactions([
                ...reactions,
                { emoji, count: 1, users: [currentUserId] },
            ]);
        }

        setShowPicker(false);

        // TODO: Emit socket event to sync reactions
        // socket.emit('addReaction', { messageId, emoji });
    };

    const hasUserReacted = (emoji: string) => {
        const reaction = reactions.find((r) => r.emoji === emoji);
        return reaction?.users.includes(currentUserId) || false;
    };

    return (
        <div className="flex items-center gap-2 mt-1">
            {/* Existing Reactions */}
            {reactions.map((reaction, idx) => (
                <button
                    key={idx}
                    onClick={() => handleAddReaction(reaction.emoji)}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                        hasUserReacted(reaction.emoji)
                            ? "bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                    )}
                >
                    <span>{reaction.emoji}</span>
                    <span className={cn(
                        "font-semibold",
                        hasUserReacted(reaction.emoji) ? "text-[var(--accent-primary)]" : "text-white/60"
                    )}>
                        {reaction.count}
                    </span>
                </button>
            ))}

            {/* Add Reaction Button */}
            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-white/60 hover:text-white"
                    title="Add reaction"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Reaction Picker */}
                {showPicker && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowPicker(false)}
                        />
                        <div className="absolute bottom-full left-0 mb-2 z-20 bg-[#1a1a23]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-1">
                            {QUICK_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(emoji)}
                                    className="w-10 h-10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center text-xl hover:scale-110"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
