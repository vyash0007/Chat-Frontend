import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;
let pendingOperations: Array<() => void> = [];

// Execute any pending operations once socket connects
const flushPendingOperations = () => {
  if (socket && socket.connected) {
    pendingOperations.forEach(op => op());
    pendingOperations = [];
  }
};

export const getSocket = (token?: string): Socket | null => {
  if (!socket && token) {
    socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    // Flush pending operations when socket connects
    socket.on('connect', () => {
      flushPendingOperations();
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    pendingOperations = [];
  }
};

export const joinChat = (chatId: string) => {
  const doJoinChat = () => {
    if (socket && socket.connected) {
      console.log('📍 Joining chat:', chatId);
      socket.emit('joinChat', { chatId });
    }
  };

  if (socket && socket.connected) {
    doJoinChat();
  } else if (socket) {
    // Socket exists but not connected yet - queue the operation
    console.log('⏳ Queueing joinChat for:', chatId);
    pendingOperations.push(doJoinChat);
  } else {
    console.warn('Socket not initialized, cannot join chat:', chatId);
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

// ========== CALL SOCKET METHODS ==========

export const initiateCall = (chatId: string, isVideoCall: boolean) => {
  if (socket && socket.connected) {
    console.log('📞 Initiating call:', { chatId, isVideoCall });
    socket.emit('initiateCall', { chatId, isVideoCall });
  } else {
    console.warn('Socket not connected, cannot initiate call');
  }
};

export const acceptCall = (chatId: string, callerId: string) => {
  if (socket && socket.connected) {
    console.log('✅ Accepting call:', { chatId, callerId });
    socket.emit('acceptCall', { chatId, callerId });
  }
};

export const rejectCall = (chatId: string, callerId: string) => {
  if (socket && socket.connected) {
    console.log('❌ Rejecting call:', { chatId, callerId });
    socket.emit('rejectCall', { chatId, callerId });
  }
};

export const cancelCall = (chatId: string) => {
  if (socket && socket.connected) {
    console.log('🚫 Cancelling call:', { chatId });
    socket.emit('cancelCall', { chatId });
  }
};
