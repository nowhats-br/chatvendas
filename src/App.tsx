import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './components/Auth/AuthLayout';
import { MainLayout } from './components/Layout/MainLayout';
import { useTheme } from './hooks/useTheme';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthLayout />;
  }

  return <MainLayout />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#DC2626',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
