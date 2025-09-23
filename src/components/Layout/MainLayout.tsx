import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from '../Dashboard/Dashboard';
import { ChatLayout } from '../Chat/ChatLayout';
import { ContactList } from '../Contacts/ContactList';
import { CampaignList } from '../Campaigns/CampaignList';
import { KanbanBoard } from '../Kanban/KanbanBoard';
import { WhatsAppConnections } from '../Connections/WhatsAppConnections';
import { TaskList } from '../Tasks/TaskList';
import { InternalChat } from '../InternalChat/InternalChat';
import { UserManagement } from '../Management/UserManagement';
import { QuickMessageManager } from '../QuickMessages/QuickMessageManager';
import { ChatbotBuilder } from '../Chatbot/ChatbotBuilder';
import { ScheduleManager } from '../Schedule/ScheduleManager';
import { TagManager } from '../Tags/TagManager';
import { ApiDocumentation } from '../Api/ApiDocumentation';
import { SystemSettings } from '../Settings/SystemSettings';
import { ProductList } from '../Products/ProductList';
import { SalesReports } from '../Reports/SalesReports';
import { InternalChatMonitoring } from '../InternalChat/InternalChatMonitoring';
import { Ticket } from '../../lib/supabase';

const getPageTitle = (activeTab: string) => {
  const titles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    chat: 'Chat de Atendimento',
    kanban: 'Kanban de Tickets',
    connections: 'Conectar WhatsApp',
    tasks: 'Tarefas',
    'internal-chat': 'Chat Interno',
    'bulk-sender': 'Disparo em Massa',
    users: 'Usuários',
    queues: 'Filas',
    teams: 'Equipes',
    monitoring: 'Monitoramento de Chat',
    'quick-messages': 'Mensagens Rápidas',
    chatbot: 'Construtor de Chatbot',
    schedule: 'Agendamentos',
    contacts: 'Contatos',
    campaigns: 'Campanhas',
    products: 'Produtos',
    reports: 'Relatórios de Vendas',
    tags: 'Etiquetas & Notas',
    api: 'API',
    settings: 'Configurações',
  };
  return titles[activeTab] || 'Dashboard';
};

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ticketToOpen, setTicketToOpen] = useState<Ticket | null>(null);

  const handleNavigateToChat = (ticket: Ticket) => {
    setTicketToOpen(ticket);
    setActiveTab('chat');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'chat': return <ChatLayout onNavigate={setActiveTab} initialTicket={ticketToOpen} setInitialTicket={setTicketToOpen} />;
      case 'kanban': return <KanbanBoard />;
      case 'connections': return <WhatsAppConnections />;
      case 'tasks': return <TaskList />;
      case 'internal-chat': return <InternalChat />;
      case 'bulk-sender': return <CampaignList />;
      case 'users':
      case 'queues':
      case 'teams':
        return <UserManagement activeTab={activeTab} />;
      case 'monitoring': return <InternalChatMonitoring />;
      case 'quick-messages': return <QuickMessageManager />;
      case 'chatbot': return <ChatbotBuilder />;
      case 'schedule': return <ScheduleManager />;
      case 'contacts': return <ContactList onNavigateToChat={handleNavigateToChat} />;
      case 'campaigns': return <CampaignList />;
      case 'products': return <ProductList />;
      case 'reports': return <SalesReports />;
      case 'tags': return <TagManager />;
      case 'api': return <ApiDocumentation />;
      case 'settings': return <SystemSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex text-gray-800 dark:text-gray-200">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Header title={getPageTitle(activeTab)} />
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
