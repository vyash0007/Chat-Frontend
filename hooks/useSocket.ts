'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useUserStore } from '@/store';
import { Message, TypingStatus, MessageStatus } from '@/types';
import { getSocket, joinChat, leaveChat, emitTyping, emitStopTyping, disconnectSocket } from '@/lib/socket';

// This hook should only be called ONCE in the layout component.
// For joinChat/leaveChat/emitTyping, import directly from '@/lib/socket'.
export const useSocket = () => {
  const listenersSet = useRef(false);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token || listenersSet.current) return;

    const socket = getSocket(token);
    if (!socket) return;

    listenersSet.current = true;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Message events - backend emits 'newMessage'
    socket.on('newMessage', (message: Message) => {
      console.log('📨 Received message:', message);
      useChatStore.getState().addMessage(message);
    });

    socket.on('messageRead', (data: { messageId: string; userId: string }) => {
      console.log('👁 Message read:', data);
      useChatStore.getState().updateMessageStatus(data.messageId, MessageStatus.READ);
    });

    // Typing events
    socket.on('userTyping', (data: TypingStatus) => {
      console.log('⌨️ User typing:', data);
      useChatStore.getState().addTypingUser(data);

      setTimeout(() => {
        useChatStore.getState().removeTypingUser(data.chatId, data.userId);
      }, 3000);
    });

    socket.on('userStoppedTyping', (data: { chatId: string; userId: string }) => {
      console.log('🛑 User stopped typing:', data);
      useChatStore.getState().removeTypingUser(data.chatId, data.userId);
    });

    // Status events
    socket.on('onlineUsers', (users: { id: string; status: string; lastSeen: Date | null }[]) => {
      console.log('📋 Initial online users:', users);
      const onlineUserIds = users.map(u => u.id);
      useUserStore.getState().setOnlineUsers(onlineUserIds);
    });

    socket.on('userStatusChange', (data: { userId: string; status: string }) => {
      console.log('🟢 User status changed:', data);

      if (data.status === 'ONLINE' || data.status === 'AWAY' || data.status === 'DO_NOT_DISTURB') {
        useUserStore.getState().addOnlineUser(data.userId);
      } else {
        useUserStore.getState().removeOnlineUser(data.userId);
      }

      useUserStore.getState().updateUserStatus({ userId: data.userId, status: data.status as any, lastSeen: null });

      const currentUser = useAuthStore.getState().user;
      if (currentUser && data.userId === currentUser.id) {
        useAuthStore.getState().setUser({
          ...currentUser,
          status: data.status as any,
        });
      }
    });

    // No cleanup - this hook runs once for the lifetime of the app
    // Socket disconnection happens on logout via disconnectSocket()
  }, [token]);

  // Return a stable api for components to use. These functions delegate to the
  // singleton socket instance in `lib/socket` so they can be called anywhere.
  const socket = getSocket(token || undefined) || null;

  return {
    socket,
    joinChat,
    leaveChat,
    emitTyping,
    emitStopTyping,
    disconnectSocket,
  } as const;
};
