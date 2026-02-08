export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  OFFLINE = 'OFFLINE',
}

export enum AuthProvider {
  PHONE = 'PHONE',
  GOOGLE = 'GOOGLE',
  BOTH = 'BOTH',
}

export interface User {
  id: string;
  phone: string | null; // E.164 format: +14155552671, +442071234567, +919876543210
  email: string | null;
  googleId?: string | null;
  authProvider: AuthProvider;
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
