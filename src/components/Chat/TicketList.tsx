import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, MessageSquare, SquarePen, Contact2, Loader2 } from 'lucide-react';
import { supabase, Ticket } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewConversationModal } from './NewConversationModal';

interface TicketListProps {
  onSelectTicket: (ticket: Ticket) => void;
  selectedTicket: Ticket | null;
  onNavigate: (tab: string) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ onSelectTicket, selectedTicket, onNavigate }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'closed'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
    const subscription = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets)
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [activeTab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`*, contact:contacts(*), messages(content, created_at)`)
        .order('updated_at', { ascending: false });

      if (activeTab === 'open') query = query.eq('status', 'open');
      else if (activeTab === 'pending') query = query.eq('status', 'pending');
      else query = query.eq('status', 'closed');
      
      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.contact?.phone.includes(searchTerm)
  );

  return (
    <>
      <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Conversas</h2>
            <div className="flex space-x-2">
              <button onClick={() => onNavigate('contacts')} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Contatos"><Contact2 size={20} /></button>
              <button onClick={() => setIsModalOpen(true)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Nova Conversa"><SquarePen size={20} /></button>
              <button onClick={fetchTickets} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Atualizar" disabled={loading}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
            </div>
          </div>
          <div className="relative">
            <input type="text" placeholder="Buscar ou começar uma nova conversa" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <button onClick={() => setActiveTab('open')} className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'open' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}>Abertas</button>
            <button onClick={() => setActiveTab('pending')} className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}>Pendentes</button>
            <button onClick={() => setActiveTab('closed')} className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${activeTab === 'closed' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}>Resolvidas</button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto">
          {loading && tickets.length === 0 ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 mt-10"><MessageSquare size={48} className="mx-auto mb-3 text-gray-400" /><p>Nenhuma conversa encontrada.</p></div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => {
                const lastMessage = Array.isArray(ticket.messages) && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null;
                return (
                  <div key={ticket.id} onClick={() => onSelectTicket(ticket)} className={`p-3 cursor-pointer flex items-center space-x-3 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                    <img className="w-12 h-12 rounded-full flex-shrink-0" src={ticket.contact?.avatar_url || `https://ui-avatars.com/api/?name=${ticket.contact?.name || 'C'}&background=random`} alt="Avatar" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 truncate">{ticket.contact?.name || ticket.contact?.phone}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{ticket.updated_at && formatDistanceToNow(new Date(ticket.updated_at), { locale: ptBR, addSuffix: false })}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{lastMessage?.content || 'Nenhuma mensagem ainda.'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <NewConversationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTicketCreatedOrFound={onSelectTicket} 
      />
    </>
  );
};
