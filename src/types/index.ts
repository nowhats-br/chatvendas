export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  isOnline: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  lastMessage?: string;
  lastSeen: Date;
  isBlocked: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  scheduledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  targetContacts: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  contact: Contact;
  messages: Message[];
  isUnread: boolean;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio';
  isFromUser: boolean;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface Analytics {
  totalMessages: number;
  totalContacts: number;
  activeCampaigns: number;
  responseRate: number;
  dailyMessages: { date: string; count: number }[];
  topTags: { tag: string; count: number }[];
}
