'use client';

import React from 'react';
import {
    MessageSquare,
    Briefcase,
    Users,
    FileText,
    Archive,
    User,
    Edit2,
    LogOut,
    Phone
} from 'lucide-react';
import { useAuthStore, useCategoryStore, useChatStore } from '@/store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const SidebarItem = ({
    icon: Icon,
    active,
    badge,
    onClick
}: {
    icon: any;
    active?: boolean;
    badge?: number | string;
    onClick?: () => void;
}) => (
    <button
        onClick={onClick}
        className={cn(
            'relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-4 rounded-sm cursor-pointer transition-all duration-200',
            active
                ? 'bg-[var(--accent-primary)] text-white shadow-glow'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-hover)]'
        )}
    >
        <Icon className="w-5 h-5 md:w-[22px] md:h-[22px]" strokeWidth={1.5} />
        {badge && (
            <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 md:w-5 md:h-5 -mt-1 -mr-1 text-[9px] md:text-[10px] font-light tracking-tighter text-white bg-[var(--danger)] rounded-full border-2 border-[var(--background-primary)]">
                {badge}
            </span>
        )}
    </button>
);

export const PrimarySidebar: React.FC = () => {
    const { activeCategory, setActiveCategory } = useCategoryStore();
    const { logout } = useAuthStore();
    const { chats } = useChatStore();
    const router = useRouter();

    const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="w-full h-full flex flex-col items-center">
            {/* Logo */}
            <div className="mb-4 md:mb-8">
                <div
                    className="w-8 h-8 md:w-10 md:h-10 bg-[var(--accent-primary)]/10 rounded-sm flex items-center justify-center cursor-pointer hover:bg-[var(--accent-primary)]/20 transition-colors"
                    onClick={() => router.push('/chats')}
                >
                    <svg className="text-[var(--accent-primary)] w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                    </svg>
                </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex-1 w-full flex flex-col items-center">
                <SidebarItem
                    icon={MessageSquare}
                    badge={totalUnread > 0 ? totalUnread : undefined}
                    active={activeCategory === 'all'}
                    onClick={() => setActiveCategory('all')}
                />
                <SidebarItem
                    icon={Briefcase}
                    active={activeCategory === 'work'}
                    onClick={() => setActiveCategory('work')}
                />
                <SidebarItem
                    icon={Users}
                    active={activeCategory === 'friends'}
                    onClick={() => setActiveCategory('friends')}
                />
                <SidebarItem
                    icon={Phone}
                    active={activeCategory === 'calls'}
                    onClick={() => setActiveCategory('calls')}
                />
                <SidebarItem
                    icon={Archive}
                    active={activeCategory === 'archive'}
                    onClick={() => setActiveCategory('archive')}
                />
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex flex-col items-center space-y-2 mt-auto">
                <SidebarItem
                    icon={User}
                    onClick={() => router.push('/profile')}
                />
                <SidebarItem
                    icon={Edit2}
                    onClick={() => router.push('/profile')}
                />
                <div className="mt-4 pt-4 border-t border-[var(--border-color)] w-12 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer transition-colors p-2 rounded-sm hover:bg-[var(--danger)]/5"
                        title="Logout"
                    >
                        <LogOut size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
};
