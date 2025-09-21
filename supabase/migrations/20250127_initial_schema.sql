/*
# Sistema de Atendimento WhatsApp - Schema Inicial
Criação de todas as tabelas necessárias para o sistema de atendimento via WhatsApp

## Query Description: 
Esta migração cria a estrutura completa do banco de dados para o sistema de atendimento WhatsApp.
Inclui tabelas para usuários, contatos, tickets, mensagens, campanhas, conexões WhatsApp e configurações.
Operação segura que não afeta dados existentes.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tabelas de usuários e perfis
- Sistema de tickets e atendimento
- Mensagens e mídia
- Campanhas e disparos
- Conexões WhatsApp
- Configurações do sistema

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: Integração com auth.users

## Performance Impact:
- Indexes: Added for performance
- Triggers: Added for automation
- Estimated Impact: Minimal performance impact
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('admin', 'supervisor', 'agent')),
    department VARCHAR(100),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Connections
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'error')),
    qr_code TEXT,
    session_data JSONB,
    webhook_url TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    avatar_url TEXT,
    is_blocked BOOLEAN DEFAULT false,
    tags TEXT[],
    notes TEXT,
    custom_fields JSONB DEFAULT '{}',
    last_interaction TIMESTAMP WITH TIME ZONE,
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queues
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#25D366',
    is_active BOOLEAN DEFAULT true,
    auto_assign BOOLEAN DEFAULT true,
    max_concurrent_tickets INTEGER DEFAULT 5,
    business_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue Members
CREATE TABLE IF NOT EXISTS public.queue_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_supervisor BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(queue_id, user_id)
);

-- Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    protocol VARCHAR(20) UNIQUE NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) NOT NULL,
    queue_id UUID REFERENCES public.queues(id),
    user_id UUID REFERENCES public.profiles(id),
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'transferred')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subject VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    is_group BOOLEAN DEFAULT false,
    last_message_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id),
    user_id UUID REFERENCES public.profiles(id),
    whatsapp_message_id VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'sticker')),
    media_url TEXT,
    media_filename VARCHAR(255),
    media_mimetype VARCHAR(100),
    is_from_contact BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    delivery_status VARCHAR(50) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),
    reply_to_message_id UUID REFERENCES public.messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick Messages
CREATE TABLE IF NOT EXISTS public.quick_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    shortcut VARCHAR(50) UNIQUE,
    is_global BOOLEAN DEFAULT false,
    user_id UUID REFERENCES public.profiles(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    message_content TEXT NOT NULL,
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled')),
    target_type VARCHAR(50) DEFAULT 'contacts' CHECK (target_type IN ('contacts', 'groups', 'tags')),
    target_criteria JSONB DEFAULT '{}',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Contacts
CREATE TABLE IF NOT EXISTS public.campaign_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Flows
CREATE TABLE IF NOT EXISTS public.chatbot_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    trigger_keywords TEXT[],
    flow_data JSONB NOT NULL DEFAULT '{}',
    whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contact_id UUID REFERENCES public.contacts(id),
    user_id UUID REFERENCES public.profiles(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    reminder_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES public.profiles(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internal Chat
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id),
    receiver_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB,
    description TEXT,
    category VARCHAR(100),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON public.tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_id ON public.tickets(queue_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Generate protocol number function
CREATE OR REPLACE FUNCTION generate_ticket_protocol()
RETURNS TRIGGER AS $$
BEGIN
    NEW.protocol := 'TK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('ticket_protocol_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for ticket protocol
CREATE SEQUENCE IF NOT EXISTS ticket_protocol_seq START 1;

-- Create trigger for automatic protocol generation
DROP TRIGGER IF EXISTS trigger_generate_protocol ON public.tickets;
CREATE TRIGGER trigger_generate_protocol
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_protocol();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles - users can view and update their own profile
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Contacts - authenticated users can view and manage contacts
CREATE POLICY "Authenticated users can manage contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');

-- Tickets - users can see tickets from their queues or assigned to them
CREATE POLICY "Users can view tickets" ON public.tickets
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            queue_id IN (
                SELECT queue_id FROM public.queue_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update tickets" ON public.tickets
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            user_id = auth.uid() OR
            queue_id IN (
                SELECT queue_id FROM public.queue_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Messages - users can view messages from tickets they have access to
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        ticket_id IN (
            SELECT id FROM public.tickets WHERE 
            user_id = auth.uid() OR
            queue_id IN (
                SELECT queue_id FROM public.queue_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create messages" ON public.messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Other tables - basic authenticated access
CREATE POLICY "Authenticated users access" ON public.whatsapp_connections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.queues FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.queue_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.quick_messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.campaign_contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.chatbot_flows FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.schedules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.internal_messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users access" ON public.system_settings FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO public.queues (name, description, color) VALUES 
    ('Suporte Técnico', 'Atendimento para questões técnicas', '#25D366'),
    ('Vendas', 'Atendimento comercial e vendas', '#0084FF'),
    ('Financeiro', 'Questões sobre pagamentos e cobranças', '#FF6B35');

INSERT INTO public.system_settings (setting_key, setting_value, description, category) VALUES
    ('company_name', '"Whazing SaaS"', 'Nome da empresa', 'general'),
    ('max_tickets_per_user', '10', 'Máximo de tickets por usuário', 'tickets'),
    ('auto_close_tickets_days', '7', 'Dias para fechar tickets automaticamente', 'tickets'),
    ('business_hours_start', '"09:00"', 'Horário de início do expediente', 'business'),
    ('business_hours_end', '"18:00"', 'Horário de fim do expediente', 'business'),
    ('notification_sound_enabled', 'true', 'Sons de notificação habilitados', 'notifications');
