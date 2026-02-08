import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket || !socket.connected) {
    // If socket doesn't exist or is disconnected, create/reconnect it
    if (!socket) {
      socket = io(WS_URL, {
        auth: {
          token,
        },
        transports: ['websocket'],
        autoConnect: true, // Auto-connect enabled
      });
    } else if (!socket.connected && token) {
      // Update auth token and reconnect
      socket.auth = { token };
      socket.connect();
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
