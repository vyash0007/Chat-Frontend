'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { useAuthStore } from '@/store';
import { UserStatus } from '@/types';

export const UserPanel: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

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
          <p className="text-xs text-[var(--text-muted)] truncate">
            {user.status?.toLowerCase() || 'online'}
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
            ].map(({ status, label, color }) => (
              <button
                key={status}
                onClick={() => {
                  // TODO: Update user status
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--background-hover)] transition-colors flex items-center gap-3"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `var(--status-${status.toLowerCase().replace('_', '-')})` }}
                />
                {label}
              </button>
            ))}
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
