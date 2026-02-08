'use client';

import { create } from 'zustand';
import { Chat, Message, MessageType, MessageStatus, TypingStatus, SendMessagePayload } from '@/types';
import { getSocket } from '@/lib/socket';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingStatus[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chatId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  addTypingUser: (typing: TypingStatus) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  createChat: (userIds: string[], name?: string, isGroup?: boolean) => Promise<Chat>;
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

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: [],
  isLoading: false,
  error: null,

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const chats: Chat[] = await response.json();
      set({ chats, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chats',
      });
    }
  },

  fetchMessages: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages: Message[] = await response.json();

      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: messages,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      });
    }
  },

  setActiveChat: (chatId: string) => {
    const { chats } = get();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      set({ activeChat: chat });
    }
  },

  sendMessage: (payload: SendMessagePayload) => {
    // Optimistic update - add message immediately with SENDING status
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      chatId: payload.chatId,
      senderId: '', // Will be set by backend
      type: payload.type,
      content: payload.content,
      status: MessageStatus.SENDING,
      reactions: [],
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(),
    };

    set(state => ({
      messages: {
        ...state.messages,
        [payload.chatId]: [...(state.messages[payload.chatId] || []), tempMessage],
      },
    }));

    // Send message via WebSocket
    const token = getAuthToken();
    const socket = getSocket(token || undefined);
    if (socket && socket.connected) {
      socket.emit('sendMessage', {
        chatId: payload.chatId,
        content: payload.content,
        type: payload.type,
      });
    } else {
      console.error('Socket not connected. Cannot send message.');
    }
  },

  addMessage: (message: Message) => {
    set(state => {
      const currentMessages = state.messages[message.chatId] || [];

      // Remove any temporary messages
      const filteredMessages = currentMessages.filter(
        m => !m.id.startsWith('temp-')
      );

      // Check if message already exists
      const exists = filteredMessages.some(m => m.id === message.id);
      if (exists) {
        return {
          messages: {
            ...state.messages,
            [message.chatId]: filteredMessages.map(m =>
              m.id === message.id ? message : m
            ),
          },
        };
      }

      return {
        messages: {
          ...state.messages,
          [message.chatId]: [...filteredMessages, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        },
      };
    });

    // Update last message in chat list
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === message.chatId
          ? { ...chat, lastMessage: message }
          : chat
      ),
    }));
  },

  updateMessageStatus: (messageId: string, status: MessageStatus) => {
    set(state => {
      const updatedMessages = { ...state.messages };

      Object.keys(updatedMessages).forEach(chatId => {
        updatedMessages[chatId] = updatedMessages[chatId].map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        );
      });

      return { messages: updatedMessages };
    });
  },

  addTypingUser: (typing: TypingStatus) => {
    set(state => ({
      typingUsers: [...state.typingUsers.filter(
        t => !(t.chatId === typing.chatId && t.userId === typing.userId)
      ), typing],
    }));
  },

  removeTypingUser: (chatId: string, userId: string) => {
    set(state => ({
      typingUsers: state.typingUsers.filter(
        t => !(t.chatId === chatId && t.userId === userId)
      ),
    }));
  },

  addReaction: async (messageId: string, emoji: string) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  },

  removeReaction: async (messageId: string, emoji: string) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/messages/${messageId}/reactions/${emoji}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error);
    }
  },

  createChat: async (userIds: string[], name?: string, isGroup: boolean = false) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      let url: string;
      let body: Record<string, unknown>;

      if (isGroup) {
        url = `${API_URL}/chats/group`;
        body = { userIds, name };
      } else {
        url = `${API_URL}/chats`;
        body = { otherUserId: userIds[0] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const newChat: Chat = await response.json();

      set(state => ({
        chats: [newChat, ...state.chats],
      }));

      return newChat;
    } catch (error) {
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
