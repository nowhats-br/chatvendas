-- Criação das tabelas principais
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT
);

CREATE TABLE IF NOT EXISTS connections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, phone)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS connections_user_id_idx ON connections(user_id);
CREATE INDEX IF NOT EXISTS connections_status_idx ON connections(status);