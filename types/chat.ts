import { User } from './user';
import { Message } from './message';

export interface Chat {
  id: string;
  name: string | null;
  avatar: string | null;
  isGroup: boolean;
  users: User[];
  messages?: Message[];
  lastMessage: Message | null;
  unreadCount: number;
  pinnedMessageId: string | null;
  settings: ChatSettings | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSettings {
  notifications: boolean;
  muted: boolean;
  theme: string | null;
}

export interface CreateChatPayload {
  userIds: string[];
  name?: string;
  isGroup: boolean;
}

export interface UpdateChatPayload {
  name?: string;
  avatar?: string;
  settings?: Partial<ChatSettings>;
}

export interface ChatListItem extends Omit<Chat, 'messages'> {
  lastMessage: Message | null;
  unreadCount: number;
  isTyping: boolean;
  lastActivity: Date;
}

export interface ChatFilter {
  search?: string;
  type?: 'all' | 'unread' | 'groups' | 'direct';
  page?: number;
  limit?: number;
}
