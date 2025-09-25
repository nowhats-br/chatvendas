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

// Error handling interfaces
export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

// Generic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Form data interfaces
export interface FormData {
  [key: string]: string | number | boolean | File | undefined;
}

// Chart data interfaces
export interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Tab interfaces
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

// Team member interface
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  count?: number;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  team_members?: TeamMember[];
}

// Task interfaces
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
}

// Product interfaces
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock?: number;
}

// Sales interfaces
export interface Sale {
  id: string;
  productId: string;
  contactId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Media interface
export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'video';
  size: number;
}
