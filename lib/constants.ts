export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  CHATS: '/chats',
  CALL: '/call',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  USER: 'user',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  FILE: 'FILE',
  LOCATION: 'LOCATION',
} as const;

export const USER_STATUS = {
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  DO_NOT_DISTURB: 'DO_NOT_DISTURB',
  OFFLINE: 'OFFLINE',
} as const;
