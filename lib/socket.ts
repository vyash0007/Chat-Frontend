import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io(WS_URL, {
      auth: {
        token, // 👈 JWT goes here
      },
      autoConnect: false,
    });
  }
  return socket;
};
