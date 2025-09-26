import { createClient } from '@supabase/supabase-js';

// Add better error handling and validation for environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Configure Supabase client with better settings for production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'chatvendas-web'
    }
  },
  db: {
    schema: 'public'
  },
  // ADD TIMEOUT CONFIGURATION TO PREVENT CONNECTION HANGING
  realtime: {
    timeout: 10000, // 10 seconds
  }
});

// Test the connection with better error handling
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    // Use a safer test method
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      // Check if it's a network error
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        console.error('This appears to be a network connectivity issue. Please check:');
        console.error('1. Your internet connection');
        console.error('2. Firewall settings');
        console.error('3. If Supabase is accessible from your location');
      }
    } else {
      console.log('Supabase connection test successful');
      console.log('Test query result:', data);
    }
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error detected. This is likely due to:');
      console.error('- Internet connectivity issues');
      console.error('- Firewall blocking the connection');
      console.error('- DNS resolution problems');
      console.error('- Supabase service temporary unavailability');
    }
  }
};

testConnection();

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

export interface UserQueue {
  user_id: string;
  queue_id: string;
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

export interface InternalNote {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}