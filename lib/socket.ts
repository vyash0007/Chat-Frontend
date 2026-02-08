import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (token?: string) => {
  if (!socket) {
    socket = io('http://localhost:3001', {
      auth: {
        token, // 👈 JWT goes here
      },
      autoConnect: false,
    });
  }
  return socket;
};
