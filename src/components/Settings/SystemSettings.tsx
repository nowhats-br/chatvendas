import React, { useState } from 'react';
import { User, Palette, Bell, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { profile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      await updateProfile({ name });
      // Avatar upload logic would go here
      toast.success("Perfil atualizado!");
    } catch (error) {
      toast.error("Falha ao atualizar perfil.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Foto de Perfil</label>
              <div className="flex items-center space-x-4">
                <img className="w-16 h-16 rounded-full" src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name}`} alt="Avatar" />
                <input type="file" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} className="text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Nome Completo</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <input type="email" id="email" value={profile?.email} disabled className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Salvar Alterações</button>
          </form>
        );
      case 'appearance':
        return (
          <div className="space-y-4">
            <h3 className="font-bold">Tema</h3>
            <div className="flex space-x-4">
              <button onClick={() => setTheme('light')} className={`p-4 border-2 rounded-lg ${theme === 'light' ? 'border-green-500' : ''}`}>Modo Claro</button>
              <button onClick={() => setTheme('dark')} className={`p-4 border-2 rounded-lg ${theme === 'dark' ? 'border-green-500' : ''}`}>Modo Escuro</button>
            </div>
          </div>
        );
      default:
        return <p>Configurações para {activeTab} em breve.</p>;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'billing', label: 'Faturamento', icon: CreditCard },
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full flex">
      <aside className="w-48">
        <nav className="space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm ${activeTab === tab.id ? 'bg-gray-200 dark:bg-gray-700 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <tab.icon size={18} /><span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 ml-6 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        {renderContent()}
      </div>
    </div>
  );
};
