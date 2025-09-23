import React from 'react';
import { 
  BarChart3, MessageSquare, Kanban, Phone, CheckSquare, Users, Send, Settings,
  Zap, Bot, Calendar, Tag, Code, UserPlus, MessageCircle, FolderOpen, LogOut, Sun, Moon,
  ShoppingBag, LineChart, Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'connections', label: 'Conexões', icon: Phone },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'internal-chat', label: 'Chat Interno', icon: MessageCircle },
];

const managementItems = [
  { id: 'contacts', label: 'Contatos', icon: Users },
  { id: 'campaigns', label: 'Campanhas', icon: Send },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'reports', label: 'Relatórios', icon: LineChart },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'queues', label: 'Filas', icon: FolderOpen },
  { id: 'teams', label: 'Equipes', icon: UserPlus },
];

const supervisionItems = [
  { id: 'monitoring', label: 'Monitoramento', icon: Eye },
];

const toolsItems = [
  { id: 'quick-messages', label: 'Respostas Rápidas', icon: Zap },
  { id: 'chatbot', label: 'Chatbot', icon: Bot },
  { id: 'schedule', label: 'Agendamentos', icon: Calendar },
  { id: 'tags', label: 'Etiquetas', icon: Tag },
  { id: 'api', label: 'API', icon: Code },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const renderMenuItems = (items: {id: string, label: string, icon: React.ElementType}[], title?: string) => (
    <div className="mb-4">
      {title && <h3 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">{title}</h3>}
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-green-400">Whazing</h1>
        <p className="mt-1 text-sm text-gray-400">Atendimento WhatsApp</p>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {renderMenuItems(menuItems, 'Principal')}
        {renderMenuItems(managementItems, 'Gerenciamento')}
        {(profile?.role === 'admin' || profile?.role === 'supervisor') && renderMenuItems(supervisionItems, 'Supervisão')}
        {renderMenuItems(toolsItems, 'Ferramentas')}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative">
              <img className="w-9 h-9 rounded-full" src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.name}&background=059669&color=fff`} alt="Avatar" />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-gray-900"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-xs text-gray-400 truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 text-gray-400 rounded-full hover:bg-gray-700">
            {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
          </button>
        </div>
        
        <button
          onClick={signOut}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 rounded-lg transition-colors hover:bg-red-600 hover:text-white"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};
