import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Loader2, MessageSquare } from 'lucide-react';
import { supabase, Contact, Ticket } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ContactModal } from './ContactModal';

interface ContactListProps {
  onNavigateToChat: (ticket: Ticket) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ onNavigateToChat }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('contacts').select('*').order('name');
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      toast.error("Erro ao carregar contatos.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, contact:contacts(*)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        toast.error('Nenhuma conversa encontrada para este contato.');
        return;
      }
      onNavigateToChat(data);
    } catch (err) {
      toast.error('Erro ao buscar conversa.');
    }
  };

  const handleOpenModal = (contact: Contact | null) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contatos</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{contacts.length} contatos cadastrados</p>
          </div>
          <button onClick={() => handleOpenModal(null)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Plus size={20} />
            <span>Novo Contato</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 text-gray-700 dark:text-gray-200">
            <Filter size={20} />
            <span>Filtros</span>
          </button>
        </div>

        {/* Contact Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Atividade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleOpenModal(contact)}>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {contact.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{contact.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{contact.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {contact.last_interaction ? format(new Date(contact.last_interaction), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contact.is_blocked 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {contact.is_blocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                           <button onClick={() => handleOpenChat(contact.id)} className="text-gray-400 hover:text-green-600 dark:hover:text-green-400" title="Abrir conversa">
                            <MessageSquare size={20} />
                          </button>
                          <button onClick={() => handleOpenModal(contact)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ContactModal
          contact={selectedContact}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchContacts();
          }}
          onNavigateToChat={onNavigateToChat}
        />
      )}
    </>
  );
};
