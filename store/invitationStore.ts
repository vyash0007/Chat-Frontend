'use client';

import { create } from 'zustand';
import { Invitation, CreateInvitationPayload, InvitationType } from '@/types';

interface InvitationState {
  pendingInvitations: Invitation[];
  chatInvitations: Record<string, Invitation[]>;
  isLoading: boolean;
  error: string | null;

  fetchPendingInvitations: () => Promise<void>;
  fetchChatInvitations: (chatId: string) => Promise<Invitation[]>;
  createInvitation: (payload: CreateInvitationPayload) => Promise<Invitation>;
  acceptInvitation: (token: string) => Promise<{ chatId: string; type: InvitationType }>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || null;
    }
  } catch {
    // fallback
  }
  return null;
}

export const useInvitationStore = create<InvitationState>()((set, get) => ({
  pendingInvitations: [],
  chatInvitations: {},
  isLoading: false,
  error: null,

  fetchPendingInvitations: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/invitations/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch pending invitations');

      const invitations: Invitation[] = await response.json();
      set({ pendingInvitations: invitations, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      });
    }
  },

  fetchChatInvitations: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/invitations/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch chat invitations');

      const invitations: Invitation[] = await response.json();
      set((state) => ({
        chatInvitations: {
          ...state.chatInvitations,
          [chatId]: invitations,
        },
        isLoading: false,
      }));

      return invitations;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      });
      throw error;
    }
  },

  createInvitation: async (payload: CreateInvitationPayload) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invitation');
      }

      const invitation: Invitation = await response.json();
      set({ isLoading: false });
      return invitation;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create invitation',
      });
      throw error;
    }
  },

  acceptInvitation: async (inviteToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const authToken = getAuthToken();
      if (!authToken) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: inviteToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept invitation');
      }

      const result = await response.json();

      // Refresh pending invitations
      await get().fetchPendingInvitations();

      set({ isLoading: false });
      return result;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to accept invitation',
      });
      throw error;
    }
  },

  revokeInvitation: async (invitationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revoke invitation');
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to revoke invitation',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
