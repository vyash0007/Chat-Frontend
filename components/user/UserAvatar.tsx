'use client';

import React from 'react';
import { User, UserStatus } from '@/types';
import { useUserStore } from '@/store';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: User | null;
  name?: string;
  avatar?: string | null;
  status?: UserStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const statusSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-6 h-6',
};

const statusColors = {
  [UserStatus.ONLINE]: 'bg-[var(--status-online)]',
  [UserStatus.AWAY]: 'bg-[var(--status-away)]',
  [UserStatus.DO_NOT_DISTURB]: 'bg-[var(--status-dnd)]',
  [UserStatus.OFFLINE]: 'bg-[var(--status-offline)]',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  avatar,
  status,
  size = 'md',
  showStatus = false,
  className,
}) => {
  const { onlineUsers } = useUserStore();

  const displayName = name || user?.name || 'User';
  const displayAvatar = avatar !== undefined ? avatar : user?.avatar;

  // Use the actual stored status, or default to OFFLINE
  const displayStatus = status || user?.status || UserStatus.OFFLINE;

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Avatar */}
      {displayAvatar ? (
        <img
          src={displayAvatar}
          alt={displayName}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}

      {/* Status indicator */}
      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--background-secondary)]',
            statusSizes[size],
            statusColors[displayStatus]
          )}
          aria-label={`Status: ${displayStatus.toLowerCase()}`}
        />
      )}
    </div>
  );
};
