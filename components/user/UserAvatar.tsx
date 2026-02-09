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
  size?: 'sm' | 'md' | 'mdl' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  mdl: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const statusSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  mdl: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
  xl: 'w-6 h-6',
};

const statusColors = {
  [UserStatus.ONLINE]: 'bg-[#22c55e]',
  [UserStatus.AWAY]: 'bg-[#f59e0b]',
  [UserStatus.DO_NOT_DISTURB]: 'bg-[#ef4444]',
  [UserStatus.OFFLINE]: 'bg-gray-300',
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

  // Use the actual stored status, but override with ONLINE if in onlineUsers set
  const isOnline = user?.id ? onlineUsers.has(user.id) : false;
  let displayStatus = status || user?.status || UserStatus.OFFLINE;

  // If user is online in store, force ONLINE status unless they are DND
  if (isOnline && displayStatus === UserStatus.OFFLINE) {
    displayStatus = UserStatus.ONLINE;
  }

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
            'object-cover rounded-full',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'bg-[var(--accent-primary)] text-white font-semibold flex items-center justify-center rounded-full',
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
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--background-secondary)] shadow-sm',
            statusSizes[size],
            statusColors[displayStatus]
          )}
          aria-label={`Status: ${displayStatus.toLowerCase()}`}
        />
      )}
    </div>
  );
};
