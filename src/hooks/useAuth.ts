import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular autenticação
    setTimeout(() => {
      setUser({
        id: '1',
        name: 'Admin User',
        email: 'admin@whazing.com',
        avatar: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/40x40/059669/ffffff?text=AU',
        plan: 'premium',
        isOnline: true,
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setUser({
        id: '1',
        name: 'Admin User',
        email: email,
        avatar: 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/40x40/059669/ffffff?text=AU',
        plan: 'premium',
        isOnline: true,
      });
      setIsLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, isLoading, login, logout };
};
