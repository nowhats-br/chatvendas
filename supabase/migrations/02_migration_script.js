/**
 * Script de migração do Supabase para PostgreSQL
 * 
 * Este script deve ser executado no ambiente Node.js com acesso ao banco de dados PostgreSQL
 * Instale as dependências necessárias: npm install pg @supabase/supabase-js dotenv
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Configuração do Supabase (origem)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do PostgreSQL (destino)
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: process.env.POSTGRES_SSL === 'true'
});

async function migrateProfiles() {
  console.log('Migrando perfis de usuários...');
  
  // Buscar perfis do Supabase
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Erro ao buscar perfis:', error);
    return;
  }
  
  // Inserir perfis no PostgreSQL
  for (const profile of profiles) {
    try {
      await pool.query(
        'INSERT INTO profiles (id, updated_at, username, full_name, avatar_url, website) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET updated_at = $2, username = $3, full_name = $4, avatar_url = $5, website = $6',
        [profile.id, profile.updated_at, profile.username, profile.full_name, profile.avatar_url, profile.website]
      );
      console.log(`Perfil migrado: ${profile.id}`);
    } catch (err) {
      console.error(`Erro ao migrar perfil ${profile.id}:`, err);
    }
  }
  
  console.log(`Migração de perfis concluída. Total: ${profiles.length}`);
}

async function migrateConnections() {
  console.log('Migrando conexões...');
  
  // Buscar conexões do Supabase
  const { data: connections, error } = await supabase
    .from('connections')
    .select('*');
  
  if (error) {
    console.error('Erro ao buscar conexões:', error);
    return;
  }
  
  // Inserir conexões no PostgreSQL
  for (const connection of connections) {
    try {
      await pool.query(
        'INSERT INTO connections (id, user_id, name, phone, status, qr_code, created_at, connected_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (user_id, phone) DO UPDATE SET name = $3, status = $5, qr_code = $6, connected_at = $8',
        [connection.id, connection.user_id, connection.name, connection.phone, connection.status, connection.qr_code, connection.created_at, connection.connected_at]
      );
      console.log(`Conexão migrada: ${connection.id}`);
    } catch (err) {
      console.error(`Erro ao migrar conexão ${connection.id}:`, err);
    }
  }
  
  console.log(`Migração de conexões concluída. Total: ${connections.length}`);
}

async function runMigration() {
  try {
    await migrateProfiles();
    await migrateConnections();
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    pool.end();
  }
}

runMigration();