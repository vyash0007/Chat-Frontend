import { User } from './user';

export interface LoginPayload {
  phone: string; // E.164 format: +14155552671, +442071234567, +919876543210
}

export interface VerifyOTPPayload {
  phone: string; // E.164 format: +14155552671, +442071234567, +919876543210
  otp: string; // 6-digit code
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  bio?: string;
  statusMessage?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
