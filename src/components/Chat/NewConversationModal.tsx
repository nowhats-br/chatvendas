import React, { useState, useEffect } from 'react';
import { supabase, Contact, Ticket } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreatedOrFound: (ticket: Ticket) => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({ isOpen, onClose, onTicketCreatedOrFound }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && searchTerm.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchContacts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setContacts([]);
    }
  }, [searchTerm, isOpen]);

  const searchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(10);
    if (error) toast.error("Erro ao buscar contatos.");
    else setContacts(data || []);
    setLoading(false);
  };

  const handleSelectContact = async (contact: Contact) => {
    if (!user) return;
    try {
      // Check for an existing open/pending ticket
      let { data: existingTicket, error: existingError } = await supabase
        .from('tickets')
        .select(`*, contact:contacts(*)`)
        .eq('contact_id', contact.id)
        .in('status', ['open', 'pending'])
        .maybeSingle();

      if (existingError) throw existingError;
      
      if (existingTicket) {
        onTicketCreatedOrFound(existingTicket);
      } else {
        // Create a new ticket
        const protocol = `WA-${Date.now()}`;
        const { data: newTicket, error: newTicketError } = await supabase
          .from('tickets')
          .insert({
            contact_id: contact.id,
            user_id: user.id,
            status: 'open',
            protocol: protocol,
          })
          .select(`*, contact:contacts(*)`)
          .single();
        
        if (newTicketError) throw newTicketError;
        onTicketCreatedOrFound(newTicket!);
      }
      onClose();
    } catch (error) {
      toast.error("Não foi possível iniciar a conversa.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Iniciar Nova Conversa</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
          {!loading && contacts.length > 0 && (
            <ul className="divide-y dark:divide-gray-700">
              {contacts.map(contact => (
                <li key={contact.id} onClick={() => handleSelectContact(contact)} className="p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <img className="w-10 h-10 rounded-full" src={contact.avatar_url || `https://ui-avatars.com/api/?name=${contact.name || 'C'}`} alt="Avatar" />
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && searchTerm.length > 2 && contacts.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p>Nenhum contato encontrado.</p>
              <button className="mt-2 text-green-600 font-medium flex items-center justify-center mx-auto space-x-2">
                <UserPlus size={18} />
                <span>Adicionar novo contato</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
