// Interface para o perfil do usuário - sem dependência direta do pg
// O módulo pg será usado apenas no backend

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

// Função para executar queries - implementação simulada para o frontend
export async function query(text: string, params?: any[]) {
  console.log('Query simulada no frontend:', { text, params });
  // No frontend, esta função fará chamadas API para o backend
  throw new Error('Função query() deve ser chamada apenas no backend');
}

// Função para obter um perfil de usuário - implementação simulada para o frontend
export async function getProfile(userId: string): Promise<Profile | null> {
  console.log('Obtendo perfil para usuário:', userId);
  // No frontend, esta função fará uma chamada API para o backend
  return null;
}

// Função para atualizar um perfil de usuário - implementação simulada para o frontend
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  console.log('Atualizando perfil para usuário:', userId, updates);
  // No frontend, esta função fará uma chamada API para o backend
  return { data: null, error: null };
}

export default {
  query,
  getProfile,
  updateProfile
};