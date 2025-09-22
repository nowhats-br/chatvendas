/*
# [FEATURE & FIX] Full Schema Enhancement
This script creates and modifies tables to support Tasks, Internal Chat, Queues, Teams, Tags, Schedules, and Business Hours. It is idempotent and safe to run multiple times, checking for existing objects before creation.

## Query Description: This script will:
1. Create new tables for Tasks, Tags, Teams, Internal Chat, Appointments, and Business Hours if they don't exist.
2. Add missing columns to the existing 'queues' table to enhance its functionality.
3. Define necessary data types, foreign keys, and Row Level Security (RLS) policies for data protection.
This operation is structural and designed to be safe. However, always back up your database before running migrations.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- New Tables: tasks, tags, ticket_tags, teams, team_members, internal_chat_channels, internal_chat_messages, appointments, business_hours.
- Modified Tables: queues (adds description, color, is_active columns).
- New Types: task_priority, task_status.

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Yes, new policies are created for all new tables to ensure users can only access their own data or data related to their team.
- Auth Requirements: Most operations require an authenticated user.

## Performance Impact:
- Indexes: Primary keys and foreign keys create indexes automatically. No other major indexes are added.
- Triggers: No new triggers are added in this script.
- Estimated Impact: Low performance impact on existing operations.
*/

-- Create custom types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
    END IF;
END
$$;

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    priority public.task_priority DEFAULT 'medium'::public.task_priority,
    status public.task_status DEFAULT 'todo'::public.task_status,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS public.tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    color text NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id)
);

-- TICKET_TAGS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.ticket_tags (
    ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);

-- TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TEAM_MEMBERS (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member'::text, -- e.g., 'member', 'leader'
    PRIMARY KEY (team_id, user_id)
);

-- INTERNAL CHAT CHANNELS
CREATE TABLE IF NOT EXISTS public.internal_chat_channels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_private boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- INTERNAL CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.internal_chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id uuid NOT NULL REFERENCES public.internal_chat_channels(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- SCHEDULES / APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    google_calendar_event_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- BUSINESS HOURS
CREATE TABLE IF NOT EXISTS public.business_hours (
    id smallint PRIMARY KEY DEFAULT 1,
    is_active boolean DEFAULT true,
    hours jsonb,
    timezone text DEFAULT 'UTC',
    out_of_office_message text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT single_row_constraint CHECK (id = 1)
);

-- MODIFY EXISTING QUEUES TABLE
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'queues') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='queues' AND column_name='description') THEN
            ALTER TABLE "public"."queues" ADD COLUMN "description" text;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='queues' AND column_name='color') THEN
            ALTER TABLE "public"."queues" ADD COLUMN "color" text DEFAULT '#3b82f6';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='queues' AND column_name='is_active') THEN
            ALTER TABLE "public"."queues" ADD COLUMN "is_active" boolean DEFAULT true;
        END IF;
    END IF;
END $$;


-- RLS POLICIES --
-- Helper function to check team membership
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Enable RLS and define policies for all new tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to own tasks" ON public.tasks;
CREATE POLICY "Allow full access to own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to own tags" ON public.tags;
CREATE POLICY "Allow full access to own tags" ON public.tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to ticket and tag owners" ON public.ticket_tags;
CREATE POLICY "Allow access to ticket and tag owners" ON public.ticket_tags FOR ALL USING (
  (SELECT user_id FROM public.tickets WHERE id = ticket_id) = auth.uid() AND
  (SELECT user_id FROM public.tags WHERE id = tag_id) = auth.uid()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to team members" ON public.teams;
CREATE POLICY "Allow read access to team members" ON public.teams FOR SELECT USING (is_team_member(id, auth.uid()));
DROP POLICY IF EXISTS "Allow admins to manage teams" ON public.teams;
CREATE POLICY "Allow admins to manage teams" ON public.teams FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );


ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to fellow team members" ON public.team_members;
CREATE POLICY "Allow read access to fellow team members" ON public.team_members FOR SELECT USING (is_team_member(team_id, auth.uid()));
DROP POLICY IF EXISTS "Allow team leaders or admins to manage members" ON public.team_members;
CREATE POLICY "Allow team leaders or admins to manage members" ON public.team_members FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT role FROM public.team_members WHERE team_id = team_members.team_id AND user_id = auth.uid()) = 'leader'
);

ALTER TABLE public.internal_chat_channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to team members" ON public.internal_chat_channels;
CREATE POLICY "Allow access to team members" ON public.internal_chat_channels FOR ALL USING (is_team_member(team_id, auth.uid()));

ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow access to channel members" ON public.internal_chat_messages;
CREATE POLICY "Allow access to channel members" ON public.internal_chat_messages FOR ALL USING (
  is_team_member((SELECT team_id FROM public.internal_chat_channels WHERE id = channel_id), auth.uid())
) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to own appointments" ON public.appointments;
CREATE POLICY "Allow full access to own appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage business hours" ON public.business_hours;
CREATE POLICY "Allow admins to manage business hours" ON public.business_hours FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Allow authenticated users to read business hours" ON public.business_hours;
CREATE POLICY "Allow authenticated users to read business hours" ON public.business_hours FOR SELECT TO authenticated USING (true);
