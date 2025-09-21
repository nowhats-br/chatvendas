/*
          # [Operation Name]
          Adicionar provedor de API às conexões WhatsApp

          ## Query Description: [Esta operação adiciona uma nova coluna `api_provider` à tabela `whatsapp_connections` para diferenciar entre as APIs utilizadas (ex: Baileys, web.js). A coluna terá um valor padrão 'baileys' para garantir que as conexões existentes continuem funcionando sem interrupções. Não há perda de dados.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tabela afetada: `public.whatsapp_connections`
          - Coluna adicionada: `api_provider` (TEXT)
          
          ## Security Implications:
          - RLS Status: Inalterado
          - Policy Changes: Não
          - Auth Requirements: Não
          
          ## Performance Impact:
          - Indexes: Nenhum
          - Triggers: Nenhum
          - Estimated Impact: Mínimo. A adição de uma coluna com valor padrão é uma operação rápida.
          */

ALTER TABLE public.whatsapp_connections
ADD COLUMN api_provider TEXT NOT NULL DEFAULT 'baileys';
