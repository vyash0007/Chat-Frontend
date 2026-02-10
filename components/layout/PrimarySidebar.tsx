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
    onClick,
    layout = 'vertical'
}: {
    icon: any;
    active?: boolean;
    badge?: number | string;
    onClick?: () => void;
    layout?: 'horizontal' | 'vertical';
}) => (
    <button
        onClick={onClick}
        className={cn(
            'relative flex items-center justify-center transition-all duration-200',
            layout === 'vertical'
                ? 'w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-4 rounded-sm'
                : 'w-14 h-14 rounded-xl',
            active
                ? 'bg-[var(--accent-primary)] text-white shadow-glow'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--background-hover)]'
        )}
    >
        <Icon className={cn(
            layout === 'vertical' ? "w-5 h-5 md:w-[22px] md:h-[22px]" : "w-6 h-6"
        )} strokeWidth={1.5} />
        {badge && (
            <span className={cn(
                "absolute flex items-center justify-center text-white bg-[var(--danger)] rounded-full border-2 border-[var(--background-primary)]",
                layout === 'vertical'
                    ? "top-0 right-0 w-4 h-4 md:w-5 md:h-5 -mt-1 -mr-1 text-[9px] md:text-[10px]"
                    : "top-2 right-2 w-5 h-5 text-[10px]"
            )}>
                {badge}
            </span>
        )}
    </button>
);

export const PrimarySidebar: React.FC<{ layout?: 'horizontal' | 'vertical' }> = ({
    layout = 'vertical'
}) => {
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
        <div className={cn(
            "w-full h-full flex items-center",
            layout === 'vertical' ? "flex-col" : "flex-row justify-around px-4"
        )}>
            {/* Logo - Only in Vertical */}
            {layout === 'vertical' && (
                <div className="mb-4 md:mb-8">
                    <div
                        className="w-8 h-8 md:w-10 md:h-10 bg-[var(--accent-primary)]/10 rounded-sm flex items-center justify-center cursor-pointer hover:bg-[var(--accent-primary)]/20 transition-colors"
                        onClick={() => router.push('/chats')}
                    >
                        <svg className="text-[var(--accent-primary)] w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3L4 7L12 11L20 7L12 3Z" />
                            <path d="M12 9L4 13L12 17L20 13L12 9Z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Navigation Icons */}
            <div className={cn(
                "w-full flex items-center",
                layout === 'vertical' ? "flex-1 flex-col" : "flex-row justify-around max-w-lg"
            )}>
                <SidebarItem
                    icon={MessageSquare}
                    badge={totalUnread > 0 ? totalUnread : undefined}
                    active={activeCategory === 'all'}
                    onClick={() => setActiveCategory('all')}
                    layout={layout}
                />

                {/* Center Phone on Mobile (Horizontal) */}
                {layout === 'horizontal' && (
                    <SidebarItem
                        icon={Briefcase}
                        active={activeCategory === 'work'}
                        onClick={() => setActiveCategory('work')}
                        layout={layout}
                    />
                )}

                <SidebarItem
                    icon={Phone}
                    active={activeCategory === 'calls'}
                    onClick={() => setActiveCategory('calls')}
                    layout={layout}
                />

                {layout === 'horizontal' && (
                    <SidebarItem
                        icon={Users}
                        active={activeCategory === 'friends'}
                        onClick={() => setActiveCategory('friends')}
                        layout={layout}
                    />
                )}

                {layout === 'vertical' && (
                    <>
                        <SidebarItem
                            icon={Briefcase}
                            active={activeCategory === 'work'}
                            onClick={() => setActiveCategory('work')}
                            layout={layout}
                        />
                        <SidebarItem
                            icon={Users}
                            active={activeCategory === 'friends'}
                            onClick={() => setActiveCategory('friends')}
                            layout={layout}
                        />
                    </>
                )}

                <SidebarItem
                    icon={Archive}
                    active={activeCategory === 'archive'}
                    onClick={() => setActiveCategory('archive')}
                    layout={layout}
                />

                {layout === 'horizontal' && (
                    <SidebarItem
                        icon={User}
                        active={false}
                        onClick={() => router.push('/profile')}
                        layout={layout}
                    />
                )}
            </div>

            {/* Bottom Actions - Only in Vertical */}
            {layout === 'vertical' && (
                <div className="w-full flex flex-col items-center space-y-2 mt-auto">
                    <SidebarItem
                        icon={User}
                        onClick={() => router.push('/profile')}
                        layout={layout}
                    />
                    <SidebarItem
                        icon={Edit2}
                        onClick={() => router.push('/profile')}
                        layout={layout}
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
            )}
        </div>
    );
};
