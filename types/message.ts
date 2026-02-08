import { User } from './user';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  LOCATION = 'LOCATION',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  emoji: string;
  createdAt: Date;
}

export interface MessageReceipt {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  readAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  content: string;
  status: MessageStatus;
  reactions: Reaction[];
  receipts?: MessageReceipt[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  userName: string;
}

export interface SendMessagePayload {
  chatId: string;
  content: string;
  type: MessageType;
}

export interface MessageGroup {
  senderId: string;
  sender?: User;
  messages: Message[];
  createdAt: Date;
}
