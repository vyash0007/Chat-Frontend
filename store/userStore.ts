'use client';

import { create } from 'zustand';
import { User, UserStatus, OnlineStatus } from '@/types';

interface UserState {
  users: Record<string, User>; // Cache of users by ID
  onlineUsers: Set<string>; // Set of online user IDs
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUser: (userId: string) => Promise<User>;
  searchUsers: (phone: string) => Promise<User[]>;
  updateUserStatus: (status: OnlineStatus) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useUserStore = create<UserState>()((set, get) => ({
  users: {},
  onlineUsers: new Set(),
  isLoading: false,
  error: null,

  fetchUser: async (userId: string) => {
    const { users } = get();

    // Return from cache if available
    if (users[userId]) {
      return users[userId];
    }

    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${JSON.parse(token)}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user: User = await response.json();

      set(state => ({
        users: { ...state.users, [userId]: user },
        isLoading: false,
      }));

      return user;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      });
      throw error;
    }
  },

  searchUsers: async (phone: string) => {
    if (!phone.trim()) return [];

    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/users/search?phone=${encodeURIComponent(phone)}`, {
        headers: { Authorization: `Bearer ${JSON.parse(token)}` },
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const users: User[] = await response.json();

      // Cache the users
      set(state => {
        const newUsers = { ...state.users };
        users.forEach(user => {
          newUsers[user.id] = user;
        });
        return { users: newUsers, isLoading: false };
      });

      return users;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search users',
      });
      throw error;
    }
  },

  updateUserStatus: (status: OnlineStatus) => {
    set(state => {
      const user = state.users[status.userId];
      if (!user) return state;

      return {
        users: {
          ...state.users,
          [status.userId]: {
            ...user,
            status: status.status,
            lastSeen: status.lastSeen,
          },
        },
      };
    });
  },

  setOnlineUsers: (userIds: string[]) => {
    set({ onlineUsers: new Set(userIds) });
  },

  addOnlineUser: (userId: string) => {
    set(state => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    }));
  },

  removeOnlineUser: (userId: string) => {
    set(state => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    });
  },

  clearError: () => set({ error: null }),
}));
