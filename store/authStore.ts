'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserStatus,  LoginPayload, VerifyOTPPayload, AuthResponse, UpdateProfilePayload } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (payload: LoginPayload) => Promise<void>;
  verifyOtp: (payload: VerifyOTPPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
};

// Helper to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (payload: LoginPayload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Failed to send OTP');
          }

          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to send OTP',
          });
          throw error;
        }
      },

      verifyOtp: async (payload: VerifyOTPPayload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Invalid OTP');
          }

          const data: AuthResponse = await response.json();

          // Set cookie for middleware
          setCookie('auth-token', data.accessToken, 7);

          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Invalid OTP',
          });
          throw error;
        }
      },

      logout: () => {
        // Delete cookie
        deleteCookie('auth-token');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateProfile: async (payload: UpdateProfilePayload) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Failed to update profile');
          }

          const updatedUser: User = await response.json();

          set(state => ({
            user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update profile',
          });
          throw error;
        }
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),

      setToken: (token: string) => {
        setCookie('auth-token', token, 7);
        set({ token, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
