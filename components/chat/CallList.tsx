'use client';

import React, { useState, useEffect } from 'react';
import { CallListItem } from './CallListItem';
import { useCallStore, useAuthStore } from '@/store';
import { Phone, Search } from 'lucide-react';

export const CallList: React.FC = () => {
    const { callHistory, fetchHistory } = useCallStore();
    const { token, user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (token && user?.id) {
            fetchHistory(token, user.id);
        }
    }, [token, user?.id, fetchHistory]);

    const filteredHistory = callHistory.filter(item =>
        item.targetName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="px-6 py-2">
                <div className="relative group flex items-center bg-[var(--background-primary)] rounded-md border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-all px-4 py-3 shadow-sm hover:shadow-md">
                    <Search className="w-5 h-5 text-[var(--text-muted)] mr-3" />
                    <input
                        type="text"
                        placeholder="Search call history"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent w-full outline-none border-none ring-0 focus:ring-0 text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-muted)]"
                    />
                </div>
            </div>

            {/* Call History List */}
            <div className="flex-1 overflow-y-auto mt-2 custom-scrollbar">
                {filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center opacity-40">
                        <Phone size={48} className="mb-4 text-[var(--text-muted)]" strokeWidth={1} />
                        <p className="text-[var(--text-secondary)] font-light tracking-tight">
                            {searchQuery ? 'No such call found' : 'No call history yet'}
                        </p>
                    </div>
                ) : (
                    <div className="px-3 pb-6 space-y-1">
                        {filteredHistory.map(item => (
                            <CallListItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
