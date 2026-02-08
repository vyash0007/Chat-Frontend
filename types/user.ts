export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  OFFLINE = 'OFFLINE',
}

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  status: UserStatus;
  lastSeen: Date | null;
  bio: string | null;
  statusMessage: string | null;
  createdAt: Date;
}

export interface UserProfile extends User {
  // Extended user profile with additional fields
}

export interface OnlineStatus {
  userId: string;
  status: UserStatus;
  lastSeen: Date | null;
}
