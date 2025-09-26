import { Pool } from 'pg';

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'chatvendas',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Interface para o perfil do usuário
export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'manager';
  created_at: string;
  updated_at: string;
}

// Função para executar queries
export async function query(text: string, params?: any[]) {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error executing query', error);
    throw error;
  }
}

// Função para obter um perfil de usuário
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Função para atualizar um perfil de usuário
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  
  // Construir a query dinamicamente
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const query = `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
  
  try {
    const result = await pool.query(query, [userId, ...values]);
    return { data: result.rows[0], error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

export default {
  query,
  getProfile,
  updateProfile,
  pool
};