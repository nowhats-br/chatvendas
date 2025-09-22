import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'supervisor' | 'agent';
  department?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  is_blocked: boolean;
  tags: string[];
  notes?: string;
  custom_fields: Record<string, any>;
  last_interaction?: string;
  whatsapp_connection_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  contact_id: string;
  queue_id?: string;
  user_id?: string;
  whatsapp_connection_id?: string;
  status: 'pending' | 'open' | 'closed' | 'transferred';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
  tags: string[];
  notes?: string;
  rating?: number;
  rating_comment?: string;
  is_group: boolean;
  last_message_at?: string;
  started_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  user?: Profile;
  queue?: Queue;
  messages?: Message[];
}

export interface Message {
  id: string;
  ticket_id: string;
  contact_id?: string;
  user_id?: string;
  whatsapp_message_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker' | 'system';
  media_url?: string;
  media_filename?: string;
  media_mimetype?: string;
  is_from_contact: boolean;
  is_read: boolean;
  delivery_status: 'sent' | 'delivered' | 'read' | 'failed';
  reply_to_message_id?: string;
  created_at: string;
  contact?: Contact;
  user?: Profile;
}

export interface Queue {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
  updated_at: string;
  leader?: Profile;
  team_members?: TeamMember[];
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  message_content: string;
  media_url?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'cancelled';
  target_type: 'contacts' | 'groups' | 'tags';
  target_criteria: Record<string, any>;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  error_count: number;
  whatsapp_connection_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConnection {
  id: string;
  name: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  qr_code?: string;
  session_data?: Record<string, any>;
  webhook_url?: string;
  is_default: boolean;
  api_provider: 'baileys' | 'web.js';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  contact_id: string;
  user_id: string;
  ticket_id?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  contact?: Contact;
  user?: Profile;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Task {
  id: string;
  user_id: string;
  contact_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  assignee?: Profile;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  is_global: boolean;
  created_at: string;
}

export interface InternalChannel {
  id: string;
  name: string;
  description?: string;
  channel_type: 'public' | 'private' | 'direct';
  created_by: string;
  created_at: string;
  members?: Profile[];
  last_message?: InternalMessage;
}

export interface InternalMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}
