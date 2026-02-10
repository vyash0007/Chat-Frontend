'use client';

import { create } from 'zustand';
import { Chat, Message, MessageType, MessageStatus, TypingStatus, SendMessagePayload } from '@/types';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from './authStore';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: TypingStatus[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chatId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: MessageStatus) => void;
  addTypingUser: (typing: TypingStatus) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  createChat: (userIds: string[], name?: string, isGroup?: boolean) => Promise<Chat>;
  archiveChat: (chatId: string) => Promise<void>;
  addMembers: (chatId: string, userIds: string[]) => Promise<void>;
  removeMember: (chatId: string, userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
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
  searchQuery: '',

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

      const rawChats = await response.json();

      // Transform backend response to match frontend Chat type
      // Backend returns messages[] array, but frontend expects lastMessage object
      const transformedChats: Chat[] = rawChats.map((chat: any) => ({
        ...chat,
        lastMessage: chat.messages?.[0] || null,
        unreadCount: chat.unreadCount ?? 0,
      }));

      // Filter out self-chats (where both users are the same person) and deduplicate
      const seenIds = new Set<string>();

      // Get current user ID from auth storage
      let currentUserId: string | null = null;
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          currentUserId = parsed?.state?.user?.id || null;
        }
      } catch {
        // Ignore parse errors
      }

      const chats = transformedChats.filter((chat: Chat) => {
        // Skip ID duplicates
        if (seenIds.has(chat.id)) return false;
        seenIds.add(chat.id);

        // For 1-on-1 chats, filter out self-chats AND deduplicate by other user
        if (!chat.isGroup && currentUserId && chat.users) {
          // Find the other user (not the current user)
          const otherUser = chat.users.find(u => u.id !== currentUserId);

          // If there's no other user, this is a self-chat - filter out
          if (!otherUser) return false;

          // Deduplicate: only keep one chat per other user (first one is most recent due to sort order)
          const otherUserId = otherUser.id;
          if (seenIds.has(`user:${otherUserId}`)) return false;
          seenIds.add(`user:${otherUserId}`);
        }

        return true;
      });

      set({
        chats: chats.sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return timeB - timeA;
        }),
        isLoading: false
      });
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

      // Sort messages ASCENDING (oldest first) for the chat window
      const sortedMessages = messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: sortedMessages,
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

  setActiveChat: async (chatId: string) => {
    const { chats, fetchChats } = get();
    let chat = chats.find(c => c.id === chatId);

    // If chat not found, try fetching chats first
    if (!chat && chats.length === 0) {
      await fetchChats();
      const { chats: updatedChats } = get();
      chat = updatedChats.find(c => c.id === chatId);
    }

    if (chat) {
      set({ activeChat: chat });
    }
  },

  sendMessage: (payload: SendMessagePayload) => {
    // Optimistic update - add message immediately with SENDING status
    const tempId = `temp-${Date.now()}`;
    const currentUserId = useAuthStore.getState().user?.id || '';

    const tempMessage: Message = {
      id: tempId,
      chatId: payload.chatId,
      senderId: currentUserId,
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

    if (!socket) {
      console.error('[Chat] No socket available. Cannot send message.');
      // Mark message as failed
      set(state => ({
        messages: {
          ...state.messages,
          [payload.chatId]: state.messages[payload.chatId]?.map(m =>
            m.id === tempId ? { ...m, status: MessageStatus.FAILED } : m
          ) || [],
        },
      }));
      return;
    }

    // Ensure socket is connected
    if (!socket.connected) {
      console.log('[Chat] Socket not connected, attempting to connect...');
      socket.connect();
    }

    // Wait briefly for connection then send
    const trySendMessage = () => {
      if (socket.connected) {
        socket.emit('sendMessage', {
          chatId: payload.chatId,
          content: payload.content,
          type: payload.type,
          tempId,
        });
      } else {
        console.log('[Chat] Socket connecting, message queued for send.');
        // Socket will emit when connected, so we'll queue it
        socket.once('connect', () => {
          socket.emit('sendMessage', {
            chatId: payload.chatId,
            content: payload.content,
            type: payload.type,
            tempId,
          });
        });
      }
    };

    trySendMessage();
  },

  addMessage: (message: Message & { tempId?: string }) => {
    set(state => {
      const currentMessages = state.messages[message.chatId] || [];

      // If this message has a tempId, replace the corresponding temp message
      if (message.tempId) {
        const index = currentMessages.findIndex(m => m.id === message.tempId);
        if (index !== -1) {
          const newMessages = [...currentMessages];
          newMessages[index] = message;
          return {
            messages: {
              ...state.messages,
              [message.chatId]: newMessages.sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              ),
            },
          };
        }
      }

      // Check if message already exists (to prevent duplicates)
      const exists = currentMessages.some(m => m.id === message.id);
      if (exists) {
        return {
          messages: {
            ...state.messages,
            [message.chatId]: currentMessages.map(m =>
              m.id === message.id ? message : m
            ),
          },
        };
      }

      // If it's a new message from someone else, just add it
      return {
        messages: {
          ...state.messages,
          [message.chatId]: [...currentMessages, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),
        },
      };
    });

    // Update last message and re-sort chats by latest message
    set(state => {
      const updatedChats = state.chats.map(chat =>
        chat.id === message.chatId
          ? { ...chat, lastMessage: message }
          : chat
      );

      // Sort chats: latest message first
      const sortedChats = updatedChats.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return { chats: sortedChats };
    });
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

      // Only add to list if it doesn't already exist (backend may return existing chat)
      set(state => {
        const exists = state.chats.some(c => c.id === newChat.id);
        if (exists) {
          return { chats: state.chats };
        }
        return { chats: [newChat, ...state.chats] };
      });

      return newChat;
    } catch (error) {
      throw error;
    }
  },
  archiveChat: async (chatId: string) => {
    // Optimistic update
    set(state => ({
      chats: state.chats.map(chat =>
        chat.id === chatId
          ? { ...chat, isArchived: !chat.isArchived }
          : chat
      )
    }));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chats/${chatId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to archive chat');
      }
    } catch (error) {
      // Revert optimistic update on error
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, isArchived: !chat.isArchived }
            : chat
        )
      }));
      console.error('Failed to archive chat:', error);
    }
  },

  addMembers: async (chatId: string, userIds: string[]) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chats/${chatId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to add members');
      }

      const updatedChat: Chat = await response.json();

      set(state => ({
        chats: state.chats.map(c => c.id === updatedChat.id ? updatedChat : c),
        activeChat: state.activeChat?.id === updatedChat.id ? updatedChat : state.activeChat,
      }));
    } catch (error) {
      console.error('Failed to add members:', error);
      throw error;
    }
  },

  removeMember: async (chatId: string, userId: string) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/chats/${chatId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      const updatedChat: Chat = await response.json();

      set(state => ({
        chats: state.chats.map(c => c.id === updatedChat.id ? updatedChat : c),
        activeChat: state.activeChat?.id === updatedChat.id ? updatedChat : state.activeChat,
      }));
    } catch (error) {
      console.error('Failed to remove member:', error);
      throw error;
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  clearError: () => set({ error: null }),
}));
