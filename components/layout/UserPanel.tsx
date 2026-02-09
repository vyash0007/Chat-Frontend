'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user';
import { useAuthStore, useUIStore } from '@/store';
import { UserStatus } from '@/types';
import { useSocket } from '@/hooks';
import { cn } from '@/lib/utils';
import { LogOut, ChevronUp, User as UserIcon, Check, Settings } from 'lucide-react';

export const UserPanel: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { closeModal } = useUIStore();
  const { socket } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusChange = (newStatus: UserStatus) => {
    if (socket && user) {
      socket.emit('updateStatus', { status: newStatus });
      setShowDropdown(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const currentStatus = user.status || UserStatus.OFFLINE;

  return (
    <div className="relative mt-auto p-4 border-t border-[var(--border-color)] bg-[var(--background-secondary)]">
      {/* User Info Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center gap-3 p-2 rounded-sm hover:bg-[var(--background-hover)] transition-all group"
      >
        <UserAvatar user={user} size="md" showStatus />

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-light tracking-tight text-[var(--text-primary)] truncate">
            {user.name || 'User'}
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] font-light tracking-tight capitalize">
            {currentStatus.toLowerCase()}
          </p>
        </div>

        <ChevronUp
          className={cn(
            "w-4 h-4 text-[var(--text-muted)] transition-transform",
            showDropdown ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Click overlay to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute bottom-full left-4 right-4 mb-3 bg-[var(--background-modal)] border border-[var(--border-color)] rounded-sm shadow-2xl overflow-hidden z-50 animate-fade-in-up backdrop-blur-xl">
            <button
              onClick={() => {
                router.push('/profile');
                setShowDropdown(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--background-hover)] transition-colors flex items-center gap-3 font-light tracking-tight"
            >
              <UserIcon size={18} className="text-[var(--text-muted)]" />
              <span>Profile Settings</span>
            </button>

            <div className="border-t border-[var(--border-color)]" />

            {/* Status Options */}
            <div className="py-2">
              <p className="px-4 py-1.5 text-[10px] font-light text-[var(--text-muted)] uppercase tracking-widest">
                Set Status
              </p>
              {[
                { status: UserStatus.ONLINE, label: 'Online', color: 'bg-green-500' },
                { status: UserStatus.AWAY, label: 'Away', color: 'bg-yellow-500' },
                { status: UserStatus.DO_NOT_DISTURB, label: 'Do Not Disturb', color: 'bg-red-500' },
                { status: UserStatus.OFFLINE, label: 'Invisible', color: 'bg-gray-400' },
              ].map(({ status, label, color }) => {
                const isSelected = status === currentStatus;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 group",
                      isSelected ? "text-[var(--accent-primary)] bg-[var(--accent-soft)]/10" : "text-[var(--text-secondary)] hover:bg-[var(--background-hover)] font-light tracking-tight"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
                    <span className="flex-1 font-light tracking-tight">{label}</span>
                    {isSelected && (
                      <Check size={14} className="text-[var(--accent-primary)]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[var(--border-color)]" />

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors flex items-center gap-3 font-light tracking-tight"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
