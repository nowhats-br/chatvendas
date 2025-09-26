// Este arquivo serve como ponte para migração do Supabase para PostgreSQL
// Mantido para compatibilidade com código existente

import { createClient } from '@supabase/supabase-js';
import { Profile as PostgresProfile } from './postgres';

// Configuração do cliente Supabase (mantido para compatibilidade)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Reexportando o tipo Profile para compatibilidade
export type Profile = PostgresProfile;

export default supabase;