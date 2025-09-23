/*
# [Fix Internal Channels Table Name]
Esta migração resolve a inconsistência entre o nome da tabela esperado pela função 
get_internal_channels_for_user (internal_channels) e o nome real da tabela (internal_chat_channels).

## Query Description:
Renomeia a tabela internal_chat_channels para internal_channels para manter consistência
com as funções e código que fazem referência a esta tabela.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- RENAME TABLE: internal_chat_channels -> internal_channels
- UPDATE REFERENCES: Atualiza referências em outras tabelas e funções

## Security Implications:
- RLS Status: Mantém as políticas existentes
- Policy Changes: Nenhuma alteração nas políticas
- Auth Requirements: Mantém os requisitos de autenticação existentes

## Performance Impact:
- Indexes: Mantém os índices existentes
- Triggers: Nenhum impacto
- Estimated Impact: Mínimo
*/

-- Renomear a tabela internal_chat_channels para internal_channels
ALTER TABLE IF EXISTS public.internal_chat_channels 
RENAME TO internal_channels;

-- Adicionar colunas necessárias que podem estar faltando para compatibilidade
ALTER TABLE public.internal_channels 
ADD COLUMN IF NOT EXISTS channel_type text DEFAULT 'public' CHECK (channel_type IN ('public', 'private', 'direct'));

-- Criar tabela de membros dos canais se não existir
CREATE TABLE IF NOT EXISTS public.internal_channel_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id uuid NOT NULL REFERENCES public.internal_channels(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(channel_id, user_id)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.internal_channel_members ENABLE ROW LEVEL SECURITY;

-- Políticas para internal_channel_members
CREATE POLICY "Users can see their own memberships" 
ON public.internal_channel_members FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Channel admins can manage members" 
ON public.internal_channel_members FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.internal_channel_members 
        WHERE channel_id = public.internal_channel_members.channel_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Atualizar políticas existentes da tabela renomeada se necessário
DROP POLICY IF EXISTS "Allow access to team members" ON public.internal_channels;
CREATE POLICY "Allow access to public channels" 
ON public.internal_channels FOR SELECT 
USING (channel_type = 'public');

CREATE POLICY "Allow access to private channels for members" 
ON public.internal_channels FOR SELECT 
USING (
    channel_type = 'public' OR 
    EXISTS (
        SELECT 1 FROM public.internal_channel_members 
        WHERE channel_id = internal_channels.id 
        AND user_id = auth.uid()
    )
);

-- Comentários para documentação
COMMENT ON TABLE public.internal_channels IS 'Canais de chat interno para comunicação entre usuários';
COMMENT ON TABLE public.internal_channel_members IS 'Membros dos canais de chat interno';