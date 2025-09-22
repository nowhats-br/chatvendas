/*
# [Estrutura de Funcionalidades Essenciais]
Este script cria e atualiza as tabelas necessárias para as novas funcionalidades de gerenciamento, incluindo Tarefas, Chat Interno, Filas, Equipes, Etiquetas, Agendamentos e Horário de Funcionamento.

## Query Description: "Esta operação irá reestruturar a tabela 'tasks' (causando perda de dados nessa tabela específica) e adicionar várias novas tabelas para suportar as funcionalidades solicitadas. É um passo fundamental e seguro para a evolução do sistema. Backup das tarefas atuais, se houver, é recomendado."

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- DROP TABLE: public.tasks (será recriada com nova estrutura)
- CREATE TABLE: public.business_hours, public.queues, public.tags, public.teams, public.team_members, public.appointments, public.tasks (nova), public.internal_chat_rooms, public.internal_chat_room_participants, public.internal_chat_messages.
- RLS: Habilitado para todas as novas tabelas com políticas de segurança.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, novas políticas para garantir que os usuários acessem apenas os dados permitidos.
- Auth Requirements: As políticas são baseadas no `auth.uid()` do usuário logado.

## Performance Impact:
- Indexes: Adicionados em chaves estrangeiras e campos frequentemente consultados para otimizar o desempenho.
- Triggers: Nenhum.
- Estimated Impact: Baixo a médio. As consultas serão eficientes devido à indexação.
*/

-- =============================================
-- Tabela de Horário de Funcionamento
-- =============================================
CREATE TABLE public.business_hours (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    rules jsonb,
    timezone text DEFAULT 'UTC'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.business_hours IS 'Armazena as regras de horário de funcionamento.';

-- =============================================
-- Tabela de Filas de Atendimento
-- =============================================
CREATE TABLE public.queues (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    color text DEFAULT '#808080'::text,
    is_active boolean NOT NULL DEFAULT true,
    auto_assign boolean NOT NULL DEFAULT false,
    max_concurrent_tickets integer DEFAULT 10,
    business_hours_id uuid REFERENCES public.business_hours(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.queues IS 'Filas para organização e distribuição de tickets.';
CREATE INDEX ix_queues_is_active ON public.queues USING btree (is_active);

-- =============================================
-- Tabela de Etiquetas (Tags)
-- =============================================
CREATE TABLE public.tags (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#6B7280'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tags_name_key UNIQUE (name)
);
COMMENT ON TABLE public.tags IS 'Etiquetas para categorizar contatos e tickets.';

-- =============================================
-- Tabela de Equipes (Teams)
-- =============================================
CREATE TABLE public.teams (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.teams IS 'Equipes de usuários.';

-- =============================================
-- Tabela de Membros da Equipe (Join Table)
-- =============================================
CREATE TABLE public.team_members (
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member'::text,
    PRIMARY KEY (team_id, user_id)
);
COMMENT ON TABLE public.team_members IS 'Tabela de junção para equipes e usuários.';

-- =============================================
-- Tabela de Agendamentos (Appointments)
-- =============================================
CREATE TABLE public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    google_calendar_event_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.appointments IS 'Agendamentos com contatos.';
CREATE INDEX ix_appointments_user_id_start_time ON public.appointments USING btree (user_id, start_time);

-- =============================================
-- Tabela de Tarefas (Tasks) - NOVA ESTRUTURA
-- =============================================
DROP TABLE IF EXISTS public.tasks;
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'todo'::text,
    due_date timestamp with time zone,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.tasks IS 'Tarefas a serem executadas pelos usuários.';
CREATE INDEX ix_tasks_assigned_to_user_id ON public.tasks USING btree (assigned_to_user_id);
CREATE INDEX ix_tasks_status ON public.tasks USING btree (status);

-- =============================================
-- Tabelas de Chat Interno
-- =============================================
CREATE TABLE public.internal_chat_rooms (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text,
    is_private boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.internal_chat_rooms IS 'Salas de chat para comunicação interna.';

CREATE TABLE public.internal_chat_room_participants (
    room_id uuid NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);
COMMENT ON TABLE public.internal_chat_room_participants IS 'Participantes das salas de chat interno.';

CREATE TABLE public.internal_chat_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES public.internal_chat_rooms(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text,
    media_url text,
    message_type text NOT NULL DEFAULT 'text'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.internal_chat_messages IS 'Mensagens do chat interno.';
CREATE INDEX ix_internal_chat_messages_room_id_created_at ON public.internal_chat_messages USING btree (room_id, created_at);

-- =============================================
-- Políticas de Segurança (RLS)
-- =============================================

-- Habilitar RLS para novas tabelas
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas genéricas (permitir leitura para todos os usuários autenticados)
CREATE POLICY "Allow authenticated read access" ON public.business_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.queues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.teams FOR SELECT TO authenticated USING (true);

-- Políticas para team_members
CREATE POLICY "Allow read access to team members" ON public.team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = team_id AND team_members.user_id = auth.uid()));
CREATE POLICY "Allow admin to manage members" ON public.team_members FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.created_by = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.created_by = auth.uid()));

-- Políticas para appointments
CREATE POLICY "Users can manage their own appointments" ON public.appointments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Políticas para tasks
CREATE POLICY "Users can manage their own or assigned tasks" ON public.tasks FOR ALL TO authenticated USING (user_id = auth.uid() OR assigned_to_user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Políticas para chat interno
CREATE POLICY "Users can see rooms they are part of" ON public.internal_chat_rooms FOR SELECT TO authenticated USING (id IN (SELECT room_id FROM public.internal_chat_room_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can see participants of their rooms" ON public.internal_chat_room_participants FOR SELECT TO authenticated USING (room_id IN (SELECT room_id FROM public.internal_chat_room_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage participants in rooms they created" ON public.internal_chat_room_participants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.internal_chat_rooms WHERE id = room_id AND created_by = auth.uid()));
CREATE POLICY "Users can read messages in their rooms" ON public.internal_chat_messages FOR SELECT TO authenticated USING (room_id IN (SELECT room_id FROM public.internal_chat_room_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages in their rooms" ON public.internal_chat_messages FOR INSERT TO authenticated WITH CHECK (room_id IN (SELECT room_id FROM public.internal_chat_room_participants WHERE user_id = auth.uid()));

-- Políticas de gerenciamento para admins (Exemplo - ajuste conforme necessário)
CREATE POLICY "Allow admin full access" ON public.queues FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin full access" ON public.tags FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Allow admin full access" ON public.teams FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
