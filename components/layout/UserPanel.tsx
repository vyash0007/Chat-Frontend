'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { useAuthStore, useUserStore } from '@/store';
import { UserStatus } from '@/types';
import { useSocket } from '@/hooks/useSocket';

export const UserPanel: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user); // Subscribe to user changes
  const logout = useAuthStore((state) => state.logout);
  const { onlineUsers } = useUserStore();
  const { socket } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusChange = (newStatus: UserStatus) => {
    console.log('🔄 Changing status to:', newStatus);
    console.log('Socket available:', !!socket);
    console.log('User ID:', user?.id);

    if (socket && user) {
      // Emit status change to server
      console.log('Emitting updateStatus event...');
      socket.emit('updateStatus', { status: newStatus });
      setShowDropdown(false);
    } else {
      console.error('Cannot change status: socket or user not available');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  // Get real-time status
  const currentStatus = user.status || UserStatus.OFFLINE;
  const displayStatus = currentStatus.toLowerCase();
  const statusLabel = displayStatus.replace(/_/g, ' ');

  return (
    <div className="relative p-4 border-t border-[var(--divider-color)] bg-[var(--background-tertiary)]">
      {/* User Info */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background-hover)] transition-colors group"
      >
        <UserAvatar user={user} size="md" showStatus />

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate capitalize">
            {statusLabel}
          </p>
        </div>

        {/* Dropdown icon */}
        <svg
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--background-modal)] border border-[var(--border-color)] rounded-lg shadow-[var(--shadow-lg)] overflow-hidden z-[var(--z-dropdown)]">
          <button
            onClick={() => {
              router.push('/profile');
              setShowDropdown(false);
            }}
            className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--background-hover)] transition-colors flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Settings
          </button>

          <div className="border-t border-[var(--divider-color)]" />

          {/* Status Options */}
          <div className="py-2">
            <p className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase">
              Set Status
            </p>
            {[
              { status: UserStatus.ONLINE, label: 'Online', color: 'var(--status-online)' },
              { status: UserStatus.AWAY, label: 'Away', color: 'var(--status-away)' },
              { status: UserStatus.DO_NOT_DISTURB, label: 'Do Not Disturb', color: 'var(--status-dnd)' },
              { status: UserStatus.OFFLINE, label: 'Invisible', color: 'var(--status-offline)' },
            ].map(({ status, label, color }) => {
              const isSelected = status === currentStatus;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[var(--background-hover)] text-[var(--accent-primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--background-hover)]'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `var(--status-${status.toLowerCase().replace('_', '-')})` }}
                  />
                  <span className="flex-1">{label}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--divider-color)]" />

          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--background-hover)] transition-colors flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};
