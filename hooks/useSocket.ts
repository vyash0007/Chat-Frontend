'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useUserStore } from '@/store';
import { Message, TypingStatus, MessageStatus } from '@/types';
import { getSocket } from '@/lib/socket';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const { addMessage, updateMessageStatus, addTypingUser, removeTypingUser } = useChatStore();
  const { updateUserStatus, addOnlineUser, removeOnlineUser } = useUserStore();

  useEffect(() => {
    if (!token) return;

    // Use the shared socket instance from lib/socket
    const socket = getSocket(token);
    socketRef.current = socket;

    // Remove all existing listeners first to prevent duplicates
    socket.removeAllListeners();

    // Connection events
    const handleConnect = () => {
      console.log('✅ Socket connected');
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
    };

    const handleError = (error: any) => {
      console.error('Socket error:', error);
    };

    // Message events
    const handleReceiveMessage = (message: Message) => {
      console.log('📨 Received message:', message);
      addMessage(message);
    };

    const handleMessageSent = (data: { tempId: string; message: Message }) => {
      console.log('✅ Message sent:', data);
      addMessage(data.message);
    };

    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      console.log('👁 Message read:', data);
      updateMessageStatus(data.messageId, MessageStatus.READ);
    };

    // Typing events
    const handleUserTyping = (data: TypingStatus) => {
      console.log('⌨️ User typing:', data);
      addTypingUser(data);

      setTimeout(() => {
        removeTypingUser(data.chatId, data.userId);
      }, 3000);
    };

    const handleUserStoppedTyping = (data: { chatId: string; userId: string }) => {
      console.log('🛑 User stopped typing:', data);
      removeTypingUser(data.chatId, data.userId);
    };

    // Status events
    const handleOnlineUsers = (users: { id: string; status: string; lastSeen: Date | null }[]) => {
      console.log('📋 Initial online users:', users);
      const onlineUserIds = users.map(u => u.id);
      useUserStore.getState().setOnlineUsers(onlineUserIds);
    };

    const handleUserStatusChange = (data: { userId: string; status: string }) => {
      console.log('🟢 User status changed:', data);

      if (data.status === 'ONLINE' || data.status === 'AWAY' || data.status === 'DO_NOT_DISTURB') {
        addOnlineUser(data.userId);
      } else {
        removeOnlineUser(data.userId);
      }

      updateUserStatus({ userId: data.userId, status: data.status as any, lastSeen: null });

      const currentUser = useAuthStore.getState().user;
      if (currentUser && data.userId === currentUser.id) {
        useAuthStore.getState().setUser({
          ...currentUser,
          status: data.status as any,
        });
      }
    };

    // Register all event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageSent', handleMessageSent);
    socket.on('messageRead', handleMessageRead);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('userStatusChange', handleUserStatusChange);

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      // Clean up listeners on unmount
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageSent', handleMessageSent);
      socket.off('messageRead', handleMessageRead);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('userStatusChange', handleUserStatusChange);
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
