'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useUserStore } from '@/store';
import { Message, TypingStatus, MessageStatus } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const { addMessage, updateMessageStatus, addTypingUser, removeTypingUser } = useChatStore();
  const { updateUserStatus, addOnlineUser, removeOnlineUser } = useUserStore();

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

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

    // Message events
    socket.on('receiveMessage', (message: Message) => {
      console.log('📨 Received message:', message);
      addMessage(message);
    });

    socket.on('messageSent', (data: { tempId: string; message: Message }) => {
      console.log('✅ Message sent:', data);
      // Update message from temp ID to real ID
      addMessage(data.message);
    });

    socket.on('messageRead', (data: { messageId: string; userId: string }) => {
      console.log('👁 Message read:', data);
      updateMessageStatus(data.messageId, MessageStatus.READ);
    });

    // Typing events
    socket.on('userTyping', (data: TypingStatus) => {
      console.log('⌨️ User typing:', data);
      addTypingUser(data);

      // Auto-remove after 3 seconds
      setTimeout(() => {
        removeTypingUser(data.chatId, data.userId);
      }, 3000);
    });

    socket.on('userStoppedTyping', (data: { chatId: string; userId: string }) => {
      console.log('🛑 User stopped typing:', data);
      removeTypingUser(data.chatId, data.userId);
    });

    // Status events
    socket.on('onlineUsers', (users: { id: string; status: string; lastSeen: Date | null }[]) => {
      console.log('📋 Initial online users:', users);
      // Initialize online users in store
      const onlineUserIds = users.map(u => u.id);
      useUserStore.getState().setOnlineUsers(onlineUserIds);
    });

    socket.on('userStatusChange', (data: { userId: string; status: string }) => {
      console.log('🟢 User status changed:', data);

      // Update online users set
      if (data.status === 'ONLINE' || data.status === 'AWAY' || data.status === 'DO_NOT_DISTURB') {
        addOnlineUser(data.userId);
      } else {
        removeOnlineUser(data.userId);
      }

      // Update user's cached status
      updateUserStatus({ userId: data.userId, status: data.status as any, lastSeen: null });

      // If it's the current user, update auth store
      const currentUser = useAuthStore.getState().user;
      if (currentUser && data.userId === currentUser.id) {
        useAuthStore.getState().setUser({
          ...currentUser,
          status: data.status as any,
        });
      }
    });

    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
    };
  }, [token, addMessage, updateMessageStatus, addTypingUser, removeTypingUser, updateUserStatus, addOnlineUser, removeOnlineUser]);

  const joinChat = (chatId: string) => {
    if (socketRef.current) {
      console.log('📍 Joining chat:', chatId);
      socketRef.current.emit('joinChat', { chatId });
    }
  };

  const leaveChat = (chatId: string) => {
    if (socketRef.current) {
      console.log('🚪 Leaving chat:', chatId);
      socketRef.current.emit('leaveChat', { chatId });
    }
  };

  const emitTyping = (chatId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit('typing', { chatId });
    }
  };

  const emitStopTyping = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('stopTyping', { chatId });
    }
  };

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    emitTyping,
    emitStopTyping,
  };
};
