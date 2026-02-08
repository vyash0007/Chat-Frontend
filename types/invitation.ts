export enum InvitationType {
  PERMANENT_MEMBER = 'PERMANENT_MEMBER',
  TEMPORARY_CALL = 'TEMPORARY_CALL',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface Invitation {
  id: string;
  token: string;
  chatId: string;
  invitedEmail: string;
  invitedUserId: string | null;
  inviterId: string;
  type: InvitationType;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chat?: {
    id: string;
    name: string | null;
    avatar: string | null;
    isGroup: boolean;
  };
  inviter?: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  invitedUser?: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
  };
}

export interface CreateInvitationPayload {
  chatId: string;
  invitedEmail: string;
  type: InvitationType;
}
