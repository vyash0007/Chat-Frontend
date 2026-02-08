import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket | null => {
  if (!socket && token) {
    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId: string) => {
  if (socket && socket.connected) {
    console.log('📍 Joining chat:', chatId);
    socket.emit('joinChat', { chatId });
  } else {
    console.warn('Socket not connected, cannot join chat:', chatId);
  }
};

export const leaveChat = (chatId: string) => {
  if (socket && socket.connected) {
    console.log('🚪 Leaving chat:', chatId);
    socket.emit('leaveChat', { chatId });
  }
};

export const emitTyping = (chatId: string) => {
  if (socket && socket.connected) {
    socket.emit('typing', { chatId });
  }
};

export const emitStopTyping = (chatId: string) => {
  if (socket && socket.connected) {
    socket.emit('stopTyping', { chatId });
  }
};

