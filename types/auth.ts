import { User } from './user';

export interface LoginPayload {
  phone: string;
}

export interface VerifyOTPPayload {
  phone: string;
  otp: string;
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
