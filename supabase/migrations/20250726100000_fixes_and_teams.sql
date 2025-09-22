/*
# [Fixes and New Features]
This migration script addresses several issues and adds new database structures.

## Query Description:
1.  **Task Schema Fix:** Adds a comment to the `tasks.assigned_to` column. This is a non-destructive operation intended to force a refresh of the Supabase schema cache, which should resolve the "column not found" error when creating tasks.
2.  **Internal Chat Function Fix:** Replaces the `get_internal_channels_for_user` function with a more robust version that correctly fetches all public channels and private/direct channels a user is a member of.
3.  **Team Management Structure:** Creates the `teams` and `team_members` tables to support the new team management feature.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- **Modified:** `tasks` table (comment added), `get_internal_channels_for_user` function.
- **Added:** `teams` table, `team_members` table.

## Security Implications:
- RLS Status: Enabled on new tables.
- Policy Changes: New policies are added for the new tables.
- Auth Requirements: Standard authenticated user access.

## Performance Impact:
- Indexes: Primary keys and foreign keys on new tables will have indexes.
- Triggers: A trigger is added to the `teams` table to manage `updated_at`.
- Estimated Impact: Low.
*/

-- 1. Add comment to tasks.assigned_to to attempt a schema cache refresh
COMMENT ON COLUMN public.tasks.assigned_to IS 'ID of the user profile the task is assigned to. This comment is to force a schema refresh.';

-- 2. Update internal chat function for correctness and to include all channel types
CREATE OR REPLACE FUNCTION public.get_internal_channels_for_user(p_user_id uuid)
RETURNS SETOF public.internal_channels
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    -- Select all public channels
    SELECT *
    FROM public.internal_channels
    WHERE channel_type = 'public'
    
    UNION
    
    -- Select all private and direct channels the user is a member of
    SELECT ic.*
    FROM public.internal_channels ic
    JOIN public.internal_channel_members icm ON ic.id = icm.channel_id
    WHERE icm.user_id = p_user_id;
END;
$function$;

-- 3. Create tables for Team Management
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.teams IS 'Stores information about user teams or departments.';

CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'leader')) DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, user_id)
);

COMMENT ON TABLE public.team_members IS 'Associates users (profiles) with teams.';

-- RLS for Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to all authenticated users" ON public.teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin and supervisors to manage teams" ON public.teams FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- RLS for Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow team members to see their own team" ON public.team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = public.team_members.team_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Allow admin and supervisors to manage team members" ON public.team_members FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- Trigger to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER handle_updated_at_teams
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
